// models/communicationSettings.model.js

const db = require("../config/db");

const CommunicationSettings = {

    // =====================================================
    // GET ALL
    // =====================================================

    getAll: async () => {

        const [rows] = await db.query(`

            SELECT

                cs.*,

                p.providerKey,
                p.providerName,
                p.providerType,

                t.name AS templateName

            FROM communication_settings cs

            LEFT JOIN providers p
                ON cs.providerId = p.id

            LEFT JOIN notification_templates t
                ON cs.templateId = t.id

            ORDER BY
                cs.eventType ASC,
                cs.channel ASC

        `);

        return rows;
    },

    // =====================================================
    // GET BY ID
    // =====================================================

    getById: async (id) => {

        const [rows] = await db.query(`

            SELECT *

            FROM communication_settings

            WHERE id = ?

            LIMIT 1

        `, [id]);

        return rows[0] || null;
    },

    // =====================================================
    // SEND-TIME QUERY
    // =====================================================

    getEnabledForEvent: async (eventType) => {

        const [rows] = await db.query(`

            SELECT

                cs.*,

                p.providerKey,
                p.providerName,
                p.providerType

            FROM communication_settings cs

            LEFT JOIN providers p
                ON cs.providerId = p.id

            WHERE
                cs.eventType = ?
                AND cs.enabled = 1

            ORDER BY
                p.priority ASC

        `, [eventType]);

        return rows;
    },

    // =====================================================
    // CREATE
    // =====================================================

    create: async ({
        eventType,
        channel,
        enabled = 1,
        providerId = null,
        templateId = null,
    }) => {

        const [result] = await db.query(`

            INSERT INTO communication_settings (

                eventType,
                channel,
                enabled,
                providerId,
                templateId

            )

            VALUES (?, ?, ?, ?, ?)

        `, [
            eventType,
            channel,
            enabled,
            providerId,
            templateId,
        ]);

        return {
            id: result.insertId,
        };
    },

    // =====================================================
    // UPDATE
    // =====================================================

    update: async (id, fields) => {

        const allowed = [
            "eventType",
            "channel",
            "enabled",
            "providerId",
            "templateId",
        ];

        const setClauses = [];
        const values = [];

        for (const key of allowed) {

            if (fields[key] !== undefined) {

                setClauses.push(`${key} = ?`);

                values.push(fields[key]);
            }
        }

        if (setClauses.length === 0) {

            return {
                affectedRows: 0,
            };
        }

        values.push(id);

        const [result] = await db.query(`

            UPDATE communication_settings

            SET ${setClauses.join(", ")}

            WHERE id = ?

        `, values);

        return {
            affectedRows: result.affectedRows,
        };
    },

    // =====================================================
    // DELETE
    // =====================================================

    remove: async (id) => {

        const [result] = await db.query(`

            DELETE FROM communication_settings

            WHERE id = ?

        `, [id]);

        return {
            affectedRows: result.affectedRows,
        };
    },
};

module.exports = CommunicationSettings;