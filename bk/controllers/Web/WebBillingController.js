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

// Get bill details
async function getBillDetails(req, res) {
  try {
    const { dairy_id, farmer_id, period_start, period_end } = req.query;

    if (!dairy_id || !farmer_id || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id, farmer_id, period_start, and period_end are required'
      });
    }

    // Handle farmer_id (can be array or single value)
    let farmerIds = [];
    if (Array.isArray(farmer_id)) {
      farmerIds = farmer_id;
    } else if (typeof farmer_id === 'string' && farmer_id.includes(',')) {
      farmerIds = farmer_id.split(',').map(id => id.trim());
    } else {
      farmerIds = [farmer_id];
    }

    // Get bills for specified farmers
    const placeholders = farmerIds.map(() => '?').join(',');
    const [bills] = await db.execute(
      `SELECT b.farmer_id, b.advance_total, b.advance_remaining,
              b.cattlefeed_total, b.cattlefeed_remaining,
              b.other1_total, b.other1_remaining,
              b.other2_total, b.other2_remaining
       FROM bills b
       WHERE b.dairy_id = ? AND b.farmer_id IN (${placeholders}) 
             AND b.period_start = ? AND b.period_end = ?`,
      [dairy_id, ...farmerIds, period_start, period_end]
    );

    const result = bills.map(bill => ({
      farmer_id: bill.farmer_id,
      advance_total: Number(bill.advance_total || 0).toFixed(2),
      advance_remaining: Number(bill.advance_remaining || 0).toFixed(2),
      cattlefeed_total: Number(bill.cattlefeed_total || 0).toFixed(2),
      cattlefeed_remaining: Number(bill.cattlefeed_remaining || 0).toFixed(2),
      other1_total: Number(bill.other1_total || 0).toFixed(2),
      other1_remaining: Number(bill.other1_remaining || 0).toFixed(2),
      other2_total: Number(bill.other2_total || 0).toFixed(2),
      other2_remaining: Number(bill.other2_remaining || 0).toFixed(2)
    }));

    res.status(200).json({
      success: true,
      message: 'Bill details fetched successfully',
      filters: {
        dairy_id,
        farmer_id: farmerIds,
        period_start,
        period_end
      },
      data: result
    });

  } catch (err) {
    console.error('Error fetching bill details:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

// Update farmer bill for web (farmer deduction page)
async function updateFarmerBillWeb(req, res) {
  try {
    const { 
      farmer_id, 
      dairy_id, 
      period_start, 
      period_end, 
      milk_total, 
      advance_total, 
      cattlefeed_total,
      other1_total,
      other2_total,
      received_total, 
      net_payable,
      advance_remaining,
      cattlefeed_remaining,
      other1_remaining,
      other2_remaining
    } = req.body;

    if (!farmer_id || !dairy_id) {
      return res.status(400).json({ success: false, message: "farmer_id and dairy_id are required" });
    }

    if (!period_start || !period_end) {
      return res.status(400).json({ success: false, message: "period_start and period_end are required" });
    }

    // Check if bill exists for this farmer, dairy, and period
    const [existing] = await db.execute(
      `SELECT * FROM bills 
       WHERE farmer_id=? AND dairy_id=? AND period_start=? AND period_end=?
       ORDER BY id DESC LIMIT 1`,
      [farmer_id, dairy_id, period_start, period_end]
    );

    const finalNet = net_payable || 
      (Number(milk_total) - Number(advance_total || 0) - Number(cattlefeed_total || 0) - 
       Number(other1_total || 0) - Number(other2_total || 0) + Number(received_total || 0));

    if (existing.length > 0) {
      // Update existing bill
      await db.execute(
        `UPDATE bills 
         SET milk_total=?, advance_total=?, cattlefeed_total=?, other1_total=?, other2_total=?, 
             received_total=?, net_payable=?, 
             advance_remaining=?, cattlefeed_remaining=?, other1_remaining=?, other2_remaining=?
         WHERE id=?`,
        [
          Number(milk_total) || 0,
          Number(advance_total) || 0,
          Number(cattlefeed_total) || 0,
          Number(other1_total) || 0,
          Number(other2_total) || 0,
          Number(received_total) || 0,
          finalNet,
          Number(advance_remaining) || 0,
          Number(cattlefeed_remaining) || 0,
          Number(other1_remaining) || 0,
          Number(other2_remaining) || 0,
          existing[0].id
        ]
      );
      return res.json({ success: true, message: "Bill updated", bill_id: existing[0].id });
    } else {
      // Insert new bill
      const [result] = await db.execute(
        `INSERT INTO bills (
          farmer_id, dairy_id, period_start, period_end, 
          milk_total, advance_total, cattlefeed_total, other1_total, other2_total,
          received_total, net_payable, 
          advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
          status, is_finalized
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
        [
          farmer_id, dairy_id, period_start, period_end,
          Number(milk_total) || 0,
          Number(advance_total) || 0,
          Number(cattlefeed_total) || 0,
          Number(other1_total) || 0,
          Number(other2_total) || 0,
          Number(received_total) || 0,
          finalNet,
          Number(advance_remaining) || 0,
          Number(cattlefeed_remaining) || 0,
          Number(other1_remaining) || 0,
          Number(other2_remaining) || 0
        ]
      );
      return res.json({ success: true, message: "Bill created", bill_id: result.insertId });
    }
  } catch (err) {
    console.error('Error updating farmer bill:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

module.exports = { createVLCCommission, createVLCTS, upsertBill, getBillDetails, updateFarmerBillWeb };
