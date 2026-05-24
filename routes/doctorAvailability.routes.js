const express = require("express");
const router = express.Router();
const doctorAvailabilityController = require("../controllers/doctorAvailability.controller");

// Check availability
router.get("/:doctorId", doctorAvailabilityController.checkAvailability);

// Update timings
router.post("/update", doctorAvailabilityController.updateTimings);

// Delete timings
router.delete("/delete/:doctorId", doctorAvailabilityController.deleteTimings);

module.exports = router;
