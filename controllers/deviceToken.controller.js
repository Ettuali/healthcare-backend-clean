const DeviceToken = require("../models/deviceToken.model");

const saveToken = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const token = req.body.token?.trim();
    const platform = req.body.platform;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "token is required",
      });
    }

    const supportedPlatforms = new Set([
      "android",
      "ios",
      "web",
    ]);

    const normalizedPlatform = platform?.toLowerCase();

    const safePlatform = supportedPlatforms.has(
      normalizedPlatform,
    )
      ? normalizedPlatform
      : "android";

    await DeviceToken.saveToken(
      userId,
      token,
      safePlatform,
    );

    return res.json({
      success: true,
      message: "Token saved successfully",
    });
  } catch (err) {
    console.error("Device token error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteToken = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const token = req.body.token?.trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "token is required",
      });
    }

    await DeviceToken.removeToken(
      userId,
      token,
    );

    return res.json({
      success: true,
      message: "Token removed successfully",
    });
  } catch (err) {
    console.error("Delete device token error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  saveToken,
  deleteToken,
};