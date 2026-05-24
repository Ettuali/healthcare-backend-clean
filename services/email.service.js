// services/email.service.js
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, message, config = {}, secrets = {} }) => {
    const user = secrets.smtpUser || process.env.EMAIL;
    const pass = secrets.smtpPassword || process.env.EMAIL_PASS;
    const fromEmail = config.fromEmail || user;

    if (!secrets.smtpPassword) console.warn("[email] using .env SMTP pass (DB secret not set yet)");

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 587, secure: false,
        auth: { user, pass },
    });
    await transporter.sendMail({ from: fromEmail, to, subject, text: message });
    console.log(`✅ EMAIL SENT (from ${fromEmail})`);
};

module.exports = { sendEmail };