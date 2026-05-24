"use strict";

const bcrypt = require("bcrypt");
const userManagementModel = require("../models/userManagement.model");
const db = require("../config/db");
const cryptoService = require("../services/crypto.service");
const userPatientModel = require("../models/userPatient.model");

// ============================================================
// HELPERS
// ============================================================

/**
 * Validates that all required keys are present and non-empty in an object.
 * Returns an array of missing field names (empty array = valid).
 */
const getMissingFields = (data, requiredFields) =>
  requiredFields.filter((field) => {
    const val = data[field];
    return val === undefined || val === null || String(val).trim() === "";
  });

// ============================================================
// 1. CREATE USER / HOSPITAL  (main entry point)
// ============================================================

const createUserAndHospital = async (req, res) => {
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM user");
    const isFirstUser = count === 0;

    let createdBy = null;
    let createdByHospitalId = null;

    if (isFirstUser) {
      if (req.body.roleName?.toLowerCase() !== "admin") {
        return res.status(403).json({
          success: false,
          message: "First user must be an admin.",
        });
      }
    } else {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Login required.",
        });
      }
      createdBy = req.user.id;
      createdByHospitalId = req.user.createdByHospitalId || null;
    }

    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ success: false, message: "roleName is required." });
    }

    // ── Route to role-specific handler ─────────────────────────────────────
    switch (roleName.toLowerCase()) {
      case "admin":
        return await handleCreateAdmin(req, res, createdBy);

      case "hospital":
        return await handleCreateHospital(req, res, createdBy);

      case "doctor":
        return await handleCreateDoctor(req, res, createdBy, createdByHospitalId);

      case "nurse":
        return await handleCreateNurse(req, res, createdBy, createdByHospitalId);

      case "patient":
        return await handleCreatePatient(req, res, createdBy, createdByHospitalId);

      default:
        return res.status(400).json({ success: false, message: `Invalid role: ${roleName}` });
    }
  } catch (err) {
    console.error("❌ Error in createUserAndHospital:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during creation.",
      
    });
  }
};

// ============================================================
// 1a. ADMIN
// ============================================================

const handleCreateAdmin = async (req, res, createdBy) => {
  const missing = getMissingFields(req.body, [
  "name",
  "email",
  "password",
  "phone",
  "state",
  "city",
  "area",
  "zipcode",
]);
  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  const userId = await userManagementModel.createAdmin(req.body, createdBy);

  return res.status(201).json({
    success: true,
    message: "Admin created successfully.",
    userId,
  });
};

// ============================================================
// 1b. HOSPITAL + HOSPITAL ADMIN
// ============================================================

const handleCreateHospital = async (
  req,
  res,
  createdBy
) => {

  try {

    const missing = getMissingFields(req.body, [
      "name",
      "email",
      "password",
      "phone",
      "state",
      "city",
      "area",
      "zipcode",
    ]);

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const result =
      await userManagementModel.createHospitalAdmin(
        req.body,
        createdBy
      );

    return res.status(201).json({
      success: true,
      message:
        "Hospital and hospital admin created successfully.",
      hospitalId: result.hospitalId,
      userId: result.userId,
    });

  } catch (error) {

    console.error(
      "Error creating hospital:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create hospital.",
      error: error.message,
    });
  }
};

// ============================================================
// 1c. DOCTOR
// ============================================================

const handleCreateDoctor = async (req, res, createdBy) => {

  // =========================================================
  // VALIDATION
  // =========================================================
  const missing = getMissingFields(req.body, [
    "name",
    "phone",
    "email",
    "password",
    "age",
    "gender",
    "specialization",
    "state",
    "city",
    "area",
    "zipcode",
    "language",
    "hospitalId",
  ]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  // =========================================================
  // CREATE DOCTOR
  // =========================================================
  const result = await userManagementModel.createDoctor(
    req.body,
    createdBy
  );

  // =========================================================
  // RESPONSE
  // =========================================================
  return res.status(201).json({
    success: true,
    message: "Doctor created successfully.",
    data: result,
  });
};

// ============================================================
// 1d. NURSE
// ============================================================

const handleCreateNurse = async (req, res, createdBy) => {

  // =========================================================
  // VALIDATION
  // =========================================================
  const missing = getMissingFields(req.body, [
    "name",
    "phone",
    "email",
    "password",
    "age",
    "gender",
    "language",
    "specialization",
    "experience",
    "state",
    "city",
    "area",
    "zipcode",
    
  ]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  // =========================================================
  // CREATE NURSE
  // =========================================================
  const result = await userManagementModel.createNurse(
    req.body,
    createdBy
  );

  // =========================================================
  // RESPONSE
  // =========================================================
  return res.status(201).json({
    success: true,
    message: "Nurse created successfully.",
    data: result,
  });
};

// ============================================================
// 1e. PATIENT  (full workflow)
// ============================================================

const handleCreatePatient = async (
  req,
  res,
  createdBy,
  createdByHospitalId
) => {

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();

    const data = req.body;

    // =========================================================
    // VALIDATION
    // =========================================================

    const REQUIRED_FIELDS = [
      "name",
      "phone",
      "email",
      "password",
      "age",
      "gender",
      "state",
      "city",
      "area",
      "zipcode",
      "language",
      "severityLevel",
      "packageId",
    ];

    const missing = getMissingFields(data, REQUIRED_FIELDS);

    if (missing.length) {

      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // =========================================================
    // HOSPITAL
    // =========================================================

    const hospitalId =
      data.hospitalId || createdByHospitalId;

    if (!hospitalId) {

      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "hospitalId is required.",
      });
    }

    // =========================================================
    // DOCTOR ASSIGNMENT
    // =========================================================

    let doctorId = data.doctorId || null;

    if (!doctorId) {

      const doctors =
        await userPatientModel.getDoctorsByHospital(
          hospitalId
        );

      if (!doctors.length) {

        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "No active doctor found in selected hospital.",
        });
      }

      doctorId = doctors[0].id;
    }

    // =========================================================
    // NURSE ASSIGNMENT
    // =========================================================

    let nurse =
      await userPatientModel.getLeastLoadedNurse(
        data.language
      );

    if (!nurse) {

      console.warn(
        `No ${data.language} nurse found. Falling back to English.`
      );

      nurse =
        await userPatientModel.getLeastLoadedNurse(
          "English"
        );
    }

    const nurseId = nurse ? nurse.id : null;

    // =========================================================
    // PACKAGE
    // =========================================================

    const pkg =
      await userPatientModel.getPackageById(
        data.packageId
      );

    if (!pkg) {

      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid package selected.",
      });
    }

    // =========================================================
    // HASH PASSWORD
    // =========================================================

    const hashedPassword =
      await bcrypt.hash(data.password, 10);

    // =========================================================
    // CREATE PATIENT
    // =========================================================

    const patientId =
      await userPatientModel.createPatient(
        {
          name: data.name,
          phone: data.phone,
          email: data.email,
          hashedPassword,
          age: data.age,
          gender: data.gender,
          dob: data.dob || null,
          state: data.state,
          city: data.city,
          area: data.area,
          zipcode: data.zipcode,
          language: data.language,
        },
        createdBy,
        connection
      );

    // =========================================================
    // ASSIGN HOSPITAL
    // =========================================================

    await userPatientModel.assignHospital(
      patientId,
      hospitalId,
      connection
    );

    // =========================================================
    // INSERT VITALS
    // =========================================================

   await userPatientModel.insertVitals(
  patientId,
  {
    temperature: data.temperature || null,
    bloodPressure: data.bloodPressure || null,
    heartRate: data.heartRate || null,
    oxygenSaturation: data.oxygenSaturation || null,

    severityLevel: data.severityLevel || null,
    bloodGroup: data.bloodGroup || null,
    diagnosisType: data.diagnosisType || null,
  },
  createdBy,
  connection
);

    // =========================================================
    // ASSIGN DOCTOR + NURSE
    // =========================================================

    await userPatientModel.assignPatient(
      patientId,
      doctorId,
      nurseId,
      connection
    );

    // =========================================================
    // ASSIGN PACKAGE
    // =========================================================

    await userPatientModel.assignPackage(
      patientId,
      pkg.id,
      pkg.duration_days,
      createdBy,
      connection
    );

    // =========================================================
    // DOCUMENTS
    // =========================================================


    // =========================================================
    // COMMIT
    // =========================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Patient created successfully.",
      patientId,
      doctorId,
      nurseId,
    });

  } catch (error) {

    await connection.rollback();

    console.error(
      "Error creating patient:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create patient.",
      error: error.message,
    });

  } finally {

    connection.release();
  }
};

// ============================================================
// 2. GET ALL USERS (PAGINATED)
// ============================================================

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";

    const allowedSortBy = ["id", "name", "email", "createdAt", "status"];
    const sortBy = allowedSortBy.includes(req.query.sortBy) ? req.query.sortBy : "name";
    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const result = await userManagementModel.getAllUsersPaginated({ page, limit, search, sortBy, order });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      ...result.meta,
      data: result.data,
    });
  } catch (err) {
    console.error("❌ Error in getAllUsers:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching users.",  });
  }
};

// ============================================================
// 3. GET ALL PACKAGES
// ============================================================

const getAllPackages = async (req, res) => {
  try {
    const db = require("../config/db");
    const [rows] = await db.query(
      "SELECT id, name, price, duration_days FROM packages WHERE is_active = 1"
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Error fetching packages:", err);
    return res.status(500).json({ success: false, message: "Error fetching packages.",  });
  }
};

// ============================================================
// 4. ASSIGN / RENEW PACKAGE
// ============================================================

const assignPackage = async (req, res) => {
  try {
    const userId = req.params.id;
    const { package_id } = req.body;
    const renewedBy = req.user?.id || null;

    if (!package_id) {
      return res.status(400).json({ success: false, message: "package_id is required." });
    }

    const pkg = await userManagementModel.getPackageById(package_id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found or inactive." });
    }

    const endDate = await userManagementModel.insertUserPackage(userId, pkg.id, pkg.duration_days, renewedBy);
    await userManagementModel.updateUserStatus(userId, "active");

    return res.status(200).json({
      success: true,
      message: "Package assigned and user activated successfully.",
      packageEndDate: endDate,
    });
  } catch (err) {
    console.error("❌ Error during package assignment:", err);
    return res.status(500).json({ success: false, message: "Server error during package assignment.",  });
  }
};

// ============================================================
// 5. REACTIVATE USER
// ============================================================

const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await userManagementModel.updateUserStatus(id, "active");
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({
      success: true,
      message: "User reactivated. Please assign a package if required.",
    });
  } catch (err) {
    console.error("❌ Error reactivating user:", err);
    return res.status(500).json({ success: false, message: "Server error during reactivation.",  });
  }
};

// ============================================================
// 6. DEACTIVATE USER
// ============================================================

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await userManagementModel.updateUserStatus(id, "inactive");
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, message: "User deactivated successfully." });
  } catch (err) {
    console.error("❌ Error deactivating user:", err);
    return res.status(500).json({ success: false, message: "Server error during deactivation.",  });
  }
};

// ============================================================
// 7. GET USERS BY CREATOR + ROLE
// ============================================================

const getUsersByCreatorAndRole = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { roleName } = req.params;

    if (!roleName) {
      return res.status(400).json({ success: false, message: "roleName param is required." });
    }

    const users = await userManagementModel.getUsersByCreatorIdAndRole(creatorId, roleName);
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("❌ Error in getUsersByCreatorAndRole:", err);
    return res.status(500).json({ success: false, message: "Server error.",  });
  }
};

// ============================================================
// 8. GET USERS BY HOSPITAL + ROLE
// ============================================================

const getUsersByHospital = async (req, res) => {
  try {
    const hospitalId =
      req.user.roleName === "hospital" ? req.user.id : req.user.createdByHospitalId;

    const { roleName } = req.params;

    if (!hospitalId) {
      return res.status(403).json({ success: false, message: "No hospital associated with your account." });
    }
    if (!roleName) {
      return res.status(400).json({ success: false, message: "roleName param is required." });
    }

    const users = await userManagementModel.getUsersByHospitalIdAndRole(hospitalId, roleName);
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("❌ Error in getUsersByHospital:", err);
    return res.status(500).json({ success: false, message: "Server error.",  });
  }
};

// ============================================================
// 9. GET USER BY ID (encrypted)
// ============================================================

const getUserById = async (req, res) => {
  try {
    const encryptedId = req.params.id;
    const id = await cryptoService.decrypt(encryptedId, "authentication");

    const user = await userManagementModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("❌ Error in getUserById:", err);
    return res.status(500).json({ success: false, message: "Server error.",  });
  }
};

// ============================================================
// 10. UPDATE USER
// ============================================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({ success: false, message: "No fields provided for update." });
    }

    const updated = await userManagementModel.updateUser(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found or no changes made." });
    }

    return res.status(200).json({ success: true, message: "User updated successfully." });
  } catch (err) {
    console.error("❌ Error in updateUser:", err);
    return res.status(500).json({ success: false, message: "Server error during update.",  });
  }
};

// ============================================================
// 11. RESET PASSWORD
// ============================================================

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).trim() === "") {
      return res.status(400).json({ success: false, message: "newPassword is required." });
    }

    const updated = await userManagementModel.resetUserPassword(id, newPassword);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("❌ Error in resetPassword:", err);
    return res.status(500).json({ success: false, message: "Server error during password reset.",  });
  }
};

 
module.exports = {
  createUserAndHospital,
  getAllUsers,
  getAllPackages,
  assignPackage,
  reactivateUser,
  deactivateUser,
  getUsersByCreatorAndRole,
  getUsersByHospital,
  getUserById,
  updateUser,
  resetPassword,
};