const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ─── Helper ───────────────────────────────────────────────────────────────────const getVitalsPatients = async (userId, options = {}) => {
function dateFilter(column, filters = {}) {
  const parts = [];
  const params = [];
  if (filters.year) {
    parts.push(`YEAR(${column}) = ?`);
    params.push(Number(filters.year));
  }
  if (filters.month) {
    parts.push(`MONTH(${column}) = ?`);
    params.push(Number(filters.month));
  }
  return {
    clause: parts.length ? "AND " + parts.join(" AND ") : "",
    params,
  };
}

// ─── Core: Create Patient with Smart Load Balancing ──────────────────────────
async function createPatient(patientData, createdBy, doctorId, packageDetails) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const hashedPassword = await bcrypt.hash(patientData.password, 10);
    // 1. Create the user (Mapping FE 'preferredLanguage' to DB 'language')
    const [userResult] = await connection.query(
      `INSERT INTO user 
  (name, email, phone, password, age, gender, language, city, state, area, zipcode, createdBy, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        patientData.name,
        patientData.email,
        patientData.phone,
        hashedPassword,
        patientData.age,
        patientData.gender,
        patientData.preferredLanguage,
        patientData.city,
        patientData.state,
        patientData.area,
        patientData.zipcode,
        createdBy,
      ],
    );

    const userId = userResult.insertId;

    // 2. Assign role (Patient = 5)
    await connection.query(
      `INSERT INTO userrole (userId, roleId) VALUES (?, 5)`,
      [userId],
    );

    // 3. Resolve Hospital from the Admin/Staff who is creating the patient
    const [adminHospital] = await connection.query(
      `SELECT hospitalId FROM assignedhospital WHERE userId = ? LIMIT 1`,
      [createdBy],
    );

    if (adminHospital.length === 0) {
      throw new Error(
        "Creator is not assigned to a hospital. Cannot tag patient.",
      );
    }
    const hospitalId = adminHospital[0].hospitalId;

    await connection.query(
      `INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)`,
      [userId, hospitalId],
    );

    // 4. GLOBAL NURSE ASSIGNMENT (Critical Fix)
const langId =
  patientData?.preferredLanguage ??
  data?.preferredLanguage ??
  null;

let [nurses] = await connection.query(`
  SELECT u.id
  FROM user u
  JOIN userrole ur ON u.id = ur.userId
  WHERE ur.roleId = 4
    AND u.status = 'Active'
  ORDER BY 
    CASE 
      WHEN u.language = ? THEN 1
      WHEN u.language = 2 THEN 2
      ELSE 3
    END,
    (
      SELECT COUNT(*) 
      FROM patient_assignments pa 
      WHERE pa.caretakerId = u.id 
        AND pa.status = 'Active'
    ) ASC
  LIMIT 1
`, [langId]);

    // If still no nurse found (even English ones), get the least loaded nurse regardless of language
    if (nurses.length === 0) {
      [nurses] = await connection.query(`
    SELECT u.id
    FROM user u
    JOIN userrole ur ON u.id = ur.userId
    WHERE ur.roleId = 4 AND u.status = 'Active'
    ORDER BY (SELECT COUNT(*) FROM patient_assignments pa WHERE pa.caretakerId = u.id AND pa.status = 'Active') ASC
    LIMIT 1
  `);
    }

    if (nurses.length === 0) {
      throw new Error("No active nurses available in the system.");
    }

    const caretakerId = nurses[0].id;

    // 5. Insert Patient Vitals
    await connection.query(
      `INSERT INTO patientvitalslogs 
   (patientId, temperature, bloodPressure, heartRate, oxygenSaturation, severityLevel, bloodGroup, diagnosisType)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        patientData.temperature,
        patientData.bloodPressure,
        patientData.heartRate,
        patientData.oxygenSaturation,
        patientData.severityLevel,
        patientData.bloodGroup,
        patientData.diagnosisType,
      ],
    );

    // 6. Insert Patient Assignment (Doctor is hospital-specific, Nurse is global)
    await connection.query(
      `INSERT INTO patient_assignments (patientId, doctorId, caretakerId, status)
       VALUES (?, ?, ?, 'Active')`,
      [userId, doctorId || null, caretakerId],
    );

    // 7. Package Assignment
    await connection.query(
      `INSERT INTO user_packages 
      (user_id, package_id, start_date, end_date, status)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL CAST(? AS UNSIGNED) DAY), 'Active')`,
      [userId, packageDetails.packageId, packageDetails.durationDays],
    );

    // 8. Transaction Log
    await connection.query(
      `INSERT INTO subscription_transactions 
      (user_id, hospital_id, package_id, amount, payment_method, billing_date, status)
      VALUES (?, ?, ?, ?, ?, NOW(), 'paid')`,
      [
        userId,
        hospitalId,
        packageDetails.packageId,
        packageDetails.amount || 0,
        packageDetails.paymentMethod || "Cash",
      ],
    );

    await connection.commit();
    return { patientId: userId, caretakerId: caretakerId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
// ─── Stat Fetching Logic ─────────────────────────────────────────────────────

async function getHospitalIdByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT hospitalId FROM assignedhospital WHERE userId = ? LIMIT 1`,
    [userId],
  );
  return rows.length > 0 ? rows[0].hospitalId : null;
}

async function getTotalPatients(hospitalId) {
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) AS total
     FROM user u
     JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
     JOIN userrole ur ON ur.userId = u.id
     WHERE ur.roleId = 5 AND u.status = 'Active'`,
    [hospitalId],
  );
  return rows[0].total;
}

async function getTotalDoctors(hospitalId) {
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) AS total
     FROM user u
     JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
     JOIN userrole ur ON ur.userId = u.id
     WHERE ur.roleId = 3 AND u.status = 'Active'`,
    [hospitalId],
  );
  return rows[0].total;
}

async function getAssignedPatients(hospitalId) {
  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) AS total
     FROM user u
     JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
     JOIN userrole ur ON ur.userId = u.id
     JOIN (
       SELECT patientId, MAX(id) AS maxId
       FROM patient_assignments
       GROUP BY patientId
     ) latest_pa ON latest_pa.patientId = u.id
     JOIN patient_assignments pa ON pa.id = latest_pa.maxId AND pa.status = 'Active'
     WHERE ur.roleId = 5 AND u.status = 'Active'`,
    [hospitalId],
  );
  return rows[0].total;
}

async function getPatientStatus(hospitalId) {
  const [rows] = await pool.query(
    `SELECT
       SUM(CASE WHEN up.status = 'Active' THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN up.status IN ('Expired','Cancelled') THEN 1 ELSE 0 END) AS expired,
       SUM(
         CASE
           WHEN up.status = 'Active'
            AND up.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
           THEN 1 ELSE 0
         END
       ) AS expiringSoon
     FROM user u
     JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
     JOIN userrole ur ON ur.userId = u.id
     JOIN user_packages up ON up.user_id = u.id
     JOIN (
       SELECT user_id, MAX(id) AS maxId
       FROM user_packages
       GROUP BY user_id
     ) latest ON latest.user_id = up.user_id AND latest.maxId = up.id
     WHERE ur.roleId = 5 AND u.status = 'Active'`,
    [hospitalId],
  );
  return rows[0];
}

async function getPackageById(packageId) {
  const [rows] = await pool.query(
    `SELECT * FROM packages WHERE id = ? LIMIT 1`,
    [packageId],
  );
  return rows[0];
}

// ─── Distributions ───────────────────────────────────────────────────────────

async function getPatientsByGender(hospitalId, year, month) {
  const df = dateFilter("u.createdOn", { year, month });
  const [rows] = await pool.query(
    `SELECT COALESCE(u.gender, 'Unknown') AS gender, COUNT(DISTINCT u.id) AS count
     FROM user u
     JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
     JOIN userrole ur ON ur.userId = u.id
     WHERE ur.roleId = 5 AND u.status = 'Active' ${df.clause}
     GROUP BY u.gender
     ORDER BY count DESC`,
    [hospitalId, ...df.params],
  );
  return rows;
}

async function getDoctorLoad(hospitalId, year, month) {
  const df = dateFilter("pa.assignedOn", { year, month });
  const [rows] = await pool.query(
    `SELECT u.id AS doctorId, u.name, u.email, u.phone, 
            COALESCE(u.specialization, 'Unspecified') AS specialization,
            COUNT(pa.id) AS patientCount
     FROM user u
     JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
     JOIN userrole ur ON ur.userId = u.id
     LEFT JOIN patient_assignments pa ON pa.doctorId = u.id AND pa.status = 'Active' ${df.clause}
     WHERE ur.roleId = 3 AND u.status = 'Active'
     GROUP BY u.id, u.name, u.email, u.phone, u.specialization`,
    [hospitalId, ...df.params],
  );
  return rows;
}

// ─── Finance ─────────────────────────────────────────────────────────────────

async function createTransaction({
  user_id,
  hospital_id,
  package_id,
  amount,
  payment_method,
}) {
  const [result] = await pool.query(
    `INSERT INTO subscription_transactions 
     (user_id, hospital_id, package_id, amount, payment_method, billing_date, status)
     VALUES (?, ?, ?, ?, ?, NOW(), 'paid')`,
    [user_id, hospital_id, package_id, amount, payment_method],
  );
  return result.insertId;
}

async function getHospitalRevenue(hospitalId) {
  const [rows] = await pool.query(
    `SELECT SUM(amount) AS totalRevenue FROM subscription_transactions WHERE hospital_id = ? AND status = 'paid'`,
    [hospitalId],
  );
  return rows[0];
}

// ─── Pagination ──────────────────────────────────────────────────────────────

async function getPatientsByHospitalId(userId, options) {
  const { page, limit, search, sortBy, sortOrder, status } = options;
  const offset = (page - 1) * limit;
  const hospitalId = await getHospitalIdByUserId(userId);

  if (!hospitalId) return { patients: [], totalItems: 0, totalPages: 0 };

  let queryConditions = `
    FROM user u
    JOIN assignedhospital ah ON ah.userId = u.id AND ah.hospitalId = ?
    JOIN userrole ur ON ur.userId = u.id
    WHERE ur.roleId = 5 AND u.status = ?
  `;

  const params = [hospitalId, status];
  if (search) {
    queryConditions += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) as total ${queryConditions}`,
    params,
  );
  const totalItems = countRows[0].total;

  const dataQuery = `
    SELECT u.id, u.name, u.email, u.phone, u.gender, u.age, u.status, u.createdOn
    ${queryConditions}
    ORDER BY u.${sortBy || "name"} ${sortOrder || "ASC"}
    LIMIT ? OFFSET ?
  `;

  const [patients] = await pool.query(dataQuery, [
    ...params,
    parseInt(limit),
    parseInt(offset),
  ]);

  return { patients, totalItems, totalPages: Math.ceil(totalItems / limit) };
}

async function getPatientDetailsById(patientId) {
  const [rows] = await pool.query(
    `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.age,
      u.gender,
      u.city,
      u.state,
      u.area,
      u.zipcode,
      u.status,
      u.language,

      d.name AS doctorName,

      pkg.name AS packageName,
      up.start_date,
      up.end_date,
      up.status AS packageStatus,

      v.temperature,
      v.bloodPressure,
      v.heartRate,
      v.oxygenSaturation,
      v.bloodGroup,
      v.diagnosisType

    FROM user u

    LEFT JOIN patient_assignments pa 
      ON pa.patientId = u.id AND pa.status = 'Active'

    LEFT JOIN user d 
      ON pa.doctorId = d.id

    LEFT JOIN user_packages up 
  ON up.id = (
    SELECT id FROM user_packages
    WHERE user_id = u.id
    ORDER BY id DESC
    LIMIT 1
  )

    LEFT JOIN packages pkg 
      ON pkg.id = up.package_id

    LEFT JOIN patientvitalslogs v 
  ON v.id = (
    SELECT id FROM patientvitalslogs
    WHERE patientId = u.id
    ORDER BY id DESC
    LIMIT 1
  )

    WHERE u.id = ?

    ORDER BY v.id DESC
    LIMIT 1
  `,
    [patientId],
  );

  return rows[0];
}
async function checkActivePackage(userId) {
  const [rows] = await pool.query(
    `
    SELECT id FROM user_packages
    WHERE user_id = ?
    AND status = 'Active'
    AND end_date > NOW()
    LIMIT 1
  `,
    [userId],
  );

  return rows.length > 0;
}

async function reactivatePatient(userId) {
  await pool.query(`UPDATE user SET status = 'Active' WHERE id = ?`, [userId]);
}

async function deactivatePatient(userId) {
  await pool.query(`UPDATE user SET status = 'Inactive' WHERE id = ?`, [
    userId,
  ]);
}

async function renewPatientPackage(userId, packageId, createdBy) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [pkg] = await connection.query(
      `SELECT * FROM packages WHERE id = ? LIMIT 1`,
      [packageId],
    );

    if (!pkg.length) throw new Error("Invalid package");

    await connection.query(
      `INSERT INTO user_packages 
      (user_id, package_id, start_date, end_date, status)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 'Active')`,
      [userId, packageId, pkg[0].duration_days],
    );

    // 🔥 activate automatically
    await connection.query(`UPDATE user SET status = 'Active' WHERE id = ?`, [
      userId,
    ]);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function updatePatient(patientId, updatedBy, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update basic user info
    await connection.query(`
      UPDATE user
SET 
  name = ?, 
  email = ?, 
  phone = ?, 
  age = ?, 
  gender = ?, 
  language = ?,
  city = ?,
  state = ?,
  area = ?,
  zipcode = ?
WHERE id = ?
    `, 
  [
  data.name,
  data.email,
  data.phone,
  data.age,
  data.gender,
  data.preferredLanguage,
  data.city,
  data.state,
  data.area,
  data.zipcode,
  patientId
]);

    // 2. Reassign doctor + nurse (IMPORTANT)
    
    // 🔥 deactivate old assignment
    await connection.query(`
      UPDATE patient_assignments
      SET status = 'Inactive'
      WHERE patientId = ? AND status = 'Active'
    `, [patientId]);
   await connection.query(`
  INSERT INTO patientvitalslogs 
  (patientId, bloodGroup, diagnosisType)
  VALUES (?, ?, ?)
`, [
  patientId,
  data.bloodGroup,
  data.diagnosisType
]);

    // 3. Recalculate nurse based on language
const langId = data?.preferredLanguage ?? null;

let [nurses] = await connection.query(`
  SELECT u.id
  FROM user u
  JOIN userrole ur ON u.id = ur.userId
  LEFT JOIN languages l ON l.id = ?
  WHERE ur.roleId = 4
    AND u.status = 'Active'
  ORDER BY 
    CASE 
  WHEN u.language = ? THEN 1
  WHEN u.language = 2 THEN 2
  ELSE 3
END,
    (SELECT COUNT(*) 
     FROM patient_assignments pa 
     WHERE pa.caretakerId = u.id AND pa.status = 'Active') ASC
  LIMIT 1
`, [langId]);

    if (!nurses.length) {
      [nurses] = await connection.query(`
        SELECT u.id
        FROM user u
        JOIN userrole ur ON u.id = ur.userId
        WHERE ur.roleId = 4 AND u.status = 'Active'
        ORDER BY 
          (SELECT COUNT(*) FROM patient_assignments pa 
           WHERE pa.caretakerId = u.id AND pa.status = 'Active') ASC
        LIMIT 1
      `);
    }

    if (!nurses.length) throw new Error("No nurse available");

    const caretakerId = nurses[0].id;

    // 4. Insert new assignment
    await connection.query(`
      INSERT INTO patient_assignments (patientId, doctorId, caretakerId, status)
      VALUES (?, ?, ?, 'Active')
    `, [
      patientId,
      data.doctorId || null,
      caretakerId
    ]);

    await connection.commit();

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}


const getVitalsPatients = async (userId, options = {}) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 5;
  const offset = (page - 1) * limit;

  const search = options.search || "";

  const hospitalId = await getHospitalIdByUserId(userId);

  const assignmentFilter = options.assignmentFilter || "all";

  // ─────────────────────────────────────
  // GET PATIENTS
  // ─────────────────────────────────────
  const [rows] = await pool.query(
    `
    SELECT 
      u.id,
      u.name AS patientName,
      u.age,
      u.email,
      u.phone,

      d.name AS doctorName,

      COALESCE(v.severityLevel, 'NOT UPDATED') AS severity,

      v.createdOn AS admittedOn

    FROM user u

    -- user ↔ hospital mapping
    JOIN assignedhospital ah
      ON ah.userId = u.id

    -- user ↔ role mapping
    JOIN userrole ur
      ON ur.userId = u.id

    -- doctor assignment
    LEFT JOIN patient_assignments pda
      ON pda.patientId = u.id
      AND pda.status = 'Active'

    -- doctor user
    LEFT JOIN user d
      ON d.id = pda.doctorId

    -- latest vitals
    LEFT JOIN patientvitalslogs v
      ON v.id = (
        SELECT id
        FROM patientvitalslogs
        WHERE patientId = u.id
        ORDER BY id DESC
        LIMIT 1
      )

    WHERE ah.hospitalId = ?
      AND ur.roleId = 5

      AND (
        ? = 'all'
        OR u.status = ?
      )

      AND (
        u.name LIKE ?
        OR u.email LIKE ?
        OR u.phone LIKE ?
        OR d.name LIKE ?
      )

    GROUP BY
      u.id,
      u.name,
      u.age,
      u.email,
      u.phone,
      d.name,
      v.severityLevel,
      v.createdOn

    ORDER BY u.id DESC

    LIMIT ? OFFSET ?
    `,
    [
      hospitalId,
      assignmentFilter,
      assignmentFilter,

      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,

      limit,
      offset,
    ]
  );

  // ─────────────────────────────────────
  // COUNT
  // ─────────────────────────────────────
  const [countRows] = await pool.query(
    `
    SELECT COUNT(DISTINCT u.id) AS total

    FROM user u

    JOIN assignedhospital ah
      ON ah.userId = u.id

    JOIN userrole ur
      ON ur.userId = u.id

    LEFT JOIN patient_assignments pda
      ON pda.patientId = u.id
      AND pda.status = 'Active'

    LEFT JOIN user d
      ON d.id = pda.doctorId

    WHERE ah.hospitalId = ?
      AND ur.roleId = 5

      AND (
        ? = 'all'
        OR u.status = ?
      )

      AND (
        u.name LIKE ?
        OR u.email LIKE ?
        OR u.phone LIKE ?
        OR d.name LIKE ?
      )
    `,
    [
      hospitalId,
      assignmentFilter,
      assignmentFilter,

      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ]
  );

  return {
    patients: rows,
    totalItems: countRows[0].total,
    totalPages: Math.ceil(countRows[0].total / limit),
  };
};

module.exports = {
  getHospitalIdByUserId,
  getTotalPatients,
  getTotalDoctors,
  getAssignedPatients,
  getPatientStatus,
  getPatientsByGender,
  getDoctorLoad,
  getPatientsByHospitalId,
  getPackageById,
  createPatient,
  createTransaction,
  getPatientDetailsById,
  renewPatientPackage,
  reactivatePatient,
  deactivatePatient,
  checkActivePackage,
  getHospitalRevenue,
  updatePatient,
  getVitalsPatients
};