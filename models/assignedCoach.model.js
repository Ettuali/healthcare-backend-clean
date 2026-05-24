const db = require("../config/db");

const assignedCoachModel = {
  // Assign a new coach to a user
  assignCoach: async (userId, coachId) => {
    const [result] = await db.query(
      "INSERT INTO AssignedCoach (userId, coachId, assignedOn) VALUES (?, ?, NOW())",
      [userId, coachId]
    );
    return result.insertId;
  },

  //  Reassign a coach to the user
  reassignCoach: async (id, coachId) => {
    const [result] = await db.query(
      "UPDATE AssignedCoach SET coachId = ?, updatedOn = NOW() WHERE id = ?",
      [coachId, id]
    );
    return result;
  },

  // Remove coach assignment
  removeCoach: async (id) => {
    const [result] = await db.query(
      "DELETE FROM AssignedCoach WHERE id = ?",
      [id]
    );
    return result;
  },
};

module.exports = assignedCoachModel;
