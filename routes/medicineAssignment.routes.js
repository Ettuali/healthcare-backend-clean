const express = require('express');
const router = express.Router();
const medicineAssignmentController = require('../controllers/medicineAssignment.controller');
const { verifyToken } = require('../middleware/auth');

// POST /api/medicine-assignments - Assign a new medicine (requires auth)
router.post('/', verifyToken, medicineAssignmentController.assignMedicineToPatient);

// GET /api/medicine-assignments/patients/:patientId - Get all assigned medicines
router.get('/patients/:patientId', verifyToken, medicineAssignmentController.getPatientAssignedMedicines);

// GET /api/medicine-assignments/patients/:patientId/today - Get today's medicines
router.get('/patients/:patientId/today', verifyToken, medicineAssignmentController.getTodaysMedicines);

// PUT /api/medicine-assignments/:assignmentId - Update an existing medicine assignment
router.put('/:assignmentId', verifyToken, medicineAssignmentController.updatePatientAssignedMedicine);

// DELETE /api/medicine-assignments/:assignmentId - Delete a medicine assignment
router.delete('/:assignmentId', verifyToken, medicineAssignmentController.deletePatientAssignedMedicine);

module.exports = router;
