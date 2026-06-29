const express = require('express');
const prisma = require('../lib/prisma');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

async function getCaregiverProfile(userId) {
  return prisma.caregiverProfile.findUnique({ where: { userId } });
}

async function getTaskForCaregiver(taskId, caregiverProfileId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { shift: true },
  });

  if (!task) {
    return { error: { status: 404, message: 'Task not found' } };
  }

  if (task.shift.caregiverProfileId !== caregiverProfileId) {
    return { error: { status: 403, message: 'Forbidden: task does not belong to this caregiver' } };
  }

  return { task };
}

router.post('/', requireRole('CAREGIVER'), async (req, res) => {
  const { shiftId, title, description } = req.body;

  if (!shiftId || !title) {
    return res.status(400).json({ error: 'shiftId and title are required' });
  }

  try {
    const caregiverProfile = await getCaregiverProfile(req.user.userId);

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.caregiverProfileId !== caregiverProfile.id) {
      return res.status(403).json({ error: 'Forbidden: shift does not belong to this caregiver' });
    }

    const task = await prisma.task.create({
      data: {
        shiftId,
        title,
        description: description || null,
        isCompleted: false,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireRole('CAREGIVER', 'ADMIN'), async (req, res) => {
  const { shiftId } = req.query;

  if (!shiftId) {
    return res.status(400).json({ error: 'shiftId query parameter is required' });
  }

  try {
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (req.user.role === 'CAREGIVER') {
      const caregiverProfile = await getCaregiverProfile(req.user.userId);

      if (!caregiverProfile) {
        return res.status(404).json({ error: 'Caregiver profile not found' });
      }

      if (shift.caregiverProfileId !== caregiverProfile.id) {
        return res.status(403).json({ error: 'Forbidden: shift does not belong to this caregiver' });
      }
    }

    const tasks = await prisma.task.findMany({
      where: { shiftId },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json(tasks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/complete', requireRole('CAREGIVER'), async (req, res) => {
  try {
    const caregiverProfile = await getCaregiverProfile(req.user.userId);

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const result = await getTaskForCaregiver(req.params.id, caregiverProfile.id);

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { isCompleted: !result.task.isCompleted },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole('CAREGIVER'), async (req, res) => {
  try {
    const caregiverProfile = await getCaregiverProfile(req.user.userId);

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const result = await getTaskForCaregiver(req.params.id, caregiverProfile.id);

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    return res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
