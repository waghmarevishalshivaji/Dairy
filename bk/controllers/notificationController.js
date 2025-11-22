const db = require("../config/db");

const { sendPushNotification } = require('../utils/notification');


// Manager sends notification
async function sendNotification(req, res) {
  try {
    let { dairy_id, title, message, farmer_id } = req.body;
    if (!dairy_id || !title || !message) {
      return res.status(400).json({ success: false, message: "dairy_id, title, message required" });
    }
    
    if(!farmer_id){
        farmer_id = "No"
    }

    // Save notification in DB
    await db.execute(
      "INSERT INTO notifications (dairy_id, title, message, farmer_id) VALUES (?, ?, ?, ?)",
      [dairy_id, title, message, farmer_id]
    );

    const io = req.app.get("io");

    // Emit to all farmers of this dairy
    io.to(`dairy_${dairy_id}`).emit("newNotification", {
      title,
      message,
      dairy_id,
      farmer_id,
      timestamp: new Date()
    });

    res.json({ success: true, message: "Notification sent & stored" });
  } catch (err) {
    console.error("Error sending notification:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Farmers fetch notifications
async function getNotifications(req, res) {
  try {
    const { dairy_id, farmer_id } = req.query;
    if (!dairy_id || !farmer_id) {
      return res.status(400).json({ success: false, message: "dairy_id and farmer_id required" });
    }

    const [rows] = await db.execute(
      `SELECT id, dairy_id, farmer_id, title, message, created_at
       FROM notifications
       WHERE dairy_id=? AND farmer_id=?
       ORDER BY created_at DESC
       LIMIT 50`,
      [dairy_id, farmer_id]
    );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function sendDairyNotification(req, res) {
  try {
    // const { dairy_id, title, body } = req.body;
    let { dairy_id, title, body, farmer_id } = req.body;

    if (!dairy_id || !title || !body) {
      return res.status(400).json({ success: false, message: "dairy_id, title and body required" });
    }

    if(!farmer_id){
        farmer_id = "No"
    }


    await db.execute(
      "INSERT INTO notifications (dairy_id, title, message, farmer_id) VALUES (?, ?, ?, ?)",
      [dairy_id, title, body, farmer_id]
    );

    // Fetch farmer tokens from DB
    const [farmers] = await db.execute(
      `SELECT expo_token FROM users WHERE dairy_id = ? AND expo_token IS NOT NULL`,
      [dairy_id]
    );

    const tokens = farmers.map(f => f.expo_token);

    if (tokens.length === 0) {
      return res.status(200).json({ success: true, message: "No farmers with push tokens" });
    }

    // Send notifications
    const tickets = await sendPushNotification(tokens, title, body, { dairy_id });

    res.status(200).json({
      success: true,
      message: "Notification sent",
      tickets,
    });
  } catch (err) {
    console.error("Error in sendDairyNotification:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


// ===========================
// 🔹 GET UNREAD COUNT API
// ===========================
async function getUnreadCount(req, res) {
  const { farmer_id, dairy_id } = req.query;

  if (!farmer_id || !dairy_id) {
    return res.status(400).json({ success: false, message: "farmer_id and dairy_id are required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE farmer_id = ? AND dairy_id = ? AND \`read\` = 0`,
      [farmer_id, dairy_id]
    );

    res.status(200).json({
      success: true,
      unread_count: rows[0]?.unread_count || 0,
    });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

// ===========================
// 🔹 MARK ALL AS READ API
// ===========================
async function markAllAsRead(req, res) {
  const { farmer_id, dairy_id } = req.body;

  if (!farmer_id || !dairy_id) {
    return res.status(400).json({ success: false, message: "farmer_id and dairy_id are required" });
  }

  try {
    const [result] = await db.query(
      `UPDATE notifications
       SET \`read\` = 1
       WHERE farmer_id = ? AND dairy_id = ? AND \`read\` = 0`,
      [farmer_id, dairy_id]
    );

    res.status(200).json({
      success: true,
      message: "All unread notifications marked as read",
      updated: result.affectedRows,
    });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

module.exports = { sendNotification, getNotifications, sendDairyNotification, getUnreadCount, markAllAsRead };
