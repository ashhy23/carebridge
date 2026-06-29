const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, requireRole('PATIENT'), async (req, res) => {
  // 1. Read optional vitals fields from the request body
  const { systolic, diastolic, glucoseLevel, temperatureCelsius, weightKg, notes } =
    req.body;

  // 2. Look up the authenticated patient's profile by their user id
  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId: req.user.userId },
  });

  // 3. Reject the request if this user has no patient profile record
  if (!patientProfile) {
    return res.status(404).json({ error: 'Patient profile not found' });
  }

  // 4. Persist a new vitals entry linked to the patient's profile
  const entry = await prisma.vitalsEntry.create({
    data: {
      patientProfileId: patientProfile.id,
      systolic,
      diastolic,
      glucoseLevel,
      temperatureCelsius,
      weightKg,
      notes,
    },
  });

  // 5. Return the created entry with 201 Created
  return res.status(201).json(entry);
});

router.get('/', authenticate, async (req, res) => {
  const { role, userId } = req.user;

  let patientProfileId;

  if (role === 'PATIENT') {
    // 1. Resolve the patient's own profile from their user id
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId },
    });

    // 2. Reject the request if no profile exists for this patient
    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    patientProfileId = patientProfile.id;
  } else if (role === 'CAREGIVER' || role === 'FAMILY_MEMBER') {
    // 3. Caregivers and family members must specify which patient's vitals to fetch
    patientProfileId = req.query.patientProfileId;

    // 4. Reject the request when the required query param is missing
    if (!patientProfileId) {
      return res.status(400).json({ error: 'patientProfileId query parameter is required' });
    }
  } else {
    // 5. Deny access for any other role
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }

  // 6. Fetch the 30 most recent vitals entries for the resolved patient profile
  const entries = await prisma.vitalsEntry.findMany({
    where: { patientProfileId },
    orderBy: { recordedAt: 'desc' },
    take: 30,
  });

  // 7. Return the vitals history array with 200 OK
  return res.status(200).json(entries);
});

module.exports = router;
