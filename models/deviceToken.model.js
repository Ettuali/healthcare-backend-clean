const db = require("../config/db");

class DeviceToken {
  static async saveToken(userId, token, platform = "android") {
    const [existing] = await db.query(
      `
      SELECT id
      FROM user_device_tokens
      WHERE user_id = ?
      AND fcm_token = ?
      `,
      [userId, token]
    );

    if (existing.length > 0) {
      return existing[0];
    }

    const [result] = await db.query(
      `
      INSERT INTO user_device_tokens
      (
        user_id,
        fcm_token,
        platform
      )
      VALUES (?, ?, ?)
      `,
      [userId, token, platform]
    );

    return result;
  }

  static async removeToken(userId, token) {
    const [result] = await db.query(
      `
      DELETE FROM user_device_tokens
      WHERE user_id = ?
      AND fcm_token = ?
      `,
      [userId, token]
    );

    return result;
  }

  static async getTokens(userId) {
    const [rows] = await db.query(
      `
      SELECT fcm_token
      FROM user_device_tokens
      WHERE user_id = ?
      `,
      [userId]
    );

    return rows;
  }
}

module.exports = DeviceToken;