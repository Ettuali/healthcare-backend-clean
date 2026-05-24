const UserRole = require("../models/userRole.model");

// Assign role to user
const assignRoleToUser = async (req, res) => {
  const { userId, roleId } = req.body;

  try {
    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "userId and roleId are required"
      });
    }

    const id = await UserRole.assignRoleToUser(userId, roleId);

    res.status(201).json({
      success: true,
      message: "Role assigned successfully",
      data: { id, userId, roleId }
    });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "User already has this role"
      });
    }

    console.error("Assign Role Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to assign role"
    });
  }
};

// Get roles of user
const getUserRoles = async (req, res) => {
  const { userId } = req.params;

  try {
    const roles = await UserRole.getUserRoles(userId);

    res.status(200).json({
      success: true,
      data: roles,
      count: roles.length
    });

  } catch (err) {
    console.error("Get User Roles Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user roles"
    });
  }
};

module.exports = {
  assignRoleToUser,
  getUserRoles
};