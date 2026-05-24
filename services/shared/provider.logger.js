const logProviderEvent = ({
  channel,
  provider,
  status,
  externalId = null,
  error = null,
}) => {
  console.log({
    timestamp: new Date().toISOString(),

    channel,

    provider,

    status,

    externalId,

    error:
      error?.response?.data ||
      error?.message ||
      null,
  });
};

module.exports = {
  logProviderEvent,
};