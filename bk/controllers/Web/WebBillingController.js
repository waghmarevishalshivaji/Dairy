const db = require('../../config/db');

// Create VLC commission entry
async function createVLCCommission(req, res) {
  const { vlcc, type, amount, effective_from } = req.body;
  if (!vlcc || !type || !amount || !effective_from) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO vlc_commission_entry (vlcc, type, amount, effective_from) VALUES (?, ?, ?, ?)',
      [vlcc, type, amount, effective_from]
    );
    return res.status(201).json({ 
      success: true, 
      message: 'VLC commission entry created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creating VLC commission entry:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Create VLC TS entry
async function createVLCTS(req, res) {
  const { vlc, kg_fat_rate, kg_snf_rate, effective_from } = req.body;
  if (!vlc || !kg_fat_rate || !kg_snf_rate || !effective_from) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO vlc_ts_entry (vlc, kg_fat_rate, kg_snf_rate, effective_from) VALUES (?, ?, ?, ?)',
      [vlc, kg_fat_rate, kg_snf_rate, effective_from]
    );
    return res.status(201).json({ 
      success: true, 
      message: 'VLC TS entry created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error creating VLC TS entry:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createVLCCommission, createVLCTS };
