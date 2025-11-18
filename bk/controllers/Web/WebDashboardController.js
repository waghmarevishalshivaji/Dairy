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
    
    const branchData = [];
    for (const branchId of branches) {
      const [userDairyRows] = await db.execute('SELECT user_id FROM userDairy WHERE dairy_id = ?', [branchId]);
      let username = null;
      if (userDairyRows.length > 0) {
        const userId = userDairyRows[0].user_id;
        const [userRows] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
        if (userRows.length > 0) {
          username = userRows[0].username;
        }
      }
      
      const [dairyRows] = await db.execute('SELECT name FROM dairy WHERE id = ?', [branchId]);
      const name = dairyRows.length > 0 ? dairyRows[0].name : null;
      
      branchData.push({
        branch_id: branchId,
        username,
        name
      });
    }
    
    return res.status(200).json({ 
      success: true,
      branches: branchData
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

// Get farmer collections with filters
async function getFarmerCollections(req, res) {
  console.log('📥 Frontend Request:', JSON.stringify(req.body, null, 2));
  const { branches, type, shift, from_date, to_date } = req.body;
  if (!branches || !Array.isArray(branches) || branches.length === 0) {
    return res.status(400).json({ success: false, message: 'Branches array is required' });
  }
  if (!from_date || !to_date) {
    return res.status(400).json({ success: false, message: 'from_date and to_date are required' });
  }
  try {
    const results = [];
    for (const dairy_id of branches) {
      let query = `
        SELECT 
          c.farmer_id,
          c.type,
          c.shift,
          c.created_at,
          SUM(c.quantity) AS total_quantity,
          u.fullName,
          u.is_active
        FROM collections c
        LEFT JOIN users u ON c.farmer_id = u.username AND u.role = 'farmer' AND c.dairy_id = u.dairy_id
        WHERE c.dairy_id = ? AND DATE(c.created_at) BETWEEN ? AND ?
      `;
      const params = [dairy_id, from_date, to_date];
      if (type && type !== 'All') {
        query += ` AND c.type = ?`;
        params.push(type);
      }
      if (shift && shift !== 'All') {
        query += ` AND c.shift = ?`;
        params.push(shift);
      }
      query += ` GROUP BY c.farmer_id, u.fullName, u.is_active ORDER BY c.created_at DESC`;
      console.log('🔍 Query:', query);
      console.log('🔍 Params:', params);
      const [rows] = await db.execute(query, params);
      console.log(`📊 Rows for dairy_id ${dairy_id}:`, rows.length);
      rows.forEach(row => {
        results.push({
          dairy_id,
          farmer_id: row.farmer_id,
          fullName: row.fullName,
          is_active: row.is_active,
          type: row.type,
          shift: row.shift,
          created_at: row.created_at,
          quantity: parseFloat(row.total_quantity) || 0
        });
      });
    }
    console.log('📤 Backend Response:', JSON.stringify({ success: true, data: results }, null, 2));
    return res.status(200).json({ 
      success: true,
      data: results
    });
  } catch (err) {
    console.error('❌ Error fetching farmer collections:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getDashboardData, getCollectionsSummary, getFarmerCollections };
