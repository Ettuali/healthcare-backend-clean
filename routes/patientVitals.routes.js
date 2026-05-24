const express = require("express");
const router = express.Router();

const {
  createVitals,
  getVitalsByPatient,
  getVitalsByPatientEncrypted,
  updateVitals,
  updateTiming,
  deleteTiming,
  deleteVitals
} = require("../controllers/patientVitals.controller");

// CREATE
router.post("/create", createVitals);

router.get("/encrypted/:patientId", getVitalsByPatientEncrypted);

// READ (single unified endpoint)
router.get("/:patientId", getVitalsByPatient);



// UPDATE
router.put("/update/:id", updateVitals);

// TIMING
router.patch("/update-timing/:id", updateTiming);
router.patch("/delete-timing/:id", deleteTiming);

// DELETE
router.delete("/delete/:id", deleteVitals);

module.exports = router;