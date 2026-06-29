const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/linked',
  authenticate,
  requireRole('CAREGIVER', 'FAMILY_MEMBER'),
  async (req, res) => {
    const { role, userId } = req.user;

    if (role === 'FAMILY_MEMBER') {
      // 1. Load patients linked to this family member via FamilyLink
      const links = await prisma.familyLink.findMany({
        where: { familyUserId: userId },
        include: {
          patientProfile: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // 2. Return profile id and display name for the picker UI
      const patients = links.map((link) => ({
        id: link.patientProfile.id,
        name: link.patientProfile.user.name,
        relationship: link.relationship,
      }));

      return res.status(200).json(patients);
    }

    // 3. Caregivers: resolve profile, then patients from assigned shifts
    const caregiverProfile = await prisma.caregiverProfile.findUnique({
      where: { userId },
    });

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const shifts = await prisma.shift.findMany({
      where: { caregiverProfileId: caregiverProfile.id },
      include: {
        patientProfile: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // 4. Deduplicate patients who appear on multiple shifts
    const seen = new Set();
    const patients = [];

    for (const shift of shifts) {
      const { id, user } = shift.patientProfile;
      if (seen.has(id)) continue;
      seen.add(id);
      patients.push({ id, name: user.name });
    }

    return res.status(200).json(patients);
  }
);

module.exports = router;
