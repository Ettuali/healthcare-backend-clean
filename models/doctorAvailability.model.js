const db = require("../config/db");

const DoctorAvailability = {
  // Create or update doctor availability
  updateTimings: async (doctorId, inTime, outTime) => {
    const [result] = await db.query(
      `
      INSERT INTO DoctorAvailability (doctorId, inTime, outTime, createdOn, updatedOn)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE inTime = VALUES(inTime), outTime = VALUES(outTime), updatedOn = NOW()
      `,
      [doctorId, inTime, outTime]
    );
    return result;
  },

  // Get availability for a doctor
  checkAvailability: async (doctorId) => {
    const [rows] = await db.query(
      "SELECT * FROM DoctorAvailability WHERE doctorId = ?",
      [doctorId]
    );
    return rows[0];
  },

  // Delete availability timings
  deleteTimings: async (doctorId) => {
    const [result] = await db.query(
      "DELETE FROM DoctorAvailability WHERE doctorId = ?",
      [doctorId]
    );
    return result;
  },
};

module.exports = DoctorAvailability;
