// =========================================
// === Hospital Controller for API search ===
// =========================================
/**
 * This controller handles the business logic for the hospital search API.
 */
const hospitalModel = require("../models/hospital.model"); // Adjust path if needed

const hospitalController = {
  /**
   * Handles the GET request to search for hospitals by name.
   * The search term is expected in the query parameters as 'name'.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   */
  async searchHospitals(req, res) {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Search query 'name' is required." });
    }

    try {
      const hospitals = await hospitalModel.findByName(name);
      res.status(200).json({ hospitals });
    } catch (error) {
      console.error("Error searching for hospitals:", error);
      res.status(500).json({ message: "An error occurred while searching for hospitals." });
    }
  },
  
  /**
   * Handles the GET request to fetch all hospitals.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   */
  async getAllHospitals(req, res) {
    try {
      const hospitals = await hospitalModel.findAll();
      res.status(200).json({ hospitals });
    } catch (error) {
      console.error("Error fetching all hospitals:", error);
      res.status(500).json({ message: "An error occurred while fetching all hospitals." });
    }
  }
};

module.exports = hospitalController;