const express = require("express");
const router = express.Router();

const responseController = require("../controllers/response.controller");

// GET /api/responses/all
// Get all alerts that have a response
router.get(
  "/all",
  responseController.getAllResponses
);

// GET /api/responses/patient/:patientId
// Get all alerts for a patient that have a response
router.get(
  "/patient/:patientId",
  responseController.getResponsesByPatientId
);

// GET /api/responses/:id
// Get a single response by alert ID
router.get(
  "/:id",
  responseController.getResponseByAlertId
);

// PATCH /api/responses/:id
// Add a response to an existing alert
router.patch(
  "/:id",
  responseController.addResponse
);

module.exports = router;