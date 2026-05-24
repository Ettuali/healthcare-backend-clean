const nodemailer = require("nodemailer");

const {
  validateSMTP,
} = require("../shared/provider.validator");

const {
  logProviderEvent,
} = require("../shared/provider.logger");

const send = async ({
  to,
  subject,
  message,
  config,
  secrets,
}) => {
  try {
    validateSMTP({ config, secrets });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,

      auth: {
        user: secrets.smtpUser,
        pass: secrets.smtpPassword,
      },
    });

    const response = await transporter.sendMail({
      from: config.fromEmail,
      to,
      subject,
      text: message,
    });

    logProviderEvent({
      channel: "email",
      provider: "smtp",
      status: "success",
      externalId: response.messageId,
    });

    return {
      success: true,
      provider: "smtp",
      externalId: response.messageId,
      status: "sent",
      raw: response,
    };
  } catch (error) {
    logProviderEvent({
      channel: "email",
      provider: "smtp",
      status: "failed",
      error,
    });

    throw error;
  }
};

module.exports = { send };