// routes/hospitalAdminRoutes.js

const express = require('express');
const router = express.Router();
const hospitalAdminController = require('../controllers/adminhospital.controller');
const { verifyToken  } = require('../middleware/auth'); // Assuming this is your middleware file path


// GET all active hospitals
router.get('/hospital',verifyToken, hospitalAdminController.getAllHospitals);

// GET a single hospital by ID
router.get('/hospital/:id', verifyToken,hospitalAdminController.getHospitalById);

// POST a new hospital
router.post('/hospital',verifyToken,hospitalAdminController.addHospital);

// PUT to update a hospital by ID
router.put('/hospital/:id',verifyToken , hospitalAdminController.updateHospital);

router.get('/assignments/:id', verifyToken , hospitalAdminController.getAssignmentsByHospitals);

// PUT to deactivate a hospital by ID (soft delete)
router.delete('/hospital/:id', verifyToken, hospitalAdminController.deactivateHospital);

module.exports = router;