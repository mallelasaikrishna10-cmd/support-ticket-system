/**
 * Role-based Authorization Middleware Factory
 * Checks if the authenticated user has one of the allowed roles.
 * 
 * @param {...string} allowedRoles - e.g. 'agent', 'customer'
 * @returns {Function} Express middleware
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Required role: [${allowedRoles.join(', ')}], Current role: '${req.user.role}'.`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
