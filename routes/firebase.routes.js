const express = require("express");
const router = express.Router();

const {
  sendPushNotification,
} = require("../services/firebase.service");

router.post("/test-push", async (req, res) => {
  try {
    const { token } = req.body;

    await sendPushNotification({
      token,
      title: "D2D Healthcare",
      body: "Firebase test notification",
      data: {
        type: "test",
      },
    });

    res.json({
      success: true,
      message: "Notification sent",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;