const validateTwilio = ({ config, secrets }) => {
  if (!secrets.accountSid) {
    throw new Error("Twilio account SID missing");
  }

  if (!secrets.authToken) {
    throw new Error("Twilio auth token missing");
  }

  if (!config.fromPhone) {
    throw new Error("Twilio from phone missing");
  }
};

const validateSMTP = ({ config, secrets }) => {
  if (!secrets.smtpUser) {
    throw new Error("SMTP user missing");
  }

  if (!secrets.smtpPassword) {
    throw new Error("SMTP password missing");
  }

  if (!config.fromEmail) {
    throw new Error("From email missing");
  }
};

const validateMsg91 = ({ config, secrets }) => {
  if (!config.senderId) {
    throw new Error("MSG91 senderId missing");
  }

  if (!config.templateId) {
    throw new Error("MSG91 templateId missing");
  }

  if (!secrets.authKey) {
    throw new Error("MSG91 authKey missing");
  }
};

const validateAirtel = ({ config, secrets }) => {
  if (!config.senderId) {
    throw new Error("Airtel senderId missing");
  }

  if (!config.apiUrl) {
    throw new Error("Airtel apiUrl missing");
  }

  if (!secrets.apiKey) {
    throw new Error("Airtel apiKey missing");
  }
};

const validateJio = ({ config, secrets }) => {
  if (!config.senderId) {
    throw new Error("Jio senderId missing");
  }

  if (!config.apiUrl) {
    throw new Error("Jio apiUrl missing");
  }

  if (!secrets.apiKey) {
    throw new Error("Jio apiKey missing");
  }
};

const validateMeta = ({ config, secrets }) => {
  if (!config.phoneNumberId) {
    throw new Error("Meta phoneNumberId missing");
  }

  if (!secrets.accessToken) {
    throw new Error("Meta accessToken missing");
  }
};

module.exports = {
  validateTwilio,
  validateSMTP,
  validateMsg91,
  validateAirtel,
  validateJio,
  validateMeta,
};