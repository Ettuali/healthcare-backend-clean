// controllers/totalDoc&Pat.controller.js
const totalCountsModel = require("../models/totalDoc&Pat.model");


const getDoctorAndPatientCounts = async (req, res) => {
  try {
    const { year, month } = req.query;

    // Fetch grouped data
    const doctorCounts = await totalCountsModel.countUsersByRole('doctor', year, month);
    const patientCounts = await totalCountsModel.countUsersByRole('patient', year, month);

    // Helper to sum counts
    const sumCounts = (arr) => {
      if (!Array.isArray(arr)) return 0;
      return arr.reduce((sum, item) => sum + Number(item.count || 0), 0);
    };

    const totalDoctors = sumCounts(doctorCounts);
    const totalPatients = sumCounts(patientCounts);

    res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        totalPatients,
      },
    });

  } catch (err) {
    console.error('Error fetching doctor and patient counts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching counts.',
      error: err.message,
    });
  }
};

module.exports = {
  getDoctorAndPatientCounts,
};