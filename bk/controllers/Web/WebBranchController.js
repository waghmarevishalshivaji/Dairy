const db = require('../../config/db');

// Get branch details by mobile number
async function getBranchByMobile(req, res) {
  const { mobile_number } = req.body;
  if (!mobile_number) {
    return res.status(400).json({ success: false, message: 'Mobile number is required' });
  }
  try {
    // Get Dairyadmin user by mobile number
    const [userRows] = await db.execute('SELECT id FROM users WHERE mobile_number = ? AND role = ?', [mobile_number, 'Dairyadmin']);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Get dairy branches with usernames using JOIN
    const [dairyRows] = await db.execute(
      'SELECT d.name, d.branchname, usr.username FROM dairy as d LEFT JOIN userDairy as ud ON ud.dairy_id = d.id LEFT JOIN users as usr ON usr.id = ud.user_id WHERE d.createdby = ?',
      [userRows[0].id]
    );
    const branches = dairyRows.map(row => ({
      username: row.username,
      name: row.name,
      branchname: row.branchname
    }));
    return res.status(200).json({ 
      success: true,
      mobile_number,
      branches
    });
  } catch (err) {
    console.error('Error fetching branch details:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getBranchByMobile };
