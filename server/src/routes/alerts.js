const express = require('express');
const prisma = require('../lib/prisma');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const ALERT_INCLUDE = {
  patientProfile: {
    include: {
      user: { select: { name: true } },
    },
  },
};

async function getAlertFilter(userId, role) {
  if (role === 'FAMILY_MEMBER') {
    const link = await prisma.familyLink.findFirst({
      where: { familyUserId: userId },
    });
    if (!link) {
      return null;
    }
    return { patientProfileId: link.patientProfileId };
  }

  return {};
}

async function canAccessAlert(userId, role, alert) {
  if (role === 'CAREGIVER' || role === 'ADMIN') {
    return true;
  }

  if (role === 'FAMILY_MEMBER') {
    const link = await prisma.familyLink.findFirst({
      where: { familyUserId: userId, patientProfileId: alert.patientProfileId },
    });
    return Boolean(link);
  }

  return false;
}

router.get('/', requireRole('CAREGIVER', 'ADMIN', 'FAMILY_MEMBER'), async (req, res) => {
  const { userId, role } = req.user;
  const filter = await getAlertFilter(userId, role);

  if (filter === null) {
    return res.status(200).json([]);
  }

  const alerts = await prisma.alert.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    include: ALERT_INCLUDE,
  });

  return res.status(200).json(alerts);
});

router.get('/unread-count', requireRole('CAREGIVER', 'ADMIN', 'FAMILY_MEMBER'), async (req, res) => {
  const { userId, role } = req.user;
  const filter = await getAlertFilter(userId, role);

  if (filter === null) {
    return res.status(200).json({ count: 0 });
  }

  const count = await prisma.alert.count({ where: { isRead: false, ...filter } });

  return res.status(200).json({ count });
});

router.patch('/read-all', requireRole('CAREGIVER', 'ADMIN', 'FAMILY_MEMBER'), async (req, res) => {
  const { userId, role } = req.user;
  const filter = await getAlertFilter(userId, role);

  if (filter === null) {
    return res.status(200).json({ count: 0 });
  }

  const result = await prisma.alert.updateMany({
    where: { isRead: false, ...filter },
    data: { isRead: true },
  });

  return res.status(200).json({ count: result.count });
});

router.patch('/:id/read', requireRole('CAREGIVER', 'ADMIN', 'FAMILY_MEMBER'), async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
    include: ALERT_INCLUDE,
  });

  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const allowed = await canAccessAlert(req.user.userId, req.user.role, alert);
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden: no access to this alert' });
  }

  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: { isRead: true },
    include: ALERT_INCLUDE,
  });

  return res.status(200).json(updated);
});

module.exports = router;
