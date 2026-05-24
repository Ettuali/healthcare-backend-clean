const express = require('express');
const router = express.Router();
const patientChartsController = require('../controllers/patientChart.controller');
// Add your authentication middleware
const { verifyToken } = require('../middleware/auth'); 

// Connects the frontend request to the controller logic
router.get(
    '/:id', 
    verifyToken, 
    patientChartsController.getVitalsChartData
);

module.exports = router;
// Ensure you import this router into your main app.js/server.js file