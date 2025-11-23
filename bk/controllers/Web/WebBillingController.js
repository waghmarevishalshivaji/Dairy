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

// Upsert bill (create or update)
async function upsertBill(req, res) {
  try {
    const {
      dairy_id,
      farmer_id,
      period_start,
      period_end,
      milk_total,
      net_payable,
      status,
      is_finalized,
      received_total,
      advance,
      advance_deduction,
      cattlefeed,
      cattlefeed_deduction,
      other1,
      other1_deduction,
      other2,
      other2_deduction
    } = req.body;

    // Validate required fields
    if (!dairy_id || !farmer_id || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id, farmer_id, period_start, and period_end are required'
      });
    }

    // Check if bill exists
    const [existing] = await db.execute(
      `SELECT id FROM bills 
       WHERE dairy_id = ? AND farmer_id = ? AND period_start = ? AND period_end = ?`,
      [dairy_id, farmer_id, period_start, period_end]
    );

    // Calculate totals and remaining
    const advance_total = advance_deduction || 0;
    const advance_remaining = (advance || 0) - (advance_deduction || 0);
    const cattlefeed_total = cattlefeed_deduction || 0;
    const cattlefeed_remaining = (cattlefeed || 0) - (cattlefeed_deduction || 0);
    const other1_total = other1_deduction || 0;
    const other1_remaining = (other1 || 0) - (other1_deduction || 0);
    const other2_total = other2_deduction || 0;
    const other2_remaining = (other2 || 0) - (other2_deduction || 0);

    if (existing.length > 0) {
      // Update existing bill
      await db.execute(
        `UPDATE bills SET
          milk_total = ?,
          advance_total = ?,
          advance_remaining = ?,
          cattlefeed_total = ?,
          cattlefeed_remaining = ?,
          other1_total = ?,
          other1_remaining = ?,
          other2_total = ?,
          other2_remaining = ?,
          received_total = ?,
          net_payable = ?,
          status = ?,
          is_finalized = ?
         WHERE id = ?`,
        [
          milk_total,
          advance_total,
          advance_remaining,
          cattlefeed_total,
          cattlefeed_remaining,
          other1_total,
          other1_remaining,
          other2_total,
          other2_remaining,
          received_total,
          net_payable,
          status,
          is_finalized,
          existing[0].id
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Bill updated successfully',
        id: existing[0].id
      });
    } else {
      // Insert new bill
      const [result] = await db.execute(
        `INSERT INTO bills (
          dairy_id, farmer_id, period_start, period_end,
          milk_total, advance_total, advance_remaining,
          cattlefeed_total, cattlefeed_remaining,
          other1_total, other1_remaining,
          other2_total, other2_remaining,
          received_total, net_payable, status, is_finalized
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dairy_id,
          farmer_id,
          period_start,
          period_end,
          milk_total,
          advance_total,
          advance_remaining,
          cattlefeed_total,
          cattlefeed_remaining,
          other1_total,
          other1_remaining,
          other2_total,
          other2_remaining,
          received_total,
          net_payable,
          status,
          is_finalized
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        id: result.insertId
      });
    }
  } catch (err) {
    console.error('Error upserting bill:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

module.exports = { createVLCCommission, createVLCTS, upsertBill };
