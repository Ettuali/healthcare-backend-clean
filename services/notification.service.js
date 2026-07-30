// services/notification.service.js

const { sendSMS } = require("./sms/sms.factory");
const { sendEmail } = require("./email/email.factory");
const { sendWhatsapp } = require("./whatsapp/whatsapp.factory");

const { render } = require("./template.engine");

const { resolveDefaultProvider } = require("./provider.config");

const Notification = require("../models/notification.model");
const CommunicationSettings = require("../models/communicationSettings.model");
const Template = require("../models/template.model");

const emitter = require("../realtime/emitter");

// =====================================================
// EXISTING SERVICE REUSE
// =====================================================
const { sendPushNotification } = require("./firebase.service"); 
const DeviceToken = require("../models/deviceToken.model");

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const sendFcmToUser = async ({
  userId,
  title,
  body,
  type,
  referenceId,
  referenceType,
}) => {
  try {
    const devices = await DeviceToken.getTokens(userId);

    if (!devices || devices.length === 0) return;

    for (const device of devices) {
      if (!device.fcm_token) continue;

      await sendPushNotification({
        token: device.fcm_token,
        title,
        body,
        data: {
          type,
          referenceId: referenceId ? String(referenceId) : "",
          referenceType: referenceType ? String(referenceType) : "",
        },
      });
    }
  } catch (err) {
    console.error("[FCM]", err.message);
  }
};

// =====================================================
// CHANNEL DISPATCHERS
// =====================================================

const dispatchers = {
  email: async ({
    providerKey,
    to,
    subject,
    message,
    config,
    secrets,
  }) => {
    return sendEmail({
      providerKey,
      to,
      subject,
      message,
      config,
      secrets,
    });
  },

  sms: async ({
    providerKey,
    to,
    message,
    config,
    secrets,
  }) => {
    return sendSMS({
      providerKey,
      to,
      message,
      config,
      secrets,
    });
  },

  whatsapp: async ({
    providerKey,
    to,
    message,
    config,
    secrets,
  }) => {
    return sendWhatsapp({
      providerKey,
      to,
      message,
      config,
      secrets,
    });
  },
};

// =====================================================
// MAIN SERVICE
// =====================================================

const sendNotification = async ({
  userId,
  email,
  phone,
  subject,
  message,
  channels = [],
  type = "system",
  referenceType = null,
  referenceId = null,
  metadata = {},
  templateData = {},
}) => {
  const results = {};

  // =====================================================
  // SETTINGS RESOLUTION
  // =====================================================

  let activeChannels = channels;
  let settingsByChannel = {};

  try {
    const settings = await CommunicationSettings.getEnabledForEvent(type);

    if (settings && settings.length > 0) {
      activeChannels = settings.map((s) => s.channel);

      settingsByChannel = settings.reduce((acc, s) => {
        acc[s.channel] = s;
        return acc;
      }, {});
    }
  } catch (err) {
    console.error("[notification] settings lookup failed:", err.message);
  }

  const renderData = {
    ...metadata,
    ...templateData,
  };

  // =====================================================
  // TEMPLATE RESOLUTION
  // =====================================================

  const resolveContent = async (channel) => {
    const setting = settingsByChannel[channel];
    let tpl = null;

    try {
      if (setting?.templateId) {
        tpl = await Template.getById(setting.templateId);
      }

      if (!tpl) {
        tpl = await Template.getByTypeAndChannel(type, channel);
      }
    } catch (err) {
      console.error("[notification] template lookup failed:", err.message);
    }

    if (tpl) {
      return {
        subject: tpl.subject ? render(tpl.subject, renderData) : subject,
        body: render(tpl.body, renderData),
      };
    }

    return {
      subject,
      body: message,
    };
  };

  // =====================================================
  // PERSIST HELPER
  // =====================================================

  const persist = (channel, content) => {
    return Notification.create({
      userId,
      title: content.subject || subject,
      message: content.body,
      type,
      channel,
      referenceId,
      referenceType,
      status: "pending",
      metadata,
    });
  };

  // =====================================================
  // EXTERNAL CHANNELS
  // =====================================================

  for (const channel of ["email", "sms", "whatsapp"]) {
    if (!activeChannels.includes(channel)) {
      continue;
    }

    const to = channel === "email" ? email : phone;

    if (!to) {
      results[channel] = "skipped_no_recipient";
      continue;
    }

    let row;

    try {
      // =========================================
      // TEMPLATE CONTENT
      // =========================================
      const content = await resolveContent(channel);

      // =========================================
      // PERSIST
      // =========================================
      row = await persist(channel, content);

      // =========================================
      // RESOLVE DEFAULT PROVIDER
      // =========================================
      const providerResolution = await resolveDefaultProvider({
        providerType: channel,
      });

      const { providerName, providerKey, config, secrets } = providerResolution;

      // =========================================
      // DISPATCH
      // =========================================
      await dispatchers[channel]({
        providerKey,
        to,
        subject: content.subject,
        message: content.body,
        config,
        secrets,
      });

      // =========================================
      // UPDATE STATUS
      // =========================================
      await Notification.updateStatus(row.id, "sent");

      results[channel] = {
        status: "sent",
        provider: providerKey,
      };
    } catch (err) {
      console.error(`${channel.toUpperCase()} ERROR:`, err.message);

      if (row) {
        await Notification.updateStatus(row.id, "failed");
      }

      results[channel] = {
        status: "failed",
        error: err.message,
      };
    }
  }

  // =====================================================
  // IN-APP
  // =====================================================

  if (activeChannels.includes("inapp") && userId) {
    try {
      const content = await resolveContent("inapp");

      const row = await Notification.create({
        userId,
        title: content.subject || subject,
        message: content.body,
        type,
        channel: "inapp",
        referenceId,
        referenceType,
        status: "sent",
        metadata,
      });

      results.inapp = "sent";
      results.inappId = row.id;

      // =====================================================
      // GENERALIZED FCM PUSH INTEGRATION
      // =====================================================
    const pushEnabledTypes = [
  "medical_alert",
  "patient_assignment",
  "care_team_assignment",
  "medicine_assigned",
  "medicine_due_soon",
  "medicine_time",
  "medicine_pending",
  "medicine_missed",
];

      if (pushEnabledTypes.includes(type)) {
        await sendFcmToUser({
          userId,
          title: content.subject || subject,
          body: content.body,
          type,
          notificationId: row.id,
          referenceId,
          referenceType,
        });
      }

      emitter.toUser(userId, "notification:new", {
        id: row.id,
        title: content.subject || subject,
        message: content.body,
        type,
        referenceType,
        referenceId,
        metadata,
        createdOn: new Date().toISOString(),
        isRead: 0,
      });
    } catch (err) {
      console.error("INAPP ERROR:", err.message);
      results.inapp = "failed";
    }
  }

  return results;
};

module.exports = {
  sendNotification,
  sendFcmToUser,
};