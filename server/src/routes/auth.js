const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VALID_ROLES = ['PATIENT', 'CAREGIVER', 'FAMILY_MEMBER'];

router.post('/register', async (req, res) => {
  // 1. Read the registration payload from the request body
  const { name, email, password, role } = req.body;

  // 2. Ensure every required field was sent before touching the database
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 3. Restrict sign-up to the three CareBridge roles supported by RBAC
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // 4. Block duplicate accounts when the email is already in use
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // 5. Hash the password so only a one-way digest is stored (never plain text)
  const hashedPassword = await bcrypt.hash(password, 12);

  // 6–8. Create the user and any role-specific profile in one atomic transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    if (role === 'PATIENT') {
      await tx.patientProfile.create({
        data: {
          userId: newUser.id,
          allergies: [],
        },
      });
    }

    if (role === 'CAREGIVER') {
      await tx.caregiverProfile.create({
        data: {
          userId: newUser.id,
          specializations: [],
        },
      });
    }

    return newUser;
  });

  // 9. Respond with success only — never include password or other secrets
  return res.status(201).json({
    message: 'Account created successfully',
    userId: user.id,
  });
});

router.post('/login', async (req, res) => {
  // 1. Read login credentials from the request body
  const { email, password } = req.body;

  // 2. Reject requests missing email or password
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // 3. Look up the account — same error message whether email or password is wrong
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 4. Verify the submitted password against the stored bcrypt hash
  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 5. Issue a short-lived access token for API requests (includes role for RBAC)
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // 6. Issue a long-lived refresh token used only to obtain new access tokens
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // 7. Persist the refresh token so it can be validated and revoked server-side
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // 8. Send the refresh token in an httpOnly cookie (not accessible to JavaScript)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 9. Return the access token and safe user fields — never include password
  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.post('/refresh', async (req, res) => {
  // 1. Read the refresh token from the httpOnly cookie set at login
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  // 2. Verify the JWT signature and expiry using the refresh secret
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // 3. Confirm this token is still registered in the database (not revoked)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    return res.status(401).json({ error: 'Refresh token not recognised' });
  }

  // 4. Reject tokens past their server-side expiry even if the JWT is still valid
  if (storedToken.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  // 5. Load the user for their current role, then issue a new short-lived access token
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // 6. Send only the new access token — the refresh cookie stays unchanged
  return res.status(200).json({ accessToken });
});

router.post('/logout', async (req, res) => {
  // 1. Read the refresh token cookie if the client sent one
  const refreshToken = req.cookies.refreshToken;

  // 2. Remove the token from the database so it can never be used again
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // 3. Clear the refresh token cookie from the browser
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'lax',
  });

  // 4. Confirm the session has ended
  return res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, async (req, res) => {
  // Load the full user record for the ID embedded in the access token
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Return safe profile fields only — never include password
  return res.status(200).json(user);
});

module.exports = router;
