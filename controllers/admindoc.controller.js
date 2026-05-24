const doctorModel = require("../models/admindoc.model");

const getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const allowedSortBy = ["name", "email", "specialization", "id"];
    const sortBy = allowedSortBy.includes(req.query.sortBy) ? req.query.sortBy : "name";
    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const result = await doctorModel.getAllDoctors({ page, limit, search, sortBy, order });
    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      ...result.meta,
      data: result.data,
    });
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    res.status(500).json({ success: false, message: "Failed to fetch doctors", error: error.message });
  }
};

// ⭐ THIS IS THE NEW CONTROLLER FUNCTION
const getDoctorsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000; // High limit for dropdowns
    const search = req.query.search || "";

    const result = await doctorModel.getDoctorsByHospitalId(hospitalId, {
      page,
      limit,
      search,
    });

    res.status(200).json({
      success: true,
      ...result.meta,
      data: result.data,
    });
  } catch (error) {
    console.error("Failed to fetch doctors by hospital:", error);
    res.status(500).json({ success: false, message: "Failed to fetch doctors" });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure the ID is a valid number before calling the model
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid Doctor ID format" });
    }

    const doctor = await doctorModel.getDoctorById(id);
    
    if (!doctor) {
      // This is likely where your 404 is coming from. 
      // It means ID 90 doesn't exist in your 'user' table with 'doctor' role.
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error("Failed to fetch doctor by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // ❗ Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const {
      name,
      phone,
      email,
      gender,
      specialization,
      experience,
      language,
      city,
      state,
      area,
      zipcode,
      age,
      address,
      hospitalName,
    } = req.body;

    // ✅ Basic validation (don’t overkill)
    if (!name || !phone || !email || !gender) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, email and gender are required",
      });
    }

    const updatedBy = req.user.id;

    // ✅ Clean payload (ONLY allowed fields)
    const updatedPayload = {
      name,
      phone,
      email,
      gender,
      specialization,
      experience,
      language,
      city,
      state,
      area,
      zipcode,
      age,
      address,
      hospitalName,
    };

    const result = await doctorModel.updateDoctor(
      id,
      updatedPayload,
      updatedBy
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or no changes made.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully!",
    });

  } catch (error) {
    console.error("Failed to update doctor:", error);

if (
  error.message.includes("exists") ||
  error.message.includes("Duplicate")
) {
  return res.status(409).json({
    success: false,
    message: error.message,
  });
}

res.status(500).json({
  success: false,
  message: "Failed to create doctor",
  error: error.message,
});
  }
};

const deactivateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await doctorModel.deactivateDoctor(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Doctor not found or already deactivated." });
    }
    res.status(200).json({ message: "Doctor deactivated successfully." });
  } catch (error) {
    console.error("Failed to deactivate doctor:", error);
    res.status(500).json({ message: "Failed to deactivate doctor", error: error.message });
  }
};

const addDoctor = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      gender,
      hospitalId,
      specialization,
      experience,
      language,
      city,
      state,
      area,
      zipcode,
      age,
      address,
    } = req.body;

    // ✅ Strong validation
    if (
      !name ||
      !phone ||
      !email ||
      !hospitalId ||
      !gender ||
      !specialization
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone, email, gender, specialization and hospitalId are required.",
      });
    }

    const createdBy = req.user.id;

    const doctorPayload = {
      name,
      phone,
      email,
      password,
      gender,
      hospitalId,
      specialization,
      experience,
      language,
      city,
      state,
      area,
      zipcode,
      age,
      address,
    };

    const newUserId = await doctorModel.createDoctor(
      doctorPayload,
      createdBy
    );

    res.status(201).json({
      success: true,
      message: "Doctor created successfully!",
      doctorId: newUserId,
    });

  } catch (error) {
  console.error("Failed to add new doctor:", error);

  if (
    error.message.includes("exists") ||
    error.message.includes("Duplicate")
  ) {
    return res.status(409).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message.includes("required") ||
    error.message.includes("Invalid")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
}
};

module.exports = {
  addDoctor,
  getAllDoctors,
  getDoctorsByHospital, 
  getDoctorById,
  updateDoctor,
  deactivateDoctor,
};