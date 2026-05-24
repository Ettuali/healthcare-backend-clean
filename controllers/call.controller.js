const Call = require("../models/call.model");

// =========================
// ✅ CREATE CALL
// =========================
const createCall = async (req, res) => {
  try {
    const { doctor_id, patient_id, caretaker_id } = req.body;

    // ❌ basic validation
    if (!doctor_id && !patient_id && !caretaker_id) {
      return res.status(400).json({ success: false, message: "Participants required" });
    }

    // ✅ create call
    const callId = await Call.create();

    // ✅ collect users safely
    const users = [doctor_id, patient_id, caretaker_id].filter(Boolean);

    await Call.addParticipants(callId, users);

    return res.json({ success: true, callId });

  } catch (err) {
    console.error("[CALL CREATE ERROR]", err);
    return res.status(500).json({ success: false, message: "Failed to create call" });
  }
};

// =========================
// ✅ JOIN CALL
// =========================
const joinCall = async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({ success: false, message: "call_id & user_id required" });
    }

    await Call.join(call_id, user_id);

    return res.json({ success: true });

  } catch (err) {
    console.error("[CALL JOIN ERROR]", err);
    return res.status(500).json({ success: false });
  }
};

// =========================
// ✅ LEAVE CALL
// =========================
const leaveCall = async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({ success: false, message: "call_id & user_id required" });
    }

    await Call.leave(call_id, user_id);

    return res.json({ success: true });

  } catch (err) {
    console.error("[CALL LEAVE ERROR]", err);
    return res.status(500).json({ success: false });
  }
};

// =========================
// ✅ END CALL
// =========================
const endCall = async (req, res) => {
  try {
    const { call_id } = req.body;

    if (!call_id) {
      return res.status(400).json({ success: false, message: "call_id required" });
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