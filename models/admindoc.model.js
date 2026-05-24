const pool = require('../config/db');
const bcrypt = require('bcrypt');

const createDoctor = async (doctorData, createdBy) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    let hospitalId;

    // ✅ Resolve hospitalId
    if (doctorData.hospitalId) {
      const [hospitalCheck] = await connection.query(
        `SELECT id FROM hospital WHERE id = ?`,
        [doctorData.hospitalId]
      );


      if (hospitalCheck.length === 0) {
        throw new Error("Provided hospitalId does not exist.");
      }

      hospitalId = doctorData.hospitalId;
    } else {
      const [hospitalRows] = await connection.query(
        `SELECT hospitalId FROM assignedhospital WHERE userId = ?`,
        [createdBy]
      );

      if (hospitalRows.length === 0) {
        throw new Error("Hospital not found for the user creating the doctor.");
      }

      hospitalId = hospitalRows[0].hospitalId;
    }

    // ✅ Extract ALL required fields
    const {
      name,
      phone,
      email,
      password,
      gender,
      specialization,
      experience,
      language,
      city,
      state,
      area,
      zipcode,
      age,
      address,
    } = doctorData;

    // CHECK EMAIL
const [existingEmail] = await connection.query(
  `SELECT id FROM user WHERE email = ?`,
  [email]
);

if (existingEmail.length > 0) {
  throw new Error("Email already exists");
}

// CHECK PHONE
const [existingPhone] = await connection.query(
  `SELECT id FROM user WHERE phone = ?`,
  [phone]
);

if (existingPhone.length > 0) {
  throw new Error("Phone number already exists");
}

    const hashedPassword = await bcrypt.hash(password || "default_password", 10);

    // ✅ Insert with ALL columns
    const [userResult] = await connection.query(
      `INSERT INTO user (
        name, phone, email, password, gender,
        specialization, experience, language,
        city, state, area, zipcode,
        age, address,
        status, verifiedPhone, verifiedEmail, createdBy
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, 0, ?)`,
      [
        name,
        phone,
        email,
        hashedPassword,
        gender,
        specialization,
        experience,
        language,
        city,
        state,
        area,
        zipcode,
        age,
        address || null,
        createdBy,
      ]
    );

    const newUserId = userResult.insertId;

    // ✅ Assign role
    const [roleResult] = await connection.query(
      `SELECT id FROM roles WHERE roleName = ?`,
      ["doctor"]
    );

    let roleId = roleResult.length > 0 ? roleResult[0].id : null;

    if (!roleId) {
      const [newRoleResult] = await connection.query(
        `INSERT INTO roles (roleName, createdBy) VALUES (?, ?)`,
        ["doctor", createdBy]
      );
      roleId = newRoleResult.insertId;
    }

    await connection.query(
      `INSERT INTO userrole (userId, roleId) VALUES (?, ?)`,
      [newUserId, roleId]
    );

    await connection.query(
      `INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)`,
      [newUserId, hospitalId]
    );

    await connection.commit();
    connection.release();

    return newUserId;

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

const getHospitalIdByUserId = async (userId) => {
  try {
    const [rows] = await pool.query(`SELECT hospitalId FROM assignedhospital WHERE userId = ?`, [userId]);
    return rows[0] ? rows[0].hospitalId : null;
  } catch (error) {
    console.error("Error fetching hospital ID by user ID:", error);
    throw error;
  }
};

const getAllDoctors = async (options) => {
  const { page = 1, limit = 10, search = "", sortBy = "u.name", order = "ASC" } = options;
  const offset = (page - 1) * limit;
  let params = [];
  let whereClause = `WHERE r.roleName = 'doctor' AND u.status = 'Active'`;

  if (search) {
    whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.specialization LIKE ? OR u.city LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Included new fields in the SELECT
  const dataQuery = `
    SELECT u.id, u.name, u.email, u.phone, u.specialization, u.experience, 
           u.language, u.city, u.state, u.area, u.zipcode, h.name as hospitalName 
    FROM user u 
    JOIN userrole ur ON u.id = ur.userId 
    JOIN roles r ON ur.roleId = r.id 
    LEFT JOIN assignedhospital ah ON u.id = ah.userId 
    LEFT JOIN hospital h ON ah.hospitalId = h.id 
    ${whereClause} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;

  const [doctors] = await pool.query(dataQuery, [...params, limit, offset]);
  const [[{ totalCount }]] = await pool.query(`SELECT COUNT(DISTINCT u.id) as totalCount FROM user u JOIN userrole ur ON u.id = ur.userId JOIN roles r ON ur.roleId = r.id ${whereClause}`, params);

  return {
    data: doctors,
    meta: { totalCount, currentPage: page, limit, totalPages: Math.ceil(totalCount / limit) },
  };
};

// ⭐ THIS IS THE NEW, CORRECTED FUNCTION
const getDoctorsByHospitalId = async (hospitalId, options) => {
  const { page = 1, limit = 1000, search = "", sortBy = "u.name", order = "ASC" } = options;
  const offset = (page - 1) * limit;
  let params = [hospitalId];
  let whereClause = `WHERE r.roleName = 'doctor' AND u.status = 'Active' AND ah.hospitalId = ?`;
  if (search) {
    whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.specialization LIKE ?)`;
    const searchTerm = `%${search}%`; // FIX: Removed extra backslash
    params.push(searchTerm, searchTerm, searchTerm);
  }
  const countQuery = `SELECT COUNT(DISTINCT u.id) as totalCount FROM user u JOIN userrole ur ON u.id = ur.userId JOIN roles r ON ur.roleId = r.id JOIN assignedhospital ah ON u.id = ah.userId ${whereClause}`;
  const [[{ totalCount }]] = await pool.query(countQuery, params);
  const dataQuery = `SELECT u.id, u.name, u.email, u.phone, u.specialization FROM user u JOIN userrole ur ON u.id = ur.userId JOIN roles r ON ur.roleId = r.id JOIN assignedhospital ah ON u.id = ah.userId ${whereClause} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
  const dataParams = [...params, limit, offset];
  const [doctors] = await pool.query(dataQuery, dataParams);
  return {
    data: doctors,
    meta: { totalCount, currentPage: page, limit, totalPages: Math.ceil(totalCount / limit) },
  };
};

const getDoctorById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.*, h.name AS hospitalName 
     FROM user u 
     JOIN userrole ur ON u.id = ur.userId 
     JOIN roles r ON ur.roleId = r.id 
     LEFT JOIN assignedhospital ah ON u.id = ah.userId 
     LEFT JOIN hospital h ON ah.hospitalId = h.id 
     WHERE u.id = ? AND r.roleName = 'doctor'`,
    [id]
  );
  return rows[0];
};

const updateDoctor = async (id, updatedData, updatedBy) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const {
      name,
      phone,
      email,
      gender,
      specialization,
      experience,
      language,
      city,
      state,
      area,
      zipcode,
      age,
      address,
      hospitalName,
    } = updatedData;

    // ✅ Update all fields
    await connection.query(
      `UPDATE user SET 
        name = ?, 
        phone = ?, 
        email = ?, 
        gender = ?, 
        specialization = ?, 
        experience = ?, 
        language = ?, 
        city = ?, 
        state = ?, 
        area = ?, 
        zipcode = ?, 
        age = ?, 
        address = ?, 
        updatedBy = ? 
      WHERE id = ?`,
      [
        name,
        phone,
        email,
        gender,
        specialization,
        experience,
        language,
        city,
        state,
        area,
        zipcode,
        age,
        address || null,
        updatedBy,
        id,
      ]
    );

    //  Update hospital mapping if changed
    if (hospitalName) {
      const [hospitalRows] = await connection.query(
        `SELECT id FROM hospital WHERE name = ?`,
        [hospitalName]
      );

      if (hospitalRows.length > 0) {
        await connection.query(
          `UPDATE assignedhospital SET hospitalId = ? WHERE userId = ?`,
          [hospitalRows[0].id, id]
        );
      }
    }

    await connection.commit();
    connection.release();

    return { affectedRows: 1 };

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

const deactivateDoctor = async (id) => {
  try {
    const [result] = await pool.query(`UPDATE user SET status = 'Inactive' WHERE id = ?`, [id]);
    return result;
  } catch (error) {
    console.error("Error deactivating doctor:", error);
    throw error;
  }
};

module.exports = {
  createDoctor,
  getHospitalIdByUserId,
  getDoctorsByHospitalId,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deactivateDoctor,
};