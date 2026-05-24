// controllers/permission.controller.js

const PermissionModel = require('../models/permission.model');

exports.getPermissions = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const data = await PermissionModel.getUserPermissions(userId);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('PermissionController error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};