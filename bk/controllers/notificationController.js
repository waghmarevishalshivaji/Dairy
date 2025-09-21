const db = require("../config/db");

// Manager sends notification
async function sendNotification(req, res) {
  try {
    const { dairy_id, title, message, farmer_id } = req.body;
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
    const { dairy_id } = req.query;
    if (!dairy_id) {
      return res.status(400).json({ success: false, message: "dairy_id required" });
    }

    const [rows] = await db.execute(
      `SELECT id, dairy_id, farmer_id, title, message, created_at
       FROM notifications
       WHERE dairy_id=?
       ORDER BY created_at DESC
       LIMIT 50`,
      [dairy_id]
    );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { sendNotification, getNotifications };
