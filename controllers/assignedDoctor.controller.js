
const assignedDoctorModel = require("../models/assignedDoctor.model");

//  Assign a Doctor
const assignDoctor = async (req, res) => {
  try {
    const { coachId, doctorId } = req.body;

    if (!coachId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: "coachId and doctorId are required",
      });
    }

    const assignmentId = await assignedDoctorModel.assignDoctor(coachId, doctorId);

    res.status(201).json({
      success: true,
      message: "Doctor assigned successfully",
      data: { id: assignmentId },
    });
  } catch (err) {
    console.error("Assign doctor error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while assigning doctor",
    });
  }
};

//  Reassign Doctor
const reassignDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;

    if (!id || !doctorId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID and new doctorId are required",
      });
    }

    await assignedDoctorModel.reassignDoctor(id, doctorId);

    res.status(200).json({
      success: true,
      message: "Doctor reassigned successfully",
    });
  } catch (err) {
    console.error("Reassign doctor error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while reassigning doctor",
    });
  }
};

//  Remove Doctor Assignment
const removeDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required",
      });
    }

    await assignedDoctorModel.removeDoctor(id);

    res.status(200).json({
      success: true,
      message: "Doctor assignment removed successfully",
    });
  } catch (err) {
    console.error("Remove doctor error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while removing doctor assignment",
    });
  }
};

module.exports = {
  assignDoctor,
  reassignDoctor,
  removeDoctor,
};
