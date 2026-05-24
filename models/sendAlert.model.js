// D:\Day2Day\dayday-backend\models\sendAlert.model.js

const db = require("../config/db");

const SendAlert = {

  // Universal SELECT for alert lists with all user joins
  selectWithUserJoin: `SELECT
ri.id,
ri.status,
ri.description,
ri.response,
ri.raisedOn,
ri.completedOn,
ri.severity,
u_patient.name AS patientName,
u_coach.name AS coachName,
u_doctor.name AS doctorName
FROM raisedissues AS ri
LEFT JOIN user AS u_patient ON ri.userId = u_patient.id
LEFT JOIN user AS u_coach ON ri.coachId = u_coach.id
LEFT JOIN user AS u_doctor ON ri.doctorId = u_doctor.id`,

  // =========================================================
  // GENERIC PAGINATION
  // =========================================================
  getPaginatedAlerts: async (
    whereCondition,
    whereValues,
    {
      page = 0,
      limit = 10,
      search = "",
      sort = "raisedOn",
      order = "DESC",
    }
  ) => {
    const offset = page * limit;

    let whereClause = whereCondition ? `WHERE ${whereCondition}` : "";
    let queryValues = [...whereValues];

    // SEARCH FILTER
    if (search) {
      const searchCondition = `(
u_patient.name LIKE ? OR
u_coach.name LIKE ? OR
u_doctor.name LIKE ? OR
ri.description LIKE ?
)`;
      const searchTerm = `%${search}%`;

      whereClause += whereCondition
        ? ` AND ${searchCondition}`
        : `WHERE ${searchCondition}`;

      queryValues.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // SORT
    const validSort = ["raisedOn", "severity", "status", "completedOn"].includes(sort)
      ? sort
      : "raisedOn";

    const sortClause = `ORDER BY ri.${validSort} ${
      order.toUpperCase() === "ASC" ? "ASC" : "DESC"
    }`;

    // TOTAL COUNT
    const [countRows] = await db.query(
      `SELECT COUNT(ri.id) as totalCount
FROM raisedissues AS ri
LEFT JOIN user AS u_patient ON ri.userId = u_patient.id
LEFT JOIN user AS u_coach ON ri.coachId = u_coach.id
LEFT JOIN user AS u_doctor ON ri.doctorId = u_doctor.id
${whereClause}`,
      queryValues
    );

    const totalCount = countRows[0].totalCount;

    // PAGINATED DATA
    const limitClause = `LIMIT ? OFFSET ?`;
    const dataValues = [...queryValues, limit, offset];

    const [rows] = await db.query(
      `${SendAlert.selectWithUserJoin}
${whereClause}
${sortClause}
${limitClause}`,
      dataValues
    );

    return { data: rows, totalCount };
  },

  // =========================================================
  // GET ALL ALERTS
  // =========================================================
  getAllAlerts: async (params) => {
    return await SendAlert.getPaginatedAlerts(null, [], params);
  },

  // =========================================================
  // GET ALERTS BY PATIENT ID
  // =========================================================
  getAlertByPatientId: async (patientId, params) => {
    return await SendAlert.getPaginatedAlerts("ri.userId = ?", [patientId], params);
  },

  // =========================================================
  // GET ALERTS BY DOCTOR ID
  // =========================================================
  getAlertByDoctorId: async (doctorId, params) => {
    return await SendAlert.getPaginatedAlerts("ri.doctorId = ?", [doctorId], params);
  },

  // =========================================================
  // GET ALERTS BY COACH ID
  // =========================================================
  getAlertByCoachId: async (coachId, params) => {
    return await SendAlert.getPaginatedAlerts("ri.coachId = ?", [coachId], params);
  },

  // =========================================================
  // CREATE ALERT
  // =========================================================
  createAlert: async (alertData) => {
    const {
      userId = null,
      coachId = null,
      doctorId = null,
      description,
      severity,
      status = "pending",
    } = alertData;

    const [result] = await db.query(
      `INSERT INTO raisedissues
(userId, coachId, doctorId, description, severity, status, raisedOn)
VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, coachId, doctorId, description, severity, status]
    );

    return { id: result.insertId, ...alertData };
  },

  // =========================================================
  // GET ALERT BY ID
  // =========================================================
  getAlertById: async (id) => {
    const [rows] = await db.query(
      `${SendAlert.selectWithUserJoin}
WHERE ri.id = ?`,
      [id]
    );

    return rows[0] || null;
  },

  // =========================================================
  // UPDATE ALERT STATUS
  // =========================================================
  changeAlertStatus: async (id, alertData, completedOn) => {
    const { status, response } = alertData;

    let setClauses = [];
    let values = [];

    if (status) {
      setClauses.push("status = ?");
      values.push(status);
    }

    if (response) {
      setClauses.push("response = ?");
      values.push(response);
    }

    if (completedOn) {
      setClauses.push("completedOn = ?");
      values.push(completedOn);
    }

    if (setClauses.length === 0) {
      return { affectedRows: 0 };
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE raisedissues
SET ${setClauses.join(", ")}
WHERE id = ?`,
      values
    );

    return { affectedRows: result.affectedRows };
  },

  // =========================================================
  // DELETE ALERT
  // =========================================================
  removeAlert: async (id) => {
    const [result] = await db.query(
      `DELETE FROM raisedissues
WHERE id = ?`,
      [id]
    );

    return { affectedRows: result.affectedRows };
  },
};

module.exports = SendAlert;