// models/hospitalUserModel.js

const db = require("../config/db");

/**
 * Fetches all users from the database who have a specific role ID,
 * along with their associated hospital details.
 * @param {number} roleId - The ID of the role to filter by.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
const getHospitalUsers = async (roleId) => {
  const [rows] = await db.query(
    `SELECT 
      u.id AS userId,
      u.name,
      u.email,
      u.location,
      ah.hospitalId,
      h.name AS hospitalName
    FROM user u
    INNER JOIN userrole ur ON u.id = ur.userId
    INNER JOIN assignedhospital ah ON u.id = ah.userId
    INNER JOIN hospital h ON ah.hospitalId = h.id
    WHERE ur.roleId = ?`,
    [roleId]
  );
  return rows;
};

module.exports = {
  getHospitalUsers,
};