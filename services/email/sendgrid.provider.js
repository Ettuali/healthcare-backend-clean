const sgMail = require("@sendgrid/mail");

const send = async ({
  to,
  subject,
  message,
  config,
  secrets,
}) => {

  try {

    if (!secrets?.apiKey) {
      throw new Error(
        "Missing SendGrid API key"
      );
    }

    if (!config?.fromEmail) {
      throw new Error(
        "Missing SendGrid fromEmail"
      );
    }

    sgMail.setApiKey(
      secrets.apiKey
    );

    const response =
      await sgMail.send({

        to,

        from:
          config.fromEmail,

        subject,

        text: message,
      });

    return {

      success: true,

      provider:
        "sendgrid_email",

      status:
        "sent",

      raw:
        response,
    };

  } catch (error) {

    throw error;
  }
};

module.exports = {
  send,
};