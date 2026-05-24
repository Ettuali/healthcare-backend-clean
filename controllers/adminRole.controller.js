const roleModel = require('../models/adminrole.model');

/**
 * Controller function to get a list of users by their role.
 * @param {object} req The request object.
 * @param {object} res The response object.
 */
const getUsersByRole = async (req, res) => {
    try {
        const { roleName } = req.params;
        if (!roleName) {
            return res.status(400).json({ success: false, message: 'roleName is required.' });
        }
        
        const validRoles = ['admin', 'hospital', 'doctor', 'nurse', 'patient'];
        if (!validRoles.includes(roleName.toLowerCase())) {
            return res.status(400).json({ success: false, message: `Invalid role: ${roleName}` });
        }

        const users = await roleModel.getUsersByRole(roleName.toLowerCase());
        
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: `No users found with role: ${roleName}` });
        }
        
        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error(`Error fetching users by role ${req.params.roleName}:`, err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

/**
 * Controller function to get a single user by ID.
 * @param {object} req The request object.
 * @param {object} res The response object.
 */
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await roleModel.getUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({ success: true, user });
    } catch (err) {
        console.error(`Error fetching user with ID ${req.params.userId}:`, err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

/**
 * Controller function to update a single user by ID.
 * @param {object} req The request object.
 * @param {object} res The response object.
 */
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = req.body;
        
        if (Object.keys(userData).length === 0) {
            return res.status(400).json({ success: false, message: 'No data provided for update.' });
        }

        const affectedRows = await roleModel.updateUser(userId, userData);

        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found or no changes made.' });
        }

        res.status(200).json({ success: true, message: 'User updated successfully.' });
    } catch (err) {
        console.error(`Error updating user with ID ${req.params.userId}:`, err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

/**
 * Controller function to delete a single user by ID.
 * @param {object} req The request object.
 * @param {object} res The response object.
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const affectedRows = await roleModel.deleteUser(userId);

        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
        console.error(`Error deleting user with ID ${req.params.userId}:`, err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

module.exports = {
    getUsersByRole,
    getUserById,
    updateUser,
    deleteUser
};