const db = require('../config/db');
const bcrypt = require('bcrypt');

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

// Web user login
async function loginWebUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  try {
    const [rows] = await db.execute('SELECT * FROM web_users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = rows[0];
    // Check if using temp password (first login)
    if (!user.password && user.temp_pw === password) {
      return res.status(200).json({ success: true, message: 'First login', requirePasswordChange: true, userId: user.id, name: user.name, email: user.email });
    }
    // Check main password
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.status(200).json({ success: true, message: 'Login successful', requirePasswordChange: false, userId: user.id, name: user.name, email: user.email });
      }
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Set new password after first login
async function setPassword(req, res) {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ success: false, message: 'User ID and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE web_users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    return res.status(200).json({ success: true, message: 'Password set successfully' });
  } catch (err) {
    console.error('Error setting password:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Update selected branches for web user
async function updateBranches(req, res) {
  const { mobile_number, dairy_ids } = req.body;
  if (!mobile_number || !dairy_ids) {
    return res.status(400).json({ success: false, message: 'Mobile number and dairy IDs are required' });
  }
  if (!Array.isArray(dairy_ids)) {
    return res.status(400).json({ success: false, message: 'dairy_ids must be an array' });
  }
  try {
    const branchesJson = JSON.stringify(dairy_ids);
    await db.execute('UPDATE web_users SET branches = ? WHERE mobile_number = ?', [branchesJson, mobile_number]);
    return res.status(200).json({ success: true, message: 'Branches updated successfully' });
  } catch (err) {
    console.error('Error updating branches:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createWebUser, loginWebUser, setPassword, updateBranches };