const express = require("express");
const router = express.Router();
const controller = require("../controllers/patientAssign.controller");
const { verifyToken } = require("../middleware/auth");

// --- DROPDOWN DATA ROUTES ---
// These are called when a hospital is selected in the UI
// Path: GET /api/patient-assignments/dropdown/patients/:hospitalId
router.get(
  "/dropdown/patients/:hospitalId",
  verifyToken,
  (req, res, next) => {
    req.roleType = "Patient";
    next();
  },
  controller.getUsersByHospital
);

// Path: GET /api/patient-assignments/dropdown/doctors/:hospitalId
router.get(
  "/dropdown/doctors/:hospitalId",
  verifyToken,
  (req, res, next) => {
    req.roleType = "Doctor";
    next();
  },
  controller.getUsersByHospital
);

// --- ASSIGNMENT CRUD ROUTES ---

// GET all assignments (Main Table)
router.get("/", verifyToken, controller.getAllAssignments);

// POST create new assignment
router.post("/", verifyToken, controller.createAssignment);

// GET assignments for a specific logged-in user
router.get("/by-user/:userId", verifyToken, controller.getAssignmentsByUserId);

// GET hospital-wide assignments
router.get("/hos/:userId", verifyToken, controller.getAssignmentsByHospital);

// GET assignments via QR/Encrypted ID
router.get("/by-encrypted/:encryptedId", verifyToken, controller.getAssignmentsByEncryptedId);

// GET patients assigned to a specific doctor/nurse
router.get("/assigned-patients-by-user/:userId", verifyToken, controller.getAssignedPatientsByUserId);

// --- GENERIC ID ROUTES (Keep these at the bottom) ---
router.get("/:id", verifyToken, controller.getAssignment);
router.put("/:id", verifyToken, controller.updateAssignment);
router.delete("/:id", verifyToken, controller.deleteAssignment);

module.exports = router;