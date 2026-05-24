const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');

// Caretaker Routes
router.post('/', taskController.assignTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/caretaker/:caretakerId', taskController.getTasksForCaretaker);

// Patient Routes
router.get('/patient/:patientId', taskController.getTasksForPatient);
router.put('/:id/status', taskController.updateTaskStatus);
router.get('/patients/:patientId', taskController.getTasksByPatient);
// All tasks (general)
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskDetails);

module.exports = router;
