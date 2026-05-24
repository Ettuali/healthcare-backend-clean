// routes/patient_analytics.routes.js

const express = require('express');
const router = express.Router();
const patientAnalyticsController = require('../controllers/patient_analytics.controller');

// GET /api/v1/analytics/patient-counts
// Retrieves patient counts grouped by hospital, blood group, and gender
router.get('/patient-counts', patientAnalyticsController.getAnalytics);

module.exports = router;