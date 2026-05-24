const axios = require("axios");

const {
  logProviderEvent,
} = require("../shared/provider.logger");

const send = async ({ to, message, config, secrets }) => {
  try {
    if (!config?.phoneNumberId) {
      throw new Error("Meta phoneNumberId is required");
    }

    if (!secrets?.accessToken) {
      throw new Error("Meta accessToken is required");
    }

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${secrets.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const messageId =
      response?.data?.messages?.[0]?.id || null;

    logProviderEvent({
      channel: "whatsapp",
      provider: "meta",
      status: "success",
      externalId: messageId,
    });

    return {
      success: true,
      provider: "meta",
      externalId: messageId,
      status: "sent",
      raw: response.data,
    };
  } catch (error) {
    logProviderEvent({
      channel: "whatsapp",
      provider: "meta",
      status: "failed",
      error:
        error?.response?.data || error.message,
    });

    throw error?.response?.data || error;
  }
};

module.exports = { send };