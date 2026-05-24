const db = require("../config/db");

const UserDocument = {

  // ✅ CREATE DOCUMENT (CLEAN + CONSISTENT)
  create: async ({
    patientUserId,
    uploadedBy,
    uploaderRole,
    documentName,
    imagePath,
    documentType
  }) => {

    const [result] = await db.query(
      `INSERT INTO userdocuments 
       (userId, patientUserId, uploadedBy, uploaderRole, documentName, imagePath, documentType, uploadedOn) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        patientUserId,        // userId = patient (for compatibility)
        patientUserId,
        uploadedBy,
        uploaderRole,
        documentName || "Untitled",
        imagePath,
        documentType || "prescription"
      ]
    );

    return result;
  },

  // ✅ GET ALL DOCUMENTS FOR PATIENT
  getByPatientId: async (patientUserId) => {
    const [rows] = await db.query(
      `SELECT 
          id,
          patientUserId,
          uploadedBy,
          uploaderRole,
          documentName,
          imagePath,
          documentType,
          uploadedOn
       FROM userdocuments 
       WHERE patientUserId = ? 
       ORDER BY uploadedOn DESC`,
      [patientUserId]
    );

    return rows;
  },

  // ✅ GET BY TYPE
  getByPatientIdAndType: async (patientUserId, documentType) => {
    const [rows] = await db.query(
      `SELECT 
          id,
          patientUserId,
          uploadedBy,
          uploaderRole,
          documentName,
          imagePath,
          documentType,
          uploadedOn
       FROM userdocuments 
       WHERE patientUserId = ? 
       AND documentType = ?
       ORDER BY uploadedOn DESC`,
      [patientUserId, documentType]
    );

    return rows;
  },

  // ✅ GET LATEST (HOSPITAL PRIORITY)
  getLatestByPatientIdAndType: async (patientUserId, documentType) => {
    const [rows] = await db.query(
      `SELECT 
          id,
          patientUserId,
          uploadedBy,
          uploaderRole,
          documentName,
          imagePath,
          documentType,
          uploadedOn
       FROM userdocuments 
       WHERE patientUserId = ? 
       AND documentType = ?
       ORDER BY 
         CASE 
           WHEN uploaderRole = 'hospital' THEN 1 
           WHEN uploaderRole = 'doctor' THEN 2
           WHEN uploaderRole = 'caretaker' THEN 3
           ELSE 4 
         END,
         uploadedOn DESC
       LIMIT 1`,
      [patientUserId, documentType]
    );

    return rows[0] || null;
  },

};

module.exports = UserDocument;