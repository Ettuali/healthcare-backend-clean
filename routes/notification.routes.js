// D:\Day2Day\dayday-backend\routes\notification.routes.js

const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const notificationController = require("../controllers/notification.controller");

// ALL bell routes require authentication.
router.use(verifyToken);

// ===========================================
// BELL LIST + COUNT
// ===========================================
router.get("/",             notificationController.list);
router.get("/unread-count", notificationController.unreadCount);

// ===========================================
// MARK AS READ
// Order matters: static path BEFORE param path.
// ===========================================
router.patch("/read-all",   notificationController.markAllAsRead);
router.patch("/:id/read",   notificationController.markAsRead);

module.exports = router;