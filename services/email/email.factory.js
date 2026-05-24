const registry = require("../shared/provider.registry");

const sendEmail = async ({
  providerKey,
  ...payload
}) => {

  const handler =
    registry.email[providerKey];

  if (!handler) {

    throw new Error(
      `Unsupported Email provider: ${providerKey}`
    );
  }

  return handler.send(payload);
};

module.exports = {
  sendEmail,
};