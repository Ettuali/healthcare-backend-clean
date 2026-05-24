const db = require("../config/db");

const UserRole = {
  // Assign role
  assignRoleToUser: async (userId, roleId) => {
    const [result] = await db.query(
      `INSERT INTO userrole (userId, roleId)
       VALUES (?, ?)`,
      [userId, roleId]
    );
    return result.insertId;
  },

  // Get roles
  getUserRoles: async (userId) => {
    const [rows] = await db.query(
      `SELECT 
          ur.id,
          r.id AS roleId,
          r.roleName,
          ur.createdOn
       FROM userrole ur
       JOIN roles r ON ur.roleId = r.id
       WHERE ur.userId = ?`,
      [userId]
    );
    return rows;
  }
};

module.exports = UserRole;