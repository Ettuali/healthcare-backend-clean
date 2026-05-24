// controllers/patient_analytics.controller.js

const patientAnalyticsModel = require('../models/patient_analytics.model');

/**
 * Handles the request to get comprehensive patient analytics.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function getAnalytics(req, res) {
  try {
    const analyticsData = await patientAnalyticsModel.getComprehensivePatientAnalytics();

    // Check for analytic data safety across all three potential arrays
    if (!analyticsData || 
        (analyticsData.genderAnalytics.length === 0 && 
         analyticsData.bloodGroupAnalytics.length === 0 &&
         analyticsData.bloodGroupAnalyticsByHospital.length === 0)) { // Added check for new array
      return res.status(404).json({ message: "No patient analytics data found." });
    }

    res.status(200).json({
      message: "Comprehensive patient analytics retrieved successfully.",
      data: analyticsData
    });
  } catch (error) {
    console.error("Controller Error fetching patient analytics:", error.message);
    // Returns the detailed error from the model
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAnalytics,
};