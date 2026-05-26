const nurseModel = require("../models/adminnurse.model");
const bcrypt = require("bcrypt");

// ─────────────────────────────────────────────
// Utility: Safe structured logger
// Prevents raw SQL / DB internals from leaking
// into terminal or client responses.
// ─────────────────────────────────────────────
const logError = (context, err) => {
  console.error(`[${context}]`, {
    code: err.code || "UNKNOWN",
    message: err.message,
  });
};


// ─────────────────────────────────────────────
// Utility: Detect duplicate field from MySQL
// ER_DUP_ENTRY sqlMessage format:
// "Duplicate entry 'X' for key 'table.column_name'"
// ─────────────────────────────────────────────
const getDuplicateField = (err) => {
  if (err.code !== "ER_DUP_ENTRY") return null;

  const raw = (err.sqlMessage || "").toLowerCase();

  if (raw.includes("email")) {
    return "email";
  }

  if (raw.includes("phone")) {
    return "phone";
  }

  return "unknown";
};

/**
 * Get all nurses with pagination, search, and sorting
 */
const getAllNurses = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";

    const allowedSortBy = [
      "name",
      "email",
      "phone",
      "city",
      "state",
      "id",
      "age",
    ];
    const sortBy = allowedSortBy.includes(req.query.sortBy)
      ? `u.${req.query.sortBy}`
      : "u.name";
    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const result = await nurseModel.getAllNurses({
      page,
      limit,
      search,
      sortBy,
      order,
    });

    res.status(200).json({
      success: true,
      message: "Nurses fetched successfully.",
      ...result.meta,
      data: result.data,
    });
  } catch (err) {
    logError("getAllNurses", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching nurses.",
    });
  }
};

/**
 * Create a new nurse
 */
const createNurse = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const { password, state, city, area, zipcode, ...nurseData } = req.body;

    if (
      !nurseData.name ||
      !nurseData.email ||
      !password ||
      !nurseData.phone ||
      !nurseData.language ||
      !nurseData.age
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, phone, age, and language are required fields.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserId = await nurseModel.createNurse(
      {
        ...nurseData,
        password: hashedPassword,
        state: state || "",
        city: city || "",
        area: area || "",
        zipcode: zipcode || "",
      },
      createdBy,
    );

    res.status(201).json({
      success: true,
      message: "Nurse created successfully.",
      nurseId: newUserId,
    });
  } catch (err) {
    logError("createNurse", err);

    const duplicateField = getDuplicateField(err);

    if (duplicateField !== null) {
      if (duplicateField.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      if (duplicateField.includes("phone")) {
        return res.status(409).json({
          success: false,
          message: "An account with this phone number already exists.",
        });
      }

      // Fallback: some other unique constraint was violated
      return res.status(409).json({
        success: false,
        message: "A record with these details already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create nurse.",
    });
  }
};

/**
 * Get a nurse by ID
 */
const getNurseById = async (req, res) => {
  try {
    const { id } = req.params;
    const nurse = await nurseModel.getNurseById(id);
    if (!nurse) {
      return res
        .status(404)
        .json({ success: false, message: "Nurse not found." });
    }
    res.status(200).json({ success: true, data: nurse });
  } catch (err) {
    logError("getNurseById", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching nurse.",
    });
  }
};

/**
 * Update a nurse
 */
const updateNurse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBy = req.user?.id;

    const nurseData = {
      ...req.body,
      state: req.body.state || "",
      city: req.body.city || "",
      area: req.body.area || "",
      zipcode: req.body.zipcode || "",
    };

    const affectedRows = await nurseModel.updateNurse(id, nurseData, updatedBy);
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found or no changes made.",
      });
    }
    res.status(200).json({
      success: true,
      message: "Nurse updated successfully.",
    });
  } catch (err) {
    logError("updateNurse", err);

    const duplicateField = getDuplicateField(err);

    if (duplicateField !== null) {
      if (duplicateField.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      if (duplicateField.includes("phone")) {
        return res.status(409).json({
          success: false,
          message: "An account with this phone number already exists.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "A record with these details already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating nurse.",
    });
  }
};

/**
 * Update a nurse's status (Active/Inactive)
 */
const updateNurseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBy = req.user?.id;

    if (!status || (status !== "Active" && status !== "Inactive")) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided. Must be 'Active' or 'Inactive'.",
      });
    }

    const affectedRows = await nurseModel.updateNurseStatus(
      id,
      status,
      updatedBy,
    );
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found or status already set.",
      });
    }
    res.status(200).json({
      success: true,
      message: "Nurse status updated successfully.",
    });
  } catch (err) {
    logError("updateNurseStatus", err);
    res.status(500).json({
      success: false,
      message: "Server error updating nurse status.",
    });
  }
};

/**
 * Delete a nurse (Soft Delete)
 */
const deleteNurse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBy = req.user?.id;

    const affectedRows = await nurseModel.updateNurseStatus(
      id,
      "Inactive",
      updatedBy,
    );
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found or already inactive.",
      });
    }
    res.status(200).json({
      success: true,
      message: "Nurse deactivated successfully.",
    });
  } catch (err) {
    logError("deleteNurse", err);
    res.status(500).json({
      success: false,
      message: "Server error deactivating nurse.",
    });
  }
};

module.exports = {
  createNurse,
  getAllNurses,
  getNurseById,
  updateNurse,
  updateNurseStatus,
  deleteNurse,
};