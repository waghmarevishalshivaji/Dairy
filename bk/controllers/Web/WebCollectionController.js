const db = require('../../config/db');

// Create VLC collection entry
async function createVLCEntry(req, res) {
  const { date, shift, vlc_id, vlc_name, weight, fat, snf, clr } = req.body;
  if (!date || !shift || !vlc_id || !vlc_name || !weight || !fat || !snf || !clr) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO vlc_collection_entry (date, shift, vlc_id, vlc_name, weight, fat, snf, clr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [date, shift, vlc_id, vlc_name, weight, fat, snf, clr]
    );
    return res.status(201).json({ 
      success: true, 
      message: 'VLC entry created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creating VLC entry:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get VLC entries by vlc_id array
async function getVLCEntries(req, res) {
  const { vlc_ids, date, shift } = req.body;
  if (!vlc_ids || !Array.isArray(vlc_ids) || vlc_ids.length === 0) {
    return res.status(400).json({ success: false, message: 'vlc_ids array is required' });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }
  if (!shift) {
    return res.status(400).json({ success: false, message: 'Shift is required' });
  }
  try {
    const placeholders = vlc_ids.map(() => '?').join(',');
    let query = `SELECT * FROM vlc_collection_entry WHERE vlc_id IN (${placeholders}) AND DATE(date) = ?`;
    const params = [...vlc_ids, date];
    if (shift !== 'All') {
      query += ` AND shift = ?`;
      params.push(shift);
    }
    const [rows] = await db.execute(query, params);
    return res.status(200).json({ 
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching VLC entries:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Create dispatch entry
async function createDispatchEntry(req, res) {
  const { date, weight, avg_fat, avg_snf, rate_per_liter, commission_amount_per_liter, total_amount } = req.body;
  if (!date || !weight || !avg_fat || !avg_snf || !rate_per_liter || !commission_amount_per_liter || !total_amount) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO dispatch_entry (date, weight, avg_fat, avg_snf, rate_per_liter, commission_amount_per_liter, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, weight, avg_fat, avg_snf, rate_per_liter, commission_amount_per_liter, total_amount]
    );
    return res.status(201).json({ 
      success: true, 
      message: 'Dispatch entry created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creating dispatch entry:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createVLCEntry, getVLCEntries, createDispatchEntry };
