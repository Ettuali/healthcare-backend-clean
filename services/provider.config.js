// services/provider.config.js

const Provider = require("../models/provider.model");
const cryptoService = require("./crypto.service");

const SECRET_CTX = "provider_secrets";

/**
 * Resolve provider configuration
 *
 * Returns:
 * {
 *   providerKey,
 *   providerName,
 *   providerType,
 *   config,
 *   secrets
 * }
 */

const resolveProviderConfig = async ({
    providerKey,
}) => {

    try {

        // =========================================
        // LOAD RAW PROVIDER
        // =========================================

        const provider =
            await Provider.getRawByKey(providerKey);

        if (!provider) {

            throw new Error(
                `Provider not found: ${providerKey}`
            );
        }

        // =========================================
        // DECRYPT SECRETS
        // =========================================

        const decryptedSecrets = {};

        const rawSecrets =
            provider.secrets || {};

        for (const [key, value] of Object.entries(rawSecrets)) {

            try {

                decryptedSecrets[key] =
                    await cryptoService.decrypt(
                        value,
                        SECRET_CTX
                    );

            } catch (err) {

                console.error(
                    `[provider.config] failed decrypting '${key}' for '${providerKey}'`
                );

                throw new Error(
                    `Failed to decrypt provider secret '${key}'`
                );
            }
        }

        // =========================================
        // NORMALIZED RESPONSE
        // =========================================

        return {

            providerKey:
                provider.providerKey,

            providerName:
                provider.providerName,

            providerType:
                provider.providerType,

            config:
                provider.config || {},

            secrets:
                decryptedSecrets,
        };

    } catch (err) {

        console.error(
            "[provider.config] resolve failed:",
            err.message
        );

        throw err;
    }
};

/**
 * Resolve default provider for a providerType
 *
 * Example:
 *   sms
 *   email
 *   whatsapp
 */

const resolveDefaultProvider = async ({
    providerType,
}) => {

    try {

        // =========================================
        // GET DEFAULT ACTIVE PROVIDER
        // =========================================

        const provider =
            await Provider.getDefaultByType(
                providerType
            );

        if (!provider) {

            throw new Error(
                `No active default provider for type '${providerType}'`
            );
        }

        // =========================================
        // REUSE CORE RESOLVER
        // =========================================

        return resolveProviderConfig({
            providerKey:
                provider.providerKey,
        });

    } catch (err) {

        console.error(
            "[provider.config] default resolve failed:",
            err.message
        );

        throw err;
    }
};

module.exports = {
    resolveProviderConfig,
    resolveDefaultProvider,
};