// D:\Day2Day\dayday-backend\models\notification.model.js

const db = require("../config/db");

const Notification = {

  create: async ({
    userId,
    title,
    message,
    type = "system",
    channel,
    referenceId = null,
    referenceType = null,
    status = "pending",
    metadata = null,
  }) => {
    if (!userId || !channel) {
      throw new Error("Notification.create requires userId and channel");
    }

    const [result] = await db.query(
      `INSERT INTO notifications
       (userId, title, message, type, channel, referenceId, referenceType, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        message,
        type,
        channel,
        referenceId,
        referenceType,
        status,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return { id: result.insertId };
  },

  updateStatus: async (id, status) => {
    const [result] = await db.query(
      `UPDATE notifications SET status = ? WHERE id = ?`,
      [status, id]
    );
    return { affectedRows: result.affectedRows };
  },

  listForUser: async (
    userId,
    { page = 0, limit = 20, onlyUnread = false, channel = "inapp" } = {}
  ) => {
    const offset = page * limit;
    const conditions = ["userId = ?", "channel = ?"];
    const values = [userId, channel];

    if (onlyUnread) conditions.push("isRead = 0");

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS totalCount FROM notifications ${where}`,
      values
    );

    // CHANGED: Replaced query to use hardcoded values instead of dynamic placeholders
    const [rows] = await db.query(
      `SELECT
          id,
          userId,
          title,
          message,
          type,
          channel,
          referenceId,
          referenceType,
          status,
          metadata,
          isRead,
          readAt,
          createdOn
       FROM notifications
       ${where}
       ORDER BY createdOn DESC
       LIMIT 20 OFFSET 0`,
      values
    );

    return {
      data: rows.map((r) => ({
        ...r,
        metadata:
          typeof r.metadata === "string"
            ? JSON.parse(r.metadata)
            : r.metadata,
      })),
      totalCount: countRows[0].totalCount,
    };
  },

  unreadCount: async (userId, channel = "inapp") => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS unread
       FROM notifications
       WHERE userId = ? AND channel = ? AND isRead = 0`,
      [userId, channel]
    );
    return rows[0].unread;
  },

  markAsRead: async (id, userId) => {
    const [result] = await db.query(
      `UPDATE notifications
       SET isRead = 1, readAt = NOW()
       WHERE id = ? AND userId = ? AND isRead = 0`,
      [id, userId]
    );
    return { affectedRows: result.affectedRows };
  },

  markAllAsRead: async (userId) => {
    const [result] = await db.query(
      `UPDATE notifications
       SET isRead = 1, readAt = NOW()
       WHERE userId = ? AND isRead = 0 AND channel = 'inapp'`,
      [userId]
    );
    return { affectedRows: result.affectedRows };
  },

  getDeliveryLogs: async ({ page = 0, limit = 20, channel = null, status = null, eventType = null } = {}) => {
    const offset = page * limit;
    const conditions = [];
    const values = [];

    if (channel)   { conditions.push("n.channel = ?"); values.push(channel); }
    if (status)    { conditions.push("n.status = ?");  values.push(status); }
    if (eventType) { conditions.push("n.type = ?");    values.push(eventType); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS totalCount FROM notifications n ${where}`,
      values
    );

    const [rows] = await db.query(
      `SELECT n.id, n.userId, u.name AS userName, n.type AS eventType,
              n.channel, n.status, n.title, n.referenceType, n.referenceId,
              n.isRead, n.createdOn
       FROM notifications n
       LEFT JOIN user u ON n.userId = u.id
       ${where}
       ORDER BY n.createdOn DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return { data: rows, totalCount: countRows[0].totalCount };
  },
};

module.exports = Notification;