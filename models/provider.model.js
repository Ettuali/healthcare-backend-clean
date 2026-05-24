const db = require("../config/db");

const parseJSON = (raw) => {
if (raw == null) return null;

if (typeof raw === "object") {
    return raw;
}

try {
    return JSON.parse(raw);
} catch {
    return null;
}

};

const sanitizeProvider = (row) => {
if (!row) return null;

const secrets = parseJSON(row.secrets) || {};

return {
    ...row,

    config: parseJSON(row.config),

    // NEVER expose secrets
    secrets: undefined,

    // frontend only needs keys
    secretKeys: Object.keys(secrets),
};

};

const Provider = {

// =====================================================
// PUBLIC SAFE METHODS
// =====================================================

getAll: async () => {

    const [rows] = await db.query(`
        SELECT *
        FROM providers
        ORDER BY providerType ASC, priority ASC
    `);

    return rows.map(sanitizeProvider);
},

getById: async (id) => {

    const [rows] = await db.query(`
        SELECT *
        FROM providers
        WHERE id = ?
        LIMIT 1
    `, [id]);

    return sanitizeProvider(rows[0]);
},

// =====================================================
// INTERNAL RAW METHODS
// =====================================================

getRawById: async (id) => {

    const [rows] = await db.query(`
        SELECT *
        FROM providers
        WHERE id = ?
        LIMIT 1
    `, [id]);

    if (!rows[0]) {
        return null;
    }

    return {
        ...rows[0],

        config: parseJSON(rows[0].config),

        secrets: parseJSON(rows[0].secrets) || {},
    };
},

getRawByKey: async (providerKey) => {

    const [rows] = await db.query(`
        SELECT *
        FROM providers
        WHERE providerKey = ?
        LIMIT 1
    `, [providerKey]);

    if (!rows[0]) {
        return null;
    }

    return {
        ...rows[0],

        config: parseJSON(rows[0].config),

        secrets: parseJSON(rows[0].secrets) || {},
    };
},

getDefaultByType: async (providerType) => {

    const [rows] = await db.query(`
        SELECT *
        FROM providers
        WHERE providerType = ?
        AND isActive = 1
        ORDER BY isDefault DESC, priority ASC
        LIMIT 1
    `, [providerType]);

    if (!rows[0]) {
        return null;
    }

    return {
        ...rows[0],

        config: parseJSON(rows[0].config),

        secrets: parseJSON(rows[0].secrets) || {},
    };
},

getActiveByType: async (providerType) => {

    const [rows] = await db.query(`
        SELECT *
        FROM providers
        WHERE providerType = ?
        AND isActive = 1
        ORDER BY priority ASC
    `, [providerType]);

    return rows.map((row) => ({
        ...row,

        config: parseJSON(row.config),

        secrets: parseJSON(row.secrets) || {},
    }));
},

// =====================================================
// CREATE
// =====================================================

create: async ({
    providerKey,
    providerName,
    providerType,
    envPrefix = null,
    config = null,
    secrets = null,
    isActive = 1,
    isDefault = 0,
    priority = 1,
}) => {

    const [result] = await db.query(`
        INSERT INTO providers (
            providerKey,
            providerName,
            providerType,
            envPrefix,
            config,
            secrets,
            isActive,
            isDefault,
            priority
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        providerKey,
        providerName,
        providerType,
        envPrefix,

        config ? JSON.stringify(config) : null,

        secrets ? JSON.stringify(secrets) : null,

        isActive,
        isDefault,
        priority,
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
        "providerKey",
        "providerName",
        "providerType",
        "envPrefix",
        "config",
        "secrets",
        "isActive",
        "isDefault",
        "priority",
    ];

    const setClauses = [];
    const values = [];

    for (const key of allowed) {

        if (fields[key] !== undefined) {

            setClauses.push(`${key} = ?`);

            values.push(
                (key === "config" || key === "secrets")
                    ? JSON.stringify(fields[key])
                    : fields[key]
            );
        }
    }

    if (setClauses.length === 0) {
        return {
            affectedRows: 0,
        };
    }

    values.push(id);

    const [result] = await db.query(`
        UPDATE providers
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
        DELETE FROM providers
        WHERE id = ?
    `, [id]);

    return {
        affectedRows: result.affectedRows,
    };
},

};

module.exports = Provider;