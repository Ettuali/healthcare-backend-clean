const db = require("../config/db");

// Assign or Reassign Hospital to a User
const insertAssignment = async (userId, hospitalId) => {
  return db.query(
    `INSERT INTO assignedhospital (userId, hospitalId, assignedOn, updatedOn)
     VALUES (?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE 
     hospitalId = VALUES(hospitalId), updatedOn = NOW()`,
    [userId, hospitalId]
  );
};
// Get All Assignments with Joined Data
const fetchAllAssignments = async () => {
  return db.query(
    `SELECT 
        a.id,
        u.name AS userName,
        h.name AS hospitalName,
        a.assignedOn,
        a.updatedOn
     FROM assignedhospital a
     JOIN user u ON a.userId = u.id
     JOIN hospital h ON a.hospitalId = h.id`
  );
};

// Get Assignments by User ID
const fetchAssignmentByUserId = async (userId) => {
  return db.query(
    `SELECT 
        a.id,
        h.name AS hospitalName,
        a.assignedOn,
        a.updatedOn
     FROM assignedhospital a
     JOIN hospital h ON a.hospitalId = h.id
     WHERE a.userId = ?`,
    [userId]
  );
};

// Delete Assignment
const deleteAssignmentById = async (id) => {
  return db.query(
    `DELETE FROM assignedhospital WHERE id = ?`,
    [id]
  );
};

module.exports = {
  insertAssignment,
  fetchAllAssignments,
  fetchAssignmentByUserId,
  deleteAssignmentById,
};
 