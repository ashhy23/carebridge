const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function buildVitalsAlerts(vitals, patientProfileId) {
  const alerts = [];
  const { heartRate, systolic, diastolic, bloodOxygen, temperatureCelsius } = vitals;

  if (heartRate != null && (heartRate < 50 || heartRate > 100)) {
    const direction = heartRate < 50 ? 'below' : 'above';
    alerts.push({
      patientProfileId,
      type: 'ABNORMAL_HEART_RATE',
      message: `Heart rate of ${heartRate} bpm is ${direction} the normal range (50–100).`,
    });
  }

  const systolicAbnormal = systolic != null && (systolic < 90 || systolic > 140);
  const diastolicAbnormal = diastolic != null && (diastolic < 60 || diastolic > 90);
  if (systolicAbnormal || diastolicAbnormal) {
    alerts.push({
      patientProfileId,
      type: 'ABNORMAL_BLOOD_PRESSURE',
      message: `Blood pressure of ${systolic ?? '—'}/${diastolic ?? '—'} mmHg is outside normal range.`,
    });
  }

  if (bloodOxygen != null && bloodOxygen < 95) {
    alerts.push({
      patientProfileId,
      type: 'LOW_BLOOD_OXYGEN',
      message: `Blood oxygen (SpO2) of ${bloodOxygen}% is below the safe threshold (95%).`,
    });
  }

  if (temperatureCelsius != null && (temperatureCelsius < 36.0 || temperatureCelsius > 37.5)) {
    const direction = temperatureCelsius < 36.0 ? 'below' : 'above';
    alerts.push({
      patientProfileId,
      type: 'ABNORMAL_TEMPERATURE',
      message: `Temperature of ${temperatureCelsius}°C is ${direction} the normal range (36.0–37.5°C).`,
    });
  }

  return alerts;
}

async function createVitalsAlerts(vitals, patientProfileId) {
  const alerts = buildVitalsAlerts(vitals, patientProfileId);
  if (alerts.length === 0) return;

  await prisma.alert.createMany({ data: alerts });
}

async function canAccessPatientProfile(userId, role, patientProfileId) {
  if (role === 'PATIENT') {
    const profile = await prisma.patientProfile.findUnique({ where: { userId } });
    return profile?.id === patientProfileId;
  }

  if (role === 'FAMILY_MEMBER') {
    const link = await prisma.familyLink.findFirst({
      where: { familyUserId: userId, patientProfileId },
    });
    return Boolean(link);
  }

  if (role === 'CAREGIVER') {
    const caregiverProfile = await prisma.caregiverProfile.findUnique({ where: { userId } });
    if (!caregiverProfile) return false;

    const shift = await prisma.shift.findFirst({
      where: { caregiverProfileId: caregiverProfile.id, patientProfileId },
    });
    return Boolean(shift);
  }

  return false;
}

router.post('/', authenticate, requireRole('PATIENT'), async (req, res) => {
  // 1. Read optional vitals fields from the request body
  const {
    heartRate,
    systolic,
    diastolic,
    bloodOxygen,
    glucoseLevel,
    temperatureCelsius,
    weightKg,
    notes,
  } = req.body;

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
      heartRate,
      systolic,
      diastolic,
      bloodOxygen,
      glucoseLevel,
      temperatureCelsius,
      weightKg,
      notes,
    },
  });

  // 5. Auto-generate alerts for abnormal readings (non-blocking for the response)
  try {
    await createVitalsAlerts(entry, patientProfile.id);
  } catch (err) {
    console.error('Failed to create vitals alerts:', err);
  }

  // 6. Return the created entry with 201 Created
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

    // 5. Ensure the user is allowed to view this patient's vitals
    const allowed = await canAccessPatientProfile(userId, role, patientProfileId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden: no access to this patient' });
    }
  } else {
    // 6. Deny access for any other role
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }

  // 7. Fetch the 30 most recent vitals entries for the resolved patient profile
  const entries = await prisma.vitalsEntry.findMany({
    where: { patientProfileId },
    orderBy: { recordedAt: 'desc' },
    take: 30,
  });

  // 8. Return the vitals history array with 200 OK
  return res.status(200).json(entries);
});

module.exports = router;
