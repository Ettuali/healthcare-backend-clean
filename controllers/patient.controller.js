const patientModel = require("../models/patient.model");

/**
 * Controller function to handle the creation of a new patient.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const addPatient = async (req, res) => {
  const patientData = req.body;
  
  // A mock createdBy user ID; in a real application, this would come from the session.
  const createdBy = 1; 

  // Basic server-side validation to ensure all required fields are present.
  if (!patientData.name || !patientData.email || !patientData.phone || !patientData.age || !patientData.gender || !patientData.condition || !patientData.hospitalId) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  try {
    const newPatientId = await patientModel.createPatient(patientData, createdBy);
    res.status(201).json({ 
      message: "Patient created successfully!", 
      patientId: newPatientId 
    });
  } catch (error) {
    console.error("Error in patient controller:", error);
    res.status(500).json({ message: "An error occurred while creating the patient." });
  }
};

/**
 * Controller function to get all patients.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const getAllPatients = async (req, res) => {
  res.status(501).json({ message: "Get all patients route is not implemented yet." });
};

/**
 * Controller function to get a patient by ID.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const getPatientById = async (req, res) => {
  const { id } = req.params;
  res.status(501).json({ message: `Get patient with ID ${id} is not implemented yet.` });
};

/**
 * Controller function to update a patient.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const updatePatient = async (req, res) => {
  const { id } = req.params;
  res.status(501).json({ message: `Update patient with ID ${id} is not implemented yet.` });
};

/**
 * Controller function to delete a patient.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const deletePatient = async (req, res) => {
  const { id } = req.params;
  res.status(501).json({ message: `Delete patient with ID ${id} is not implemented yet.` });
};


module.exports = {
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
