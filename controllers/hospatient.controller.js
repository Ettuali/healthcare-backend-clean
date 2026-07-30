const hospatientModel = require("../models/hospatient.model");
const pool = require("../config/db");
const { sendNotification } = require("../services/notification.service");

// ─── Controller Actions ──────────────────────────────────────────────────────
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

const addPatient = async (req, res) => {
  try {
    const createdBy = req.user.id; // The Admin/Staff creating the patient
    const data = req.body;

    // 1. Fetch package details to get duration and price
    const pkg = await hospatientModel.getPackageById(data.packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, message: "Invalid package ID provided." });
    }

    // 2. Call the consolidated model function
    // This handles: User, Role, Hospital, Vitals, Nurse Assignment, Package, and Transaction
    const result = await hospatientModel.createPatient(
      data,           // patient info (name, email, language, etc.)
      createdBy,      // used to resolve hospitalId
      data.doctorId,  // optional doctor
      {
        packageId: data.packageId,
        durationDays: pkg.duration_days,
        amount: pkg.price,
        paymentMethod: data.paymentMethod || "Cash"
      }
    );

    const newPatientId = result.patientId;
    const assignedCaretakerId = result.caretakerId;

    // 3. Notifications Dispatch
    
    // Notify Assigned Doctor
    if (data.doctorId) {
      await sendNotification({
        userId: data.doctorId,
        subject: "New Patient Assigned",
        message: `${data.name} has been assigned to you.`,
        type: "patient_assignment",
        channels: ["inapp"],
        referenceType: "patient",
        referenceId: newPatientId,
      }).catch((err) =>
        console.error("[addPatient] Doctor Notification Error:", err.message)
      );
    }

    // Notify Assigned Nurse / Caretaker
    if (assignedCaretakerId) {
      await sendNotification({
        userId: assignedCaretakerId,
        subject: "New Patient Assigned",
        message: `${data.name} has been assigned to your care.`,
        type: "patient_assignment",
        channels: ["inapp"],
        referenceType: "patient",
        referenceId: newPatientId,
      }).catch((err) =>
        console.error("[addPatient] Nurse Notification Error:", err.message)
      );
    }

    // Notify Created Patient
    await sendNotification({
      userId: newPatientId,
      email: data.email,
      phone: data.phone,
      subject: "Care Team Assigned",
      message: "Your doctor and caretaker have been assigned to your care.",
      type: "care_team_assignment",
      channels: ["inapp"],
      referenceType: "patient",
      referenceId: newPatientId,
    }).catch((err) =>
      console.error("[addPatient] Patient Notification Error:", err.message)
    );

    // 4. Return the result including the auto-assigned nurse
    res.status(201).json({
      success: true,
      message: "Patient created and assigned successfully",
      patientId: newPatientId,
      assignedCaretaker: assignedCaretakerId
    });

  } catch (err) {
    console.error("Error in addPatient controller:", err);
    const duplicateMessage = getDuplicateMessage(err);

    if (duplicateMessage) {
      return res.status(409).json({
        success: false,
        message: duplicateMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the patient.",
    });
  }
};

const getPatients = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "createdOn",
      sortOrder: req.query.sortOrder || "DESC",
      status: req.query.status || "Active"
    };

    const result = await hospatientModel.getPatientsByHospitalId(req.user.id, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const hospitalId = await hospatientModel.getHospitalIdByUserId(req.user.id);
    const data = await hospatientModel.getDoctorLoad(hospitalId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const data = await hospatientModel.getPatientDetailsById(req.params.id);
    if (!data) return res.status(404).json({ message: "Patient not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { 
      name, email, phone, age, gender, preferredLanguage, doctorId,
      city, state, area, zipcode, diagnosisType, bloodGroup
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    await hospatientModel.updatePatient(
      req.params.id,
      req.user.id,
      {
        name,
        email,
        phone,
        age,
        gender,
        preferredLanguage,
        doctorId,
        city,
        state,
        area,
        zipcode,
        diagnosisType,
        bloodGroup
      }
    );

    const updated = await hospatientModel.getPatientDetailsById(req.params.id);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    console.error("Update Patient Error:", err);
    res.json(500).json({ message: err.message });
  }
};

const deactivatePatient = async (req, res) => {
  try {
    await hospatientModel.deactivatePatient(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reactivatePatient = async (req, res) => {
  try {
    const hasActivePackage = await hospatientModel.checkActivePackage(req.params.id);

    if (!hasActivePackage) {
      return res.status(400).json({
        success: false,
        message: "Cannot reactivate without active package"
      });
    }

    await hospatientModel.reactivatePatient(req.params.id);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const renewPatientPackage = async (req, res) => {
  try {
    await hospatientModel.renewPatientPackage(
      req.params.id,
      req.body.packageId,
      req.user.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVitalsPatients = async (req, res) => {
  try {
    const result = await hospatientModel.getVitalsPatients(
      req.user.id,
      req.query
    );

    res.json({
      success: true,
      data: result.patients,
      total: result.totalItems,
      totalPages: result.totalPages,
    });

  } catch (err) {
    console.error("Get Vitals Patients Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  addPatient,
  getPatients,
  getVitalsPatients,
  getDoctors,
  getPatientById,
  updatePatient,
  deactivatePatient,
  reactivatePatient,
  renewPatientPackage
};