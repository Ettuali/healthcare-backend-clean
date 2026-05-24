const express = require("express");
const router = express.Router();
const controller = require("../controllers/call.controller");

router.post("/create", controller.createCall);
router.post("/join", controller.joinCall);
router.post("/leave", controller.leaveCall);
router.post("/end", controller.endCall);

module.exports = router;