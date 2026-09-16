const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthError } = require('../utils/errors');

/**
 * Verifies the Bearer token, attaches req.user (the full user doc, minus
 * password) for downstream handlers.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new AuthError('No token provided');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new AuthError('User no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AuthError('Invalid or expired token'));
    }
    next(err);
  }
}

/**
 * Restricts a route to specific roles. Use after requireAuth.
 * e.g. router.post('/approve', requireAuth, requireRole('responder', 'admin'), ...)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthError(`Requires one of these roles: ${roles.join(', ')}`));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
