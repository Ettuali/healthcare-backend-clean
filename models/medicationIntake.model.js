const db = require("../config/db");

const MedicationIntake = {
  // ✅ CHECK FOR EXISTING LOG
  findExistingLog: async (
    patientId,
    medicineAssignmentId,
    scheduleId,
    intakeDate
  ) => {
    const [rows] = await db.query(
      `SELECT id
       FROM medicationintakelogs
       WHERE patientId = ?
         AND medicineAssignmentId = ?
         AND scheduleId = ?
         AND DATE(intakeDate) = DATE(?)`,
      [patientId, medicineAssignmentId, scheduleId, intakeDate]
    );

    return rows;
  },

  // ✅ UPDATE EXISTING LOG (Internal Logic)
  updateExistingLog: async (logId, data) => {
    await db.query(
      `UPDATE medicationintakelogs
       SET intakeTime = ?,
           status = ?,
           notes = ?,
           updatedOn = NOW()
       WHERE id = ?`,
      [data.intakeTime, data.status, data.notes, logId]
    );
  },

  // ✅ LOG INTAKE (INSERT)
  logIntake: async (data) => {
    const [result] = await db.query(
      `INSERT INTO medicationintakelogs 
        (
          patientId,
          medicineAssignmentId,
          scheduleId,
          intakeDate,
          intakeTime,
          status,
          notes,
          reportedBy
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.patientId,
        data.medicineAssignmentId,
        data.scheduleId,
        data.intakeDate,
        data.intakeTime,
        data.status,
        data.notes || null,
        data.reportedBy || null,
      ]
    );
    return result.insertId;
  },

  // ✅ UPDATE INTAKE (Standard Update)
  updateIntake: async (logId, data) => {
    await db.query(
      `UPDATE medicationintakelogs
       SET status = ?, notes = ?, intakeTime = ?, updatedOn = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [data.status, data.notes || null, data.intakeTime, logId]
    );
  },

  // ✅ TOTAL COUNT WITH PERIOD FILTER
  getTotalHistoryCount: async (pId, period = 'all') => {
    let dateCondition = '';

    switch (period) {
      case 'last_week':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 7 DAY';
        break;
      case 'last_month':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 1 MONTH';
        break;
      case '3_months':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 3 MONTH';
        break;
      case '6_months':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 6 MONTH';
        break;
      case '1_year':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 1 YEAR';
        break;
      case 'all':
      default:
        dateCondition = '';
        break;
    }

    const query = `
      SELECT COUNT(DISTINCT am.id) AS total
      FROM assignedmedicines am
      WHERE am.patientId = ? ${dateCondition}
    `;

    const [rows] = await db.query(query, [pId]);
    return rows[0].total;
  },

  // ✅ HISTORY WITH PERIOD FILTER
  getHistoryByPatientId: async (pId, limit, offset, period = 'all') => {
    let dateCondition = '';

    switch (period) {
      case 'last_week':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 7 DAY';
        break;
      case 'last_month':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 1 MONTH';
        break;
      case '3_months':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 3 MONTH';
        break;
      case '6_months':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 6 MONTH';
        break;
      case '1_year':
        dateCondition = 'AND am.startDate >= NOW() - INTERVAL 1 YEAR';
        break;
      case 'all':
      default:
        dateCondition = '';
        break;
    }

    const query = `
      SELECT
        am.id AS medicineAssignmentId,
        am.medicineName,
        am.dosage,
        ms.time AS timing,
        ms.label,
        ms.food,
        ms.id AS scheduleId,
        mil.intakeDate,
        mil.intakeTime,
        mil.id AS logId,
        COALESCE(mil.status, 'pending') AS status
      FROM assignedmedicines am
      JOIN medicine_schedules ms ON am.id = ms.assignmentId
      LEFT JOIN medicationintakelogs mil 
        ON am.id = mil.medicineAssignmentId
        AND ms.id = mil.scheduleId
        AND mil.patientId = ?
      WHERE am.patientId = ? ${dateCondition}
      ORDER BY am.startDate DESC, ms.time ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(query, [pId, pId, limit, offset]);
    return rows;
  },

  // ✅ DAILY STATUS
  getAssignedMedicinesWithStatusForDate: async (pId, intakeDate) => {
    const [rows] = await db.query(
      `SELECT
          am.id AS medicineAssignmentId,
          am.medicineName,
          am.dosage,
          ms.id AS scheduleId,
          ms.time AS timing,
          ms.label,
          ms.food,
          mil.intakeDate,
          mil.intakeTime,
          mil.id AS logId,
          COALESCE(mil.status, 'pending') AS status
       FROM assignedmedicines am
       JOIN medicine_schedules ms 
         ON am.id = ms.assignmentId
       LEFT JOIN medicationintakelogs mil 
         ON am.id = mil.medicineAssignmentId
         AND ms.id = mil.scheduleId
         AND mil.patientId = ?
         AND DATE(mil.intakeDate) = DATE(?)
       WHERE am.patientId = ?
         AND am.startDate <= DATE(?)
         AND (am.endDate IS NULL OR am.endDate >= DATE(?))
       ORDER BY ms.time ASC`,
      [pId, intakeDate, pId, intakeDate, intakeDate]
    );

    return rows;
  }
};

module.exports = MedicationIntake;