// controllers/admin.controller.js
const adminModel = require("../models/adminadd.model");

/**
 * Creates a new admin account.
 * This function expects 'name', 'email', and 'password' in the request body.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const createAdmin = async (req, res) => {
  try {
    // This assumes authentication middleware populates req.user.id
    const createdBy = req.user.id;
    const { name, email, password } = req.body;

    // Validate that required fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
    }

    // Call the model to create the new admin
    const newAdminId = await adminModel.createAdmin({ name, email, password }, createdBy);
    
    // Send a 201 Created status for successful resource creation
    return res.status(201).json({ success: true, message: 'New admin created successfully.', userId: newAdminId });
  } catch (err) {
    console.error('Error during admin creation:', err);
    return res.status(500).json({ success: false, message: 'Server error during admin creation.', error: err.message });
  }
};

/**
 * Retrieves all admins.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.getAllAdmins();
    res.status(200).json({ success: true, data: admins });
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ success: false, message: 'Server error fetching admins.', error: err.message });
  }
};

/**
 * Retrieves a single admin by ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const getAdminById = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    console.error('Error fetching admin by ID:', err);
    res.status(500).json({ success: false, message: 'Server error fetching admin.', error: err.message });
  }
};

/**
 * Updates an admin's details.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const updateAdmin = async (req, res) => {
  try {
    // Check if any data is provided for update
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    const updatedBy = req.user.id; // ADDED: Get the ID of the user performing the update
    const affectedRows = await adminModel.updateAdmin(req.params.id, req.body, updatedBy); // UPDATED: Pass updatedBy to the model
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found or no data changed.' });
    }
    res.status(200).json({ success: true, message: 'Admin updated successfully.' });
  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(500).json({ success: false, message: 'Server error updating admin.', error: err.message });
  }
};

/**
 * Deletes an admin.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const deleteAdmin = async (req, res) => {
  try {
    const updatedBy = req.user.id; // ADDED: Get the ID of the user performing the delete
    const affectedRows = await adminModel.deleteAdmin(req.params.id, updatedBy); // UPDATED: Pass updatedBy to the model
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.status(200).json({ success: true, message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ success: false, message: 'Server error deleting admin.', error: err.message });
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
