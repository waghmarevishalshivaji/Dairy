const db = require('../config/db');

// Create new web user by super admin
async function createWebUser(req, res) {
  const { name, email, mobile_number } = req.body;
  if (!name || !email || !mobile_number) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    // Check if mobile_number exists in users table with role Dairyadmin
    const [adminRows] = await db.execute('SELECT * FROM users WHERE mobile_number = ? AND role = ?', [mobile_number, 'Dairyadmin']);
    if (adminRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Mobile number not found for Dairyadmin' });
    }
    // Generate random 6-digit password
    const temp_pw = Math.floor(100000 + Math.random() * 900000).toString();
    // Insert into web_users
    await db.execute('INSERT INTO web_users (name, email, temp_pw, mobile_number) VALUES (?, ?, ?, ?)', [name, email, temp_pw, mobile_number]);
    return res.status(201).json({ success: true, message: 'Web user created', temp_pw });
  } catch (err) {
    console.error('Error creating web user:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createWebUser };