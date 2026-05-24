// =======================================================
// File: controllers/auth.controller.js
// Description: Login & Logout with proper RBAC (roles + permissions)
// =======================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { jwtSecret, jwtExpire } = require('../config/jwt');
const cryptoService = require('../services/crypto.service');

// ✅ LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. VALIDATION
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email & password are required'
      });
    }

    // 2. GET USER
    const [users] = await query(
      `SELECT id, name, email, password, status 
       FROM user 
       WHERE email = ? AND status = 'Active'`,
      [email]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = users[0];

    // 3. CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 🔥 4. RBAC QUERY (roles + permissions)
    const [rbacRows] = await query(
      `SELECT 
          r.id as roleId,
          r.roleName,
          p.permissionName
       FROM userrole ur
       JOIN roles r ON ur.roleId = r.id
       LEFT JOIN rolepermissions rp ON r.id = rp.roleId
       LEFT JOIN permissions p ON rp.permissionId = p.id
       WHERE ur.userId = ?`,
      [user.id]
    );

    // 5. FORMAT ROLES
    const rolesMap = {};

    rbacRows.forEach(row => {
      if (!rolesMap[row.roleId]) {
        rolesMap[row.roleId] = {
          roleId: row.roleId,
          roleName: row.roleName,
          permissions: []
        };
      }

      if (row.permissionName) {
        rolesMap[row.roleId].permissions.push(row.permissionName);
      }
    });

    const roles = Object.values(rolesMap)
  .map(r => r.roleName)
  .filter(Boolean);   // 🔥 removes null

    // 6. FLATTEN PERMISSIONS
    const permissions = [
  ...new Set(
    rbacRows
      .map(row => row.permissionName)
      .filter(Boolean)
  )
];

    // 7. ENCRYPT USER ID
    const encryptedId = await cryptoService.encrypt(`${user.id}`, 'authentication');

    // 8. GENERATE TOKEN
    const token = jwt.sign(
      {
        userId: encryptedId,
        email: user.email,
        roles: roles,
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    // 9. RESPONSE
    res.status(200).json({
  success: true,
  message: 'Login successful',
  token,
  userId: encryptedId
});

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// ✅ LOGOUT
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Clear token on client.'
  });
};

const getMe = async (req, res) => {
  try {
    // 🔥 1. Get encrypted userId from token
    const encryptedId = req.user.userId;

    // 🔥 2. Decrypt it
    const decryptedId = await cryptoService.decrypt(encryptedId, 'authentication');

    // 3. GET USER
    const [users] = await query(
      `SELECT id, name, email 
       FROM user 
       WHERE id = ?`,
      [decryptedId]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // 🔥 4. RBAC QUERY (same as login — reuse logic)
    const [rbacRows] = await query(
      `SELECT 
          r.id as roleId,
          r.roleName,
          p.permissionName
       FROM userrole ur
       JOIN roles r ON ur.roleId = r.id
       LEFT JOIN rolepermissions rp ON r.id = rp.roleId
       LEFT JOIN permissions p ON rp.permissionId = p.id
       WHERE ur.userId = ?`,
      [user.id]
    );

    // 5. FORMAT ROLES
    const roles = [
      ...new Set(
        rbacRows
          .map(row => row.roleName)
          .filter(Boolean)
      )
    ];

    // 6. FORMAT PERMISSIONS
    const permissions = [
      ...new Set(
        rbacRows
          .map(row => row.permissionName)
          .filter(Boolean)
      )
    ];

    // 🔥 7. RESPONSE (same structure as login)
    res.json({
      success: true,
      data: {
        id: encryptedId, // keep encrypted for frontend consistency
        name: user.name,
        email: user.email,
        roles,
        permissions
      }
    });

  } catch (err) {
    console.error("GET ME ERROR:", err);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

module.exports = { login, logout , getMe};