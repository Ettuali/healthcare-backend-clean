// controllers/totalCounts.controller.js
const totalCountsModel = require("../models/totalCounts.model");

/**
 * Retrieves the total count and percentage for admins, doctors, nurses, patients, and hospitals.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const getAllCounts = async (req, res) => {
  try {
    const totalAdmins = await totalCountsModel.countUsersByRole('admin');
    const totalDoctors = await totalCountsModel.countUsersByRole('doctor');
    const totalNurses = await totalCountsModel.countUsersByRole('nurse');
    const totalPatients = await totalCountsModel.countUsersByRole('patient');
    const totalHospitals = await totalCountsModel.countHospitals();

    // Calculate total users (admins + doctors + nurses + patients)
    const totalUsers = totalAdmins + totalDoctors + totalNurses + totalPatients;

    // Calculate percentages and round to the nearest whole number
    const totalAdminsPercentage = totalUsers > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 0;
    const totalDoctorsPercentage = totalUsers > 0 ? Math.round((totalDoctors / totalUsers) * 100) : 0;
    const totalNursesPercentage = totalUsers > 0 ? Math.round((totalNurses / totalUsers) * 100) : 0;
    const totalPatientsPercentage = totalUsers > 0 ? Math.round((totalPatients / totalUsers) * 100) : 0;

    // For hospitals, calculate percentage relative to the total number of users + hospitals
    const totalOverall = totalUsers + totalHospitals;
    const totalHospitalsPercentage = totalOverall > 0 ? Math.round((totalHospitals / totalOverall) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalAdmins,
        totalAdminsPercentage: `${totalAdminsPercentage}%`,
        totalDoctors,
        totalDoctorsPercentage: `${totalDoctorsPercentage}%`,
        totalNurses,
        totalNursesPercentage: `${totalNursesPercentage}%`,
        totalPatients,
        totalPatientsPercentage: `${totalPatientsPercentage}%`,
        totalHospitals,
        totalHospitalsPercentage: `${totalHospitalsPercentage}%`,
      },
    });
  } catch (err) {
    console.error('Error fetching all counts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching counts.',
      error: err.message,
    });
  }
};

module.exports = {
  getAllCounts,
};