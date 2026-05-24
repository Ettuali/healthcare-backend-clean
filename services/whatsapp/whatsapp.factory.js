const registry = require("../shared/provider.registry");

const sendWhatsapp = async ({
  providerKey,
  ...payload
}) => {

  const handler =
    registry.whatsapp[providerKey];

  if (!handler) {

    throw new Error(
      `Unsupported WhatsApp provider: ${providerKey}`
    );
  }

  return handler.send(payload);
};

module.exports = {
  sendWhatsapp,
};