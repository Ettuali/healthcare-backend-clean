const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient.controller");

// POST route to add a new patient to the system.
// This route is handled by the addPatient function in the patient controller.
router.post("/add", patientController.addPatient);

// GET route to retrieve a list of all patients.
router.get("/", patientController.getAllPatients);

// GET route to retrieve a single patient by their ID.
router.get("/:id", patientController.getPatientById);

// PUT route to update a specific patient's information by their ID.
router.put("/:id", patientController.updatePatient);

// DELETE route to remove a patient from the system by their ID.
router.delete("/:id", patientController.deletePatient);

module.exports = router;
