const pool = require("../config/db");

// Define a map for safe, qualified column sorting. This prevents SQL injection
const sortFieldMap = {
  patientName: "up.name",
  doctorName: "ud.name",
  caretakerName: "uc.name",
  assignedOn: "pa.assignedOn",
  updatedOn: "pa.updatedOn",
  severity: "latest_vital.severityLevel",
};

class PatientAssignmentModel {
  // ⭐ Get all assignments with pagination, search, and sort
  static async getAllAssignments(options) {

  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "assignedOn",
    order = "DESC",
  } = options;

  const offset = (page - 1) * limit;

  let params = [];

  const safeSortBy =
    sortFieldMap[sortBy] ||
    sortFieldMap.assignedOn;

  // =====================================================
  // JOINS
  // =====================================================

  const joins = `
    LEFT JOIN user up
      ON pa.patientId = up.id

    LEFT JOIN user ud
      ON pa.doctorId = ud.id

    LEFT JOIN user uc
      ON pa.caretakerId = uc.id

    LEFT JOIN assignedhospital ah
      ON pa.doctorId = ah.userId

    LEFT JOIN user uh
      ON ah.hospitalId = uh.id
  `;

  // =====================================================
  // WHERE
  // =====================================================

  let whereClause = `
    WHERE up.status = 'Active'
      AND pa.status = 'Active'
  `;

  if (search) {

    whereClause += `
      AND (
        up.name LIKE ?
        OR ud.name LIKE ?
        OR uc.name LIKE ?
        OR uh.name LIKE ?
      )
    `;

    const searchTerm = `%${search}%`;

    params.push(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    );
  }

  // =====================================================
  // COUNT QUERY
  // =====================================================

  const countQuery = `
    SELECT COUNT(pa.id) as totalCount

    FROM patient_assignments pa

    ${joins}

    ${whereClause}
  `;

  const [[{ totalCount }]] =
    await pool.query(countQuery, params);

  // =====================================================
  // DATA QUERY
  // =====================================================

  const dataQuery = `
    SELECT
      pa.id,

      pa.patientId,
      up.name AS patientName,
      up.age,

      pa.doctorId,
      ud.name AS doctorName,

      pa.caretakerId,
      uc.name AS caretakerName,

      ah.hospitalId,
      uh.name AS hospitalName,

      pa.assignedOn,
      pa.updatedOn

    FROM patient_assignments pa

    ${joins}

    ${whereClause}

    ORDER BY ${safeSortBy} ${order}

    LIMIT ? OFFSET ?
  `;

  const dataParams = [
    ...params,
    limit,
    offset,
  ];

  const [assignments] =
    await pool.query(
      dataQuery,
      dataParams
    );

  return {
    data: assignments,

    meta: {
      totalCount,

      currentPage: page,

      limit,

      totalPages: Math.ceil(
        totalCount / limit
      ),
    },
  };
}

  // ⭐ Get assignments for a DOCTOR/CARETAKER with pagination
  static async getAssignmentsByUserIdPaginated(options) {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "assignedOn",
      order = "DESC",
      userId,
    } = options;

    const offset = (page - 1) * limit;
    let whereParams = [userId, userId];

    const safeSortBy = sortFieldMap[sortBy] || sortFieldMap.assignedOn;

    const baseJoins = `
      LEFT JOIN user up ON pa.patientId = up.id
      LEFT JOIN user ud ON pa.doctorId = ud.id
      LEFT JOIN user uc ON pa.caretakerId = uc.id
    `;

    const vitalJoins = `
      LEFT JOIN (
        SELECT
          pv.patientId,
          pv.severityLevel,
          ROW_NUMBER() OVER(PARTITION BY pv.patientId ORDER BY pv.updatedOn DESC) as rn
        FROM patientvitalslogs pv
      ) AS latest_vital ON pa.patientId = latest_vital.patientId AND latest_vital.rn = 1
    `;

    let whereClause = `WHERE (pa.caretakerId = ? OR pa.doctorId = ?) AND up.status = 'Active' AND pa.status = 'Active'`;

    if (search) {
      whereClause += ` AND (up.name LIKE ? OR ud.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      whereParams.push(searchTerm, searchTerm);
    }

    const countQuery = `
      SELECT COUNT(pa.id) as totalCount
      FROM patient_assignments pa
      ${baseJoins}
      ${whereClause}
    `;
    const [[{ totalCount }]] = await pool.query(countQuery, whereParams);

    const dataQuery = `
      SELECT
        pa.id, pa.patientId, up.name AS patientName, up.age,
        pa.doctorId, ud.name AS doctorName,
        pa.caretakerId, uc.name AS caretakerName,
        pa.assignedOn, pa.updatedOn,
        latest_vital.severityLevel AS severity
      FROM patient_assignments pa
      ${baseJoins}
      ${vitalJoins}
      ${whereClause}
      ORDER BY ${safeSortBy} ${order}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...whereParams, limit, offset];
    const [assignments] = await pool.query(dataQuery, dataParams);

    return {
      data: assignments,
      meta: {
        totalCount: totalCount,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // ⭐ Get users filtered by Hospital and Role (Fix for your 404 error)
static async getUsersByHospitalAndRole(hospitalId, role) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name 
       FROM user u
       INNER JOIN assignedhospital ah ON u.id = ah.userId
       INNER JOIN userrole ur ON u.id = ur.userId
       INNER JOIN roles r ON ur.roleId = r.id
       WHERE ah.hospitalId = ? 
         AND r.roleName = ? 
         AND u.status = 'Active'`,
      [hospitalId, role]
    );
    return rows;
  } catch (error) {
    console.error("DATABASE ERROR in getUsersByHospitalAndRole:", error.message);
    throw error;
  }
}
  static async getPatientsAssignedToUser(assignerId) {
    const [rows] = await pool.query(
      `SELECT
        pa.patientId AS id,
        up.name,
        up.status AS \`condition\`
      FROM patient_assignments pa
      JOIN user up ON pa.patientId = up.id
      WHERE (pa.caretakerId = ? OR pa.doctorId = ?) 
          AND up.status = 'Active'
          AND pa.status = 'Active'`,
      [assignerId, assignerId]
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      condition: row.condition || "N/A",
    }));
  }

static async getAssignmentsForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT
        pa.id,

        pa.patientId,
        up.name AS patientName,

        pa.doctorId,
        ud.name AS doctorName,

        pa.caretakerId,
        uc.name AS caretakerName,

        ah.hospitalId,
        uh.name AS hospitalName,

        pa.assignedOn

      FROM patient_assignments pa

      LEFT JOIN user up
        ON pa.patientId = up.id

      LEFT JOIN user ud
        ON pa.doctorId = ud.id

      LEFT JOIN user uc
        ON pa.caretakerId = uc.id

      LEFT JOIN assignedhospital ah
        ON pa.doctorId = ah.userId

      LEFT JOIN user uh
        ON ah.hospitalId = uh.id

      WHERE pa.patientId = ?
        AND up.status = 'Active'
        AND pa.status = 'Active'`,
    [patientId]
  );

  return rows;
}

static async getAssignmentById(id) {

  const [rows] = await pool.query(
    `SELECT
        pa.id,

        pa.patientId,
        up.name AS patientName,

        pa.doctorId,
        ud.name AS doctorName,

        pa.caretakerId,
        uc.name AS caretakerName,

        ah.hospitalId,
        uh.name AS hospitalName,

        pa.assignedOn,
        pa.updatedOn

      FROM patient_assignments pa

      LEFT JOIN user up
        ON pa.patientId = up.id

      LEFT JOIN user ud
        ON pa.doctorId = ud.id

      LEFT JOIN user uc
        ON pa.caretakerId = uc.id

      LEFT JOIN assignedhospital ah
        ON pa.doctorId = ah.userId

      LEFT JOIN user uh
        ON ah.hospitalId = uh.id

      WHERE pa.id = ?`,
    [id]
  );

  return rows[0] || null;
}

  static async createOrUpdateAssignment(patientId, doctorId, caretakerId) {
    const [existing] = await pool.query(
      "SELECT id FROM patient_assignments WHERE patientId=?",
      [patientId]
    );

    if (existing.length > 0) {
      const assignmentId = existing[0].id;
      await pool.query(
        `UPDATE patient_assignments
            SET doctorId    = COALESCE(?, doctorId),
                caretakerId = COALESCE(?, caretakerId),
                updatedOn   = CURRENT_TIMESTAMP(),
                status      = 'Active'
            WHERE id=?`,
        [doctorId, caretakerId, assignmentId]
      );
      return this.getAssignmentById(assignmentId);
    } else {
      const [result] = await pool.query(
        `INSERT INTO patient_assignments (patientId, doctorId, caretakerId, status)
            VALUES (?, ?, ?, 'Active')`,
        [patientId, doctorId, caretakerId]
      );
      return this.getAssignmentById(result.insertId);
    }
  }

  static async updateAssignment(id, patientId, doctorId, caretakerId) {
    const [result] = await pool.query(
      `UPDATE patient_assignments
       SET patientId   = COALESCE(?, patientId),
           doctorId    = COALESCE(?, doctorId),
           caretakerId = COALESCE(?, caretakerId),
           updatedOn   = CURRENT_TIMESTAMP(),
           status      = 'Active' 
       WHERE id=?`,
      [patientId, doctorId, caretakerId, id]
    );
    if (result.affectedRows === 0) return null;
    return this.getAssignmentById(id);
  }

  static async deleteAssignment(id) {
    const [result] = await pool.query(
      `UPDATE patient_assignments SET status='Cancelled', endedOn=NOW() WHERE id=?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getAssignmentsByHospital(userId) {
    const [hospitalRows] = await pool.query(
      `SELECT hospitalId FROM assignedhospital WHERE userId=?`,
      [userId]
    );
    if (hospitalRows.length === 0) return [];
    const hospitalId = hospitalRows[0].hospitalId;
    const [rows] = await pool.query(
      `SELECT pa.id, pa.patientId, up.name AS patientName,
              pa.doctorId, ud.name AS doctorName,
              pa.caretakerId, uc.name AS caretakerName,
              pa.assignedOn, pa.updatedOn
        FROM patient_assignments pa
        LEFT JOIN user up ON pa.patientId = up.id
        LEFT JOIN user ud ON pa.doctorId = ud.id
        LEFT JOIN user uc ON pa.caretakerId = uc.id
        WHERE (pa.patientId IN (SELECT userId FROM assignedhospital WHERE hospitalId=?)
          OR pa.doctorId IN (SELECT userId FROM assignedhospital WHERE hospitalId=?)
          OR pa.caretakerId IN (SELECT userId FROM assignedhospital WHERE hospitalId=?))
          AND up.status = 'Active'
          AND pa.status = 'Active'
        ORDER BY pa.assignedOn DESC`,
      [hospitalId, hospitalId, hospitalId]
    );
    return rows;
  }
}

module.exports = PatientAssignmentModel;