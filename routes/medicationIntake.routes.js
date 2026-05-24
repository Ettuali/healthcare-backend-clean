const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicationIntake.controller");

// Log and update
router.post("/", controller.logIntake);
router.put("/:logId", controller.updateIntake);

// Raw ID routes (Now accepts ?limit=X&offset=Y)
router.get("/history/:patientId", controller.getIntakeHistory);
router.get("/patients/:patientId/medicine-updates/:date", controller.getPatientMedicineUpdatesRaw);
// ADD THIS NEW ROUTE TO MATCH THE FRONTEND'S REQUEST (Now accepts ?limit=X&offset=Y)
router.get("/patient/:patientId/medicine-history", controller.getIntakeHistory);

// Encrypted ID routes (Now accepts ?limit=X&offset=Y)
router.get("/patients/encrypted/:patientId/medicine-updates/:date", controller.getPatientMedicineUpdatesEncrypted);
router.get("/patients/encrypted/:patientId/medicine-history", controller.getIntakeHistoryEncrypted);

module.exports = router;