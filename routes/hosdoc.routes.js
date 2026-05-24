const express = require("express");
const router = express.Router();
const hosdocController = require("../controllers/hosdoc.controller");
const { verifyToken } = require('../middleware/auth');

// POST a new doctor
router.post("/doctors", verifyToken, hosdocController.addDoctor);

// GET all doctors for the logged-in hospital
router.get("/doctors", verifyToken, hosdocController.getDoctors);

// ✅ NEW: GET doctors for a specific hospital (super admin or admin with rights)
router.get("/doctors/:hospitalId", verifyToken, hosdocController.getDoctorsByHospitalId);

// PUT to update a doctor by ID
router.put("/doctors/:id", verifyToken, hosdocController.updateDoctor);

// PUT to deactivate a doctor by ID (soft delete)
router.put("/doctors/deactivate/:id", verifyToken, hosdocController.deactivateDoctor);

// OPTIONAL: combined endpoint to fetch both patients & doctors
router.get("/hospital/:hospitalId/people", verifyToken, hosdocController.getHospitalPeople);

module.exports = router;
