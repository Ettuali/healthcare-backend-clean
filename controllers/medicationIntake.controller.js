const MedicationIntake = require("../models/medicationIntake.model");
const cryptoService = require("../services/crypto.service");

// Helper: validate intake payload
const validateIntake = (data, res) => {
  if (
    !data.patientId ||
    !data.medicineAssignmentId ||
    !data.scheduleId ||
    !data.intakeDate ||
    !data.intakeTime
  ) {
    res.status(400).json({ success: false, error: "Missing required fields" });
    return false;
  }

  if (data.status && !["taken", "missed", "pending"].includes(data.status)) {
    res.status(400).json({ success: false, error: "Invalid status" });
    return false;
  }
  return true;
};

const medicationIntakeController = {
  // ✅ LOG INTAKE
  logIntake: async (req, res) => {
    try {
      let intakeData = { ...req.body };

      // 1. Decrypt if necessary
      const isEncrypted =
        typeof intakeData.patientId === "string" &&
        intakeData.patientId.startsWith("U2FsdGVkX1");

      if (isEncrypted) {
        intakeData.patientId = await cryptoService.decrypt(intakeData.patientId, "authentication");
        if (intakeData.reportedBy) {
          intakeData.reportedBy = await cryptoService.decrypt(intakeData.reportedBy, "authentication");
        }
      }

      // 2. Validate
      if (!validateIntake(intakeData, res)) return;

      intakeData.status = intakeData.status || "taken";
      intakeData.notes = intakeData.notes || null;

      // 3. Model Logic
      const existing = await MedicationIntake.findExistingLog(
        intakeData.patientId,
        intakeData.medicineAssignmentId,
        intakeData.scheduleId,
        intakeData.intakeDate
      );

      let logId;
      if (existing.length > 0) {
        logId = existing[0].id;
        await MedicationIntake.updateExistingLog(logId, intakeData);
      } else {
        logId = await MedicationIntake.logIntake(intakeData);
      }

      res.status(200).json({ success: true, logId });
    } catch (err) {
      console.error("Log intake error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ✅ UPDATE INTAKE
  updateIntake: async (req, res) => {
    try {
      const { logId } = req.params;
      const { status, notes, intakeTime } = req.body;

      if (!logId || isNaN(logId)) {
        return res.status(400).json({ success: false, error: "Invalid logId" });
      }

      await MedicationIntake.updateIntake(logId, { status, notes, intakeTime });
      res.json({ success: true, message: "Intake updated successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 🟢 GET HISTORY (Standard with Period Filter)
  getIntakeHistory: async (req, res) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = parseInt(req.query.offset, 10) || 0;
      const period = req.query.period || 'all'; // 🟢 Extract period filter

      const totalCount = await MedicationIntake.getTotalHistoryCount(patientId, period);
      const history = await MedicationIntake.getHistoryByPatientId(patientId, limit, offset, period);

      res.json({
        success: true,
        data: history,
        pagination: { total: totalCount, limit, offset }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 🟢 GET HISTORY (Encrypted with Period Filter)
  getIntakeHistoryEncrypted: async (req, res) => {
    try {
      const { patientId } = req.params;
      const decryptedId = await cryptoService.decrypt(patientId, "authentication");
      
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = parseInt(req.query.offset, 10) || 0;
      const period = req.query.period || 'all'; // 🟢 Extract period filter

      const totalCount = await MedicationIntake.getTotalHistoryCount(decryptedId, period);
      const history = await MedicationIntake.getHistoryByPatientId(decryptedId, limit, offset, period);

      res.json({ success: true, data: history, pagination: { total: totalCount, limit, offset } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ✅ DAILY UPDATES
  getPatientMedicineUpdatesRaw: async (req, res) => {
    try {
      const { patientId, date } = req.params;
      const updates = await MedicationIntake.getAssignedMedicinesWithStatusForDate(patientId, date);
      res.json({ success: true, data: updates });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ✅ DAILY UPDATES (Encrypted)
  getPatientMedicineUpdatesEncrypted: async (req, res) => {
    try {
      const { patientId, date } = req.params;
      const decryptedId = await cryptoService.decrypt(patientId, "authentication");
      const updates = await MedicationIntake.getAssignedMedicinesWithStatusForDate(decryptedId, date);
      res.json({ success: true, data: updates });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};

module.exports = medicationIntakeController;