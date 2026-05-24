const db = require("../config/db");

const assignedDoctorModel = {
  // ✅ Assign a new doctor to a coach
  assignDoctor: async (coachId, doctorId) => {
    const [result] = await db.query(
      "INSERT INTO AssignedDoctor (coachId, doctorId, assignedOn) VALUES (?, ?, NOW())",
      [coachId, doctorId]
    );
    return result.insertId;
  },

  // ✅ Reassign a doctor
  reassignDoctor: async (id, doctorId) => {
    const [result] = await db.query(
      "UPDATE AssignedDoctor SET doctorId = ?, updatedOn = NOW() WHERE id = ?",
      [doctorId, id]
    );
    return result;
  },

  // ✅ Remove doctor assignment
  removeDoctor: async (id) => {
    const [result] = await db.query(
      "DELETE FROM AssignedDoctor WHERE id = ?",
      [id]
    );
    return result;
  },
};

module.exports = assignedDoctorModel;
