const express = require("express");
const router = express.Router();
const hospatientController = require("../controllers/hospatient.controller");
const { verifyToken } = require('../middleware/auth');

// ─── CREATE ───────────────────────────────
router.post("/patients", verifyToken, hospatientController.addPatient);

// ─── GET ALL (HOSPITAL USER) ─────────────
router.get("/patients", verifyToken, hospatientController.getPatients);

// ─── GET VITALS PATIENTS (HOSPITAL) ─────
router.get(
  "/vitals-patients",
  verifyToken,
  hospatientController.getVitalsPatients
);

// ─── GET BY ID ───────────────────────────
router.get("/patients/:id", verifyToken, hospatientController.getPatientById);

// ─── GET BY HOSPITAL (ADMIN ONLY) ────────
// 🔥 ONLY keep this IF you actually implement it in controller
// router.get("/patients/hospital/:hospitalId", verifyToken, hospatientController.getPatientsByHospitalId);

// ─── DOCTORS ─────────────────────────────
router.get("/doctors", verifyToken, hospatientController.getDoctors);

// ─── UPDATE ──────────────────────────────
router.put("/patients/:id", verifyToken, hospatientController.updatePatient);

// ─── STATUS ──────────────────────────────
router.put("/patients/deactivate/:id", verifyToken, hospatientController.deactivatePatient);
router.put("/patients/reactivate/:id", verifyToken, hospatientController.reactivatePatient);

// ─── PACKAGE ─────────────────────────────
router.post("/patients/:id/renew", verifyToken, hospatientController.renewPatientPackage);

module.exports = router;