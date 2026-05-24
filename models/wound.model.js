const db = require("../config/db");

  // Create a new wound entry
const Wound = {
  // ✅ CREATE
  create: async ({ userId, documentName, imagePath, woundMeasurement, createdBy, updatedBy }) => {
    // 1️⃣ Insert into userdocuments
    const [docResult] = await db.query(
      `INSERT INTO userdocuments 
       (userId, patientUserId, uploadedBy, uploaderRole, documentName, imagePath, documentType, uploadedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        userId,
        userId,
        "patient",
        documentName,
        imagePath,
        "wound_image"
      ]
    );

    const documentId = docResult.insertId;

    // 2️⃣ Insert into wound table
    const [woundResult] = await db.query(
      `INSERT INTO wound 
       (userId, documentId, woundMeasurement, createdBy, updatedBy, createdOn, updatedOn)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        documentId,
        woundMeasurement,
        createdBy,
        updatedBy
      ]
    );

    return { woundId: woundResult.insertId, documentId };
  },


  getAll: async () => {
    const [rows] = await db.query(
      `SELECT w.*, u.documentName, u.imagePath 
       FROM wound w
       JOIN userdocuments u ON w.documentId = u.id
       ORDER BY w.createdOn DESC`
    );
    return rows;
  },

  getByUserId: async (userId) => {
    const [rows] = await db.query(
      `SELECT w.*, u.documentName, u.imagePath 
       FROM wound w
       JOIN userdocuments u ON w.documentId = u.id
       WHERE w.userId = ?
       ORDER BY w.createdOn DESC`,
      [userId]
    );
    return rows;
  },

  getLatestByUserId: async (userId) => {
    const [rows] = await db.query(
      `SELECT w.*, u.documentName, u.imagePath 
       FROM wound w
       JOIN userdocuments u ON w.documentId = u.id
       WHERE w.userId = ?
       ORDER BY w.createdOn DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  updateById: async (woundId, data) => {
    const [result] = await db.query(
      `UPDATE wound SET healingStatus = ?, infectionSigns = ?, updatedOn = NOW() WHERE id = ?`,
      [data.healingStatus, data.infectionSigns, woundId]
    );
    return result;
  },

  deleteById: async (woundId) => {
    // Optionally, delete the related userdocuments entry too
    const [woundRows] = await db.query(`SELECT documentId FROM wound WHERE id = ?`, [woundId]);
    if (woundRows.length) {
      const documentId = woundRows[0].documentId;
      await db.query(`DELETE FROM userdocuments WHERE id = ?`, [documentId]);
    }

    const [result] = await db.query(`DELETE FROM wound WHERE id = ?`, [woundId]);
    return result;
  },
};

module.exports = Wound;
