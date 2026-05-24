const Role = require("../models/role.model");

// Create a new role (MUST be lowercase)
const createRole = async (req, res) => {
  try {
    const { roleName, description, createdBy } = req.body;

    // Validation
    if (!roleName || !createdBy) {
      return res.status(400).json({
        success: false,
        message: "Role name and createdBy are required"
      });
    }

    // Check if role already exists
    const existingRole = await Role.getRoleByName(roleName);
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: `Role '${roleName}' already exists`
      });
    }

    const roleId = await Role.addRole(roleName, description, createdBy);
    
    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: {
        roleId,
        roleName: roleName.toLowerCase(),
        description: description || null
      }
    });
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: err.message
    });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.getAllRoles();
    
    res.status(200).json({
      success: true,
      message: "Roles fetched successfully",
      data: roles,
      count: roles.length
    });
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
      error: err.message
    });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: "Role ID is required"
      });
    }

    const role = await Role.getRoleById(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Role fetched successfully",
      data: role
    });
  } catch (err) {
    console.error("Error fetching role:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch role",
      error: err.message
    });
  }
};

// Get role by name
const getRoleByName = async (req, res) => {
  try {
    const { roleName } = req.params;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "Role name is required"
      });
    }

    const role = await Role.getRoleByName(roleName);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role '${roleName}' not found`
      });
    }

    res.status(200).json({
      success: true,
      message: "Role fetched successfully",
      data: role
    });
  } catch (err) {
    console.error("Error fetching role:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch role",
      error: err.message
    });
  }
};

// Update a role
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { roleName, description, updatedBy } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: "Role ID is required"
      });
    }

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "Role name is required"
      });
    }

    const result = await Role.updateRole(roleId, roleName, description, updatedBy);

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: {
        roleId,
        roleName: roleName.toLowerCase(),
        description: description || null
      }
    });
  } catch (err) {
    if (err.message === 'Role not found') {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }
    
    console.error("Error updating role:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: err.message
    });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: "Role ID is required"
      });
    }

    const deleted = await Role.deleteRole(roleId);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: "Role deleted successfully",
        data: { deletedRoleId: roleId }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }
  } catch (err) {
    if (err.message.includes('Cannot delete role')) {
      return res.status(409).json({
        success: false,
        message: err.message
      });
    }

    console.error("Error deleting role:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete role",
      error: err.message
    });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  getRoleByName,
  updateRole,
  deleteRole
};