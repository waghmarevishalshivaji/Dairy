const db = require('../../config/db');

// Get all users data
async function getAllUsers(req, res) {
  try {
    const [dairyAdmins] = await db.execute('SELECT * FROM users WHERE role = ?', ['Dairyadmin']);
    
    const [dairyManagersData] = await db.execute(`
      SELECT u.*, d.*
      FROM users u
      LEFT JOIN userDairy ud ON u.id = ud.user_id
      LEFT JOIN dairy d ON ud.dairy_id = d.id
      WHERE u.role = ?
    `, ['Dairymgr']);
    
    const [farmers] = await db.execute('SELECT * FROM users WHERE role = ?', ['farmer']);
    const [webUsers] = await db.execute('SELECT * FROM web_users');
    
    return res.status(200).json({ 
      success: true,
      data: {
        dairyAdmins,
        dairyManagers: dairyManagersData,
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
