// models/adminadd.model.js
const db = require("../config/db");
const bcrypt = require("bcrypt");

// Helper function to get the role ID by name
const getRoleIdByName = async (roleName) => {
  try {
    const [rows] = await db.query(`SELECT id FROM roles WHERE roleName = ?`, [roleName]);
    if (rows.length === 0) {
      throw new Error(`Role '${roleName}' not found.`);
    }
    return rows[0].id;
  } catch (error) {
    console.error(`Error fetching role ID for '${roleName}': ${error.message}`);
    throw error;
  }
};

/**
 * Retrieves a user and their role ID.
 * @param {string} id - The ID of the user.
 * @returns {Promise<object>} The user object with id and roleId.
 */
const getRoleAndUserId = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, ur.roleId FROM user u 
       JOIN userrole ur ON u.id = ur.userId
       WHERE u.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      // Return null instead of throwing an error for a cleaner flow
      return null;
    }
    return rows[0];
  } catch (error) {
    console.error(`Error fetching user and role ID: ${error.message}`);
    throw error;
  }
};

const insertUser = async (userData, createdBy) => {
  try {
    const { name, phone, email, hashedPassword, specialization, gender, location, language } = userData;
    const [result] = await db.query(
      `INSERT INTO user (name, phone, email, password, specialization, gender, location, language, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone || '', email, hashedPassword, specialization || null, gender || null, location || "", language || "", createdBy]
    );
    return result.insertId;
  } catch (error) {
    console.error(`Error inserting user: ${error.message}`);
    throw error;
  }
};

const assignRoleToUser = async (userId, roleId) => {
  try {
    await db.query(`INSERT INTO userrole (userId, roleId) VALUES (?, ?)`, [userId, roleId]);
  } catch (error) {
    console.error(`Error assigning role to user: ${error.message}`);
    throw error;
  }
};

/**
 * Creates a new admin.
 * @param {object} adminData - The data for the new admin.
 * @param {string} createdBy - The ID of the user creating the admin.
 * @returns {Promise<number>} The ID of the newly created admin.
 */
const createAdmin = async (adminData, createdBy) => {
  try {
    const { name, email, password } = adminData;
    const roleId = await getRoleIdByName('admin');
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = await insertUser({ name, email, hashedPassword }, createdBy);
    await assignRoleToUser(newUserId, roleId);
    return newUserId;
  } catch (error) {
    console.error(`Error in createAdmin: ${error.message}`);
    throw error;
  }
};

/**
 * Retrieves all admins.
 * @returns {Promise<Array<object>>} An array of admin objects.
 */
const getAllAdmins = async () => {
  try {
    const adminRoleId = await getRoleIdByName('admin');
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.status
       FROM user u
       JOIN userrole ur ON u.id = ur.userId
       WHERE ur.roleId = ?`,
      [adminRoleId]
    );
    return rows;
  } catch (error) {
    console.error(`Error fetching all admins: ${error.message}`);
    throw error;
  }
};

/**
 * Retrieves a single admin by their ID.
 * @param {string} id - The ID of the admin.
 * @returns {Promise<object>} The admin object.
 */
const getAdminById = async (id) => {
  try {
    const adminRoleId = await getRoleIdByName('admin');
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.status
       FROM user u
       JOIN userrole ur ON u.id = ur.userId
       WHERE u.id = ? AND ur.roleId = ?`,
      [id, adminRoleId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error(`Error fetching admin by ID: ${error.message}`);
    throw error;
  }
};

/**
 * Updates an admin's information.
 * @param {string} id - The ID of the admin to update.
 * @param {object} adminData - The data to update.
 * @returns {Promise<number>} The number of affected rows.
 */
const updateAdmin = async (id, adminData) => {
  try {
    const existingAdmin = await getAdminById(id);
    if (!existingAdmin) {
      return 0; // Admin not found
    }

    const { name, email, password } = adminData;
    let hashedPassword = password;
    
    // Only hash the password if a new one is provided
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Use a dynamic query to update only the fields that are provided
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (password) updateFields.password = hashedPassword;

    const [result] = await db.query(
      `UPDATE user SET ? WHERE id = ?`,
      [updateFields, id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error(`Error updating admin: ${error.message}`);
    throw error;
  }
};

/**
 * Deletes an admin (hard delete).
 * @param {string} id - The ID of the admin to delete.
 * @returns {Promise<number>} The number of affected rows.
 */
const deleteAdmin = async (id) => {
  try {
    const existingAdmin = await getAdminById(id);
    if (!existingAdmin) {
      return 0; // Admin not found
    }

    // First, delete from the UserRole table to satisfy foreign key constraints
    await db.query(`DELETE FROM userrole WHERE userId = ?`, [id]);
    
    // Then, delete the user from the user table
    const [result] = await db.query(`DELETE FROM user WHERE id = ?`, [id]);
    return result.affectedRows;
  } catch (error) {
    console.error(`Error deleting admin: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
