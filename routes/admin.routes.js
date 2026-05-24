const express = require("express");
const router = express.Router();

const adminDashboardController = require("../controllers/adminDashboard.controller");
const { verifyToken } = require("../middleware/auth");

router.get(
  "/hospitals-by-state", 
  verifyToken,
  adminDashboardController.getHospitalsByState 
);

module.exports = router;