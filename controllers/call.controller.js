const Call = require("../models/call.model");
const DeviceToken = require("../models/deviceToken.model");
const { getContactById } = require("../models/user.model");
const {
  sendIncomingCallNotification,
} = require("../services/firebase.service");

// =========================
// ✅ CREATE CALL
// =========================
const createCall = async (req, res) => {
  try {
    const { participants, receiver_id } = req.body;

    // Validate that participants array exists and is not empty
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Participants required",
      });
    }

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "receiver_id required",
      });
    }

    // Sanitize participants array (ensure integers)
    const users = participants.filter(Boolean).map(Number);

    // Validate receiver belongs to this call before any DB or FCM work
    if (!users.includes(Number(receiver_id))) {
      return res.status(400).json({
        success: false,
        message: "receiver_id must be one of the call participants",
      });
    }

    // DB inserts using the new array format
    const callId = await Call.create();
    await Call.addParticipants(callId, participants);

    // ─── Caller identity from JWT ──────────────────────────────────
    // req.user.id is the real decrypted integer DB id set by verifyToken.
    // Flutter does not send caller_id or caller_name.
    const callerId = req.user.id;

    // Reusing existing model method that safely resolves the profile data.
    const callerUser = await getContactById(callerId);
    const callerName = callerUser?.name ?? "Unknown";

    // ─── FCM fan-out to receiver ───────────────────────────────────
    let tokens = [];

    try {
      const rows = await DeviceToken.getTokens(receiver_id);
      tokens = rows.map((r) => r.fcm_token).filter(Boolean);
    } catch (tokenErr) {
      console.error(
        "[CALL FCM] Failed to fetch device tokens:",
        tokenErr.message
      );
    }

    if (tokens.length === 0) {
      console.log(
        `[CALL FCM] No device tokens for receiver ${receiver_id} — FCM skipped`
      );
      return res.json({ success: true, callId });
    }

    // Send to each token independently.
    // One expired or invalid token does not cancel remaining sends.
    for (const token of tokens) {
      try {
        await sendIncomingCallNotification({
          token,
          callId,
          callerId,
          callerName,
          receiverId: receiver_id,
        });

        console.log(
          `[CALL FCM] ✅ Sent to token: ${token.slice(0, 20)}...`
        );
      } catch (fcmErr) {
        console.error(
          `[CALL FCM] ❌ Failed for token ${token.slice(0, 20)}...:`,
          fcmErr.message
        );
      }
    }

    return res.json({ success: true, callId });

  } catch (err) {
    console.error("[CALL CREATE ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create call",
    });
  }
};

// =========================
// ✅ JOIN CALL — unchanged
// =========================
const joinCall = async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "call_id & user_id required",
      });
    }

    await Call.join(call_id, user_id);

    return res.json({ success: true });
  } catch (err) {
    console.error("[CALL JOIN ERROR]", err);
    return res.status(500).json({ success: false });
  }
};

// =========================
// ✅ LEAVE CALL — unchanged
// =========================
const leaveCall = async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "call_id & user_id required",
      });
    }

    await Call.leave(call_id, user_id);

    return res.json({ success: true });
  } catch (err) {
    console.error("[CALL LEAVE ERROR]", err);
    return res.status(500).json({ success: false });
  }
};

// =========================
// ✅ END CALL — unchanged
// =========================
const endCall = async (req, res) => {
  try {
    const { call_id } = req.body;

    if (!call_id) {
      return res.status(400).json({
        success: false,
        message: "call_id required",
      });
    }

    await Call.end(call_id);

    return res.json({ success: true });
  } catch (err) {
    console.error("[CALL END ERROR]", err);
    return res.status(500).json({ success: false });
  }
};

module.exports = {
  createCall,
  joinCall,
  leaveCall,
  endCall,
};