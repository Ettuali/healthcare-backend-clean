const patientModel = require("../models/adminpatient.model");
const cryptoService = require("../services/crypto.service");
const nurseModel = require("../models/adminnurse.model");
const patientAssignmentModel = require("../models/patientAssign.model");


const getDuplicateMessage = (err) => {
  if (err.code !== "ER_DUP_ENTRY") return null;

  const raw = (err.sqlMessage || "").toLowerCase();

  if (raw.includes("email")) {
    return "An account with this email already exists.";
  }

  if (raw.includes("phone")) {
    return "An account with this phone number already exists.";
  }

  return "A record with these details already exists.";
};

// ================= GET ALL =================
const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const statusFilter = req.query.status || "Active";

    const allowedSortBy = ["name", "email", "phone", "city", "state", "id", "doctorName"];
    let sortBy = "u.name";

    if (allowedSortBy.includes(req.query.sortBy)) {
      sortBy = req.query.sortBy === "doctorName" ? "ud.name" : `u.${req.query.sortBy}`;
    }

    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const result = await patientModel.getAllPatients({
      page,
      limit,
      search,
      sortBy,
      order,
      statusFilter,
    });

    res.status(200).json({
      success: true,
      message: "Patients fetched successfully.",
      ...result.meta,
      data: result.data,
    });
  } catch (error) {
    console.error("Failed to retrieve patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patients",
      
    });
  }
};

// ================= ADD PATIENT =================
const addPatient = async (req, res) => {
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

      // =====================================================
      // ASSIGNMENTS
      // =====================================================
      hospitalId,
      doctorId,

    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !age ||
      !gender ||
      !state ||
      !city ||
      !area ||
      !zipcode ||
      !language ||
      !severityLevel ||
      !bloodGroup ||
      !hospitalId ||
      !packageId ||
      !doctorId
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    const createdBy = req.user.id;

    // =====================================================
    // GET PACKAGE
    // =====================================================

    const [pkg] = await patientModel.getPackageById(packageId);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Invalid package selected.",
      });
    }

    // =====================================================
    // GET LEAST LOADED NURSE
    // =====================================================

    let assignedNurse =
      await nurseModel.getLeastLoadedNurseByLanguage(language);

    // fallback
    if (!assignedNurse) {
      assignedNurse =
        await nurseModel.getLeastLoadedNurseByLanguage("English");
    }

    if (!assignedNurse) {
      console.warn(
        `No caretaker available for patient ${name}`
      );
    }

    // =====================================================
    // CLEAN PAYLOAD
    // =====================================================

    const patientPayload = {
      // BASIC
      name,
      phone,
      email,
      password,
      age,
      gender,
      dob: dob || null,

      // LOCATION
      state,
      city,
      area,
      zipcode,
      language,

      // VITALS
      severityLevel,
      bloodGroup,
      diagnosisType: diagnosisType || null,

      temperature: temperature || null,
      bloodPressure: bloodPressure || null,
      heartRate: heartRate || null,
      oxygenSaturation: oxygenSaturation || null,

      // PAYMENT
      paymentMethod: paymentMethod || "cash",

      // ASSIGNMENTS
      hospitalId,
      packageId,
      doctorId,

      // PACKAGE
      durationDays: pkg.duration_days,
    };

    // =====================================================
    // CREATE PATIENT
    // =====================================================

    const newPatientId = await patientModel.createPatient(
      patientPayload,
      createdBy,
      assignedNurse
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,
      message: "Patient created successfully!",

      data: {
        patientId: newPatientId,

        assignedDoctor: doctorId,

        assignedCaretaker: assignedNurse
          ? {
              id: assignedNurse.id,
              name: assignedNurse.name,
            }
          : null,

        package: {
          id: packageId,
          durationDays: pkg.duration_days,
          price: pkg.price,
        },
      },
    });

  } catch (error) {

    console.error("[addPatient]", {
  code: error.code,
  message: error.message,
});

    const duplicateMessage = getDuplicateMessage(error);

if (duplicateMessage) {
  return res.status(409).json({
    success: false,
    message: duplicateMessage,
  });
}

return res.status(500).json({
  success: false,
  message: "Failed to create patient.",
});
  }
};

// 🔥 COMMON HANDLER (reuse logic)
const handleGetPatient = async (patientId, res) => {
  try {
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patient = await patientModel.getPatientById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: patient,
    });

  } catch (error) {
    console.error("Failed to retrieve patient:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient",
      
    });
  }
};



// ================= GET BY ID =================
const getPatientById = async (req, res) => {
  return handleGetPatient(req.params.id, res);
};



// ================= GET BY ENCRYPTED ID =================
const getPatientByEncryptedId = async (req, res) => {
  try {
    const decryptedId = await cryptoService.decrypt(
      req.params.id,
      "authentication"
    );

    return handleGetPatient(decryptedId, res);

  } catch (error) {
    console.error("Decryption failed:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid encrypted ID",
    });
  }
};

// ================= UPDATE =================
const updatePatient = async (req, res) => {
  try {
    const updated = await patientModel.updatePatient(
      req.params.id,
      req.body,
      req.user.id
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or no changes made.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully!",
    });
  } catch (error) {
    console.error("Failed to update patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update patient",
      
    });
  }
};

// ================= DELETE =================
const deletePatient = async (req, res) => {
  try {
    const deleted = await patientModel.softDeletePatient(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or already deleted.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully!",
    });
  } catch (error) {
    console.error("Failed to delete patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient",
      
    });
  }
};

// ================= RENEW =================
const renewPackage = async (req, res) => {
  try {
    const { packageId } = req.body;
    const patientId = req.params.id;
    const renewedBy = req.user.id;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required.",
      });
    }

    const [pkg] = await patientModel.getPackageById(packageId);

    if (!pkg || !pkg.duration_days) {
      return res.status(404).json({
        success: false,
        message: "Invalid package.",
      });
    }

    const durationDays = pkg.duration_days;

    const reactivated = await patientModel.renewUserPackage(
      patientId,
      packageId,
      durationDays,
      renewedBy
    );

    if (!reactivated) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package renewed successfully!",
      data: {
        packageName: pkg.name,
        durationDays: pkg.duration_days,
        price: pkg.price,
      },
    });

  } catch (err) {
    console.error("Renew package error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to renew package",
      error: err.message,
    });
  }
};

module.exports = {
  addPatient,
  getAllPatients,
  getPatientById,
  getPatientByEncryptedId,
  updatePatient,
  deletePatient,
  renewPackage,
};