const {
  insertAssignment,
  fetchAllAssignments,
  fetchAssignmentByUserId,
  deleteAssignmentById
} = require("../models/assignHospital.model");

// Create a new assignment
const createAssignment = async (req, res) => {
  try {
    const { userId, hospitalId } = req.body;

    if (!userId || !hospitalId) {
      return res.status(400).json({ error: "userId and hospitalId are required" });
    }

    await insertAssignment(userId, hospitalId);
    res.status(201).json({ message: "Hospital assigned successfully" });
  } catch (error) {
    console.error("Error assigning hospital:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all hospital assignments
const getAllAssignments = async (req, res) => {
  try {
    const [assignments] = await fetchAllAssignments(); // this calls the fixed SQL
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get assignment by user ID
const getAssignmentByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [assignment] = await fetchAssignmentByUserId(userId);

    if (!assignment.length) {
      return res.status(404).json({ message: "No assignment found for this user" });
    }

    res.status(200).json(assignment);
  } catch (error) {
    console.error("Error fetching assignment by user ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete assignment by ID
const deleteAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    await deleteAssignmentById(assignmentId);
    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentByUserId,
  deleteAssignment,
};
 