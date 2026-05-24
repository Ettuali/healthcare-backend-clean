const express = require("express");
const router = express.Router();
const patientController = require("../controllers/adminpatient.controller");
const { verifyToken, } = require('../middleware/auth');

// POST route to add a new patient (restricted to 'admin' role)
router.post("/patients", verifyToken, patientController.addPatient);

// GET route to retrieve all patients (accessible to admins and doctors)
router.get("/patients", patientController.getAllPatients);

// GET route to retrieve a single patient by ID (accessible to admins, doctors, and the patient themselves)
router.get("/patients/:id", patientController.getPatientById);

// NEW ROUTE: GET route to retrieve a single patient by encrypted ID
router.get("/patients/encrypted/:id", patientController.getPatientByEncryptedId);

// PUT route to update an existing patient by ID (restricted to 'admin' role)
router.put("/patients/:id", verifyToken, patientController.updatePatient);

// DELETE route to soft delete a patient by ID (restricted to 'admin' role)
router.delete("/patients/:id", patientController.deletePatient);
//renew the package 
router.post("/patients/:id/renew", verifyToken, patientController.renewPackage);


module.exports = router;