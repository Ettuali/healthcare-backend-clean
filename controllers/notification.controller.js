// D:\Day2Day\dayday-backend\controllers\notification.controller.js

const Notification = require("../models/notification.model");

const notificationController = {

    // =========================================================
    // GET /notifications
    // Paginated list of the current user's in-app notifications
    // =========================================================
    list: async (req, res) => {
        console.log("===== NOTIFICATION LIST =====");
        console.log("Authenticated User:", req.user.id);
        try {
            const userId = req.user && req.user.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const {
                page = 0,
                limit = 20,
                onlyUnread = "false",
            } = req.query;

            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            const { data, totalCount } = await Notification.listForUser(userId, {
                page: pageNum,
                limit: limitNum,
                onlyUnread: onlyUnread === "true",
                channel: "inapp",
            });

            // FIXED: Removed the non-existent 'rows' variable console.log
            console.log({
                userId,
                totalCount,
                returned: data.length,
            });

            res.status(200).json({
                data,
                totalCount,
                page: pageNum,
                limit: limitNum,
            });
        } catch (error) {
            console.error("Error listing notifications:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // =========================================================
    // GET /notifications/unread-count
    // Single integer — hot path for the bell badge
    // =========================================================
    unreadCount: async (req, res) => {
        try {
            const userId = req.user && req.user.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const unread = await Notification.unreadCount(userId, "inapp");
            res.status(200).json({ unread });
        } catch (error) {
            console.error("Error fetching unread count:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // =========================================================
    // PATCH /notifications/:id/read
    // Mark a single notification as read (must belong to user)
    // =========================================================
    markAsRead: async (req, res) => {
        try {
            const userId = req.user && req.user.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const { id } = req.params;
            const result = await Notification.markAsRead(id, userId);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Notification not found, already read, or not yours.",
                });
            }

            res.status(200).json({ message: "Notification marked as read." });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // =========================================================
    // PATCH /notifications/read-all
    // Mark every unread in-app notification as read for current user
    // =========================================================
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.user && req.user.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const result = await Notification.markAllAsRead(userId);
            res.status(200).json({
                message: "All notifications marked as read.",
                updatedCount: result.affectedRows,
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deliveryLogs: async (req, res) => {
        try {
            const { page = 0, limit = 20, channel, status, eventType } = req.query;
            const result = await Notification.getDeliveryLogs({
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                channel: channel || null,
                status: status || null,
                eventType: eventType || null,
            });
            res.status(200).json(result);
        } catch (error) {
            console.error("Error fetching delivery logs:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};

module.exports = notificationController;