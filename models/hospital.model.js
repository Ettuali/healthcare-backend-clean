// =====================================
// === Hospital Model for API search ===
// =====================================
/**
 * This model file handles database queries related to the 'hospital' table.
 */
const pool = require("../config/db"); // Assuming your database connection pool is in a config file.

const hospitalModel = {
  /**
   * Searches for hospitals by name.
   * @param {string} hospitalName - The name to search for (partial matches are supported).
   * @returns {Promise<Array>} A promise that resolves to an array of hospital objects.
   */
  async findByName(hospitalName) {
    try {
      const query = "SELECT id, name FROM hospital WHERE name LIKE ? ORDER BY name ASC";
      // The '%' wildcard allows for partial matches
      const [rows] = await pool.query(query, [`%${hospitalName}%`]);
      return rows;
    } catch (error) {
      console.error("Error in findByName model:", error);
      throw error;
    }
  },
  
  /**
   * Fetches all hospitals from the database.
   * @returns {Promise<Array>} A promise that resolves to an array of all hospital objects.
   */
  async findAll() {
    try {
      const query = "SELECT id, name FROM hospital ORDER BY name ASC";
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      console.error("Error in findAll model:", error);
      throw error;
    }
  }
};

module.exports = hospitalModel;