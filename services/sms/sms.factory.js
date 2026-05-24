const registry = require("../shared/provider.registry");

const sendSMS = async ({
  providerKey,
  ...payload
}) => {

  const handler =
    registry.sms[providerKey];

  if (!handler) {

    throw new Error(
      `Unsupported SMS provider: ${providerKey}`
    );
  }

  return handler.send(payload);
};

module.exports = {
  sendSMS,
};