// services/sms/msg91.provider.js

const axios = require("axios");

const {
  logProviderEvent,
} = require("../shared/provider.logger");

const send = async ({
  to,
  message,
  config,
  secrets,
}) => {
  try {

    // ================================
    // VALIDATION
    // ================================

    if (!secrets.authKey) {
      throw new Error("MSG91 authKey missing");
    }

    if (!config.senderId) {
      throw new Error("MSG91 senderId missing");
    }

    if (!config.templateId) {
      throw new Error("MSG91 templateId missing");
    }

    // ================================
    // FORMAT NUMBER
    // ================================

    let mobile = String(to).replace(/\D/g, "");

    if (!mobile.startsWith("91")) {
      mobile = `91${mobile}`;
    }

    // ================================
    // API REQUEST
    // ================================

    const payload = {
      template_id: config.templateId,
      sender: config.senderId,
      short_url: "0",
      mobiles: mobile,
      message,
    };

    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      payload,
      {
        headers: {
          authkey: secrets.authKey,
          "Content-Type": "application/json",
        },
      }
    );

    // ================================
    // LOG SUCCESS
    // ================================

    logProviderEvent({
      channel: "sms",
      provider: "msg91",
      status: "success",
      externalId:
        response.data?.request_id || null,
    });

    return {
      success: true,
      provider: "msg91",
      externalId:
        response.data?.request_id || null,
      status: "sent",
      raw: response.data,
    };

  } catch (error) {

    // ================================
    // LOG FAILURE
    // ================================

    logProviderEvent({
      channel: "sms",
      provider: "msg91",
      status: "failed",
      error,
    });

    throw new Error(
      error?.response?.data?.message ||
      error.message ||
      "MSG91 send failed"
    );
  }
};

module.exports = { send };