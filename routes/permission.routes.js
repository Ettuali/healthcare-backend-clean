// routes/permissionRoutes.js

const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/permission.controller'); // Adjust path

// The route to get permissions based on a user ID sent in the request body.
router.post('/permissions', PermissionController.getPermissions);

module.exports = router;