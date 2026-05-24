const db = require("../config/db");

const PatientVitals = {
  // Add vitals
  createVitals: async (vitals) => {
    const [result] = await db.query(
      `INSERT INTO PatientVitalsLogs 
      (patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy, updatedBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vitals.patientId,
        vitals.temperature,
        vitals.bloodPressure,
        vitals.heartRate,
        vitals.oxygenSaturation,
        vitals.severityLevel,
        vitals.postedBy,
        vitals.updatedBy,
      ]
    );
    return result.insertId;
  },

  // Get vitals by patientId
  getVitalsByPatient: async (patientId) => {
    const [rows] = await db.query(
      `SELECT * FROM PatientVitalsLogs WHERE patientId = ?`,
      [patientId]
    );
    return rows;
  },

  // Update vitals data
  updateVitals: async (id, updatedVitals) => {
    const [result] = await db.query(
      `UPDATE PatientVitalsLogs 
       SET temperature = ?, bloodPressure = ?, heartRate = ?, oxygenSaturation = ?, severityLevel = ?, updatedBy = ? 
       WHERE id = ?`,
      [
        updatedVitals.temperature,
        updatedVitals.bloodPressure,
        updatedVitals.heartRate,
        updatedVitals.oxygenSaturation,
        updatedVitals.severityLevel,
        updatedVitals.updatedBy,
        id,
      ]
    );
    return result;
  },

  // Update only timestamps
  updateTiming: async (id) => {
    const [result] = await db.query(
      `UPDATE PatientVitalsLogs SET updatedOn = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return result;
  },

  // Delete timing (reset timestamps)
  deleteTiming: async (id) => {
    const [result] = await db.query(
      `UPDATE PatientVitalsLogs 
       SET createdOn = NULL, updatedOn = NULL 
       WHERE id = ?`,
      [id]
    );
    return result;
  },

  // Delete vitals record
  deleteVitals: async (id) => {
    const [result] = await db.query(
      `DELETE FROM PatientVitalsLogs WHERE id = ?`,
      [id]
    );
    return result;
  },
};

module.exports = PatientVitals;
