const Task = require('../models/task.model');
const cryptoService = require("../services/crypto.service");

// Assign a new task (Create)
exports.assignTask = async (req, res) => {
  try {
    const { title, description, videoUrl, dueDate, assignedTo, assignedBy } = req.body;
    
    if (!assignedTo || !assignedBy || !title || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields: assignedTo, assignedBy, title, and dueDate.' });
    }

    // 🔑 Decrypt caretaker ID before inserting
    const decryptedAssignedBy = await cryptoService.decrypt(assignedBy, "authentication");

    const newTask = await Task.createTask({
      title,
      description,
      videoUrl,
      dueDate,
      assignedTo,
      assignedBy: decryptedAssignedBy,
    });

    res.status(201).json({ message: 'Task assigned successfully.', task: newTask });
  } catch (err) {
    console.error('Error assigning task:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Update an existing task (modified to handle patientName + decrypt caretaker)
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, dueDate, status, patientName, assignedTo, assignedBy } = req.body;

    const existingTask = await Task.getTaskById(id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    let patientId = assignedTo;

    if (patientName) {
      patientId = await Task.getPatientIdByName(patientName);
      if (!patientId) {
        return res.status(404).json({ message: 'Patient not found.' });
      }
    }

    // 🔑 Decrypt caretaker ID before updating
    const decryptedAssignedBy = assignedBy
      ? await cryptoService.decrypt(assignedBy, "authentication")
      : existingTask.assigned_by;

    const updatedTask = await Task.updateTask(id, {
      title,
      description,
      videoUrl,
      dueDate,
      status,
      assignedTo: patientId,
      assignedBy: decryptedAssignedBy,
    });

    res.status(200).json({ message: 'Task updated successfully.', task: updatedTask });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Delete a task (Delete)
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTask = await Task.getTaskById(id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    await Task.deleteTask(id);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get all tasks (Read)
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.getAllTasks();
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching all tasks:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get a single task by ID (Read)
exports.getTaskDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.getTaskById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error('Error fetching task details:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get all tasks for a specific patient (Read)
exports.getTasksForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const tasks = await Task.getTasksByAssignedToId(patientId);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks for patient:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Update the status of a task (Update)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    status = status.toLowerCase();

    const result = await Task.updateTaskStatus(id, status);

    return res.status(200).json({
      success: true,
      message: result.message || "Task status updated successfully.",
    });

  } catch (err) {
    console.error("Error updating task status:", err);

    if (err.message === "Invalid status value" || err.message.includes("Invalid transition")) {
      return res.status(400).json({ message: err.message });
    }

    if (err.message === "Task not found") {
      return res.status(404).json({ message: err.message });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all tasks for a specific caretaker
exports.getTasksForCaretaker = async (req, res) => {
  try {
    const { caretakerId } = req.params;

    // 🔑 Decrypt caretaker ID before fetching
    const decryptedCaretakerId = await cryptoService.decrypt(caretakerId, "authentication");

    const tasks = await Task.getTasksByAssignedById(decryptedCaretakerId);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks for caretaker:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get all tasks by patient (with encrypted patientId in URL)
exports.getTasksByPatient= async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ message: 'Missing required field: patientId.' });
    }

    const decryptedPatientId = await cryptoService.decrypt(patientId, 'authentication');
    const tasks = await Task.getTasksByAssignedToId(decryptedPatientId);

    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks for patient:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};