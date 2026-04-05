const ApiError = require('../utils/ApiError');

/**
 * Role hierarchy: admin > analyst > viewer
 * authorize('admin') — only admins
 * authorize('analyst', 'admin') — analysts and admins
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not allowed to perform this action`
        )
      );
    }

    next();
  };
};

/**
 * Shorthand role guards
 */
const isAdmin = authorize('admin');
const isAnalystOrAdmin = authorize('analyst', 'admin');
const isAnyRole = authorize('viewer', 'analyst', 'admin');

module.exports = { authorize, isAdmin, isAnalystOrAdmin, isAnyRole };
