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
    const branches = userRows[0].branches || [];
    return res.status(200).json({ 
      success: true,
      branches
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get collections summary by branches, date and shift
async function getCollectionsSummary(req, res) {
  const { branches, date, shift } = req.body;
  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    return res.status(400).json({ success: false, message: 'Branches array is required' });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }
  if (!shift) {
    return res.status(400).json({ success: false, message: 'Shift is required' });
  }
  try {
    const results = [];
    for (const dairy_id of branches) {
      let query = `
        SELECT 
          SUM(quantity) AS total_quantity,
          SUM(quantity * fat) AS weighted_fat,
          SUM(quantity * snf) AS weighted_snf,
          SUM(amount) AS total_amount
        FROM collections
        WHERE dairy_id = ? AND DATE(created_at) = ?
      `;
      const params = [dairy_id, date];
      if (shift !== 'All') {
        query += ` AND shift = ?`;
        params.push(shift);
      }
      const [rows] = await db.execute(query, params);
      const row = rows[0];
      const totalQty = parseFloat(row.total_quantity) || 0;
      const avgFat = totalQty > 0 ? (parseFloat(row.weighted_fat) / totalQty).toFixed(2) : 0;
      const avgSnf = totalQty > 0 ? (parseFloat(row.weighted_snf) / totalQty).toFixed(2) : 0;
      results.push({
        dairy_id,
        quantity: totalQty,
        fat: parseFloat(avgFat),
        snf: parseFloat(avgSnf),
        amount: parseFloat(row.total_amount) || 0
      });
    }
    return res.status(200).json({ 
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Error fetching collections summary:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getDashboardData, getCollectionsSummary };
