// services/whatsapp.service.js
const twilio = require("twilio");

const sendWhatsapp = async ({ to, message, config = {}, secrets = {} }) => {
    const sid   = secrets.accountSid || process.env.TWILIO_SID;
    const token = secrets.authToken  || process.env.TWILIO_AUTH_TOKEN;
    const fromRaw = config.fromPhone || process.env.TWILIO_WHATSAPP_NUMBER;

    if (!secrets.authToken) console.warn("[whatsapp] using .env Twilio token (DB secret not set yet)");

    const from = fromRaw && fromRaw.startsWith("whatsapp:") ? fromRaw : `whatsapp:${fromRaw}`;
    const client = twilio(sid, token);
    await client.messages.create({ body: message, from, to: `whatsapp:${to}` });
    console.log(`✅ WHATSAPP SENT (from ${from})`);
};

module.exports = { sendWhatsapp };