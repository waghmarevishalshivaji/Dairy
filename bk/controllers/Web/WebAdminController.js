const db = require('../../config/db');

// Get all users data
async function getAllUsers(req, res) {
  try {
    const [dairyAdmins] = await db.execute('SELECT * FROM users WHERE role = ?', ['Dairyadmin']);
    const [dairyManagers] = await db.execute('SELECT * FROM users WHERE role = ?', ['Dairymgr']);
    const [farmers] = await db.execute('SELECT * FROM users WHERE role = ?', ['farmer']);
    const [webUsers] = await db.execute('SELECT * FROM web_users');
    
    return res.status(200).json({ 
      success: true,
      data: {
        dairyAdmins,
        dairyManagers,
        farmers,
        webUsers
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getAllUsers };
