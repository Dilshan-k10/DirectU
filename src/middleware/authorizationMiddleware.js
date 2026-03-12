export const authorize = (...allowedRoles) => {
  // Normalize allowed roles once, case-insensitive
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role).toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    const userRole = req.user.role ? String(req.user.role).toLowerCase() : null;

    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions',
      });
    }

    next();
  };
};
