const hospitalUserModel = require("../models/hospitalUser.model")


// The constant for the hospital role ID
const HOSPITAL_ROLE_ID = 1;

/**
 * Handles the API call to fetch all users who have the hospital role.
 * This is a GET request and does not require a body.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
const getHospitalUsers = async (req, res) => {
  try {
    // Call the model function to get users with the hospital role
    const users = await hospitalUserModel.getHospitalUsers(HOSPITAL_ROLE_ID);

    if (users.length === 0) {
      // If no users are found, return a 404 Not Found response
      return res.status(404).json({
        success: true,
        message: 'No hospital users found.',
        hospitals: [], // Using 'hospitals' key to match frontend expectation
      });
    }

    // On success, return a 200 OK response with the hospital user data
    res.status(200).json({
      success: true,
      message: 'Hospital users fetched successfully.',
      hospitals: users, // Key change: sending the data under the 'hospitals' key
    });
  } catch (err) {
    // Log the error for debugging and send a 500 Server Error response
    console.error('Error fetching hospital users:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hospital users.',
    });
  }
};

module.exports = {
  getHospitalUsers,
};