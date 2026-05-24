// controllers/totalCounts.controller.js
const totalCountsModel = require("../models/totalCounts.model");

/**
 * Aggregates all counts (Admins, Doctors, Nurses, Patients, Hospitals) grouped by year and month.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const getAllCounts = async (req, res) => {
  try {
    const { year, month } = req.query;

    const adminCounts = await totalCountsModel.countUsersByRole('admin', year, month);
    const doctorCounts = await totalCountsModel.countUsersByRole('doctor', year, month);
    const nurseCounts = await totalCountsModel.countUsersByRole('nurse', year, month);
    const patientCounts = await totalCountsModel.countUsersByRole('patient', year, month);
    const hospitalCounts = await totalCountsModel.countHospitals(year, month); // make sure this supports filter

    const sumCounts = (arr) => {
      if (!Array.isArray(arr)) return 0;
      return arr.reduce((sum, item) => sum + Number(item.count || 0), 0);
    };

    const totalAdmins = sumCounts(adminCounts);
    const totalDoctors = sumCounts(doctorCounts);
    const totalNurses = sumCounts(nurseCounts);
    const totalPatients = sumCounts(patientCounts);
    const totalHospitals = sumCounts(hospitalCounts);

    const totalUsers = totalAdmins + totalDoctors + totalNurses + totalPatients;
    const totalOverall = totalUsers + totalHospitals;

    res.status(200).json({
      success: true,
      data: {
        totalAdmins,
        totalDoctors,
        totalNurses,
        totalPatients,
        totalHospitals,
        totalUsers,
        totalOverall
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAllCounts,
};