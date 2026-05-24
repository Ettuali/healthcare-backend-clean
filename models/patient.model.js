const db = require("../config/db");
const bcrypt = require("bcrypt");

/**
 * Inserts a new user into the database with patient-specific details.
 * @param {string} name - Patient's name.
 * @param {string} phone - Patient's phone number.
 * @param {string} email - Patient's email.
 * @param {string} hashedPassword - The hashed password.
 * @param {string} dob - Patient's date of birth.
 * @param {string} gender - Patient's gender.
 * @param {string} location - Patient's location.
 * @param {number} createdBy - The user ID of the creator.
 * @returns {number} The ID of the newly created user.
 */
const insertUser = async (name, phone, email, hashedPassword, dob, gender, location, createdBy) => {
  const [result] = await db.query(
    `INSERT INTO user (name, phone, email, password, dob, gender, location, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, phone, email, hashedPassword, dob, gender, location, createdBy]
  );
  return result.insertId;
};

/**
 * Assigns the 'patient' role (roleId = 4) to a user.
 * @param {number} userId - The ID of the user to assign the role to.
 */
const assignRoleToUser = async (userId) => {
  const roleId = 4; // Role ID for a patient
  await db.query(
    `INSERT INTO userrole (userId, roleId) VALUES (?, ?)`,
    [userId, roleId]
  );
};

/**
 * Inserts a patient's initial condition as a severity log.
 * @param {number} patientId - The ID of the user who is the patient.
 * @param {string} condition - Patient's medical condition, mapped to severityLevel.
 * @param {number} postedBy - The ID of the user who posted the vital log.
 */
const insertPatientVitalsLog = async (patientId, condition, postedBy) => {
  await db.query(
    `INSERT INTO patientvitalslogs (patientId, severityLevel, postedBy) VALUES (?, ?, ?)`,
    [patientId, condition, postedBy]
  );
};

/**
 * Assigns a hospital to the new patient using the assignedhospital table.
 * @param {number} userId - The ID of the newly created patient.
 * @param {number} hospitalId - The ID of the hospital to assign.
 */
const assignHospitalToPatient = async (userId, hospitalId) => {
  await db.query(
    `INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)`,
    [userId, hospitalId]
  );
};

/**
 * A composite function to handle the entire patient creation process in a single call.
 * This orchestrates the user creation, role assignment, detail insertion, and hospital assignment.
 * @param {object} patientData - Object containing all patient form data.
 * @param {number} createdBy - The user ID of the creator.
 * @returns {number} The ID of the newly created patient.
 */
const createPatient = async (patientData, createdBy) => {
  const { name, phone, email, age, gender, condition, hospitalId } = patientData;
  const location = ""; // Provide a default empty string for location to satisfy the database constraint.

  // Calculate DOB from age to match the schema
  const today = new Date();
  const dob = new Date(today.getFullYear() - age, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  // Generate a secure, temporary password.
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  try {
    // 1. Insert the new user into the 'user' table with dob and gender.
    const newUserId = await insertUser(name, phone, email, hashedPassword, dob, gender, location, createdBy);

    // 2. Assign the 'patient' role (ID 4) to the new user.
    await assignRoleToUser(newUserId);

    // 3. Assign the hospital to the new patient.
    await assignHospitalToPatient(newUserId, hospitalId);

    // 4. Insert the patient's specific details (condition) into the vitals log.
    await insertPatientVitalsLog(newUserId, condition, createdBy);

    return newUserId;
  } catch (error) {
    console.error("Error in patient model:", error);
    throw error;
  }
};

module.exports = {
  createPatient,
};
