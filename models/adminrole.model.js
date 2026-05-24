const db = require("../config/db"); // Your MySQL connection

/**
 * Fetches all active users associated with a specific role.
 * @param {string} roleName The name of the role (e.g., 'admin', 'doctor').
 * @returns {Array<Object>} An array of user objects.
 */
const getUsersByRole = async (roleName) => {
    try {
        const [rows] = await db.query(
            `SELECT u.*, r.roleName
             FROM user u
             LEFT JOIN userrole ur ON u.id = ur.userId
             LEFT JOIN roles r ON ur.roleId = r.id
             WHERE r.roleName = ? AND u.status = 'active'`,
            [roleName]
        );
        return rows;
    } catch (error) {
        console.error(`Error fetching users by role '${roleName}': ${error.message}`);
        throw error;
    }
};

/**
 * Fetches a single user by their ID.
 * @param {number} userId The ID of the user.
 * @returns {Object|null} The user object or null if not found.
 */
const getUserById = async (userId) => {
    try {
        const [rows] = await db.query(
            `SELECT u.*, r.roleName
             FROM user u
             LEFT JOIN userrole ur ON u.id = ur.userId
             LEFT JOIN roles r ON ur.roleId = r.id
             WHERE u.id = ?`,
            [userId]
        );
        return rows.length ? rows[0] : null;
    } catch (error) {
        console.error(`Error fetching user by ID '${userId}': ${error.message}`);
        throw error;
    }
};

/**
 * Updates a user by their ID.
 * @param {number} userId The ID of the user.
 * @param {object} userData The data to update.
 * @returns {number} The number of affected rows.
 */
const updateUser = async (userId, userData) => {
    try {
        const [result] = await db.query(
            `UPDATE user SET ? WHERE id = ?`,
            [userData, userId]
        );
        return result.affectedRows;
    } catch (error) {
        console.error(`Error updating user by ID '${userId}': ${error.message}`);
        throw error;
    }
};

/**
 * Deletes a user by their ID.
 * @param {number} userId The ID of the user.
 * @returns {number} The number of affected rows.
 */
const deleteUser = async (userId) => {
    try {
        const [result] = await db.query(
            `DELETE FROM user WHERE id = ?`,
            [userId]
        );
        return result.affectedRows;
    } catch (error) {
        console.error(`Error deleting user by ID '${userId}': ${error.message}`);
        throw error;
    }
};

module.exports = {
    getUsersByRole,
    getUserById,
    updateUser,
    deleteUser
};