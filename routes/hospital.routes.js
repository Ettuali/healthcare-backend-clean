// ==================================
// === Hospital Routes for API search ===
// ==================================
/**
 * This file defines the routes for the hospital search API.
 */
const express = require("express");
const router = express.Router();
const hospitalController = require("../controllers/hospital.controller"); // Adjust path if needed

// Route to search for hospitals by name.

router.get("/search", hospitalController.searchHospitals);

// Route to get all hospitals.

router.get("/all", hospitalController.getAllHospitals);

module.exports = router;