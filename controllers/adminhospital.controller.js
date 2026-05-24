const hospitalAdminModel = require("../models/adminhospital.model");
const cryptoService = require("../services/crypto.service");


const handleSqlError = (error) => {
  // Check for MySQL/SQL duplicate entry error (Code 1062 or sqlState 23000)
  if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || error.sqlState === '23000') {
    const msg = error.sqlMessage || "";
    if (msg.includes("user.phone") || msg.includes("contactNumber")) {
      return "This phone number is already registered.";
    }
    if (msg.includes("user.email") || msg.includes("email")) {
      return "This email address is already in use.";
    }
    if (msg.includes("registrationNumber")) {
      return "This registration number already exists.";
    }
    return "A record with these details already exists.";
  }
  return "An internal server error occurred.";
};

/**
 * Controller function to add a new hospital.
 */
const addHospital = async (req, res) => {
  try {
    const hospitalData = req.body;
    const requiredFields = ["name", "contactNumber", "email", "zipcode", "password", "city", "state", "area"];
    
    const missingFields = requiredFields.filter(field => !hospitalData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const createdBy = req.user?.id;
    if (!createdBy) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await hospitalAdminModel.createHospitalAdmin(hospitalData, createdBy);

    res.status(201).json({
      success: true,
      message: "Hospital created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error adding hospital:", error);
    const friendlyMessage = handleSqlError(error);
    const statusCode = friendlyMessage.includes("already") ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: friendlyMessage,
      // Optional: only send error.sqlMessage during development
      debug: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined 
    });
  }
};

/**
 * Controller function to get a list of all active hospitals with pagination.
 */
const getAllHospitals = async (req, res) => {
  try {
    // 1. Get pagination and sorting parameters from query string
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";

    // Whitelist allowed sort fields to prevent injection
    const allowedSortBy = [
      "name",
      "email",
      "city",
      "state",
      "registrationNumber",
    ];
    const sortBy = allowedSortBy.includes(req.query.sortBy)
      ? `h.${req.query.sortBy}`
      : "h.name";
    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // 2. Pass these options to the model function
    const result = await hospitalAdminModel.getAllHospitals({
      page,
      limit,
      search,
      sortBy,
      order,
    });

    // 3. Send the paginated response
    res.status(200).json({
      success: true,
      message: "Active hospitals fetched successfully.",
      ...result.meta, // Contains totalCount, totalPages, etc.
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error.message);
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
};

// --- All other controller functions remain unchanged ---

/**
 * Controller function to get a single hospital by ID.
 */
const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    const hospital = await hospitalAdminModel.getHospitalById(id);

    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Hospital not found." });
    }

    res.status(200).json({
      success: true,
      message: "Hospital fetched successfully.",
      data: hospital,
    });
  } catch (error) {
    console.error("Error fetching hospital by ID:", error.message);
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
};

/**
 * Controller function to get a hospital by a decrypted ID.
 */
const getHospitalByDecryptedId = async (req, res) => {
  try {
    const { id } = req.params;
    const decryptedId = await cryptoService.decrypt(id, "authentication");

    if (!decryptedId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or malformed ID." });
    }

    const hospital = await hospitalAdminModel.getHospitalById(decryptedId);

    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Hospital not found." });
    }

    res.status(200).json({
      success: true,
      message: "Hospital fetched successfully.",
      data: hospital,
    });
  } catch (error) {
    console.error("Error fetching hospital by decrypted ID:", error);
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
};

const getAssignmentsByHospitals = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (!userId || isNaN(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid or malformed user ID provided." });
    }
    // Assuming PatientAssignment model exists and works as intended.
    const assignments = await PatientAssignment.getAssignmentsByHospital(
      userId
    );
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments by hospital:", error);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

/**
 * Controller function to update an existing hospital.
 */
const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalData = req.body;
    const updatedBy = req.user?.id;

    if (!updatedBy) return res.status(401).json({ success: false, message: "Unauthorized" });

    await hospitalAdminModel.updateHospital(id, hospitalData, updatedBy);

    res.status(200).json({
      success: true,
      message: "Hospital updated successfully.",
    });
  } catch (error) {
    console.error("Error updating hospital:", error);
    const friendlyMessage = handleSqlError(error);
    const statusCode = friendlyMessage.includes("already") ? 409 : 500;

    res.status(statusCode).json({ 
      success: false, 
      message: friendlyMessage 
    });
  }
};

/**
 * Controller function to deactivate a hospital.
 */
const deactivateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await hospitalAdminModel.deactivateHospital(id);

    if (!result) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Hospital not found or already inactive.",
        });
    }

    res.status(200).json({
      success: true,
      message: "Hospital deactivated successfully.",
    });
  } catch (error) {
    console.error("Error deactivating hospital:", error.message);
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
};

module.exports = {
  addHospital,
  getAllHospitals,
  getHospitalById,
  getHospitalByDecryptedId,
  updateHospital,
  deactivateHospital,
  getAssignmentsByHospitals,
};