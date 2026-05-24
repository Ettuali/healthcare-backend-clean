const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/admindoc.controller");
const { verifyToken } = require('../middleware/auth');

// --- 1. COLLECTION ROUTES ---

// GET all
router.get("/doctors", verifyToken, doctorController.getAllDoctors);

// POST
router.post("/doctors", verifyToken, doctorController.addDoctor);

// FILTER
router.get("/doctors/hospital/:hospitalId", verifyToken, doctorController.getDoctorsByHospital);

// INDIVIDUAL
router.get("/doctors/:id", verifyToken, doctorController.getDoctorById);
router.put("/doctors/:id", verifyToken, doctorController.updateDoctor);
router.delete("/doctors/:id", verifyToken, doctorController.deactivateDoctor);


module.exports = router;