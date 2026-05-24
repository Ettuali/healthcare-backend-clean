const hosdocModel = require('../models/hosdoc.model');
const hospatientModel = require('../models/hospatient.model');

/**
 * Controller to handle the creation of a new doctor by a hospital admin.
 */
const addDoctor = async (req, res) => {
  try {
    const doctorData = req.body;
    const createdBy = req.user.id; // Assuming createdBy is the admin's ID

    // A better approach is to validate the input first.
    if (!doctorData.name || !doctorData.email || !doctorData.password) {
  return res.status(400).json({ error: "Name, email, and password are required." });
}

    const newDoctorId = await hosdocModel.createDoctor(doctorData, createdBy);

    res.status(201).json({
      message: "Doctor created successfully",
      doctorId: newDoctorId,
    });
  } catch (error) {
    // Check for specific error messages from the model
    if (error.message.includes("Hospital not found")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error creating doctor:", error);
    res.status(500).json({ error: "Failed to create doctor: " + error.message });
  }
};

/**
 * Controller to handle updating a doctor's details.
 */
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const userId = req.user.id;

    const result = await hosdocModel.updateDoctor(id, userId, updatedData);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Doctor not found or no changes were made." });
    }
    res.status(200).json({ message: "Doctor updated successfully." });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error("Error updating doctor:", error);
    res.status(500).json({ error: "Failed to update doctor." });
  }
};

/**
 * Controller to handle deactivating a doctor (soft-delete).
 */
const deactivateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await hosdocModel.deactivateDoctor(id, userId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Doctor not found." });
    }
    res.status(200).json({ message: "Doctor deactivated successfully." });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error("Error deactivating doctor:", error);
    res.status(500).json({ error: "Failed to deactivate doctor." });
  }
};

// ====================================================================
// ✅ UPDATED: getDoctors (Main endpoint for frontend with Search/Sort)
// ====================================================================
/**
 * Controller to get all doctors for the logged-in hospital with pagination, search, and sort.
 */
const getDoctors = async (req, res) => {
  try {
    // Assuming req.user.id holds the hospital admin's ID, which is used to derive the hospitalId
    const userId = req.user.id;
console.log("ADMIN USER ID FROM TOKEN:", userId);
    // 1. Extract and validate pagination, search, and sort parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1
    let limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    
    // Extract Search and Sort parameters
    const searchTerm = req.query.search || ''; // Default to empty string
    const sortBy = req.query.sort || 'name';   // Default to sorting by 'name'

    // Enforce minimum limit of 10
    if (limit < 10) {
        limit = 10;
    }
    
    if (page < 1) {
      return res.status(400).json({ error: "Page must be a positive integer starting from 1." });
    }

    // 2. Pass all necessary parameters to the model function
    // NOTE: You MUST update your hosdocModel.getDoctorsByHospitalId to accept searchTerm and sortBy.
    const { doctors, totalPages, totalCount } = await hosdocModel.getDoctorsByHospitalId(
      userId, 
      page, 
      limit, 
      searchTerm, 
      sortBy
    );

    // 3. Send response with pagination and doctor data
    res.status(200).json({
      doctors: doctors,
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalCount: totalCount
    });
  } catch (error) {
    console.error("Error fetching doctors with pagination, search, and sort:", error);
    res.status(500).json({ error: "Failed to retrieve doctors." });
  }
};

// ====================================================================
// ✅ UPDATED: getDoctorsByHospitalId (Added Search/Sort logic)
// ====================================================================
/**
 * Controller to get doctors for any hospitalId (super admin) with pagination, search, and sort.
 */
const getDoctorsByHospitalId = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    // Extract and validate pagination parameters for this route too
    const page = parseInt(req.query.page) || 1; // Default to page 1
    let limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    
    // Extract Search and Sort parameters
    const searchTerm = req.query.search || ''; // Default to empty string
    const sortBy = req.query.sort || 'name';   // Default to sorting by 'name'

    // Enforce minimum limit of 10
    if (limit < 10) {
        limit = 10;
    }
    
    if (page < 1) {
      return res.status(400).json({ error: "Page must be a positive integer starting from 1." });
    }

    // Check if the hospitalId is a valid number (assuming your model expects a numeric ID)
    if (isNaN(hospitalId)) {
      return res.status(400).json({ error: "Invalid hospitalId provided (must be numeric)." });
    }
    
    // Use the updated model function which accepts all parameters
    // NOTE: You MUST update your hosdocModel.getDoctorsForSpecificHospital to accept searchTerm and sortBy.
    const { doctors, totalPages, totalCount } = await hosdocModel.getDoctorsForSpecificHospital(
      hospitalId, 
      page, 
      limit, 
      searchTerm, 
      sortBy
    );

    // Send paginated response
    res.status(200).json({
      doctors: doctors,
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalCount: totalCount
    });
  } catch (error) {
    console.error("Error fetching doctors by specific hospital ID:", error);
    res.status(500).json({ error: "Failed to retrieve doctors." });
  }
};

/**
 * OPTIONAL: Combined endpoint to get both patients and doctors for a hospital.
 * NOTE: This is left unpaginated as paginating two lists in one response is complex.
 */
const getHospitalPeople = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    // Fetch all doctors (page 1, very high limit) without search/sort for this combined view
    const [patients, { doctors }] = await Promise.all([
      hospatientModel.getPatientsBySpecificHospitalId(hospitalId),
      hosdocModel.getDoctorsForSpecificHospital(hospitalId, 1, 999999, '', 'name'), 
    ]);
    res.status(200).json({ patients, doctors });
  } catch (error) {
    console.error("Error fetching hospital people:", error);
    res.status(500).json({ error: "Failed to retrieve hospital people." });
  }
};

module.exports = {
  addDoctor,
  updateDoctor,
  deactivateDoctor,
  getDoctors, // PAGINATED, SEARCHABLE, SORTABLE
  getDoctorsByHospitalId, // PAGINATED, SEARCHABLE, SORTABLE
  getHospitalPeople,
};