const Chats = require("../models/chat.model");
const cryptoService = require("../services/crypto.service");

// A simple in-memory store for online users.
const onlineUsers = new Map();

/**
 * Manages the list of online users.
 * This function is meant to be called by your WebSocket logic in server.js.
 * @param {string} userId - The ID of the user.
 * @param {boolean} isOnline - True if the user is coming online, false if offline.
 */
const setOnlineUsers = (userId, isOnline) => {
  if (isOnline) {
    onlineUsers.set(userId, true);
    console.log(`User ${userId} is now online. Total online users: ${onlineUsers.size}`);
  } else {
    onlineUsers.delete(userId);
    console.log(`User ${userId} is now offline. Total online users: ${onlineUsers.size}`);
  }
};

//  Send a new message
const sendMsg = async (req, res) => {
  console.log("\n--- [API] 📩 POST /api/communication/chats ---");
  try {
    const { sender_id, receiver_id, message, delivered } = req.body;
    console.log("1. Received Request Body:", req.body);

    if (!sender_id || !receiver_id || !message) {
      console.warn("   - ❌ Validation Failed: Missing required fields.");
      return res.status(400).json({
        success: false,
        message: "sender_id, receiver_id, and message are required",
      });
    }

    // This robust logic handles both encrypted strings and plain numbers.
    let processedSenderId;
    let processedReceiverId;

    console.log("2. Processing IDs...");
    try {
      processedSenderId = parseInt(sender_id, 10);
      if (isNaN(processedSenderId)) {
        const decryptedId = await cryptoService.decrypt(sender_id, "authentication");
        processedSenderId = parseInt(decryptedId, 10);
      }
    } catch (err) {
      console.error("   - ❌ Invalid Sender ID:", sender_id);
      return res.status(400).json({ success: false, message: "Invalid sender ID" });
    }

    try {
      processedReceiverId = parseInt(receiver_id, 10);
      if (isNaN(processedReceiverId)) {
        const decryptedId = await cryptoService.decrypt(receiver_id, "authentication");
        processedReceiverId = parseInt(decryptedId, 10);
      }
    } catch (err) {
      console.error("   - ❌ Invalid Receiver ID:", receiver_id);
      return res.status(400).json({ success: false, message: "Invalid receiver ID" });
    }
    
    console.log(`   - Sender: ${sender_id} -> ${processedSenderId}`);
    console.log(`   - Receiver: ${receiver_id} -> ${processedReceiverId}`);

    if (isNaN(processedSenderId) || isNaN(processedReceiverId)) {
      console.warn("   - ❌ Validation Failed: Invalid ID after processing.");
      return res.status(400).json({ success: false, message: "Invalid sender or receiver ID provided." });
    }

    const dbPayload = {
      sender_id: processedSenderId,
      receiver_id: processedReceiverId,
      message,
      delivered: delivered || false,
    };
    
    console.log("3. Inserting into database with payload:", dbPayload);
    const result = await Chats.InsertMsg(dbPayload);

    console.log("4. ✅ SUCCESS: Database insertion result:", result);
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      result: { insertId: result.insertId },
    });

  } catch (err) {
    console.error("   - ❌ SERVER ERROR in sendMsg:", err);
    res.status(500).json({ success: false, message: "Server error while sending message", error: err.message });
  }
};

//  Get messages between two users
const getMsgs = async (req, res) => {
    console.log("\n--- [API] ⬇️ GET /api/communication/chats/:senderId/:receiverId ---");
    try {
        const { senderId, receiverId } = req.params;
        console.log("1. Received URL Params:", req.params);

        let processedSenderId;
        let processedReceiverId;

        console.log("2. Processing IDs...");
        try {
            processedSenderId = parseInt(senderId, 10);
            if (isNaN(processedSenderId)) {
                const decryptedId = await cryptoService.decrypt(senderId, "authentication");
                processedSenderId = parseInt(decryptedId, 10);
            }
        } catch (err) {
            console.error("   - ❌ Invalid Sender ID:", senderId);
            return res.status(400).json({ success: false, message: "Invalid sender ID" });
        }

        try {
            processedReceiverId = parseInt(receiverId, 10);
            if (isNaN(processedReceiverId)) {
                const decryptedId = await cryptoService.decrypt(receiverId, "authentication");
                processedReceiverId = parseInt(decryptedId, 10);
            }
        } catch (err) {
            console.error("   - ❌ Invalid Receiver ID:", receiverId);
            return res.status(400).json({ success: false, message: "Invalid receiver ID" });
        }
        
        console.log(`   - Sender: ${senderId} -> ${processedSenderId}`);
        console.log(`   - Receiver: ${receiverId} -> ${processedReceiverId}`);

        if (isNaN(processedSenderId) || isNaN(processedReceiverId)) {
            console.warn("   - ❌ Validation Failed: Invalid ID in URL.");
            return res.status(400).json({ success: false, message: "Invalid sender or receiver ID provided in URL." });
        }
        
        console.log("3. Fetching from database...");
        const rows = await Chats.GetMsgs(processedSenderId, processedReceiverId);
        
        console.log(`4. ✅ SUCCESS: Found ${rows.length} messages.`);
        res.status(200).json({
            success: true,
            messages: rows,
        });
    } catch (err) {
        console.error("   - ❌ SERVER ERROR in getMsgs:", err);
        res.status(500).json({ success: false, message: "Server error while fetching messages", error: err.message });
    }
};

// Decode an encrypted user ID
const decodeUserId = async (req, res) => {
  console.log(`\n--- [API] 🔐 GET /api/communication/decode/:encryptedId ---`);
  try {
    const { encryptedId } = req.params;
    console.log("1. Received Encrypted ID:", encryptedId);
    
    const decrypted = await cryptoService.decrypt(encryptedId, "authentication");
    const numericalId = parseInt(decrypted, 10);
    
    console.log(`2. ✅ SUCCESS: Decrypted to -> ${numericalId}`);
    res.json({ success: true, id: numericalId });
  } catch (err) {
    console.error("   - ❌ SERVER ERROR in decodeUserId:", err);
    res.status(400).json({ success: false, message: "Invalid encrypted id" });
  }
};

// Update delivery status
const updateMsgStatus = async (req, res) => {
  console.log("\n--- [API] 🔄 PUT /api/communication/chats/:messageId ---");
  try {
    const { messageId } = req.params;
    const { delivered } = req.body;
    console.log("1. Received Params & Body:", { params: req.params, body: req.body });

    if (!messageId) {
      console.warn("   - ❌ Validation Failed: Missing messageId.");
      return res.status(400).json({ success: false, message: "Message ID is required" });
    }

    const messageId_int = parseInt(messageId, 10);
    if (isNaN(messageId_int)) {
      console.warn("   - ❌ Validation Failed: Invalid messageId.");
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }
    
    console.log(`2. Updating message ${messageId_int} status to: ${delivered}`);
    await Chats.UpdateMsgStatus(messageId_int, delivered);

    console.log("3. ✅ SUCCESS: Message status updated.");
    res.status(200).json({
      success: true,
      message: "Message status updated successfully",
    });
  } catch (err) {
    console.error("   - ❌ SERVER ERROR in updateMsgStatus:", err);
    res.status(500).json({ success: false, message: "Server error while updating message status", error: err.message });
  }
};

// =========================
// ✅ MARK MESSAGES AS READ
// =========================
const markRead = async (req, res) => {
  console.log("\n--- [API] 👀 POST /api/communication/mark-read ---");

  try {
    const { senderId, receiverId } = req.body;

    console.log("1. Received Body:", req.body);

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "senderId and receiverId are required",
      });
    }

    let processedSenderId;
    let processedReceiverId;

    try {
      processedSenderId = parseInt(senderId, 10);

      if (isNaN(processedSenderId)) {
        const decrypted = await cryptoService.decrypt(
          senderId,
          "authentication"
        );

        processedSenderId = parseInt(decrypted, 10);
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid senderId",
      });
    }

    try {
      processedReceiverId = parseInt(receiverId, 10);

      if (isNaN(processedReceiverId)) {
        const decrypted = await cryptoService.decrypt(
          receiverId,
          "authentication"
        );

        processedReceiverId = parseInt(decrypted, 10);
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiverId",
      });
    }

    console.log(
      `2. Marking messages as read: ${processedSenderId} -> ${processedReceiverId}`
    );

    const result = await Chats.markRead(
      processedSenderId,
      processedReceiverId
    );

    console.log(
      `3. ✅ SUCCESS: ${result.affectedRows} messages marked as read`
    );

    return res.status(200).json({
      success: true,
      affectedRows: result.affectedRows,
      message: "Messages marked as read",
    });
  } catch (err) {
    console.error("❌ MARK READ ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: err.message,
    });
  }
};
const getUnreadCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    const counts =
      await Chats.getUnreadCount(userId);

    res.json({
      success: true,
      data: counts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
module.exports = {
  sendMsg,
  getMsgs,
  updateMsgStatus,
  setOnlineUsers,
  decodeUserId,
  markRead,
};