const patientVitalsModel = require("../models/patientVitalsLog.model");
const cryptoService = require("../services/crypto.service");

// 🔥 Helper: safely resolve patientId (handles encrypted + plain)
const resolvePatientId = async (patientId) => {
  // If it looks like encrypted → decrypt
  if (typeof patientId === "string" && patientId.startsWith("U2FsdGVkX1")) {
    try {
      const decrypted = await cryptoService.decrypt(patientId, "authentication");

      // extra safety: ensure valid number
      if (!decrypted || isNaN(decrypted)) {
        throw new Error("Invalid decrypted ID");
      }

      return decrypted;
    } catch (err) {
      console.error("Decrypt failed, fallback to plain:", err.message);
      return patientId;
    }
  }

  // Otherwise assume plain
  return patientId;
};

// CREATE
const createVitals = async (req, res) => {
  try {
    const {
      patientId,
      temperature,
      bloodPressure,
      heartRate,
      oxygenSaturation,
      severityLevel,
    } = req.body;

    if (!patientId || !temperature || !bloodPressure || !heartRate || !oxygenSaturation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const resolvedPatientId = await resolvePatientId(patientId);

    const id = await patientVitalsModel.createVitals({
      patientId: resolvedPatientId,
      temperature,
      bloodPressure,
      heartRate,
      oxygenSaturation,
      severityLevel,
      postedBy: resolvedPatientId,
    });

    res.status(201).json({
      success: true,
      message: "Patient vitals added successfully",
      data: { id },
    });

  } catch (err) {
    console.error("Create vitals error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while adding patient vitals",
      error: err.message,
    });
  }
};

// READ (PAGINATED + FIXED)
const getVitalsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    let { page = 1, limit = 5 } = req.query;

    // ✅ validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 5));

    const resolvedPatientId = await resolvePatientId(patientId);

    // console.log("Incoming ID:", patientId);
    // console.log("Resolved ID:", resolvedPatientId);

    const result = await patientVitalsModel.fetchPatientVitalsByPatientId(
      resolvedPatientId,
      pageNum,
      limitNum
    );

    const encryptedVitals = await Promise.all(
      result.data.map(async (vital) => ({
        ...vital,
        id: await cryptoService.encrypt(String(vital.id), "authentication"),
        postedBy: vital.postedBy
          ? await cryptoService.encrypt(String(vital.postedBy), "authentication")
          : null,
      }))
    );

    res.status(200).json({
      success: true,
      data: encryptedVitals,
      pagination: result.pagination,
    });

  } catch (err) {
    console.error("Get vitals error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching patient vitals",
    });
  }
};

// ❌ OPTIONAL: REMOVE THIS AFTER EVERYTHING WORKS
const getVitalsforPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await patientVitalsModel.fetchPatientVitalsByPatientId(patientId);

    res.status(200).json({
      success: true,
      data: result.data || result,
    });
  } catch (err) {
    console.error("Get vitals error:", err);
    res.status(500).json({ success: false });
  }
};

// UPDATE
const updateVitals = async (req, res) => {
  try {
    const { id } = req.params;

    await patientVitalsModel.updateVitals(id, req.body);

    res.status(200).json({
      success: true,
      message: "Patient vitals updated successfully",
    });
  } catch (err) {
    console.error("Update vitals error:", err);
    res.status(500).json({ success: false });
  }
};

// UPDATE TIMING
const updateTiming = async (req, res) => {
  try {
    const { id } = req.params;

    await patientVitalsModel.updateTiming(id);

    res.status(200).json({
      success: true,
      message: "Vitals timestamp updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// DELETE TIMING
const deleteTiming = async (req, res) => {
  try {
    const { id } = req.params;

    await patientVitalsModel.deleteTiming(id);

    res.status(200).json({
      success: true,
      message: "Vitals timestamp deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// DELETE
const deleteVitals = async (req, res) => {
  try {
    const { id } = req.params;

    await patientVitalsModel.deleteVitals(id);

    res.status(200).json({
      success: true,
      message: "Patient vitals deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const getVitalsByPatientEncrypted = async (req, res) => {
  try {
    const decryptedId = await cryptoService.decrypt(
      req.params.patientId,
      "authentication"
    );

    req.params.patientId = decryptedId;

    return getVitalsByPatient(req, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createVitals,
  getVitalsByPatient,
  getVitalsByPatientEncrypted,
  updateVitals,
  updateTiming,
  deleteTiming,
  deleteVitals
};