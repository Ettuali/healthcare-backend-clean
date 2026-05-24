const db = require("../config/db");

// CREATE
const createVitals = async ({ patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy }) => {
  const [result] = await db.query(
    `INSERT INTO patientvitalslogs 
      (patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy || null]
  );
  return result.insertId;
};

// READ all for a patient
const fetchPatientVitalsByPatientId = async (patientId, page = 1, limit = 5) => {
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT id, patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, postedBy, updatedBy, createdOn, updatedOn
     FROM patientvitalslogs 
     WHERE patientId = ?
     ORDER BY createdOn DESC
     LIMIT ? OFFSET ?`,
    [patientId, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM patientvitalslogs WHERE patientId = ?`,
    [patientId]
  );

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// UPDATE
const updateVitals = async (id, { temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, updatedBy }) => {
  await db.query(
    `UPDATE patientvitalslogs 
     SET temperature=?, bloodPressure=?, heartRate=?, oxygenSaturation=?, severityLevel=?, updatedBy=?, updatedOn = CURRENT_TIMESTAMP 
     WHERE id=?`,
    [temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, updatedBy || null, id]
  );
};

// UPDATE timing only
const updateTiming = async (id) => {
  await db.query(
    `UPDATE patientvitalslogs 
     SET updatedOn = CURRENT_TIMESTAMP 
     WHERE id=?`,
    [id]
  );
};

// DELETE timing (set to NULL)
const deleteTiming = async (id) => {
  await db.query(
    `UPDATE patientvitalslogs 
     SET updatedOn = NULL 
     WHERE id=?`,
    [id]
  );
};

// DELETE record
const deleteVitals = async (id) => {
  await db.query(`DELETE FROM patientvitalslogs WHERE id=?`, [id]);
};

module.exports = {
  createVitals,
  fetchPatientVitalsByPatientId,
  updateVitals,
  updateTiming,
  deleteTiming,
  deleteVitals
};