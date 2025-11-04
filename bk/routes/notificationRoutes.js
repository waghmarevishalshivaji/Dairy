const express = require("express");
const { sendNotification, getNotifications, sendDairyNotification, getUnreadCount, markAllAsRead } = require("../controllers/notificationController");

const router = express.Router();

router.post("/send", sendNotification);   // POST /notifications/send
router.get("/", getNotifications);        // GET /notifications?dairy_id=1
router.post('/sendnotify', sendDairyNotification);

router.get("/unread-count", getUnreadCount);
router.post("/mark-read", markAllAsRead);

module.exports = router;
