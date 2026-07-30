const medicineAssignmentModel = require("../models/medicineAssignment.model");
const { sendNotification } = require("../services/notification.service");

// 🔥 COMMON VALIDATION (no duplication)
const validateSchedule = (schedule, res) => {
  for (const s of schedule) {
    if (!s.time) {
      res.status(400).json({
        success: false,
        message: "Each schedule must have a valid time (HH:mm)",
      });
      return false;
    }

    if (s.food && !["before", "after"].includes(s.food)) {
      res.status(400).json({
        success: false,
        message: "Food must be either 'before' or 'after'",
      });
      return false;
    }
  }
  return true;
};

// 🔥 Normalize schedule (important)
const normalizeSchedule = (schedule) => {
  return schedule.map((s) => ({
    time: s.time,
    label: s.label || null,
    food: s.food || "after",
  }));
};

// ✅ ASSIGN MEDICINE
const assignMedicineToPatient = async (req, res) => {
  try {
    const {
      patientId,
      medicineName,
      dosage,
      schedule,
      startDate,
      endDate,
    } = req.body;

    if (
      !patientId ||
      !medicineName ||
      !dosage ||
      !startDate ||
      !Array.isArray(schedule) ||
      schedule.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required: patientId, medicineName, dosage, startDate, and at least one schedule",
      });
    }

    // 🔥 Date validation
    if (endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    if (!validateSchedule(schedule, res)) return;

    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const normalizedSchedule = normalizeSchedule(schedule);

    const result = await medicineAssignmentModel.create(
      patientId,
      medicineName.trim(),
      dosage.trim(),
      normalizedSchedule,
      createdBy,
      startDate,
      endDate || null
    );

    // =====================================================
    // SEND NOTIFICATION TO PATIENT
    // =====================================================
    try {
      await sendNotification({
        userId: patientId,
        type: "medicine_assigned",
        subject: "New Medicine Assigned",
        message: `${medicineName} (${dosage}) has been assigned to you.`,
        referenceType: "medicine",
        referenceId: result.assignmentId,
        metadata: {
          assignmentId: result.assignmentId,
        },
        templateData: {
          medicineName,
          dosage,
          startDate,
        },
      });
    } catch (notificationError) {
      console.error(
        "Medicine assignment notification failed:",
        notificationError
      );
      // Do not fail medicine assignment if notification fails
    }

    return res.status(201).json({
      success: true,
      message: "Medicine assigned successfully",
      assignmentId: result.assignmentId,
    });
  } catch (err) {
    console.error("Assign medicine error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ✅ GET ALL
const getPatientAssignedMedicines = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);

    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const medicines = await medicineAssignmentModel.getByPatientId(patientId);

    return res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (err) {
    console.error("Get medicines error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ GET TODAY
const getTodaysMedicines = async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);

    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const medicines =
      await medicineAssignmentModel.getTodaysMedicines(patientId);

    return res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (err) {
    console.error("Get today's medicines error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ UPDATE
const updatePatientAssignedMedicine = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);

    const {
      medicineName,
      dosage,
      schedule,
      startDate,
      endDate,
    } = req.body;

    if (
      isNaN(assignmentId) ||
      !medicineName ||
      !dosage ||
      !Array.isArray(schedule) ||
      schedule.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required: assignmentId, medicineName, dosage, and at least one schedule",
      });
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    if (!validateSchedule(schedule, res)) return;

    const updatedBy = req.user?.id;

    if (!updatedBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const normalizedSchedule = normalizeSchedule(schedule);

    const result = await medicineAssignmentModel.update(
      assignmentId,
      medicineName.trim(),
      dosage.trim(),
      normalizedSchedule,
      updatedBy,
      startDate,
      endDate
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
    });
  } catch (err) {
    console.error("Update medicine error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ✅ DELETE
const deletePatientAssignedMedicine = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);

    if (isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const result = await medicineAssignmentModel.delete(assignmentId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (err) {
    console.error("Delete medicine error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  assignMedicineToPatient,
  getPatientAssignedMedicines,
  getTodaysMedicines,
  updatePatientAssignedMedicine,
  deletePatientAssignedMedicine,
};