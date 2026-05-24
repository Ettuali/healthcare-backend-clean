const RolePermission = require("../models/rolePermission.model");

// ==========================
// GET ROLE PERMISSIONS
// ==========================
const getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: "Role ID is required"
      });
    }

    const permissions = await RolePermission.getRolePermissions(roleId);

    res.json({
      success: true,
      message: "Role permissions fetched successfully",
      data: permissions,
      count: permissions.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// GET ALL PERMISSIONS
// ==========================
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await RolePermission.getAllPermissions();

    res.json({
      success: true,
      data: permissions,
      count: permissions.length
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// TOGGLE PERMISSION (CORE)
// ==========================
const togglePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      return res.status(400).json({
        success: false,
        message: "roleId and permissionId are required"
      });
    }

    const existing = await RolePermission.checkPermission(roleId, permissionId);

    // 🔥 FIXED CONDITION
    if (existing && existing.id) {
      await RolePermission.removePermission(roleId, permissionId);

      return res.json({
        success: true,
        message: "Permission removed"
      });
    }

    await RolePermission.assignPermission(roleId, permissionId);

    return res.json({
      success: true,
      message: "Permission added"
    });

  } catch (err) {
    console.error("Toggle error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// PERMISSION MATRIX (FRONTEND)
// ==========================
const getPermissionMatrix = async (req, res) => {
  try {
    const allPermissions = await RolePermission.getAllPermissions();
    const rows = await RolePermission.getRolePermissionMatrix();

    const roleMap = {};

    rows.forEach(row => {
      if (!roleMap[row.roleId]) {
        roleMap[row.roleId] = {
          roleId: row.roleId,
          roleName: row.roleName,
          permissions: []
        };
      }

      if (row.permissionName) {
        roleMap[row.roleId].permissions.push(row.permissionName);
      }
    });

    res.json({
      success: true,
      data: {
        roles: Object.values(roleMap),
        allPermissions: allPermissions.map(p => ({
          id: p.id,
          name: p.permissionName
        }))
      }
    });

  } catch (err) {
    console.error("Matrix error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// EXPORT ONLY WHAT YOU NEED
// ==========================
module.exports = {
  getRolePermissions,
  getAllPermissions,
  togglePermission,
  getPermissionMatrix
};