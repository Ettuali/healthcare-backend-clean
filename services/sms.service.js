// services/sms.service.js
const twilio = require("twilio");

const sendSMS = async ({ to, message, config = {}, secrets = {} }) => {
    const sid   = secrets.accountSid || process.env.TWILIO_SID;
    const token = secrets.authToken  || process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = config.fromPhone || process.env.TWILIO_PHONE;

    if (!secrets.authToken) console.warn("[sms] using .env Twilio token (DB secret not set yet)");

    const client = twilio(sid, token);
    await client.messages.create({ body: message, from: fromPhone, to });
    console.log(`✅ SMS SENT (from ${fromPhone})`);
};

module.exports = { sendSMS };