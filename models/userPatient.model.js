"use strict";

const pool = require("../config/db");

// ============================================================
// CREATE PATIENT
// ============================================================

const createPatient = async (
  patientData,
  createdBy,
  connection
) => {

  const {
    name,
    phone,
    email,
    hashedPassword,
    age,
    gender,
    dob = null,
    state,
    city,
    area,
    zipcode,
    language,
  } = patientData;

  // ------------------------------------------------------------
  // INSERT USER
  // ------------------------------------------------------------

  const [userResult] = await connection.query(
    `INSERT INTO user
      (
        name,
        phone,
        email,
        password,
        age,
        gender,
        dob,
        state,
        city,
        area,
        zipcode,
        language,
        createdBy,
        status
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      phone,
      email,
      hashedPassword,
      age,
      gender,
      dob,
      state,
      city,
      area,
      zipcode,
      language,
      createdBy,
      "active",
    ]
  );

  const patientId = userResult.insertId;

  // ------------------------------------------------------------
  // GET PATIENT ROLE
  // ------------------------------------------------------------

  const [[role]] = await connection.query(
    `SELECT id FROM roles WHERE roleName = 'patient'`
  );

  if (!role) {
    throw new Error("Patient role not found");
  }

  // ------------------------------------------------------------
  // ASSIGN ROLE
  // ------------------------------------------------------------

  await connection.query(
    `INSERT INTO userrole (userId, roleId)
     VALUES (?, ?)`,
    [patientId, role.id]
  );

  return patientId;
};

// ============================================================
// ASSIGN HOSPITAL
// ============================================================

const assignHospital = async (
  patientId,
  hospitalId,
  connection
) => {

  await connection.query(
    `INSERT INTO assignedhospital
      (userId, hospitalId)
     VALUES (?, ?)`,
    [patientId, hospitalId]
  );
};

// ============================================================
// GET DOCTORS BY HOSPITAL
// ============================================================

const getDoctorsByHospital = async (hospitalId) => {

  const [rows] = await pool.query(
    `SELECT u.id, u.name
     FROM user u
     JOIN userrole ur ON u.id = ur.userId
     JOIN roles r ON ur.roleId = r.id
     JOIN assignedhospital ah ON u.id = ah.userId
     WHERE ah.hospitalId = ?
       AND r.roleName = 'doctor'
       AND u.status = 'active'`,
    [hospitalId]
  );

  return rows;
};

// ============================================================
// LEAST LOADED NURSE
// ============================================================

const getLeastLoadedNurse = async (language) => {

  const [rows] = await pool.query(
    `SELECT
        u.id,
        u.name,
        u.language,
        COUNT(pa.patientId) AS patientCount
     FROM user u
     JOIN userrole ur ON u.id = ur.userId
     JOIN roles r ON ur.roleId = r.id
     LEFT JOIN patient_assignments pa
       ON pa.caretakerId = u.id
     WHERE r.roleName = 'nurse'
       AND u.status = 'active'
       AND u.language = ?
     GROUP BY u.id
     ORDER BY patientCount ASC, RAND()
     LIMIT 1`,
    [language]
  );

  return rows.length > 0 ? rows[0] : null;
};

// ============================================================
// ASSIGN PATIENT
// ============================================================

const assignPatient = async (
  patientId,
  doctorId,
  caretakerId,
  connection
) => {

  await connection.query(
    `INSERT INTO patient_assignments
      (
        patientId,
        doctorId,
        caretakerId
      )
     VALUES (?, ?, ?)`,
    [
      patientId,
      doctorId,
      caretakerId || null,
    ]
  );
};

// ============================================================
// INSERT VITALS
// ============================================================

const insertVitals = async (
  patientId,
  vitalsData,
  postedBy,
  connection
) => {

 const {
  temperature = null,
  bloodPressure = null,
  heartRate = null,
  oxygenSaturation = null,

  severityLevel = null,
  bloodGroup = null,
  diagnosisType = null,
} = vitalsData;

await connection.query(
  `INSERT INTO patientvitalslogs
    (
      patientId,
      temperature,
      bloodPressure,
      heartRate,
      oxygenSaturation,
      severityLevel,
      bloodGroup,
      diagnosisType,
      postedBy
    )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    patientId,
    temperature,
    bloodPressure,
    heartRate,
    oxygenSaturation,
    severityLevel,
    bloodGroup,
    diagnosisType,
    postedBy,
  ]
);
};

// ============================================================
// PACKAGE
// ============================================================

const getPackageById = async (packageId) => {

  const [[pkg]] = await pool.query(
    `SELECT
        id,
        name,
        price,
        duration_days
     FROM packages
     WHERE id = ?
       AND is_active = 1`,
    [packageId]
  );

  return pkg || null;
};

const assignPackage = async (
  patientId,
  packageId,
  durationDays,
  renewedBy,
  connection
) => {

  await connection.query(
    `INSERT INTO user_packages
      (
        user_id,
        package_id,
        start_date,
        end_date,
        status,
        renewedBy
      )
     VALUES
      (
        ?,
        ?,
        NOW(),
        DATE_ADD(NOW(), INTERVAL ? DAY),
        'Active',
        ?
      )`,
    [
      patientId,
      packageId,
      durationDays,
      renewedBy || null,
    ]
  );
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createPatient,
  assignHospital,
  getDoctorsByHospital,
  getLeastLoadedNurse,
  assignPatient,
  insertVitals,
  getPackageById,
  assignPackage,
};