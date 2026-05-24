const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/patientDashboard.controller");
const { verifyToken } = require('../middleware/auth'); 

// GET /api/patientdashboard/summary/encryptedPatientId
router.get("/summary/:patientId", verifyToken, dashboardController.getDashboardData);

module.exports = router;