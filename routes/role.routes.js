const express = require("express");
const router = express.Router();

const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole
} = require("../controllers/role.controller");

// Create role
router.post("/", createRole);

// Get all roles
router.get("/", getAllRoles);

// Get role by ID
router.get("/:roleId", getRoleById);

// Update role
router.put("/:roleId", updateRole);

// Delete role
router.delete("/:roleId", deleteRole);

module.exports = router;