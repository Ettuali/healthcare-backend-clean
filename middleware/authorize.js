const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user || !user.permissions) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      // convert to array if string
      const required = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const hasPermission = required.some(p =>
        user.permissions.includes(p)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: insufficient permission"
        });
      }

      next();

    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };
};

module.exports = authorize;