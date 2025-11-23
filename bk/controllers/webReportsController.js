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

async function getVLCDifferenceReport(req, res) {
  try {
    const { dairy_id, vlc_id, from, to, shift } = req.query;

    // Validate required fields
    if (!dairy_id || !vlc_id || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id, vlc_id, from, and to are required'
      });
    }

    // Query for VLC collection data
    let vlcQuery = `
      SELECT 
        SUM(weight) as total_weight,
        SUM(amount) as total_amount,
        AVG(fat) as avg_fat,
        AVG(snf) as avg_snf,
        AVG(rate) as avg_rate
      FROM vlc_collection_entry
      WHERE vlc_id = ?
        AND DATE(date) BETWEEN ? AND ?
    `;
    const vlcParams = [vlc_id, from, to];

    if (shift && shift !== 'All') {
      vlcQuery += ` AND shift = ?`;
      vlcParams.push(shift);
    }

    // Query for dairy collection data
    let dairyQuery = `
      SELECT 
        SUM(quantity) as total_weight,
        SUM(amount) as total_amount,
        AVG(fat) as avg_fat,
        AVG(snf) as avg_snf,
        AVG(rate) as avg_rate
      FROM collections
      WHERE dairy_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
    `;
    const dairyParams = [dairy_id, from, to];

    if (shift && shift !== 'All') {
      dairyQuery += ` AND shift = ?`;
      dairyParams.push(shift);
    }

    // Execute both queries
    const [vlcData] = await db.execute(vlcQuery, vlcParams);
    const [dairyData] = await db.execute(dairyQuery, dairyParams);

    const vlc = vlcData[0] || {};
    const dairy = dairyData[0] || {};

    // Calculate differences
    const difference = {
      weight: (Number(vlc.total_weight || 0) - Number(dairy.total_weight || 0)).toFixed(2),
      amount: (Number(vlc.total_amount || 0) - Number(dairy.total_amount || 0)).toFixed(2),
      fat: (Number(vlc.avg_fat || 0) - Number(dairy.avg_fat || 0)).toFixed(2),
      snf: (Number(vlc.avg_snf || 0) - Number(dairy.avg_snf || 0)).toFixed(2),
      rate: (Number(vlc.avg_rate || 0) - Number(dairy.avg_rate || 0)).toFixed(2)
    };

    res.status(200).json({
      success: true,
      message: 'VLC difference report fetched successfully',
      filters: {
        dairy_id,
        vlc_id,
        from,
        to,
        shift: shift || 'All'
      },
      data: {
        vlc: {
          total_weight: Number(vlc.total_weight || 0).toFixed(2),
          total_amount: Number(vlc.total_amount || 0).toFixed(2),
          avg_fat: Number(vlc.avg_fat || 0).toFixed(2),
          avg_snf: Number(vlc.avg_snf || 0).toFixed(2),
          avg_rate: Number(vlc.avg_rate || 0).toFixed(2)
        },
        dairy: {
          total_weight: Number(dairy.total_weight || 0).toFixed(2),
          total_amount: Number(dairy.total_amount || 0).toFixed(2),
          avg_fat: Number(dairy.avg_fat || 0).toFixed(2),
          avg_snf: Number(dairy.avg_snf || 0).toFixed(2),
          avg_rate: Number(dairy.avg_rate || 0).toFixed(2)
        },
        difference
      }
    });

  } catch (err) {
    console.error('Error fetching VLC difference report:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

module.exports = {
  getCollectionsReport,
  getVLCDifferenceReport
};
