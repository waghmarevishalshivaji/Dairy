const db = require('../../config/db');

// Get dashboard data by email
async function getDashboardData(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const [userRows] = await db.execute('SELECT branches FROM web_users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const branches = userRows[0].branches ? JSON.parse(userRows[0].branches) : [];
    return res.status(200).json({ 
      success: true,
      branches
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getDashboardData };
