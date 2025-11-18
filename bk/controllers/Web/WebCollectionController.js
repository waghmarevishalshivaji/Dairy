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

module.exports = { createVLCEntry };
