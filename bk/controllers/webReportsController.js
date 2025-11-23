const db = require('../config/db');

async function getCollectionsReport(req, res) {
  try {
    const { dairy_id, milk_type, shift, from, to } = req.query;

    // Validate required fields
    if (!dairy_id || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id, from, and to are required'
      });
    }

    // Build query
    let query = `
      SELECT 
        c.id,
        c.farmer_id,
        c.dairy_id,
        c.type,
        c.quantity,
        c.fat,
        c.snf,
        c.clr,
        c.rate,
        c.amount,
        c.shift,
        c.created_at,
        u.fullName as farmer_name,
        u.username as farmer_code
      FROM collections c
      LEFT JOIN users u ON c.farmer_id = u.username AND c.dairy_id = u.dairy_id
      WHERE DATE(c.created_at) BETWEEN ? AND ?
    `;

    const params = [from, to];

    // Handle dairy_id (can be array or single value)
    let dairyIds = [];
    if (Array.isArray(dairy_id)) {
      dairyIds = dairy_id;
    } else if (typeof dairy_id === 'string' && dairy_id.includes(',')) {
      dairyIds = dairy_id.split(',').map(id => id.trim());
    } else {
      dairyIds = [dairy_id];
    }

    if (dairyIds.length > 0) {
      query += ` AND c.dairy_id IN (${dairyIds.map(() => '?').join(',')})`;
      params.push(...dairyIds);
    }

    // Handle milk_type filter
    if (milk_type && milk_type !== 'All') {
      query += ` AND c.type = ?`;
      params.push(milk_type);
    }

    // Handle shift filter
    if (shift && shift !== 'All') {
      query += ` AND c.shift = ?`;
      params.push(shift);
    }

    query += ` ORDER BY c.created_at DESC, c.dairy_id, c.farmer_id`;

    // Execute query
    const [rows] = await db.execute(query, params);

    // Calculate summary
    const summary = {
      total_records: rows.length,
      total_quantity: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      total_amount: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      avg_fat: rows.length > 0 ? (rows.reduce((sum, row) => sum + Number(row.fat || 0), 0) / rows.length).toFixed(2) : 0,
      avg_snf: rows.length > 0 ? (rows.reduce((sum, row) => sum + Number(row.snf || 0), 0) / rows.length).toFixed(2) : 0,
    };

    res.status(200).json({
      success: true,
      message: 'Collections report fetched successfully',
      filters: {
        dairy_id: dairyIds,
        milk_type: milk_type || 'All',
        shift: shift || 'All',
        from,
        to
      },
      summary,
      data: rows
    });

  } catch (err) {
    console.error('Error fetching collections report:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

module.exports = {
  getCollectionsReport
};
