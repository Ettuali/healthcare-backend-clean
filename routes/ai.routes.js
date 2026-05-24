const express = require("express");
const router = express.Router();

const { healthChat } = require("../controllers/ai.controller");
const { verifyToken } = require("../middleware/auth"); 

router.post("/health-chat", verifyToken, healthChat);

module.exports = router;