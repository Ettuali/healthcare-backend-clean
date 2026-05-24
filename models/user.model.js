// D:\Backend\day2day-backend\models\user.model.js

const db = require("../config/db");

const User = {

    /**
     * Fetch contact info needed for the notification dispatcher.
     * Used by sendAlert.controller to email/SMS/WhatsApp/inapp the recipient.
     *
     * Note: This is intentionally narrow. Heavier user queries already live in
     * userManagement.model.js / userPatient.model.js. Long-term, this method
     * can move into one of those — the controller import path is the only thing
     * that would need to change.
     */
    getContactById: async (id) => {
        const [rows] = await db.query(
            `SELECT id, name, email, phone FROM user WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    },
};

module.exports = User;