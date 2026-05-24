const router = require("express").Router();
const { verifyToken, allowRoles } = require("../middleware/auth");
const notificationController = require("../controllers/notification.controller");

// Admin-only: viewing ALL users' delivery history
router.use(verifyToken, allowRoles("admin"));

router.get("/logs", notificationController.deliveryLogs);

module.exports = router;