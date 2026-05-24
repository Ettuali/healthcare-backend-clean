// models/template.model.js
const db = require("../config/db");

const Template = {
    getAll: async () => {
        const [rows] = await db.query(`SELECT * FROM notification_templates ORDER BY type, channel`);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(`SELECT * FROM notification_templates WHERE id = ?`, [id]);
        return rows[0] || null;
    },

    getByTypeAndChannel: async (type, channel) => {
        const [rows] = await db.query(
            `SELECT * FROM notification_templates
             WHERE type = ? AND channel = ? AND isActive = 1 LIMIT 1`,
            [type, channel]
        );
        return rows[0] || null;
    },

    create: async ({ name, type, channel, subject = null, body, isActive = 1 }) => {
        const [result] = await db.query(
            `INSERT INTO notification_templates (name, type, channel, subject, body, isActive)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, type, channel, subject, body, isActive]
        );
        return { id: result.insertId };
    },

    update: async (id, fields) => {
        const allowed = ["name", "type", "channel", "subject", "body", "isActive"];
        const setClauses = [];
        const values = [];
        for (const key of allowed) {
            if (fields[key] !== undefined) {
                setClauses.push(`${key} = ?`);
                values.push(fields[key]);
            }
        }
        if (setClauses.length === 0) return { affectedRows: 0 };
        values.push(id);
        const [result] = await db.query(`UPDATE notification_templates SET ${setClauses.join(", ")} WHERE id = ?`, values);
        return { affectedRows: result.affectedRows };
    },

    remove: async (id) => {
        const [result] = await db.query(`DELETE FROM notification_templates WHERE id = ?`, [id]);
        return { affectedRows: result.affectedRows };
    },
};

module.exports = Template;