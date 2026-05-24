const DashboardModel = require('../models/dashboard.model'); 

// ✅ Helper: safe param parsing
const getYearMonthParams = (req) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const hospitalId = Number(req.query.hospitalId);

  return {
    year: Number.isInteger(year) ? year : null,
    month: Number.isInteger(month) ? month : null,
    hospitalId: Number.isInteger(hospitalId) ? hospitalId : null
  };
};

// =========================
// CORE DASHBOARD
// =========================

const getOverallCounts = async (req, res) => {
  try {
    const { year, month } = getYearMonthParams(req);

    const counts = await DashboardModel.getTotalCounts(year, month);

    res.status(200).json({ success: true, data: counts });

  } catch (error) {
    console.error('Error in getOverallCounts:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve overall counts." });
  }
};

const getWeeklyData = async (req, res) => {
  try {
    const { year } = getYearMonthParams(req);

    const weeklyData = await DashboardModel.getWeeklyUsers(year);

    res.status(200).json({ success: true, data: weeklyData });

  } catch (error) {
    console.error('Error in getWeeklyData:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve weekly data." });
  }
};

const getMonthlyData = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return res.status(400).json({ success: false, message: "Year and month are required path parameters." });
    }

    const monthlyData = await DashboardModel.getMonthlyDetails(year, month);

    res.status(200).json({ success: true, data: monthlyData });

  } catch (error) {
    console.error('Error in getMonthlyData:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve monthly data." });
  }
};

const getYearlyData = async (req, res) => {
  try {
    const { year } = getYearMonthParams(req);

    const yearlyData = await DashboardModel.getYearlyPerformance(year);

    res.status(200).json({ success: true, data: yearlyData });

  } catch (error) {
    console.error('Error in getYearlyData:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve yearly data." });
  }
};

// =========================
// HOSPITAL LEVEL
// =========================

const getHospitalDoctorPatientDetails = async (req, res) => {
  try {
    const { year, month } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getHospitalDoctorPatientBreakdown(year, month);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching hospital breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve hospital breakdown." });
  }
};

const getHospitalPatientData = async (req, res) => {
  try {
    const { year, month } = getYearMonthParams(req);

    const counts = await DashboardModel.getHospitalPatientCounts(year, month);

    res.status(200).json({ success: true, data: counts });

  } catch (error) {
    console.error('Error fetching hospital patient counts:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve hospital patient counts." });
  }
};

const getHospitalPatientBloodGroupBreakdown = async (req, res) => {
  try {
    const { year, month } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getHospitalPatientBloodGroupBreakdown(year, month);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching hospital blood group breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve hospital blood group breakdown." });
  }
};

const getHospitalPatientGenderBreakdownController = async (req, res) => {
  try {
    const { year, month } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getHospitalPatientGenderBreakdown(year, month);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching hospital gender breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve hospital gender breakdown." });
  }
};

// =========================
// GLOBAL PATIENT DATA
// =========================

const getTotalPatientGenderBreakdownController = async (req, res) => {
  try {
    const { year, month, hospitalId } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getTotalPatientGenderBreakdown(year, month, hospitalId);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching total patient gender breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve gender breakdown." });
  }
};

const getTotalPatientBloodGroupBreakdownController = async (req, res) => {
  try {
    const { year, month, hospitalId } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getTotalPatientBloodGroupBreakdown(year, month, hospitalId);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching blood group breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve blood group breakdown." });
  }
};

// =========================
// PATIENT ANALYTICS
// =========================

const getPatientBreakdownBySpecializationController = async (req, res) => {
  try {
    const { year, month, hospitalId } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getPatientBreakdownBySpecialization(year, month, hospitalId);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching specialization breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve specialization breakdown." });
  }
};

const getPatientBreakdownByAgeController = async (req, res) => {
  try {
    const { year, month, hospitalId } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getPatientBreakdownByAge(year, month, hospitalId);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching age breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve age breakdown." });
  }
};

// =========================
// DOCTOR ANALYTICS
// =========================

const getDoctorsBySpecializationController = async (req, res) => {
  try {
    const { year, month, hospitalId } = getYearMonthParams(req);

    const breakdown = await DashboardModel.getDoctorsBySpecialization(year, month, hospitalId);

    res.status(200).json({ success: true, data: breakdown });

  } catch (error) {
    console.error('Error fetching doctor specialization breakdown:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve doctor specialization breakdown." });
  }
};

// =========================
// EXPORTS
// =========================

module.exports = {
  getOverallCounts,
  getWeeklyData,
  getMonthlyData,
  getYearlyData,
  getHospitalDoctorPatientDetails,
  getHospitalPatientData,
  getHospitalPatientBloodGroupBreakdown,
  getHospitalPatientGenderBreakdownController,
  getTotalPatientGenderBreakdownController,
  getTotalPatientBloodGroupBreakdownController,
  getPatientBreakdownBySpecializationController,
  getPatientBreakdownByAgeController,
  getDoctorsBySpecializationController,
};