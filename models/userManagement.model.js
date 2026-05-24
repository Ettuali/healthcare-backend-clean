"use strict";
const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// ============================================================
// ROLE HELPERS
// ============================================================

const getRoleIdByName = async (roleName) => {
  const role = roleName.trim().toLowerCase();
  const [rows] = await db.query(`SELECT id FROM roles WHERE roleName = ?`, [role]);
  if (rows.length === 0) throw new Error(`Role '${roleName}' not found.`);
  return rows[0].id;
};

// ============================================================
// USER INSERT / ASSIGN
// ============================================================

/**
 * Inserts a row into the `user` table.
 * @param {object} userData - { name, phone, email, hashedPassword, specialization, experience, dob, gender, language, age, state, city, area, zipcode, severityLevel, bloodGroup, diagnosisType }
 * @param {number|null} createdBy
 * @param {number|null} createdByHospitalId
 * @returns {number} insertId
 */
const insertUser = async (userData, createdBy) => {
  const {
    name,
    phone,
    email,
    hashedPassword,
    specialization = null,
    experience = null,
    dob = null,
    gender = null,
    language = null,
    age = null,
    state = null,
    city = null,
    area = null,
    zipcode = null,
  } = userData;

  const [result] = await db.query(
    `INSERT INTO user
       (name, phone, email, password, specialization, experience, dob, gender,
        language, age, state, city, area, zipcode, createdBy, createdByHospitalId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, phone, email, hashedPassword,
      specialization, experience, dob, gender,
      language, age, state, city, area, zipcode,
      createdBy, createdByHospitalId,
    ]
  );
  return result.insertId;
};

const assignRoleToUser = async (userId, roleId) => {
  await db.query(`INSERT INTO userrole (userId, roleId) VALUES (?, ?)`, [userId, roleId]);
};

const assignHospitalToUser = async (userId, hospitalId) => {
  await db.query(
    `INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE hospitalId = VALUES(hospitalId), updatedOn = NOW()`,
    [userId, hospitalId]
  );
};

// ============================================================
// HOSPITAL
// ============================================================

const insertHospital = async (
  name,
  address,
  contactNumber,
  email,
  zipcode
) => {
  const [result] = await db.query(
    `INSERT INTO hospital 
      (name, address, contactNumber, email, zipcode)
     VALUES (?, ?, ?, ?, ?)`,
    [name, address, contactNumber, email, zipcode]
  );

  return result.insertId;
};


const createAdmin = async (adminData, createdBy) => {

  const {
    name,
    phone,
    email,
    password,
    state,
    city,
    area,
    zipcode,
  } = adminData;

  if (
    !name ||
    !phone ||
    !email ||
    !password ||
    !state ||
    !city ||
    !area ||
    !zipcode
  ) {
    throw new Error(
      "Missing required fields for admin"
    );
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const [userResult] = await db.query(
    `INSERT INTO user
      (
        name,
        phone,
        email,
        password,
        state,
        city,
        area,
        zipcode,
        createdBy,
        status
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      phone,
      email,
      hashedPassword,
      state,
      city,
      area,
      zipcode,
      createdBy,
      "active",
    ]
  );

  const userId = userResult.insertId;

  const roleId =
    await getRoleIdByName("admin");

  await db.query(
    `INSERT INTO userrole
      (userId, roleId)
     VALUES (?, ?)`,
    [userId, roleId]
  );

  return userId;
};


const createHospitalAdmin = async (hospitalData, createdBy) => {
  let connection;

  try {
    // =========================================================
    // DB TRANSACTION
    // =========================================================
    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // EXTRACT DATA
    // =========================================================
    const {
      name,
      phone,
      email,
      password,
      state,
      city,
      area,
      zipcode,
    } = hospitalData;

    // =========================================================
    // VALIDATION
    // =========================================================
    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !state ||
      !city ||
      !area ||
      !zipcode
    ) {
      throw new Error(
        "Missing required fields for hospital/admin creation"
      );
    }

    // =========================================================
    // AUTO GENERATE REGISTRATION NUMBER
    // =========================================================
    const registrationNumber = `H-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .slice(0, 4)
      .toUpperCase()}`;

    // =========================================================
    // CREATE HOSPITAL
    // =========================================================
   const [hospitalResult] = await connection.query(
  `INSERT INTO hospital
    (
      name,
      registrationNumber,
      contactNumber,
      email,
      zipcode
    )
   VALUES (?, ?, ?, ?, ?)`,
  [
    name,
    registrationNumber,
    phone,
    email,
    zipcode,
  ]
);

    const hospitalId = hospitalResult.insertId;

    // =========================================================
    // HASH PASSWORD
    // =========================================================
    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================================================
    // CREATE USER
    // =========================================================
    const [userResult] = await connection.query(
  `INSERT INTO user
    (
      name,
      phone,
      email,
      password,
      state,
      city,
     area,
      zipcode,
      createdBy,
      status
    )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    name,
    phone,
    email,
    hashedPassword,
    state,
    city,
    area,
    zipcode,
    createdBy,
    "active",
  ]
);

    const userId = userResult.insertId;

    // =========================================================
    // GET ROLE ID
    // =========================================================
    const roleId = await getRoleIdByName("hospital");

    // =========================================================
    // ASSIGN ROLE
    // =========================================================
    await connection.query(
      `INSERT INTO userrole (userId, roleId)
       VALUES (?, ?)`,
      [userId, roleId]
    );

    // =========================================================
    // ASSIGN HOSPITAL
    // =========================================================
    await connection.query(
      `INSERT INTO assignedhospital (userId, hospitalId)
       VALUES (?, ?)`,
      [userId, hospitalId]
    );

    // =========================================================
    // COMMIT
    // =========================================================
    await connection.commit();

    return {
      hospitalId,
      userId,
      registrationNumber,
    };

  } catch (error) {

    // =========================================================
    // ROLLBACK
    // =========================================================
    if (connection) {
      await connection.rollback();
    }

    throw error;

  } finally {

    // =========================================================
    // RELEASE CONNECTION
    // =========================================================
    if (connection) {
      connection.release();
    }
  }
};


/**
 * Creates a doctor user, assigns role + hospital.
 */
const createDoctor = async (doctorData, createdBy) => {
  let connection;

  try {

    // =========================================================
    // TRANSACTION
    // =========================================================
    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // EXTRACT DATA
    // =========================================================
    const {
      name,
      phone,
      email,
      password,
      age,
      gender,
      specialization,
      state,
      city,
      area,
      zipcode,
      language,
      hospitalId,
    } = doctorData;

    // =========================================================
    // VALIDATION
    // =========================================================
    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !age ||
      !gender ||
      !specialization ||
      !state ||
      !city ||
      !area ||
      !zipcode ||
      !language ||
      !hospitalId
    ) {
      throw new Error("Missing required fields for doctor");
    }

    // =========================================================
    // HASH PASSWORD
    // =========================================================
    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================================================
    // CREATE USER
    // =========================================================
    const [userResult] = await connection.query(
      `INSERT INTO user
        (
          name,
          phone,
          email,
          password,
          age,
          gender,
          specialization,
          state,
          city,
          area,
          zipcode,
          language,
          createdBy,
          status
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        name,
        phone,
        email,
        hashedPassword,
        age,
        gender,
        specialization,
        state,
        city,
        area,
        zipcode,
        language,
        createdBy,
        "active",
      ]
    );

    const userId = userResult.insertId;

    // =========================================================
    // GET ROLE ID
    // =========================================================
    const roleId = await getRoleIdByName("doctor");

    // =========================================================
    // ASSIGN ROLE
    // =========================================================
    await connection.query(
      `INSERT INTO userrole (userId, roleId)
       VALUES (?, ?)`,
      [userId, roleId]
    );

    // =========================================================
    // ASSIGN HOSPITAL
    // =========================================================
    await connection.query(
      `INSERT INTO assignedhospital (userId, hospitalId)
       VALUES (?, ?)`,
      [userId, hospitalId]
    );

    // =========================================================
    // COMMIT
    // =========================================================
    await connection.commit();

    return {
      success: true,
      userId,
    };

  } catch (error) {

    // =========================================================
    // ROLLBACK
    // =========================================================
    if (connection) {
      await connection.rollback();
    }

    throw error;

  } finally {

    // =========================================================
    // RELEASE CONNECTION
    // =========================================================
    if (connection) {
      connection.release();
    }
  }
};

const createNurse = async (nurseData, createdBy) => {

  let connection;

  try {

    // =========================================================
    // TRANSACTION
    // =========================================================
    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // EXTRACT DATA
    // =========================================================
    const {
      name,
      phone,
      email,
      password,
      age,
      gender,
      language,
      specialization,
      experience,
      state,
      city,
      area,
      zipcode,
    } = nurseData;

    // =========================================================
    // VALIDATION
    // =========================================================
    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !age ||
      !gender ||
      !language ||
      !specialization ||
      !experience ||
      !state ||
      !city ||
      !area ||
      !zipcode
    ) {
      throw new Error(
        "Missing required fields for nurse"
      );
    }

    // =========================================================
    // HASH PASSWORD
    // =========================================================
    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================================================
    // CREATE USER
    // =========================================================
    const [userResult] = await connection.query(
      `INSERT INTO user
        (
          name,
          phone,
          email,
          password,
          age,
          gender,
          language,
          specialization,
          experience,
          state,
          city,
          area,
          zipcode,
          createdBy,
          status
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        email,
        hashedPassword,
        age,
        gender,
        language,
        specialization,
        experience,
        state,
        city,
        area,
        zipcode,
        createdBy,
        "active",
      ]
    );

    const userId = userResult.insertId;

    // =========================================================
    // GET ROLE ID
    // =========================================================
    const roleId = await getRoleIdByName("nurse");

    // =========================================================
    // ASSIGN ROLE
    // =========================================================
    await connection.query(
      `INSERT INTO userrole (userId, roleId)
       VALUES (?, ?)`,
      [userId, roleId]
    );

    // =========================================================
    // COMMIT
    // =========================================================
    await connection.commit();

    return {
      success: true,
      userId,
    };

  } catch (error) {

    // =========================================================
    // ROLLBACK
    // =========================================================
    if (connection) {
      await connection.rollback();
    }

    throw error;

  } finally {

    // =========================================================
    // RELEASE CONNECTION
    // =========================================================
    if (connection) {
      connection.release();
    }
  }
};

// ============================================================
// LOOKUP QUERIES (used by controller orchestration)
// ============================================================

const getUserById = async (userId) => {
  const [rows] = await db.query(
    `SELECT u.*, r.roleName
     FROM user u
     LEFT JOIN userrole ur ON u.id = ur.userId
     LEFT JOIN roles r ON ur.roleId = r.id
     WHERE u.id = ? AND u.status = 'active'`,
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
};

const getAllUsers = async () => {
  const [rows] = await db.query(
    `SELECT u.*, r.roleName
     FROM user u
     LEFT JOIN userrole ur ON u.id = ur.userId
     LEFT JOIN roles r ON ur.roleId = r.id`
  );
  return rows;
};

const getAllUsersPaginated = async ({ page = 1, limit = 10, search = "", sortBy = "name", order = "ASC" }) => {
  const offset = (page - 1) * limit;

  let whereClause = "";
  let params = [];

  if (search) {
    whereClause = `WHERE u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR r.roleName LIKE ?`;
    const s = `%${search}%`;
    params = [s, s, s, s];
  }

  const allowedSort = ["id", "name", "email", "createdAt", "status"];
  const safeSort = allowedSort.includes(sortBy) ? sortBy : "name";
  const safeOrder = order === "DESC" ? "DESC" : "ASC";

  const [[{ totalCount }]] = await db.query(
    `SELECT COUNT(DISTINCT u.id) as totalCount
     FROM user u
     LEFT JOIN userrole ur ON u.id = ur.userId
     LEFT JOIN roles r ON ur.roleId = r.id
     ${whereClause}`,
    params
  );

  const [users] = await db.query(
    `SELECT u.id, u.name, u.phone, u.email, u.gender, u.dob, u.status, r.roleName
     FROM user u
     LEFT JOIN userrole ur ON u.id = ur.userId
     LEFT JOIN roles r ON ur.roleId = r.id
     ${whereClause}
     ORDER BY u.${safeSort} ${safeOrder}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: users,
    meta: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

const getUsersByCreatorIdAndRole = async (creatorId, roleName) => {
  const [rows] = await db.query(
    `SELECT u.*, r.roleName
     FROM user u
     LEFT JOIN userrole ur ON u.id = ur.userId
     LEFT JOIN roles r ON ur.roleId = r.id
     WHERE u.createdBy = ? AND r.roleName = ? AND u.status = 'active'`,
    [creatorId, roleName]
  );
  return rows;
};

const getUsersByHospitalIdAndRole = async (hospitalId, roleName) => {
  const [rows] = await db.query(
    `SELECT u.*, r.roleName
     FROM user u
     LEFT JOIN userrole ur ON u.id = ur.userId
     LEFT JOIN roles r ON ur.roleId = r.id
     LEFT JOIN assignedhospital ah ON u.id = ah.userId
     WHERE ah.hospitalId = ? AND r.roleName = ? AND u.status = 'active'`,
    [hospitalId, roleName]
  );
  return rows;
};

/**
 * Returns doctors assigned to a given hospital.
 */
const getDoctorsByHospital = async (hospitalId) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.specialization
     FROM user u
     JOIN userrole ur ON u.id = ur.userId
     JOIN roles r ON ur.roleId = r.id
     JOIN assignedhospital ah ON u.id = ah.userId
     WHERE ah.hospitalId = ? AND r.roleName = 'doctor' AND u.status = 'active'`,
    [hospitalId]
  );
  return rows;
};

/**
 * Returns the nurse with the fewest active patient assignments
 * that speaks the given language and belongs to the given hospital.
 */
const getLeastLoadedNurse = async (language) => {
  const [rows] = await db.query(
    `SELECT 
        u.id,
        u.name,
        u.language,
        COUNT(pa.patientId) AS patientCount
     FROM user u
     JOIN userrole ur 
        ON u.id = ur.userId
     JOIN roles r 
        ON ur.roleId = r.id
     LEFT JOIN patient_assignments pa 
        ON pa.caretakerId = u.id
     WHERE r.roleName = 'nurse'
       AND u.status = 'active'
       AND u.language = ?
     GROUP BY u.id
     ORDER BY patientCount ASC, u.id ASC
     LIMIT 1`,
    [language]
  );

  return rows.length ? rows[0] : null;
};

/**
 * Fetches a package by its ID.
 */
const getPackageById = async (packageId) => {
  const [[pkg]] = await db.query(
    `SELECT id, name, price, duration_days FROM packages WHERE id = ? AND is_active = 1`,
    [packageId]
  );
  return pkg || null;
};

// ============================================================
// ASSIGNMENT / RECORDS INSERTS
// ============================================================

/**
 * Inserts into patient_assignments (doctor + optional nurse/caretaker).
 */
const assignPatient = async (patientId, doctorId, caretakerId = null) => {
  await db.query(
    `INSERT INTO patient_assignments (patientId, doctorId, caretakerId) VALUES (?, ?, ?)`,
    [patientId, doctorId, caretakerId]
  );
};

/**
 * Inserts a package subscription row into user_packages.
 */
const insertUserPackage = async (userId, packageId, durationDays, renewedBy = null) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + durationDays);

  await db.query(
    `INSERT INTO user_packages (user_id, package_id, start_date, end_date, status, renewedBy)
     VALUES (?, ?, NOW(), ?, 'Active', ?)`,
    [userId, packageId, endDate, renewedBy]
  );

  return endDate;
};

/**
 * Inserts patient vitals / intake record.
 */
const insertVitals = async (patientId, severityLevel, bloodGroup, diagnosisType, postedBy) => {
  await db.query(
    `INSERT INTO patientvitalslogs (patientId, severityLevel, bloodGroup, diagnosisType, postedBy)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, severityLevel, bloodGroup || null, diagnosisType || null, postedBy]
  );
};

/**
 * Inserts documents (prescription / report) into userdocuments.
 */
const insertDocuments = async (patientId, documents, uploadedBy) => {
  // documents: [{ type: 'prescription'|'report', fileUrl: '...' }, ...]
  if (!documents || documents.length === 0) return;

  const values = documents.map((doc) => [patientId, doc.type, doc.fileUrl || null, uploadedBy]);

  await db.query(
    `INSERT INTO userdocuments (userId, documentType, fileUrl, uploadedBy) VALUES ?`,
    [values]
  );
};

// ============================================================
// UPDATE HELPERS
// ============================================================

const updateUser = async (userId, userData) => {
  const dataToUpdate = { ...userData };
  const roleName = dataToUpdate.roleName;
  let affectedRows = 0;

  if (roleName) delete dataToUpdate.roleName;

  if (Object.keys(dataToUpdate).length > 0) {
    dataToUpdate.updatedOn = new Date();
    const fields = Object.keys(dataToUpdate).map((k) => `${k} = ?`).join(", ");
    const values = [...Object.values(dataToUpdate), userId];
    const [result] = await db.query(`UPDATE user SET ${fields} WHERE id = ?`, values);
    affectedRows += result.affectedRows;
  }

  if (roleName) {
    const roleId = await getRoleIdByName(roleName);
    const [roleResult] = await db.query(
      `UPDATE userrole SET roleId = ? WHERE userId = ?`,
      [roleId, userId]
    );
    affectedRows += roleResult.affectedRows;
  }

  return affectedRows > 0;
};

const updateUserStatus = async (userId, status) => {
  const [check] = await db.query(`SELECT id, status FROM user WHERE id = ?`, [userId]);
  if (check.length === 0) return false;

  const statusValue = status.toLowerCase() === "active" ? "active" : "inactive";
  const [result] = await db.query(
    `UPDATE user SET status = ?, updatedOn = NOW() WHERE id = ?`,
    [statusValue, userId]
  );

  return result.affectedRows > 0 || check[0].status === statusValue;
};

const resetUserPassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const [result] = await db.query(
    `UPDATE user SET password = ?, updatedOn = NOW() WHERE id = ?`,
    [hashedPassword, userId]
  );
  return result.affectedRows > 0;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Helpers
  getRoleIdByName,

  // Atomic DB ops
  insertUser,
  assignRoleToUser,
  assignHospitalToUser,
  insertHospital,

  // Composite creators
  createAdmin,
  createHospitalAdmin,
  createDoctor,
  createNurse,
  

  // Lookups
  getUserById,
  getAllUsers,
  getAllUsersPaginated,
  getUsersByCreatorIdAndRole,
  getUsersByHospitalIdAndRole,
  getDoctorsByHospital,
  getLeastLoadedNurse,
  getPackageById,

  // Inserts / assignments
  assignPatient,
  insertUserPackage,
  insertVitals,
  insertDocuments,

  // Updates
  updateUser,
  updateUserStatus,
  resetUserPassword,
};