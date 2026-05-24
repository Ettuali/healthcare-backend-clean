const AWS = require("aws-sdk");

const send = async ({
  to,
  subject,
  message,
  config,
  secrets,
}) => {

  try {

    if (
      !secrets?.accessKeyId ||
      !secrets?.secretAccessKey
    ) {
      throw new Error(
        "Missing AWS SES credentials"
      );
    }

    if (!config?.fromEmail) {
      throw new Error(
        "Missing SES fromEmail"
      );
    }

    const ses =
      new AWS.SES({

        region:
          config.region || "us-east-1",

        accessKeyId:
          secrets.accessKeyId,

        secretAccessKey:
          secrets.secretAccessKey,
      });

    const response =
      await ses.sendEmail({

        Source:
          config.fromEmail,

        Destination: {
          ToAddresses: [to],
        },

        Message: {

          Subject: {
            Data: subject,
          },

          Body: {

            Text: {
              Data: message,
            },
          },
        },
      }).promise();

    return {

      success: true,

      provider:
        "ses_email",

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