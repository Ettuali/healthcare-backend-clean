const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/caretakerdashboard.controller");
const { verifyToken } = require("../middleware/auth");

// GET /api/caretaker-dashboard?fromDate=2026-04-01&toDate=2026-05-26
router.get("/", verifyToken, dashboardController.getDashboardData);

module.exports = router;