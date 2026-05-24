const db = require("../config/db");

// ==========================
// CORE HELPERS (NO this)
// ==========================

const checkPermission = async (roleId, permissionId) => {
  const [rows] = await db.query(
    `SELECT id FROM rolepermissions 
     WHERE roleId = ? AND permissionId = ?`,
    [roleId, permissionId]
  );

  return rows.length > 0 ? rows[0] : null;
};

const assignPermission = async (roleId, permissionId) => {
  const [result] = await db.query(
    `INSERT INTO rolepermissions (roleId, permissionId) VALUES (?, ?)`,
    [roleId, permissionId]
  );

  return result.insertId;
};

const removePermission = async (roleId, permissionId) => {
  const [result] = await db.query(
    `DELETE FROM rolepermissions WHERE roleId = ? AND permissionId = ?`,
    [roleId, permissionId]
  );

  return result.affectedRows;
};

// ==========================
// MAIN MODEL
// ==========================

const RolePermission = {

  // ==========================
  // TOGGLE WILL USE THESE
  // ==========================
  checkPermission,
  assignPermission,
  removePermission,

  // ==========================
  // FETCH ROLE PERMISSIONS
  // ==========================
  getRolePermissions: async (roleId) => {
    const [rows] = await db.query(
      `SELECT 
        rp.id, 
        rp.roleId, 
        r.roleName, 
        rp.permissionId, 
        p.permissionName
       FROM rolepermissions rp
       INNER JOIN roles r ON rp.roleId = r.id
       INNER JOIN permissions p ON rp.permissionId = p.id
       WHERE rp.roleId = ?
       ORDER BY p.permissionName ASC`,
      [roleId]
    );

    return rows;
  },

  // ==========================
  // GET ALL PERMISSIONS
  // ==========================
  getAllPermissions: async () => {
    const [rows] = await db.query(
      `SELECT id, permissionName 
       FROM permissions 
       ORDER BY permissionName ASC`
    );

    return rows;
  },

  // ==========================
  // MATRIX (USED BY FRONTEND)
  // ==========================
  getRolePermissionMatrix: async () => {
    const [rows] = await db.query(`
      SELECT 
        r.id as roleId,
        r.roleName,
        p.permissionName
      FROM roles r
      LEFT JOIN rolepermissions rp ON r.id = rp.roleId
      LEFT JOIN permissions p ON rp.permissionId = p.id
    `);

    return rows;
  }

};

module.exports = RolePermission;