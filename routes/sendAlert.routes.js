const router = require("express").Router();
const sendAlertController = require("../controllers/sendAlert.controller");

// ========================================
// ALERT CREATION
// ========================================
router.post("/raise/patient", sendAlertController.sendAlertForPatient);
router.post("/raise/doctor", sendAlertController.sendAlertForDoctor);

// ========================================
// PAGINATED ALERT LISTS (JOINs INCLUDED)
// ========================================

// 🔹 All alerts (paginated, searchable, sortable)
router.get("/", sendAlertController.getAllAlerts);

// 🔹 Alerts by Patient / Doctor / Coach (non-decrypted IDs)
router.get("/patient/:patientId", sendAlertController.getAlertsByPatientId);
router.get("/doctor/:doctorId", sendAlertController.getAlertsByDoctorId);
router.get("/coach/:coachId", sendAlertController.getAlertsByCoachId);

// ========================================
// DECRYPTED ID ROUTES (MUST COME BEFORE :id)
// ========================================
router.get("/patient/decrypted/:patientId", sendAlertController.getAlertsByPatientIdDecrypted);
router.get("/doctor/decrypted/:doctorId", sendAlertController.getAlertsByDoctorIdDecrypted);
router.get("/coach/decrypted/:coachId", sendAlertController.getAlertsByCoachIdDecrypted);

// ========================================
// SINGLE ALERT, UPDATE, DELETE
// ========================================

// 🔹 Fetch a single alert by ID (with JOINs/decryption)
router.get("/:id", sendAlertController.getAlertByIdDecrypted);

// 🔹 Update status or response for a specific alert
router.put("/:id", sendAlertController.updateAlertStatus);

// 🔹 Delete alert by ID
router.delete("/:id", sendAlertController.deleteAlert);

module.exports = router;