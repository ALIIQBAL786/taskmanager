/**
 * Role-Based Access Control middleware factory.
 * Usage: authorize('admin') or authorize('admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden — requires one of roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = authorize;
