const express = require("express");
const router = express.Router();
const rolePermissionController = require("../controllers/rolePermission.controller");

// GET /api/rolepermissions/:roleId - Fetches all permissions for a specific role
router.get("/role/:roleId", rolePermissionController.getRolePermissions);

router.get("/matrix", rolePermissionController.getPermissionMatrix);

// POST /api/rolepermissions/toggle - Toggles a permission for a role (assigns or revokes)
router.post("/toggle", rolePermissionController.togglePermission);

module.exports = router;
