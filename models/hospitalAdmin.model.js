const db = require("../config/db"); // Assuming your database connection is in this path
const bcrypt = require("bcrypt"); // For password hashing

// Inserts a new hospital record into the database.
const insertHospital = async (name, registrationNumber, address, phone, email, zipcode) => {
  // IMPORTANT: The SQL query has been updated to use the 'phone' column instead of 'contactNumber'.
  const [result] = await db.query(
    `INSERT INTO hospital (name, registrationNumber, address, phone, email, zipcode)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, registrationNumber, address, phone, email, zipcode]
  );
  return result.insertId;
};

// Inserts a new user record into the database.
const insertUser = async (name, phone, email, hashedPassword, location, createdBy) => {
  const [result] = await db.query(
    `INSERT INTO user (name, phone, email, password, location, createdBy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, phone, email, hashedPassword, location, createdBy]
  );
  return result.insertId;
};

// Assigns a specific role to a user.
const assignRoleToUser = async (userId, roleId) => {
  await db.query(
    `INSERT INTO userrole (userId, roleId) VALUES (?, ?)`,
    [userId, roleId]
  );
};

// Assigns or reassigns a hospital to a user.
const insertAssignment = async (userId, hospitalId) => {
  await db.query(
    `INSERT INTO assignedhospital (userId, hospitalId, assignedOn, updatedOn)
     VALUES (?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE 
     hospitalId = VALUES(hospitalId), updatedOn = NOW()`,
    [userId, hospitalId]
  );
};
  
module.exports = {
  insertHospital,
  insertUser,
  assignRoleToUser,
  insertAssignment,
};
