const assignedCoachModel = require("../models/assignedCoach.model");

// Assign a Coach
const assignCoach = async (req, res) => {
  try {
    const { userId, coachId } = req.body;

    if (!userId || !coachId) {
      return res.status(400).json({
        success: false,
        message: "userId and coachId are required",
      });
    }

    const assignmentId = await assignedCoachModel.assignCoach(userId, coachId);

    res.status(201).json({
      success: true,
      message: "Coach assigned successfully",
      data: { id: assignmentId },
    });
  } catch (err) {
    console.error("Assign coach error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while assigning coach",
    });
  }
};

// Reassign Coach
const reassignCoach = async (req, res) => {
  try {
    const { id } = req.params;
    const { coachId } = req.body;

    if (!id || !coachId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID and new coachId are required",
      });
    }

    await assignedCoachModel.reassignCoach(id, coachId);

    res.status(200).json({
      success: true,
      message: "Coach reassigned successfully",
    });
  } catch (err) {
    console.error("Reassign coach error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while reassigning coach",
    });
  }
};

//  Remove Coach Assignment
const removeCoach = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required",
      });
    }

    await assignedCoachModel.removeCoach(id);

    res.status(200).json({
      success: true,
      message: "Coach assignment removed successfully",
    });
  } catch (err) {
    console.error("Remove coach error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while removing coach assignment",
    });
  }
};

module.exports = {
  assignCoach,
  reassignCoach,
  removeCoach,
};
