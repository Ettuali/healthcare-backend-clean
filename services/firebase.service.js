const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

const serviceAccount = require(
  path.join(__dirname, "../firebase/service-account.json")
);

// Guard: only initialize if no app exists yet
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
  console.log("🔥 Firebase Admin Initialized");
}

// =============================================================
// EXISTING — Chat notifications (unchanged)
// =============================================================

const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  try {
    const response = await getMessaging().send({
      token,

      notification: {
        title,
        body,
      },

      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
    });

    console.log("✅ Push Notification Sent:", response);

    return response;
  } catch (err) {
    console.error("❌ Firebase Push Error:", err);
    throw err;
  }
};

// =============================================================
// NEW — Incoming call notification (Android only, data-only)
//
// This function sends a single-token, data-only FCM message.
// Multi-device fan-out (iterating user_device_tokens) is the
// responsibility of the caller (call.controller.js).
//
// On the Flutter side, this payload is received by:
//   - FirebaseMessaging.onBackgroundMessage() when app is killed/background
//   - FirebaseMessaging.onMessage() when app is foreground
// In both cases the handler checks data['type'] == 'incoming_call'
// and delegates to CallKitService — the OS never renders this
// message as a visible notification because there is no
// `notification` block.
// =============================================================

const sendIncomingCallNotification = async ({
  token,
  callId,
  callerId,
  callerName,
  receiverId,
}) => {
  try {
const message = {
  token,

  notification: {
    title: "Incoming Call",
    body: `${callerName} is calling`,
  },

  data: {
    type: "incoming_call",
    callId: String(callId),
    callerId: String(callerId),
    callerName: String(callerName),
    receiverId: String(receiverId),
  },

  android: {
    priority: "high",
    ttl: 30000,
    collapseKey: `call_${callId}`,
  },
};

    const response = await getMessaging().send(message);

    console.log("✅ Incoming Call Notification Sent:", response);

    return response;
  } catch (err) {
    console.error("❌ Incoming Call FCM Error:", err);
    throw err;
  }
};

module.exports = {
  sendPushNotification,
  sendIncomingCallNotification,
};