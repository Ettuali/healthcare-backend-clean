// models/totalDoc&Pat.model.js
const db = require("../config/db");

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
 * Counts the total number of users with a specific role.
 * @param {string} roleName - The name of the role (e.g., 'admin', 'doctor', 'patient', 'nurse').
 * @returns {Promise<number>} The total count.
 */
const countUsersByRole = async (roleName, year, month) => {
  const roleId = await getRoleIdByName(roleName);

  let query = `
    SELECT 
      YEAR(u.createdOn) as year,
      MONTH(u.createdOn) as month,
      COUNT(u.id) as count
    FROM user u
    JOIN userrole ur ON u.id = ur.userId
    WHERE ur.roleId = ?
  `;

  const params = [roleId];

  if (year) {
    query += ` AND YEAR(u.createdOn) = ?`;
    params.push(year);
  }

  if (month) {
    query += ` AND MONTH(u.createdOn) = ?`;
    params.push(month);
  }

  query += ` GROUP BY year, month`;

  const [rows] = await db.query(query, params);
  return rows;
};

module.exports = {
  countUsersByRole,
};