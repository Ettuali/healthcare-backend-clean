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

    const response = await client.messages.create({
      body: message,
      from: config.fromPhone,
      to,
    });

    logProviderEvent({
      channel: "sms",
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
      channel: "sms",
      provider: "twilio",
      status: "failed",
      error,
    });

    throw error;
  }
};

module.exports = { send };