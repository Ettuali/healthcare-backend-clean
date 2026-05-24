// routes/totalDoc&Pat.Routes.js
const express = require("express");
const router = express.Router();
const totalCountsController = require("../controllers/totalDocAndPat.controller");

// GET total counts for doctors and patients
router.get("/doctor-patient-counts", totalCountsController.getDoctorAndPatientCounts);

module.exports = router;