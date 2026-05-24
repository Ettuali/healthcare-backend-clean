const db = require("../config/db");

const Role = {
  // Add new role (MUST be lowercase)
  addRole: async (roleName, description, createdBy) => {
    // Enforce lowercase role names
    const lowerRoleName = roleName.toLowerCase().trim();
    
    try {
      const [result] = await db.query(
        `INSERT INTO roles (roleName, description, createdBy) 
         VALUES (?, ?, ?)`,
        [lowerRoleName, description || null, createdBy]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Role '${lowerRoleName}' already exists`);
      }
      throw error;
    }
  },

  // Get all roles
  getAllRoles: async () => {
    try {
      const [rows] = await db.query(
        `SELECT id, roleName, description, createdBy, createdOn, updatedOn 
         FROM roles 
         ORDER BY roleName ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get role by ID
  getRoleById: async (roleId) => {
    try {
      const [rows] = await db.query(
        `SELECT id, roleName, description, createdBy, createdOn, updatedOn 
         FROM roles 
         WHERE id = ?`,
        [roleId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Get role by name
  getRoleByName: async (roleName) => {
    try {
      const [rows] = await db.query(
        `SELECT id, roleName, description, createdBy, createdOn, updatedOn 
         FROM roles 
         WHERE roleName = ?`,
        [roleName.toLowerCase().trim()]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  // Update role
  updateRole: async (roleId, roleName, description, updatedBy) => {
    try {
      const lowerRoleName = roleName.toLowerCase().trim();
      
      const [result] = await db.query(
        `UPDATE roles 
         SET roleName = ?, description = ?, updatedOn = NOW() 
         WHERE id = ?`,
        [lowerRoleName, description || null, roleId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Role not found');
      }
      
      return result;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Role '${roleName}' already exists`);
      }
      throw error;
    }
  },

  // Delete a role
  deleteRole: async (roleId) => {
    try {
      const [result] = await db.query(
        `DELETE FROM roles WHERE id = ?`,
        [roleId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Role not found');
      }
      
      return result.affectedRows;
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new Error('Cannot delete role: it is assigned to users or has permissions');
      }
      throw error;
    }
  },

  // Check if role exists
  roleExists: async (roleName) => {
    try {
      const [rows] = await db.query(
        `SELECT id FROM roles WHERE roleName = ?`,
        [roleName.toLowerCase().trim()]
      );
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Role;