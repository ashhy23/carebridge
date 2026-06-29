const express = require('express');
const prisma = require('../lib/prisma');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const PATIENT_INCLUDE = {
  patientProfile: {
    include: {
      user: { select: { name: true } },
    },
  },
};

const SHIFT_DETAIL_INCLUDE = {
  ...PATIENT_INCLUDE,
  tasks: { orderBy: { createdAt: 'asc' } },
  careNote: true,
};

const VALID_TRANSITIONS = {
  SCHEDULED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

function formatShift(shift) {
  if (!shift) return shift;
  const { careNote, ...rest } = shift;
  return { ...rest, notes: careNote?.rawText ?? null };
}

async function getCaregiverProfile(userId) {
  return prisma.caregiverProfile.findUnique({ where: { userId } });
}

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { patientProfileId, caregiverId, startTime, endTime, notes } = req.body;

  if (!patientProfileId || !caregiverId || !startTime || !endTime) {
    return res.status(400).json({
      error: 'patientProfileId, caregiverId, startTime, and endTime are required',
    });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ error: 'startTime and endTime must be valid dates' });
  }

  if (start >= end) {
    return res.status(400).json({ error: 'startTime must be before endTime' });
  }

  try {
    const shift = await prisma.shift.create({
      data: {
        patientProfileId,
        caregiverProfileId: caregiverId,
        startTime: start,
        endTime: end,
        status: 'SCHEDULED',
        ...(notes != null &&
          notes !== '' && {
            careNote: { create: { rawText: notes } },
          }),
      },
      include: { careNote: true },
    });

    return res.status(201).json(formatShift(shift));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireRole('ADMIN', 'CAREGIVER'), async (req, res) => {
  try {
    const { role, userId } = req.user;

    let where = {};

    if (role === 'CAREGIVER') {
      const caregiverProfile = await getCaregiverProfile(userId);

      if (!caregiverProfile) {
        return res.status(404).json({ error: 'Caregiver profile not found' });
      }

      where = { caregiverProfileId: caregiverProfile.id };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: PATIENT_INCLUDE,
      orderBy: { startTime: 'asc' },
    });

    return res.status(200).json(shifts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/status', requireRole('CAREGIVER'), async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const caregiverProfile = await getCaregiverProfile(req.user.userId);

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.caregiverProfileId !== caregiverProfile.id) {
      return res.status(403).json({ error: 'Forbidden: shift does not belong to this caregiver' });
    }

    const allowed = VALID_TRANSITIONS[shift.status];

    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${shift.status} to ${status}`,
      });
    }

    const updated = await prisma.shift.update({
      where: { id: req.params.id },
      data: { status },
      include: { careNote: true },
    });

    return res.status(200).json(formatShift(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/notes', requireRole('CAREGIVER'), async (req, res) => {
  const { notes } = req.body;

  if (notes === undefined) {
    return res.status(400).json({ error: 'notes is required' });
  }

  try {
    const caregiverProfile = await getCaregiverProfile(req.user.userId);

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.caregiverProfileId !== caregiverProfile.id) {
      return res.status(403).json({ error: 'Forbidden: shift does not belong to this caregiver' });
    }

    await prisma.careNote.upsert({
      where: { shiftId: req.params.id },
      create: { shiftId: req.params.id, rawText: notes },
      update: { rawText: notes },
    });

    const updated = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: { careNote: true },
    });

    return res.status(200).json(formatShift(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireRole('ADMIN', 'CAREGIVER'), async (req, res) => {
  try {
    const { role, userId } = req.user;

    const shift = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: SHIFT_DETAIL_INCLUDE,
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (role === 'CAREGIVER') {
      const caregiverProfile = await getCaregiverProfile(userId);

      if (!caregiverProfile) {
        return res.status(404).json({ error: 'Caregiver profile not found' });
      }

      if (shift.caregiverProfileId !== caregiverProfile.id) {
        return res.status(403).json({ error: 'Forbidden: shift does not belong to this caregiver' });
      }
    }

    return res.status(200).json(formatShift(shift));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
