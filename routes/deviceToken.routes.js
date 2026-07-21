const express = require("express");
const router = express.Router();

const {
  verifyToken,
} = require("../middleware/auth");

const deviceTokenController =
  require("../controllers/deviceToken.controller");

router.post(
  "/device-token",
  verifyToken,
  deviceTokenController.saveToken,
);

router.delete(
  "/device-token",
  verifyToken,
  deviceTokenController.deleteToken,
);

module.exports = router;