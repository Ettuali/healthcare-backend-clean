module.exports = {
  email: {
    smtp_email:
      require("../email/smtp.provider"),

    sendgrid_email:
      require("../email/sendgrid.provider"),

    ses_email:
      require("../email/ses.provider"),
  },

  sms: {
    twilio_sms:
      require("../sms/twilio.provider"),

    msg91_sms:
      require("../sms/msg91.provider"),
 
    airtel_sms:
      require("../sms/airtel.provider"),

    jio_sms:
      require("../sms/jio.provider"),
  },

  whatsapp: {
    twilio_whatsapp:
      require("../whatsapp/twilio.provider"),

    meta_whatsapp:
      require("../whatsapp/meta.provider"),
  },
};