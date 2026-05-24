  const bcrypt = require("bcrypt");
  const hospitalAdminModel = require("../models/hospitalAdmin.model");

  // Assuming roleId for hospital is 1, based on your database schema
  const HOSPITAL_ROLE_ID = 1;

  /**
   * Handles the single API call to create a new hospital and its associated admin user.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  const addHospitalWithAdmin = async (req, res) => {
    try {
      const {
        name,
        registrationNumber,
        address,
        contactNumber,
        email,
        city,
        state,
        zipcode,
        password, // New: Get the password from the UI
      } = req.body;

      // Validate required fields, now including the password
      if (!name || !registrationNumber || !address || !contactNumber || !email || !city || !state || !zipcode || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for hospital and user creation.',
        });
      }

      const userLocation = `${city}, ${state}`;

      // Hash the password securely before saving it to the database
      const hashedPassword = await bcrypt.hash(password, 10);

      // 1. Create the hospital using the model
      const hospitalId = await hospitalAdminModel.insertHospital(
        name,
        registrationNumber,
        address,
        contactNumber,
        email,
        zipcode
      );

      // 2. Create the user using the model, passing the hashed password
      const userId = await hospitalAdminModel.insertUser(
        name,
        contactNumber,
        email,
        hashedPassword, // Use the hashed password from the UI
        userLocation,
        req.body.createdBy || null
      );

      // 3. Assign the hospital role (roleId: 1) to the user
      await hospitalAdminModel.assignRoleToUser(userId, HOSPITAL_ROLE_ID);

      // 4. Assign the hospital to the user
      await hospitalAdminModel.insertAssignment(userId, hospitalId);

      res.status(201).json({
        success: true,
        message: 'Hospital and new user created and assigned successfully.',
        hospitalId,
        userId,
      });
    } catch (err) {
      console.error('Combined operation error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error during hospital and user creation.',
      });
    }
  };

  module.exports = {
    addHospitalWithAdmin,
  };