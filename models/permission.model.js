// models/permissionModel.js

const db = require('../config/db');

exports.getUserPermissions = async (userId) => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.id AS roleId,
        r.roleName,
        p.permissionName
      FROM userrole ur
      JOIN roles r ON ur.roleId = r.id
      LEFT JOIN rolepermissions rp ON r.id = rp.roleId
      LEFT JOIN permissions p ON rp.permissionId = p.id
      WHERE ur.userId = ?;
    `, [userId]);

    if (rows.length === 0) {
      return { roles: [], permissions: [] };
    }

    const rolesMap = {};

    rows.forEach(row => {
      if (!rolesMap[row.roleId]) {
        rolesMap[row.roleId] = {
          roleId: row.roleId,
          roleName: row.roleName
        };
      }
    });

    const roles = Object.values(rolesMap).map(r => r.roleName);

    const permissions = [
      ...new Set(
        rows
          .map(row => row.permissionName)
          .filter(Boolean)
      )
    ];

    return {
      roles,
      permissions
    };

  } catch (error) {
    console.error('Error in PermissionModel:', error);
    throw error;
  }
};