const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

/**
 * Gets all active hospitals with pagination and search.
 * @returns {Promise<Array>} An array of hospital data.
 */
const getAllHospitals = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "h.name",
    order = "ASC",
  } = options;

  const offset = (page - 1) * limit;
  let params = [];

  const joins = `
        JOIN assignedhospital ah ON h.id = ah.hospitalId
        JOIN user u ON ah.userId = u.id
        JOIN userrole ur ON u.id = ur.userId
        JOIN roles r ON ur.roleId = r.id
    `;

  let whereClause = `WHERE u.status = "Active" AND r.roleName = 'hospital'`;
  if (search) {
    whereClause += ` AND (h.name LIKE ? OR h.email LIKE ? OR u.city LIKE ? OR u.state LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const countQuery = `SELECT COUNT(DISTINCT h.id) as totalCount FROM hospital h ${joins} ${whereClause}`;
  const [[{ totalCount }]] = await db.query(countQuery, params);

  const dataQuery = `
      SELECT h.*, u.city, u.state, u.area
      FROM hospital h
      ${joins}
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT ? OFFSET ?
    `;

  const dataParams = [...params, limit, offset];
  const [hospitals] = await db.query(dataQuery, dataParams);

  return {
    data: hospitals,
    meta: {
      totalCount: totalCount,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

/**
 * Creates a new hospital and an associated admin user in a single transaction.
 */
const createHospitalAdmin = async (hospitalData, createdBy) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      name,
      contactNumber,
      email,
      zipcode,
      password,
      city,
      state,
      area
    } = hospitalData;

    const registrationNumber = `H-${Date.now()}-${crypto.randomBytes(4).toString("hex").slice(0, 4)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Insert into Hospital Table
    const [hospitalResult] = await connection.query(
      `INSERT INTO hospital (name, registrationNumber, contactNumber, email, zipcode)
       VALUES (?, ?, ?, ?, ?)`,
      [name, registrationNumber, contactNumber, email, zipcode]
    );
    const hospitalId = hospitalResult.insertId;

    // 2. Insert into User Table (Using 'address' column instead of 'location')
    const [userResult] = await connection.query(
      `INSERT INTO user (name, phone, email, password, area, city, state, zipcode, createdBy, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,  "Active")`,
      [name, contactNumber, email, hashedPassword, area, city, state, zipcode, createdBy]
    );
    const userId = userResult.insertId;

    // 3. Roles and Assignment
    const [roleResult] = await connection.query("SELECT id FROM roles WHERE roleName = ?", ["hospital"]);
    const roleId = roleResult[0].id;

    await connection.query(`INSERT INTO userrole (userId, roleId) VALUES (?, ?)`, [userId, roleId]);
    await connection.query(`INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)`, [userId, hospitalId]);

    await connection.commit();
    return { hospitalId, userId };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Gets a hospital by its ID, checking for an active status on the associated user.
 */
const getHospitalById = async (hospitalId) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*, u.city, u.state, u.status
             FROM hospital h
             JOIN assignedhospital ah ON h.id = ah.hospitalId
             JOIN user u ON ah.userId = u.id
             WHERE h.id = ? AND u.status = "Active"`,
      [hospitalId]
    );
    return rows[0]; // Return the hospital object or undefined
  } catch (error) {
    console.error(`Error in getHospitalById: ${error.message}`);
    throw error;
  }
};

/**
 * Updates a hospital's information.
 */
const updateHospital = async (hospitalId, hospitalData, updatedBy) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      name,
      contactNumber,
      email,
      zipcode,
      city,
      state,
      area
    } = hospitalData;

    // 🚨 Basic validation (you skipped this completely before)
    if (!hospitalId) throw new Error("Hospital ID is required");
    if (!name || !contactNumber || !email) {
      throw new Error("Required fields missing");
    }

    // 1. Get assigned user
    const [assignedUsers] = await connection.query(
      `SELECT userId FROM assignedhospital WHERE hospitalId = ?`,
      [hospitalId]
    );

    if (!assignedUsers.length) {
      throw new Error("No user associated with this hospital");
    }

    // ⚠️ You are assuming 1:1 mapping — keeping same logic
    const userId = assignedUsers[0].userId;

    // 2. Update Hospital Table
    await connection.query(
      `UPDATE hospital 
       SET name = ?, contactNumber = ?, email = ?, zipcode = ?
       WHERE id = ?`,
      [name, contactNumber, email, zipcode, hospitalId]
    );

    // 3. Update User Table
    await connection.query(
      `UPDATE user 
       SET name = ?, phone = ?, email = ?, area = ?, city = ?, state = ?, zipcode = ?, updatedBy = ?
       WHERE id = ?`,
      [name, contactNumber, email, area, city, state, zipcode, updatedBy, userId]
    );

    await connection.commit();

    return {
      success: true,
      hospitalId,
      userId
    };

  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Deactivates a hospital.
 */
const deactivateHospital = async (hospitalId) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [assignedUsers] = await connection.query(
      `SELECT userId FROM assignedhospital WHERE hospitalId = ?`,
      [hospitalId]
    );

    if (assignedUsers.length === 0) {
      await connection.rollback();
      return false;
    }

    // ✅ FIX: handle multiple users
    const userIds = assignedUsers.map(u => u.userId);

    await connection.query(
      `UPDATE user SET status = "Inactive" WHERE id IN (?)`,
      [userIds]
    );

    await connection.query(
      `UPDATE hospital SET updatedAt = CURRENT_TIMESTAMP() WHERE id = ?`,
      [hospitalId]
    );

    await connection.commit();
    return userIds.length > 0;

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error in deactivateHospital: ${error.message}`);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createHospitalAdmin,
  getHospitalById,
  getAllHospitals,
  updateHospital,
  deactivateHospital,
};