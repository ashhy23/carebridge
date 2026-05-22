const jwt = require('jsonwebtoken');

// Verifies the Bearer access token and attaches the decoded user to the request
function authenticate(req, res, next) {
  // 1. Read the Authorization header sent by the client
  const header = req.headers.authorization;

  // 2. Require a Bearer-scheme token (e.g. "Bearer eyJhbG...")
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // 3. Strip the "Bearer " prefix to get the raw JWT string
  const token = header.split(' ')[1];

  // 4. Verify signature and expiry; reject tampered or expired tokens
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Expose userId and role on req.user for downstream routes and RBAC checks
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // 6. Token is valid — continue to the protected route handler
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Returns middleware that only allows users whose role is in the allowed list
function requireRole(...roles) {
  // 1. Factory pattern: configure allowed roles once, reuse on many routes
  return (req, res, next) => {
    // 2. Deny access if the authenticated user's role is not permitted
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    // 3. Role is allowed — proceed to the route handler
    next();
  };
}

module.exports = { authenticate, requireRole };
