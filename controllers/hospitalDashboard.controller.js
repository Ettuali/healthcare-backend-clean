const Dashboard = require("../models/hospitalDashboard.model");
const db = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized - user missing"
      });
    }

    let hospitalId = req.user.hospitalId;

    // fallback hospital resolution
    if (!hospitalId) {
      const [rows] = await db.query(
        "SELECT hospitalId FROM assignedhospital WHERE userId = ? LIMIT 1",
        [req.user.id]
      );

      if (!rows.length) {
        return res.status(400).json({
          message: "User is not assigned to any hospital"
        });
      }

      hospitalId = rows[0].hospitalId;
    }

    if (!hospitalId) {
      return res.status(400).json({
        message: "HospitalId not found"
      });
    }

    // ==========================================
    // DATE FILTERS
    // ==========================================

    const {
      fromDate,
      toDate,
      year: queryYear
    } = req.query;

    const currentYear = new Date().getFullYear();
    const year = parseInt(queryYear) || currentYear;

    // ==========================================
    // FETCH DATA
    // ==========================================

    const [
      stats,
      dept,
      weekly,
      gender,
      blood,
      age,
      patients,
      patientDeptWorkload,
      patientOverviewRaw
    ] = await Promise.all([
      Dashboard.getStats(hospitalId, fromDate, toDate),

      // structural
      Dashboard.getDoctorsByDept(hospitalId),

      // operational monitoring
      Dashboard.getPatientActivityLast7Days(hospitalId),

      // filtered analytics
      Dashboard.getGenderStats(hospitalId, fromDate, toDate),
      Dashboard.getBloodGroupStats(hospitalId, fromDate, toDate),
      Dashboard.getAgeDistribution(hospitalId, fromDate, toDate),
      Dashboard.getPatientList(hospitalId, fromDate, toDate),
      Dashboard.getPatientsByDept(hospitalId, fromDate, toDate),

      // yearly trends
      Dashboard.getPatientDemographicsYearly(hospitalId, year)
    ]);

    // ==========================================
    // NORMALIZE DEMOGRAPHICS MONTHS
    // ==========================================

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const patientOverview = months.map((month, index) => {
      const found = patientOverviewRaw.find(
        r => r.month === index + 1
      );

      return {
        period: month,
        male: Number(found?.male) || 0,
        female: Number(found?.female) || 0,
        other: Number(found?.other) || 0
      };
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      stats,
      dept,
      weekly,
      gender,
      blood,
      age,
      patients,
      patientDeptWorkload,
      patientOverview
    });

  } catch (err) {
    console.error("[Dashboard Error]", err);

    res.status(500).json({
      message: "Dashboard error"
    });
  }
};