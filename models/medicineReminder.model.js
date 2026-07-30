// models/medicineReminder.model.js

const db = require("../config/db");

const MedicineReminder = {
  // ============================
  // Active medicine schedules
  // ============================
  async getActiveSchedules() {
    const [rows] = await db.query(`
      SELECT
          am.id AS assignmentId,
          ms.id AS scheduleId,

          am.patientId,

          pa.caretakerId,
          pa.doctorId,

          am.medicineName,
          am.dosage,

          ms.time AS scheduleTime,
          ms.label,
          ms.food,

          am.startDate,
          am.endDate

      FROM assignedmedicines am

      INNER JOIN medicine_schedules ms
          ON am.id = ms.assignmentId

      INNER JOIN patient_assignments pa
          ON am.patientId = pa.patientId
         AND pa.status = 'Active'

      WHERE
          am.startDate <= CURDATE()
          AND (
              am.endDate IS NULL
              OR am.endDate >= CURDATE()
          )

      ORDER BY
          am.patientId,
          ms.time ASC
    `);

    return rows;
  },

  // ============================
  // Reminder already sent?
  // ============================
  async hasReminderSent(
    assignmentId,
    scheduleId,
    reminderType,
    reminderDate
  ) {
    const [rows] = await db.query(
      `
      SELECT id
      FROM medicine_reminder_logs
      WHERE assignmentId = ?
        AND scheduleId = ?
        AND reminderType = ?
        AND reminderDate = ?
      LIMIT 1
      `,
      [
        assignmentId,
        scheduleId,
        reminderType,
        reminderDate,
      ]
    );

    return rows.length > 0;
  },

  // ============================
  // Save reminder log
  // ============================
  async markReminderSent(
    assignmentId,
    scheduleId,
    reminderType,
    reminderDate
  ) {
    await db.query(
      `
      INSERT IGNORE INTO medicine_reminder_logs
      (
          assignmentId,
          scheduleId,
          reminderType,
          reminderDate
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        assignmentId,
        scheduleId,
        reminderType,
        reminderDate,
      ]
    );
  },

  // ============================
  // Medicine taken?
  // ============================
  async isMedicineTaken(
    patientId,
    assignmentId,
    scheduleId,
    intakeDate
  ) {
    const [rows] = await db.query(
      `
      SELECT id

      FROM medicationintakelogs

      WHERE patientId = ?
        AND medicineAssignmentId = ?
        AND scheduleId = ?
        AND DATE(intakeDate)=DATE(?)
        AND status='taken'

      LIMIT 1
      `,
      [
        patientId,
        assignmentId,
        scheduleId,
        intakeDate,
      ]
    );

    return rows.length > 0;
  },
};

module.exports = MedicineReminder;