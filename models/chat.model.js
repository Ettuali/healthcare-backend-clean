// models/chat.model.js
const db = require("../config/db");

/**
 * Helper to format current local time for MySQL DATETIME.
 * This returns YYYY-MM-DD HH:mm:ss for Asia/Kolkata.
 */
function getLocalTimeString(timeZone = "Asia/Kolkata") {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  const h = parts.find(p => p.type === "hour").value;
  const min = parts.find(p => p.type === "minute").value;
  const s = parts.find(p => p.type === "second").value;
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

module.exports = class Chats {
  /**
   * Represents a chat message.
   * @param {number} sender_id - The ID of the user who sent the message.
   * @param {number} receiver_id - The ID of the user who received the message.
   * @param {string} message - The content of the message.
   * @param {boolean} delivered - The delivery status of the message.
   */
  constructor(sender_id, receiver_id, message, delivered) {
    this.sender_id = sender_id;
    this.receiver_id = receiver_id;
    this.message = message;
    this.delivered = delivered;
  }

  /**
   * Inserts a new message into the database.
   * @param {object} data - An object containing message data.
   * @param {number} data.sender_id - The sender's ID.
   * @param {number} data.receiver_id - The receiver's ID.
   * @param {string} data.message - The message content.
   * @param {boolean} data.delivered - The message delivery status.
   * @returns {Promise<object>} The database result object.
   */
  static async InsertMsg(data) {
    // get Asia/Kolkata local time instead of UTC
    const currentTime = getLocalTimeString();

    try {
      const result = await db.query(
        `INSERT INTO messages(sender_id, receiver_id, message, delivered, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.sender_id,
          data.receiver_id,
          data.message,
          data.delivered,
          currentTime,
        ]
      );
      return result;
    } catch (error) {
      console.error("Error inserting message:", error);
      throw error;
    }
  }

  /**
   * Retrieves all messages between two users from the database.
   * @param {number} senderId - The ID of one user.
   * @param {number} receiverId - The ID of the other user.
   * @returns {Promise<Array<object>>} An array of message objects.
   */
  static async GetMsgs(senderId, receiverId) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM messages
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at ASC`,
        [senderId, receiverId, receiverId, senderId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
  }

  /**
   * Updates the delivery status of a specific message.
   * @param {number} messageId - The ID of the message to update.
   * @param {boolean} delivered - The new delivery status.
   * @returns {Promise<object>} The database result object.
   */
  static async UpdateMsgStatus(messageId, delivered) {
    try {
      const result = await db.query(
        "UPDATE messages SET delivered = ? WHERE id = ?",
        [delivered, messageId]
      );
      return result;
    } catch (error) {
      console.error("Error updating message status:", error);
      throw error;
    }
  }
/**
 * Marks all unread messages as read.
 */
static async markRead(senderId, receiverId) {
  try {
    const [result] = await db.query(
      `
      UPDATE messages
      SET \`read\` = 1
      WHERE sender_id = ?
        AND receiver_id = ?
        AND \`read\` = 0
      `,
      [senderId, receiverId]
    );

    return result;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}
static async getUnreadCount(userId) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        sender_id,
        COUNT(*) AS unreadCount
      FROM messages
      WHERE receiver_id = ?
      AND \`read\` = 0
      GROUP BY sender_id
      `,
      [userId]
    );

    return rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
};

