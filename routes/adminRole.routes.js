const express = require('express');
const router = express.Router();
const roleController = require('../controllers/adminRole.controller');

// Route to get all users by role name.
router.get(
    '/users/:roleName',
    roleController.getUsersByRole
);

// Route to get a single user by ID.
router.get(
    '/users/id/:userId',
    roleController.getUserById
);

// Route to update a user by ID.
router.put(
    '/users/id/:userId',
    roleController.updateUser
);

// Route to delete a user by ID.
router.delete(
    '/users/id/:userId',
    roleController.deleteUser
);

module.exports = router;