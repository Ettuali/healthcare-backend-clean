const pool = require("../config/db");
const bcrypt = require("bcrypt");

const generateNotification = (days, status) => {
  // Only show notifications for Active packages and where days remaining is 0 or more
  if (status !== "Active" || days < 0) {
    return null;
  }

  if (days === 0) {
    return `🛑 Package expires TODAY!`;
  }

  if (days === 1) {
    return `⚠️ Package expires tomorrow.`;
  } // Admin view can show a simpler message

  if (days <= 7) {
    return `🔔 Expires in ${days} days.`;
  }

  return null; // No notification needed
};

class PatientModel {
  /** 🔹 Get Paginated and Filtered List of Patients for Admin Dashboard */
  static async getAllPatients(options) {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "u.name",
      order = "ASC",
      statusFilter = "Active",
    } = options;

    const offset = (page - 1) * limit;
    let params = [];
    let whereClause = `WHERE r.roleName = 'patient'`;

    if (statusFilter === "Active") {
      whereClause += ` AND u.status = 'Active'`;
    } else if (statusFilter === "Inactive") {
      whereClause += ` AND u.status = 'Inactive'`;
    }

    if (search) {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR h.name LIKE ? OR ud.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    const baseJoins = `
JOIN userrole ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
LEFT JOIN assignedhospital ah ON u.id = ah.userId
LEFT JOIN hospital h ON ah.hospitalId = h.id

-- LATEST Doctor Assignment details
LEFT JOIN (
    SELECT pa.patientId, pa.doctorId,
    ROW_NUMBER() OVER(PARTITION BY pa.patientId ORDER BY pa.assignedOn DESC) as rn
    FROM patient_assignments pa
) AS latest_pa ON u.id = latest_pa.patientId AND latest_pa.rn = 1
LEFT JOIN user ud ON latest_pa.doctorId = ud.id

-- LATEST Package details
LEFT JOIN (
    SELECT
        up.*,
        ROW_NUMBER() OVER(PARTITION BY up.user_id ORDER BY up.id DESC) as rn_package
    FROM user_packages up
) AS latest_up ON u.id = latest_up.user_id AND latest_up.rn_package = 1
LEFT JOIN packages p ON latest_up.package_id = p.id`;
    const trimmedJoins = baseJoins.trim();

    const countQuery = `SELECT COUNT(DISTINCT u.id) as totalCount FROM user u ${trimmedJoins} ${whereClause}`;
    const [[{ totalCount }]] = await pool.query(countQuery, params);

    const dataQuery = `SELECT
u.id, u.name, u.phone, u.email, u.age, u.gender, u.language, u.state, u.city, u.area, u.zipcode, u.status,
ah.hospitalId, h.name AS hospitalName,
ud.name AS doctorName,
p.name AS packageName,
latest_up.end_date AS packageEndDate,
latest_up.status AS packageStatus,
DATEDIFF(latest_up.end_date, NOW()) AS daysRemaining

FROM user u ${trimmedJoins}
${whereClause}
ORDER BY ${sortBy} ${order}
LIMIT ? OFFSET ?
`;
    const dataParams = [...params, limit, offset];
    const [patients] = await pool.query(dataQuery, dataParams);

    const patientsWithNotification = patients.map((p) => ({
      ...p,
      renewalNotification: generateNotification(
        p.daysRemaining,
        p.packageStatus
      ),
      daysRemaining: undefined,
    }));

    return {
      data: patientsWithNotification,
      meta: {
        totalCount,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // ----------------------------------------------------------------------
  // --- CREATE/GET/UPDATE/DELETE ---
  // ----------------------------------------------------------------------

static async createPatient(
  patientData,
  createdBy,
  assignedNurse = null
) {

  const connection = await pool.getConnection();

  await connection.beginTransaction();

  try {

    const {
      // =====================================================
      // BASIC INFO
      // =====================================================
      name,
      phone,
      email,
      password,
      age,
      gender,
      dob,

      // =====================================================
      // LOCATION
      // =====================================================
      state,
      city,
      area,
      zipcode,
      language,

      // =====================================================
      // VITALS
      // =====================================================
      severityLevel,
      bloodGroup,
      diagnosisType,

      temperature,
      bloodPressure,
      heartRate,
      oxygenSaturation,

      // =====================================================
      // PACKAGE / PAYMENT
      // =====================================================
      packageId,
      paymentMethod,
      durationDays,

      // =====================================================
      // ASSIGNMENTS
      // =====================================================
      hospitalId,
      doctorId,

    } = patientData;

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // =====================================================
    // CREATE USER
    // =====================================================

    const [userResult] = await connection.query(
      `
      INSERT INTO user
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
        status,
        createdBy
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
      `,
      [
        name,
        phone,
        email,
        hashedPassword,
        age,
        gender,
        dob || null,
        state,
        city,
        area,
        zipcode,
        language,
        createdBy,
      ]
    );

    const newUserId = userResult.insertId;

    // =====================================================
    // GET ROLE
    // =====================================================

    const [roleResult] = await connection.query(
      `
      SELECT id
      FROM roles
      WHERE roleName = ?
      `,
      ["patient"]
    );

    if (!roleResult.length) {
      throw new Error("Patient role not found");
    }

    const roleId = roleResult[0].id;

    // =====================================================
    // ASSIGN ROLE
    // =====================================================

    await connection.query(
      `
      INSERT INTO userrole
      (userId, roleId)
      VALUES (?, ?)
      `,
      [newUserId, roleId]
    );

    // =====================================================
    // INSERT VITALS
    // =====================================================

    await connection.query(
      `
      INSERT INTO patientvitalslogs
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        newUserId,

        temperature || null,
        bloodPressure || null,
        heartRate || null,
        oxygenSaturation || null,

        severityLevel || null,
        bloodGroup || null,
        diagnosisType || null,

        createdBy,
      ]
    );

    // =====================================================
    // ASSIGN HOSPITAL
    // =====================================================

    await connection.query(
      `
      INSERT INTO assignedhospital
      (userId, hospitalId)
      VALUES (?, ?)
      `,
      [newUserId, hospitalId]
    );

    // =====================================================
    // GET PACKAGE
    // =====================================================

    const [pkgResult] = await connection.query(
      `
      SELECT
        price,
        duration_days
      FROM packages
      WHERE id = ?
      `,
      [packageId]
    );

    if (!pkgResult.length) {
      throw new Error("Invalid packageId");
    }

    const amount = pkgResult[0].price;

    // =====================================================
    // ASSIGN PACKAGE
    // =====================================================

    await connection.query(
      `
      INSERT INTO user_packages
      (
        user_id,
        package_id,
        start_date,
        end_date,
        status,
        renewal_count
      )
      VALUES
      (
        ?,
        ?,
        NOW(),
        DATE_ADD(NOW(), INTERVAL ? DAY),
        'Active',
        0
      )
      `,
      [
        newUserId,
        packageId,
        durationDays,
      ]
    );

    // =====================================================
    // INSERT PAYMENT TRANSACTION
    // =====================================================

    await connection.query(
      `
      INSERT INTO subscription_transactions
      (
        user_id,
        hospital_id,
        package_id,
        amount,
        payment_method,
        status,
        billing_date,
        created_at
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        'paid',
        CURDATE(),
        NOW()
      )
      `,
      [
        newUserId,
        hospitalId,
        packageId,
        amount,
        paymentMethod || "cash",
      ]
    );

    // =====================================================
    // ASSIGN DOCTOR + NURSE
    // =====================================================

    await connection.query(
      `
      INSERT INTO patient_assignments
      (
        patientId,
        doctorId,
        caretakerId,
        status,
        assignedOn
      )
      VALUES (?, ?, ?, 'Active', NOW())
      `,
      [
        newUserId,
        doctorId,
        assignedNurse ? assignedNurse.id : null,
      ]
    );

    // =====================================================
    // COMMIT
    // =====================================================

    await connection.commit();

    return newUserId;

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();
  }
}

  /** 🔹 Get a single patient's details, including latest vitals, package, and EXPIRATION NOTIFICATION */
static async getPatientById(patientId) {

  const [patient] = await pool.query(
    `
    SELECT

      -- =====================================================
      -- BASIC INFO
      -- =====================================================

      u.id,
      u.name,
      u.phone,
      u.email,
      u.age,
      u.gender,
      l.name AS language,

      u.state,
      u.city,
      u.area,
      u.zipcode,
      u.status,
      u.createdOn,

      -- =====================================================
      -- HOSPITAL
      -- =====================================================

      ah.hospitalId,
      h.name AS hospitalName,
      h.address AS hospitalAddress,

      -- =====================================================
      -- LATEST VITALS
      -- =====================================================

      v.temperature,
      v.bloodPressure,
      v.heartRate,
      v.oxygenSaturation,

      v.severityLevel,
      v.bloodGroup,
      v.diagnosisType,

      v.createdOn AS vitalsUpdatedAt,

      -- =====================================================
      -- DOCTOR
      -- =====================================================

      latest_pa.doctorId,
      ud.name AS doctorName,
      ud.phone AS doctorPhone,

      -- =====================================================
      -- CARETAKER / NURSE
      -- =====================================================

      latest_pa.caretakerId,
      uc.name AS caretakerName,
      uc.phone AS caretakerPhone,
      uc.language AS caretakerLanguage,

      -- =====================================================
      -- PACKAGE
      -- =====================================================

      up.package_id AS packageId,
      p.name AS packageName,
      p.price AS packagePrice,
      p.duration_days AS packageDuration,

      up.start_date AS packageStartDate,
      up.end_date AS packageEndDate,
      up.status AS packageStatus,
      up.renewal_count,

      DATEDIFF(up.end_date, NOW()) AS daysRemaining,

      -- =====================================================
      -- PAYMENT
      -- =====================================================

      st.amount,
      st.payment_method,
      st.status AS paymentStatus,
      st.billing_date,

      -- =====================================================
      -- DOCUMENT COUNTS
      -- =====================================================

      (
        SELECT COUNT(*)
        FROM userdocuments d
        WHERE d.userId = u.id
      ) AS totalDocuments

    FROM user u

   JOIN userrole ur
  ON u.id = ur.userId

JOIN roles r
  ON ur.roleId = r.id

LEFT JOIN languages l
  ON u.language = l.id

    -- =====================================================
    -- HOSPITAL
    -- =====================================================

    LEFT JOIN assignedhospital ah
      ON u.id = ah.userId

    LEFT JOIN hospital h
      ON ah.hospitalId = h.id

    -- =====================================================
    -- LATEST VITALS
    -- =====================================================

    LEFT JOIN patientvitalslogs v
      ON v.id = (
        SELECT MAX(id)
        FROM patientvitalslogs
        WHERE patientId = u.id
      )

    -- =====================================================
    -- LATEST ASSIGNMENT
    -- =====================================================

    LEFT JOIN (
      SELECT
        pa.*,
        ROW_NUMBER() OVER(
          PARTITION BY pa.patientId
          ORDER BY pa.assignedOn DESC
        ) AS rn
      FROM patient_assignments pa
    ) AS latest_pa
      ON u.id = latest_pa.patientId
      AND latest_pa.rn = 1

    LEFT JOIN user ud
      ON latest_pa.doctorId = ud.id

    LEFT JOIN user uc
      ON latest_pa.caretakerId = uc.id

    -- =====================================================
    -- LATEST PACKAGE
    -- =====================================================

    LEFT JOIN (
      SELECT
        up.*,
        ROW_NUMBER() OVER(
          PARTITION BY up.user_id
          ORDER BY up.id DESC
        ) AS rn
      FROM user_packages up
    ) AS up
      ON u.id = up.user_id
      AND up.rn = 1

    LEFT JOIN packages p
      ON up.package_id = p.id

    -- =====================================================
    -- LATEST TRANSACTION
    -- =====================================================

    LEFT JOIN (
      SELECT
        st.*,
        ROW_NUMBER() OVER(
          PARTITION BY st.user_id
          ORDER BY st.id DESC
        ) AS rn
      FROM subscription_transactions st
    ) AS st
      ON u.id = st.user_id
      AND st.rn = 1

    WHERE
      u.id = ?
      AND r.roleName = 'patient'
    `,
    [patientId]
  );

  if (!patient.length) {
    return null;
  }

  const patientData = patient[0];

  // =====================================================
  // RENEWAL NOTIFICATION
  // =====================================================

  patientData.renewalNotification =
    generateNotification(
      patientData.daysRemaining,
      patientData.packageStatus
    );

  delete patientData.daysRemaining;

  return patientData;
}

  /** 🔹 Update patient details and hospital assignment/diagnosis */
  static async updatePatient(patientId, patientData, updatedBy) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
     const {
  name,
  phone,
  email,
  age,
  gender,
  state,
  city,
  area,
  zipcode,
  language,
  hospitalName,
  diagnosisType,
  bloodGroup,
  severityLevel
} = patientData;

      await connection.query(
        `UPDATE user
                         SET name=?, phone=?, email=?, age=?, gender=?, state=?, city=?, area=?, zipcode=?, language=?, updatedBy=?
                         WHERE id=?`,
        [
          name,
          phone,
          email,
          age,
          gender,
          state,
          city,
          area,
          zipcode,
          language,
          updatedBy,
          patientId,
        ]
      );

      if (hospitalName) {
        const [hospitalResult] = await connection.query(
          `SELECT id FROM hospital WHERE name = ?`,
          [hospitalName]
        );
        if (hospitalResult.length > 0) {
          const hospitalId = hospitalResult[0].id;
          const [exists] = await connection.query(
            `SELECT userId FROM assignedhospital WHERE userId=?`,
            [patientId]
          );
          if (exists.length > 0) {
            await connection.query(
              `UPDATE assignedhospital SET hospitalId=? WHERE userId=?`,
              [hospitalId, patientId]
            );
          } else {
            await connection.query(
              `INSERT INTO assignedhospital (userId, hospitalId) VALUES (?, ?)`,
              [patientId, hospitalId]
            );
          }
        }
      }


if (
  diagnosisType !== undefined ||
  bloodGroup !== undefined ||
  severityLevel !== undefined
) {
  await connection.query(
    `INSERT INTO patientvitalslogs 
     (patientId, diagnosisType, bloodGroup, severityLevel, postedBy) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      patientId,
      diagnosisType || null,
      bloodGroup || null,
      severityLevel || null,
      updatedBy,
    ]
  );
}

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /** 🔹 Soft delete a patient and cancel their active package AND assignments */
  static async softDeletePatient(patientId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      // 1. Soft delete user
      const [result] = await connection.query(
        `UPDATE user SET status='Inactive' WHERE id=?`,
        [patientId]
      );
      // 2. Mark ACTIVE package as 'Cancelled'
      await connection.query(
        `UPDATE user_packages SET status='Cancelled' WHERE user_id=? AND status='Active'`,
        [patientId]
      );
      // 3. Mark ACTIVE assignment as 'Cancelled'
      await connection.query(
        `UPDATE patient_assignments
         SET status='Cancelled', endedOn=NOW()
         WHERE patientId=? AND status='Active'`,
        [patientId]
      );
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ----------------------------------------------------------------------
  // --- PACKAGE METHODS ---
  // ----------------------------------------------------------------------

  /** 🔹 Get package details by ID */
  static async getPackageById(packageId) {
    const [pkg] = await pool.query("SELECT * FROM packages WHERE id = ?", [
      packageId,
    ]);
    return pkg;
  }

  /** 🔹 [UPDATED] Renew a patient's package and reactivate their assignment */
static async renewUserPackage(userId, packageId, durationDays, renewedBy = null) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const durationMinutes = Math.round(durationDays * 24 * 60);

    // 1️⃣ Mark previous packages as 'Renewed'
    await connection.query(
      `UPDATE user_packages SET status='Renewed' WHERE user_id=? AND status IN ('Active', 'Expired')`,
      [userId]
    );

    // 2️⃣ Insert the new active package safely
    await connection.query(
      `INSERT INTO user_packages (user_id, package_id, start_date, end_date, status, renewal_count, renewedBy)
       VALUES (?, ?, GREATEST(NOW(), NOW()), DATE_ADD(GREATEST(NOW(), NOW()), INTERVAL ? MINUTE), 'Active', 1, ?)`,
      [userId, packageId, durationMinutes, renewedBy]
    );

    // 3️⃣ Reactivate the user
    await connection.query(`UPDATE user SET status='Active' WHERE id=?`, [userId]);

    // 4️⃣ Reactivate last caretaker assignment
    await connection.query(
      `UPDATE patient_assignments
         SET status='Active', endedOn=NULL
         WHERE id = (
             SELECT id FROM (
                 SELECT id FROM patient_assignments
                 WHERE patientId=? ORDER BY assignedOn DESC LIMIT 1
             ) AS t
         )`,
      [userId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
}

module.exports = {
  createPatient: PatientModel.createPatient,
  getAllPatients: PatientModel.getAllPatients,
  getPatientById: PatientModel.getPatientById,
  updatePatient: PatientModel.updatePatient,
  softDeletePatient: PatientModel.softDeletePatient,
  getPackageById: PatientModel.getPackageById,
  renewUserPackage: PatientModel.renewUserPackage,
};
