const express = require("express");
const router = express.Router();
const controller = require("../controllers/call.controller");
const { verifyToken } = require("../middleware/auth");

router.post("/create", verifyToken, controller.createCall);
router.post("/join", verifyToken, controller.joinCall);
router.post("/leave", verifyToken, controller.leaveCall);
router.post("/end", verifyToken, controller.endCall);

module.exports = router;