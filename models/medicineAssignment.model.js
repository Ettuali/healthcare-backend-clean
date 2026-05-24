const db = require("../config/db");

const MedicineAssignment = {
  // ✅ CREATE
  create: async (
    patientId,
    medicineName,
    dosage,
    schedule,
    createdBy,
    startDate,
    endDate
  ) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Insert main record
      const [result] = await connection.query(
        `INSERT INTO assignedmedicines
         (patientId, medicineName, dosage, createdBy, startDate, endDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [patientId, medicineName, dosage, createdBy, startDate, endDate]
      );

      const assignmentId = result.insertId;

      // 2. Insert schedules
      for (const s of schedule) {
        if (!s.time) throw new Error("Schedule time is required");

        await connection.query(
          `INSERT INTO medicine_schedules (assignmentId, time, label, food)
           VALUES (?, ?, ?, ?)`,
          [assignmentId, s.time, s.label || null, s.food || "after"]
        );
      }

      await connection.commit();
      return { assignmentId };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // ✅ GET ALL MEDICINES
  getByPatientId: async (patientId) => {
    const [rows] = await db.query(
      `SELECT 
        am.id,
        am.patientId,
        am.medicineName,
        am.dosage,
        am.createdBy,
        am.updatedBy,
        am.createdOn,
        am.updatedOn,
        am.startDate,
        am.endDate,
        ms.id as scheduleId,
        ms.time,
        ms.label,
        ms.food
      FROM assignedmedicines am
      LEFT JOIN medicine_schedules ms 
        ON am.id = ms.assignmentId
      WHERE am.patientId = ?
      ORDER BY am.createdOn DESC, ms.time ASC`,
      [patientId]
    );

    return groupSchedules(rows);
  },

  // ✅ GET TODAY'S MEDICINES
  getTodaysMedicines: async (patientId) => {
    const [rows] = await db.query(
      `SELECT 
        am.id,
        am.patientId,
        am.medicineName,
        am.dosage,
        am.createdBy,
        am.updatedBy,
        am.createdOn,
        am.updatedOn,
        am.startDate,
        am.endDate,
        ms.id as scheduleId,
        ms.time,
        ms.label,
        ms.food
      FROM assignedmedicines am
      JOIN medicine_schedules ms 
        ON am.id = ms.assignmentId
      WHERE am.patientId = ?
        AND am.startDate <= CURDATE()
        AND (am.endDate IS NULL OR am.endDate >= CURDATE())
      ORDER BY ms.time ASC`,
      [patientId]
    );

    return groupSchedules(rows);
  },

  // ✅ UPDATE
  update: async (
    id,
    medicineName,
    dosage,
    schedule,
    updatedBy,
    startDate,
    endDate
  ) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Update main record
      const [result] = await connection.query(
        `UPDATE assignedmedicines
         SET medicineName = ?, 
             dosage = ?, 
             updatedBy = ?, 
             updatedOn = NOW(), 
             startDate = ?, 
             endDate = ?
         WHERE id = ?`,
        [medicineName, dosage, updatedBy, startDate, endDate, id]
      );

      // 2. Delete old schedules
      await connection.query(
        `DELETE FROM medicine_schedules WHERE assignmentId = ?`,
        [id]
      );

      // 3. Insert new schedules
      for (const s of schedule) {
        if (!s.time) throw new Error("Schedule time is required");

        await connection.query(
          `INSERT INTO medicine_schedules (assignmentId, time, label, food)
           VALUES (?, ?, ?, ?)`,
          [id, s.time, s.label || null, s.food || "after"]
        );
      }

      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // ✅ DELETE
  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM assignedmedicines WHERE id = ?`,
      [id]
    );
    return result;
  },
};


// ✅ HELPER: group schedules
function groupSchedules(rows) {
  const map = {};

  for (const row of rows) {
    if (!map[row.id]) {
      map[row.id] = {
        id: row.id,
        patientId: row.patientId,
        medicineName: row.medicineName,
        dosage: row.dosage,
        createdBy: row.createdBy,
        updatedBy: row.updatedBy,
        createdOn: row.createdOn,
        updatedOn: row.updatedOn,
        startDate: row.startDate,
        endDate: row.endDate,
        schedule: [],
      };
    }

    if (row.scheduleId) {
      map[row.id].schedule.push({
        id: row.scheduleId,
        time: row.time,
        label: row.label,
        food: row.food || "after",
      });
    }
  }

  return Object.values(map);
}

module.exports = MedicineAssignment;