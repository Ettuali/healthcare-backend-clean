const db = require("../config/db");

// Helper: Get the role ID for a nurse
const getRoleIdByName = async (roleName) => {
  const [rows] = await db.query(`SELECT id FROM roles WHERE roleName = ?`, [
    roleName,
  ]);
  if (rows.length === 0) throw new Error(`Role '${roleName}' not found.`);
  return rows[0].id;
};

/**
 * ⭐ NEW: Get all nurses with pagination and search.
 */
const getAllNurses = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "u.name",
    order = "ASC",
  } = options;

  const offset = (page - 1) * limit;
  let params = [];
  const nurseRoleId = await getRoleIdByName("nurse");

  // Build the WHERE clause for searching
  let whereClause = `WHERE ur.roleId = ?`;
  params.push(nurseRoleId);

  if (search) {
    whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.city LIKE ? OR u.state LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // First, get the total count of nurses matching the search criteria
  const countQuery = `
      SELECT COUNT(u.id) as totalCount
      FROM user u
      JOIN userrole ur ON u.id = ur.userId
      ${whereClause}
    `;
  const [[{ totalCount }]] = await db.query(countQuery, params);

  // Then, fetch the paginated data
 const dataQuery = `
  SELECT 
    u.id,
    u.name,
    u.phone,
    u.email,
    u.specialization,
    u.experience,
    u.gender,
    u.age,
    u.state,
    u.city,
    u.area,
    u.zipcode,

    CASE
      WHEN u.language REGEXP '^[0-9]+$'
      THEN l.name
      ELSE u.language
    END AS language,

    u.status

  FROM user u

  JOIN userrole ur
    ON u.id = ur.userId

  LEFT JOIN languages l
    ON CAST(u.language AS UNSIGNED) = l.id

  ${whereClause}

  ORDER BY ${sortBy} ${order}

  LIMIT ? OFFSET ?
`;

  const dataParams = [...params, limit, offset];
  const [nurses] = await db.query(dataQuery, dataParams);

  return {
    data: nurses,
    meta: {
      totalCount: totalCount,
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

// --- All other model functions remain unchanged ---

/**
 * Create a nurse and assign the 'nurse' role in a single transaction.
 */
const createNurse = async (nurseData, createdBy) => {
  const {
    name,
    phone,
    email,
    password,
    age,
    specialization,
    experience,
    gender,
    state,
    city,
    area,
    zipcode,
    language,
  } = nurseData;
  try {
    await db.query("START TRANSACTION");
    const roleId = await getRoleIdByName("nurse");
    const [userResult] = await db.query(
      `INSERT INTO user (name, phone, email, password,age, specialization, experience, gender, state, city, area, zipcode, language, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        name,
        phone,
        email,
        password,
        age,
        specialization,
        experience,
        gender,
        state,
        city,
        area,
        zipcode,
        language,
        createdBy,
      ]
    );
    const newUserId = userResult.insertId;
    await db.query(`INSERT INTO userrole (userId, roleId) VALUES (?, ?)`, [
      newUserId,
      roleId,
    ]);
    await db.query("COMMIT");
    return newUserId;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Transaction failed:", error);
    throw error;
  }
};

/**
 * Get a nurse by ID
 */
const getNurseById = async (id) => {
  const nurseRoleId = await getRoleIdByName("nurse");

  const [rows] = await db.query(
    `
    SELECT 
      u.id,
      u.name,
      u.phone,
      u.email,
      u.specialization,
      u.experience,
      u.age,
      u.gender,
      u.state,
      u.city,
      u.area,
      u.zipcode,

      CASE
        WHEN u.language REGEXP '^[0-9]+$'
        THEN l.name
        ELSE u.language
      END AS language,

      u.status

    FROM user u

    JOIN userrole ur
      ON u.id = ur.userId

    LEFT JOIN languages l
      ON CAST(u.language AS UNSIGNED) = l.id

    WHERE u.id = ?
    AND ur.roleId = ?
    `,
    [id, nurseRoleId]
  );

  return rows[0] || null;
};

/**
 * Update a nurse
 */
const updateNurse = async (id, nurseData, updatedBy) => {
  const {
    name,
    phone,
    email,
    age,
    specialization,
    experience,
    gender,
    state,
    city,
    area,
    zipcode,
    language,
  } = nurseData;
  const [result] = await db.query(
    `UPDATE user SET name=?, phone=?, email=?, age=?, specialization=?, experience=?, gender=?, state=?, city=?, area=?, zipcode=?, language=?, updatedBy=? WHERE id=?`,
    [
      name,
      phone,
      email,
      age,
      specialization,
      experience,
      gender,
      state,
      city,
      area,
      zipcode,
      language,
      updatedBy,
      id,
    ]
  );
  return result.affectedRows;
};

/**
 * Update a nurse's status
 */
const updateNurseStatus = async (id, newStatus, updatedBy) => {
  const [result] = await db.query(
    `UPDATE user SET status=?, updatedBy=? WHERE id=?`,
    [newStatus, updatedBy, id]
  );
  return result.affectedRows;
};

/**
 * Get an available active nurse by language who has less than the patient limit.
 */
const getAvailableNurseByLanguageAndLimit = async (language, limit) => {
  try {
    const nurseRoleId = await getRoleIdByName("nurse");
    const [rows] = await db.query(
  `SELECT 
     u.id, 
     u.name,
     COUNT(pa.patientId) AS patient_count
   FROM user u
   JOIN userrole ur 
     ON u.id = ur.userId
   LEFT JOIN patient_assignments pa 
     ON u.id = pa.caretakerId
   WHERE 
     ur.roleId = ?
     AND u.status = 'Active'
     AND (
       u.language = ?
       OR EXISTS (
         SELECT 1
         FROM languages l
         WHERE l.id = u.language
         AND l.name = ?
       )
     )
   GROUP BY u.id
   HAVING patient_count < ?
   ORDER BY patient_count ASC
   LIMIT 1`,
  [nurseRoleId, language, language, limit]
);
    return rows[0] || null;
  } catch (error) {
    console.error("Error in getAvailableNurseByLanguageAndLimit:", error);
    throw error;
  }
};

/**
 * NEW: Get the active nurse by language who currently has the *fewest* patients (no limit).
 */
const getLeastLoadedNurseByLanguage = async (language) => {
  try {
    const nurseRoleId = await getRoleIdByName("nurse");
    const [rows] = await db.query(
  `SELECT 
     u.id, 
     u.name,
     COUNT(pa.patientId) AS patient_count
   FROM user u
   JOIN userrole ur 
     ON u.id = ur.userId
   LEFT JOIN patient_assignments pa 
     ON u.id = pa.caretakerId
   WHERE 
     ur.roleId = ?
     AND u.status = 'Active'
     AND (
       u.language = ?
       OR EXISTS (
         SELECT 1
         FROM languages l
         WHERE l.id = u.language
         AND l.name = ?
       )
     )
   GROUP BY u.id
   ORDER BY patient_count ASC
   LIMIT 1`,
  [nurseRoleId, language, language]
);
    return rows[0] || null;
  } catch (error) {
    console.error("Error in getLeastLoadedNurseByLanguage:", error);
    throw error;
  }
};

module.exports = {
  createNurse,
  getAllNurses,
  getNurseById,
  updateNurse,
  updateNurseStatus,
  getAvailableNurseByLanguageAndLimit,
  getLeastLoadedNurseByLanguage,
};
