const db = require("../config/db");

class Call {
  // =========================
  // ✅ CREATE CALL
  // =========================
  static async create() {
    const [result] = await db.query(
      `INSERT INTO calls (call_type, status)
       VALUES ('audio', 'ringing')`
    );

    return result.insertId;
  }

  // =========================
  // ✅ ADD PARTICIPANTS (SAFE)
  // =========================
  static async addParticipants(callId, participants = []) {
    // Deduplicate the array of participant IDs
    const uniqueParticipants = [...new Set(participants)];

    for (let userId of uniqueParticipants) {
      if (!userId) continue;

      await db.query(
        `INSERT IGNORE INTO call_participants (call_id, user_id, status)
         VALUES (?, ?, 'ringing')`,
        [callId, userId]
      );
    }
  }

  // =========================
  // ✅ JOIN CALL
  // =========================
  static async join(callId, userId) {
    return db.query(
      `UPDATE call_participants
       SET status = 'joined', joined_at = NOW()
       WHERE call_id = ? AND user_id = ?`,
      [callId, userId]
    );
  }

  // =========================
  // ✅ LEAVE CALL
  // =========================
  static async leave(callId, userId) {
    return db.query(
      `UPDATE call_participants
       SET status = 'left', left_at = NOW()
       WHERE call_id = ? AND user_id = ?`,
      [callId, userId]
    );
  }

  // =========================
  // ✅ END CALL
  // =========================
  static async end(callId) {
    return db.query(
      `UPDATE calls
       SET status = 'ended', ended_at = NOW()
       WHERE id = ?`,
      [callId]
    );
  }
}

module.exports = Call;