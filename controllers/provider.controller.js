const Provider = require("../models/provider.model");
const cryptoService = require("../services/crypto.service");

const SECRET_CTX = "provider_secrets";
const MASK = "••••••••";

const providerController = {

// =====================================================
// LIST
// =====================================================

list: async (req, res) => {

    try {

        const providers = await Provider.getAll();

        return res.status(200).json({
            data: providers,
        });

    } catch (e) {

        console.error(e);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
},

// =====================================================
// GET ONE
// =====================================================

getOne: async (req, res) => {

    try {

        const provider = await Provider.getById(req.params.id);

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found.",
            });
        }

        return res.status(200).json({
            data: provider,
        });

    } catch (e) {

        console.error(e);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
},

// =====================================================
// CREATE
// =====================================================

create: async (req, res) => {

    try {

        const {
            providerKey,
            providerName,
            providerType,
            config = null,
            secrets = null,
            isActive = 1,
            isDefault = 0,
            priority = 1,
            envPrefix = null,
        } = req.body;

        if (
            !providerKey ||
            !providerName ||
            !providerType
        ) {
            return res.status(400).json({
                message: "providerKey, providerName and providerType are required.",
            });
        }

        // =========================================
        // ENCRYPT SECRETS
        // =========================================

        let encryptedSecrets = null;

        if (secrets && typeof secrets === "object") {

            encryptedSecrets = {};

            for (const [key, value] of Object.entries(secrets)) {

                if (!value || value === MASK) {
                    continue;
                }

                encryptedSecrets[key] =
                    await cryptoService.encrypt(
                        String(value),
                        SECRET_CTX
                    );
            }
        }

        const result = await Provider.create({
            providerKey,
            providerName,
            providerType,
            envPrefix,
            config,
            secrets: encryptedSecrets,
            isActive,
            isDefault,
            priority,
        });

        return res.status(201).json({
            message: "Provider created.",
            id: result.id,
        });

    } catch (e) {

        if (e.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                message: "Provider already exists.",
            });
        }

        console.error(e);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
},

// =====================================================
// UPDATE
// =====================================================

update: async (req, res) => {

    try {

        const { id } = req.params;

        const {
            providerKey,
            providerName,
            providerType,
            envPrefix,
            config,
            secrets,
            isActive,
            isDefault,
            priority,
            deleteSecretKeys = [],
        } = req.body;

        // =========================================
        // EXISTING PROVIDER
        // =========================================

        const existingProvider =
            await Provider.getRawById(id);

        if (!existingProvider) {
            return res.status(404).json({
                message: "Provider not found.",
            });
        }

        const fields = {};

        // =========================================
        // BASIC FIELDS
        // =========================================

        if (providerKey !== undefined)
            fields.providerKey = providerKey;

        if (providerName !== undefined)
            fields.providerName = providerName;

        if (providerType !== undefined)
            fields.providerType = providerType;

        if (envPrefix !== undefined)
            fields.envPrefix = envPrefix;

        if (config !== undefined)
            fields.config = config;

        if (isActive !== undefined)
            fields.isActive = isActive;

        if (isDefault !== undefined)
            fields.isDefault = isDefault;

        if (priority !== undefined)
            fields.priority = priority;

        // =========================================
        // SECRETS MERGE
        // =========================================

        if (secrets && typeof secrets === "object") {

            const mergedSecrets = {
                ...(existingProvider.secrets || {}),
            };

            for (const [key, value] of Object.entries(secrets)) {

                // unchanged
                if (
                    value === MASK ||
                    value === "" ||
                    value == null
                ) {
                    continue;
                }

                // encrypt new value
                mergedSecrets[key] =
                    await cryptoService.encrypt(
                        String(value),
                        SECRET_CTX
                    );
            }

            // explicit deletion
            if (Array.isArray(deleteSecretKeys)) {

                for (const key of deleteSecretKeys) {
                    delete mergedSecrets[key];
                }
            }

            fields.secrets = mergedSecrets;
        }

        const result = await Provider.update(
            id,
            fields
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Provider not found or no changes.",
            });
        }

        return res.status(200).json({
            message: "Provider updated.",
        });

    } catch (e) {

        console.error(e);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
},

// =====================================================
// DELETE
// =====================================================

remove: async (req, res) => {

    try {

        const result =
            await Provider.remove(req.params.id);

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Provider not found.",
            });
        }

        return res.status(200).json({
            message: "Provider deleted.",
        });

    } catch (e) {

        console.error(e);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
},

};

module.exports = providerController;