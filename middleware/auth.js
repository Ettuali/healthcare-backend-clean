const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');
const cryptoService = require('../services/crypto.service');

// 🔐 VERIFY TOKEN
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // ✅ Verify JWT
    const decoded = jwt.verify(token, jwtSecret);

    let decryptedId = null;

    try {
      decryptedId = await cryptoService.decrypt(
        decoded.userId,
        'authentication'
      );
    } catch (e) {
      console.warn('⚠️ Decryption failed, using fallback:', e.message);
    }

    // ✅ Attach safe user object
    req.user = {
      ...decoded,
      id: decryptedId || decoded.userId,
    };

    next();
  } catch (err) {
    console.error('❌ Token verification error:', err.message);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// 🔐 ROLE AUTHORIZATION (FIXED)
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles || [];

    const hasAccess = userRoles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  allowRoles,
};