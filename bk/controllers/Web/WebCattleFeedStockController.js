const db = require('../../config/db');

// POST - Create or Update cattle feed stock
async function upsertCattleFeedStock(req, res) {
  const { dairy_id, amount, stock } = req.body;

  if (!dairy_id || amount === undefined || stock === undefined) {
    return res.status(400).json({ success: false, message: 'dairy_id, amount, and stock are required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if record exists for today
    const [existing] = await db.execute(
      'SELECT id FROM cattlefeed_stock WHERE dairy_id = ? AND date = ?',
      [dairy_id, today]
    );

    if (existing.length > 0) {
      // Update existing record
      await db.execute(
        'UPDATE cattlefeed_stock SET amount = ?, stock = ? WHERE id = ?',
        [amount, stock, existing[0].id]
      );
      return res.status(200).json({ success: true, message: 'Cattle feed stock updated' });
    } else {
      // Insert new record
      const [result] = await db.execute(
        'INSERT INTO cattlefeed_stock (dairy_id, amount, stock, date) VALUES (?, ?, ?, ?)',
        [dairy_id, amount, stock, today]
      );
      return res.status(201).json({ success: true, message: 'Cattle feed stock created', id: result.insertId });
    }
  } catch (err) {
    console.error('Error upserting cattle feed stock:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// GET - Get cattle feed stock by dairy_id
async function getCattleFeedStock(req, res) {
  const { dairy_id } = req.query;

  if (!dairy_id) {
    return res.status(400).json({ success: false, message: 'dairy_id is required' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM cattlefeed_stock WHERE dairy_id = ? ORDER BY date DESC',
      [dairy_id]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching cattle feed stock:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  upsertCattleFeedStock,
  getCattleFeedStock
};
