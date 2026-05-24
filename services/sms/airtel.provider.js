const axios = require("axios");

const {
  logProviderEvent,
} = require("../shared/provider.logger");

const send = async ({ to, message, config, secrets }) => {
  try {
    if (!config?.senderId) {
      throw new Error("Airtel senderId is required");
    }

    if (!config?.apiUrl) {
      throw new Error("Airtel apiUrl is required");
    }

    if (!secrets?.apiKey) {
      throw new Error("Airtel apiKey is required");
    }

    const response = await axios.post(
      config.apiUrl,
      {
        to,
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
      provider: "airtel",
      status: "success",
      externalId: response?.data?.requestId || null,
    });

    return {
      success: true,
      provider: "airtel",
      externalId: response?.data?.requestId || null,
      status: "sent",
      raw: response.data,
    };
  } catch (error) {
    logProviderEvent({
      channel: "sms",
      provider: "airtel",
      status: "failed",
      error: error?.response?.data || error.message,
    });

    throw error?.response?.data || error;
  }
};

module.exports = { send };