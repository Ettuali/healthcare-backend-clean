const axios = require("axios");

const {
  logProviderEvent,
} = require("../shared/provider.logger");

const send = async ({ to, message, config, secrets }) => {
  try {
    if (!config?.senderId) {
      throw new Error("Jio senderId is required");
    }

    if (!config?.apiUrl) {
      throw new Error("Jio apiUrl is required");
    }

    if (!secrets?.apiKey) {
      throw new Error("Jio apiKey is required");
    }

    const response = await axios.post(
      config.apiUrl,
      {
        mobile: to,
        message,
        senderId: config.senderId,
      },
      {
        headers: {
          Authorization: `Bearer ${secrets.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    logProviderEvent({
      channel: "sms",
      provider: "jio",
      status: "success",
      externalId: response?.data?.requestId || null,
    });

    return {
      success: true,
      provider: "jio",
      externalId: response?.data?.requestId || null,
      status: "sent",
      raw: response.data,
    };
  } catch (error) {
    logProviderEvent({
      channel: "sms",
      provider: "jio",
      status: "failed",
      error: error?.response?.data || error.message,
    });

    throw error?.response?.data || error;
  }
};

module.exports = { send };