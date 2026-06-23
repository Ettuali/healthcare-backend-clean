const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

// POST route to send a new message
router.post("/chats", chatController.sendMsg);

// GET route to retrieve messages between two users
router.get("/chats/:senderId/:receiverId", chatController.getMsgs);

// PUT route to update the delivery status of a message
router.put("/chats/:messageId/status", chatController.updateMsgStatus);
// chat.routes.js
router.get("/decode/:encryptedId", chatController.decodeUserId);

router.post(
  "/mark-read",
  chatController.markRead
);
router.get(
  "/unread-counts/:userId",
  chatController.getUnreadCounts
);

module.exports = router;
