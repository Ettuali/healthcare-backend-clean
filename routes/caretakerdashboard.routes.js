const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/caretakerDashboard.controller");
const { verifyToken } = require("../middleware/auth")

// GET /api/caretaker-dashboard?year=2025&month=10&date=8
router.get("/", verifyToken, dashboardController.getDashboardData);

module.exports = router;
