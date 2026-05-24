const twilio = require("twilio");

const {
  validateTwilio,
} = require("../shared/provider.validator");

const {
  logProviderEvent,
} = require("../shared/provider.logger");

const send = async ({ to, message, config, secrets }) => {
  try {
    validateTwilio({ config, secrets });

    const client = twilio(
      secrets.accountSid,
      secrets.authToken
    );

    const from = config.fromPhone.startsWith("whatsapp:")
      ? config.fromPhone
      : `whatsapp:${config.fromPhone}`;

    const response = await client.messages.create({
      body: message,
      from,
      to: `whatsapp:${to}`,
    });

    logProviderEvent({
      channel: "whatsapp",
      provider: "twilio",
      status: "success",
      externalId: response.sid,
    });

    return {
      success: true,
      provider: "twilio",
      externalId: response.sid,
      status: response.status,
      raw: response,
    };
  } catch (error) {
    logProviderEvent({
      channel: "whatsapp",
      provider: "twilio",
      status: "failed",
      error,
    });

    throw error;
  }
};

module.exports = { send };