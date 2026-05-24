const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const WebSocket = require("ws");
const cryptoService = require("./services/crypto.service");
const cron = require("node-cron");
const deactivateExpiredPatients = require("./middleware/cron");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// =======================
// 🔹 Store connected users
// =======================
const onlineUsers = new Map(); // userId (string) -> ws

// =======================
// 🔹 WebSocket handling
// =======================
wss.on("connection", (ws) => {
  console.log("🟡 WS Connected");

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);
      console.log("📩 message:", data);

      // =======================
      // 🔹 REGISTER
      // =======================
      if (data.type === "register") {
        const userId = String(data.userId);

        ws.userId = userId;
        onlineUsers.set(userId, ws);

        console.log(`🟢 User ${userId} connected`);
        console.log("🟢 ONLINE USERS:", Array.from(onlineUsers.keys()));
        return;
      }

      // =======================
      // 🔹 CALL REQUEST
      // =======================
      if (data.type === "call_request") {
        const receivers = Array.isArray(data.to) ? data.to : [data.to];

        receivers.forEach((receiverId) => {
          const id = String(receiverId);
          const socket = onlineUsers.get(id);

          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              ...data,
              callId: data.callId, // 🔥 important
            }));

            console.log(`📞 Call request → ${id}`);
          } else {
            onlineUsers.delete(id); // 🧹 cleanup

            ws.send(JSON.stringify({
              status: "user_offline",
              to: id,
            }));

            console.log(`⚠️ User ${id} offline`);
          }
        });

        return;
      }

      // =======================
      // 🔹 SIGNALING (1-1)
      // =======================
      if (
        [
          "call_response",
          "offer",
          "answer",
          "ice_candidate",
          "call_cancelled",
          "call_ended",
        ].includes(data.type)
      ) {
        const receiverId = Array.isArray(data.to) ? data.to[0] : data.to;
        const id = String(receiverId);

        const socket = onlineUsers.get(id);

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            ...data,
            callId: data.callId,
          }));

          console.log(`📡 ${data.type} → ${id}`);
        } else {
          onlineUsers.delete(id);

          ws.send(JSON.stringify({
            status: "user_offline",
            to: id,
          }));

          console.log(`⚠️ User ${id} offline`);
        }

        return;
      }

      // =======================
      // 🔹 CHAT
      // =======================
      if (data.type === "chat") {
        const senderId = String(data.senderId);
        const receiverId = String(data.receiverId);

        const payload = JSON.stringify({
          type: "chat",
          senderId,
          receiverId,
          message: data.message,
          timestamp: new Date(),
        });

        const socket = onlineUsers.get(receiverId);

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
          console.log(`💬 Delivered → ${receiverId}`);
        } else {
          onlineUsers.delete(receiverId);

          ws.send(JSON.stringify({
            status: "pending",
            to: receiverId,
          }));

          console.log(`⚠️ Chat pending → ${receiverId}`);
        }

        // echo to sender
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }

    } catch (err) {
      console.error("❌ WS Error:", err.message);
    }
  });

  // =======================
  // 🔹 DISCONNECT
  // =======================
  ws.on("close", () => {
    if (ws.userId) {
      onlineUsers.delete(ws.userId);
      console.log(`🔴 User ${ws.userId} disconnected`);
    }
  });
});

// =======================
// 🔹 CLEANUP (HEARTBEAT LIGHT)
// =======================
setInterval(() => {
  onlineUsers.forEach((socket, userId) => {
    if (socket.readyState !== WebSocket.OPEN) {
      onlineUsers.delete(userId);
      console.log(`🧹 Cleaned stale user ${userId}`);
    }
  });
}, 30000);

// =======================
// 🔹 EXPRESS
// =======================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const routes = require("./routes/routes");
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("🚀 Server running...");
});

// =======================
// 🔹 CRON
// =======================
cron.schedule("* * * * *", async () => {
  console.log("⏰ Checking expired packages...");
  await deactivateExpiredPatients();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata",
});

// =======================
// 🔹 START
// =======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});