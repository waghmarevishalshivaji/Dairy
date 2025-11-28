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

    if (!dairy_id || !vlc_id || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id, vlc_id, from, and to are required'
      });
    }

    // Get billing days from dairy table
    const [dairyInfo] = await db.execute(
      'SELECT days FROM dairy WHERE id = ?',
      [dairy_id]
    );

    if (!dairyInfo || dairyInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dairy not found'
      });
    }

    const billingDays = dairyInfo[0].days || 10;

    // Generate periods for each individual date
    const periods = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      periods.push({ start: dateStr, end: dateStr });
    }

    // Fetch data for each period
    const result = [];
    const shifts = (shift && shift !== 'All') ? [shift] : ['Morning', 'Evening'];
    
    for (const period of periods) {
      for (const shiftType of shifts) {
        let vlcQuery = `
          SELECT 
            SUM(weight) as total_weight,
            SUM(amount) as total_amount,
            AVG(fat) as avg_fat,
            AVG(snf) as avg_snf,
            AVG(rate) as avg_rate
          FROM vlc_collection_entry
          WHERE vlc_id = ? AND DATE(date) = ? AND shift = ?
        `;
        const vlcParams = [vlc_id, period.start, shiftType];

        let dairyQuery = `
          SELECT 
            SUM(quantity) as total_weight,
            SUM(amount) as total_amount,
            AVG(fat) as avg_fat,
            AVG(snf) as avg_snf,
            AVG(rate) as avg_rate
          FROM collections
          WHERE dairy_id = ? AND DATE(created_at) = ? AND shift = ?
        `;
        const dairyParams = [dairy_id, period.start, shiftType];

        const [vlcData] = await db.execute(vlcQuery, vlcParams);
        const [dairyData] = await db.execute(dairyQuery, dairyParams);

        const vlc = vlcData[0] || {};
        const dairy = dairyData[0] || {};

        result.push({
          period: period.start,
          shift: shiftType,
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
          difference: {
            weight: (Number(vlc.total_weight || 0) - Number(dairy.total_weight || 0)).toFixed(2),
            amount: (Number(vlc.total_amount || 0) - Number(dairy.total_amount || 0)).toFixed(2),
            fat: (Number(vlc.avg_fat || 0) - Number(dairy.avg_fat || 0)).toFixed(2),
            snf: (Number(vlc.avg_snf || 0) - Number(dairy.avg_snf || 0)).toFixed(2),
            rate: (Number(vlc.avg_rate || 0) - Number(dairy.avg_rate || 0)).toFixed(2)
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'VLC difference report fetched successfully',
      filters: {
        dairy_id,
        vlc_id,
        from,
        to,
        shift: shift || 'All',
        billing_days: billingDays
      },
      data: result
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

async function getFarmerRemainingBalances(req, res) {
  try {
    const { dairy_id, date } = req.query;

    if (!dairy_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id and date are required'
      });
    }

    // Find bills for the given date and dairy_id, ordered by period_start DESC
    const [bills] = await db.execute(
      `SELECT b.farmer_id, b.advance_remaining, b.other1_remaining, b.other2_remaining, 
              b.cattlefeed_remaining, b.period_start, b.period_end, b.status, b.is_finalized,
              u.fullName as farmer_name
       FROM bills b
       LEFT JOIN users u ON b.farmer_id = u.username AND b.dairy_id = u.dairy_id
       WHERE b.dairy_id = ? AND ? BETWEEN b.period_start AND b.period_end
       ORDER BY b.period_start DESC`,
      [dairy_id, date]
    );

    // If current period bills are finalized and paid, return them
    if (bills.length > 0 && bills[0].status === 'paid' && bills[0].is_finalized === 1) {
      return res.status(200).json({
        success: true,
        message: 'Farmer remaining balances fetched successfully',
        data: bills.map(b => ({
          farmer_id: b.farmer_id,
          farmer_name: b.farmer_name,
          advance_remaining: Number(b.advance_remaining || 0).toFixed(2),
          other1_remaining: Number(b.other1_remaining || 0).toFixed(2),
          other2_remaining: Number(b.other2_remaining || 0).toFixed(2),
          cattlefeed_remaining: Number(b.cattlefeed_remaining || 0).toFixed(2),
          period_start: b.period_start,
          period_end: b.period_end,
          status: b.status,
          is_finalized: b.is_finalized
        }))
      });
    }

    // Otherwise, find the most recent finalized and paid bill
    const [previousBills] = await db.execute(
      `SELECT b.farmer_id, b.advance_remaining, b.other1_remaining, b.other2_remaining, 
              b.cattlefeed_remaining, b.period_start, b.period_end, b.status, b.is_finalized,
              u.fullName as farmer_name
       FROM bills b
       LEFT JOIN users u ON b.farmer_id = u.username AND b.dairy_id = u.dairy_id
       WHERE b.dairy_id = ? AND b.status = 'paid' AND b.is_finalized = 1 
             AND b.period_end < ?
       ORDER BY b.period_end DESC`,
      [dairy_id, date]
    );

    if (previousBills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No finalized bills found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Farmer remaining balances fetched successfully',
      data: previousBills.map(b => ({
        farmer_id: b.farmer_id,
        farmer_name: b.farmer_name,
        advance_remaining: Number(b.advance_remaining || 0).toFixed(2),
        other1_remaining: Number(b.other1_remaining || 0).toFixed(2),
        other2_remaining: Number(b.other2_remaining || 0).toFixed(2),
        cattlefeed_remaining: Number(b.cattlefeed_remaining || 0).toFixed(2),
        period_start: b.period_start,
        period_end: b.period_end,
        status: b.status,
        is_finalized: b.is_finalized
      }))
    });

  } catch (err) {
    console.error('Error fetching farmer remaining balances:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

async function getVLCCommissionReport(req, res) {
  try {
    const { vlc_id, start_date, end_date } = req.query;

    if (!vlc_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'vlc_id, start_date, and end_date are required'
      });
    }

    // Handle vlc_id (can be array or single value)
    let vlcIds = [];
    if (Array.isArray(vlc_id)) {
      vlcIds = vlc_id;
    } else if (typeof vlc_id === 'string' && vlc_id.includes(',')) {
      vlcIds = vlc_id.split(',').map(id => id.trim());
    } else {
      vlcIds = [vlc_id];
    }

    const result = [];

    for (const vlcId of vlcIds) {
      // Get total quantity from collections table
      const [collections] = await db.execute(
        `SELECT SUM(quantity) as total_quantity
         FROM collections
         WHERE dairy_id = ? AND DATE(created_at) BETWEEN ? AND ?`,
        [vlcId, start_date, end_date]
      );

      // Get all commission entries
      const [commissions] = await db.execute(
        `SELECT amount, effective_from, type
         FROM vlc_commission_entry
         WHERE vlcc = ?
         ORDER BY effective_from DESC`,
        [vlcId]
      );

      result.push({
        vlc_id: vlcId,
        total_quantity: Number(collections[0]?.total_quantity || 0).toFixed(2),
        commissions: commissions.map(c => ({
          type: c.type,
          amount: Number(c.amount || 0).toFixed(2),
          effective_from: c.effective_from
        }))
      });
    }

    res.status(200).json({
      success: true,
      message: 'VLC commission report fetched successfully',
      filters: {
        vlc_id: vlcIds,
        start_date,
        end_date
      },
      data: result
    });

  } catch (err) {
    console.error('Error fetching VLC commission report:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

async function getFarmerWiseCollectionReport(req, res) {
  try {
    const { dairy_id, from, to, farmer_id } = req.query;

    if (!dairy_id || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'dairy_id, from, and to are required'
      });
    }

    // Get unique farmer IDs
    let farmerQuery = `SELECT DISTINCT farmer_id FROM collections WHERE dairy_id = ? AND DATE(created_at) BETWEEN ? AND ?`;
    let farmerParams = [dairy_id, from, to];
    
    if (farmer_id) {
      farmerQuery += ` AND farmer_id = ?`;
      farmerParams.push(farmer_id);
    }
    
    const [farmers] = await db.execute(farmerQuery, farmerParams);
    const farmersData = [];

    for (const farmer of farmers) {
      const fid = farmer.farmer_id;

      // Get collections
      const [collections] = await db.execute(
        `SELECT id, shift, type, quantity, fat, snf, clr, rate, (quantity * rate) as amount, created_at
         FROM collections
         WHERE dairy_id = ? AND farmer_id = ? AND DATE(created_at) BETWEEN ? AND ?
         ORDER BY shift, created_at`,
        [dairy_id, fid, from, to]
      );

      // Get payments
      const [payments] = await db.execute(
        `SELECT 
           SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
           SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
           SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
           SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
           SUM(amount_taken) AS total_deductions,
           SUM(received) AS total_received
         FROM farmer_payments
         WHERE dairy_id = ? AND farmer_id = ? AND DATE(date) BETWEEN ? AND ?`,
        [dairy_id, fid, from, to]
      );

      const payment = payments[0] || {};

      // Group by shift
      const grouped = { morning: [], evening: [] };
      collections.forEach((r) => {
        const entry = {
          id: r.id,
          type: r.type,
          shift: r.shift,
          quantity: Number(r.quantity),
          fat: Number(r.fat),
          snf: Number(r.snf),
          clr: Number(r.clr),
          rate: Number(r.rate),
          amount: Number(r.amount),
          created_at: r.created_at,
        };
        if (r.shift.toLowerCase() === 'morning') grouped.morning.push(entry);
        if (r.shift.toLowerCase() === 'evening') grouped.evening.push(entry);
      });

      const calcShiftTotals = (entries) => {
        if (!entries.length) return { total_quantity: 0, avg_fat: 0, avg_snf: 0, avg_clr: 0, total_amount: 0 };
        const totalQty = entries.reduce((a, b) => a + b.quantity, 0);
        const totalAmount = entries.reduce((a, b) => a + b.amount, 0);
        return {
          total_quantity: totalQty,
          avg_fat: (entries.reduce((a, b) => a + b.fat, 0) / entries.length).toFixed(2),
          avg_snf: (entries.reduce((a, b) => a + b.snf, 0) / entries.length).toFixed(2),
          avg_clr: (entries.reduce((a, b) => a + b.clr, 0) / entries.length).toFixed(2),
          total_amount: totalAmount,
        };
      };

      const morningTotals = calcShiftTotals(grouped.morning);
      const eveningTotals = calcShiftTotals(grouped.evening);
      const totalQty = morningTotals.total_quantity + eveningTotals.total_quantity;
      const totalAmount = morningTotals.total_amount + eveningTotals.total_amount;
      const dailyAvgFat = (Number(morningTotals.avg_fat) + Number(eveningTotals.avg_fat)) / 2 || 0;

      const deductions = {
        advance: Number(payment.advance) || 0,
        cattle_feed: Number(payment.cattle_feed) || 0,
        other1: Number(payment.other1) || 0,
        other2: Number(payment.other2) || 0,
        total: Number(payment.total_deductions) || 0,
      };

      const netAmount = totalAmount - deductions.total + (Number(payment.total_received) || 0);

      farmersData.push({
        farmer_id: fid,
        morning: { shift: 'Morning', entries: grouped.morning, totals: morningTotals },
        evening: { shift: 'Evening', entries: grouped.evening, totals: eveningTotals },
        overall: { totalQty, totalAmount, avgFat: dailyAvgFat.toFixed(2) },
        financials: {
          deductions,
          total_received: Number(payment.total_received) || 0,
          netAmount,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Farmer-wise collection report fetched successfully',
      filters: { dairy_id, from, to, farmer_id: farmer_id || 'All' },
      farmers: farmersData,
    });

  } catch (err) {
    console.error('Error fetching farmer-wise collection report:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}

module.exports = {
  getCollectionsReport,
  getVLCDifferenceReport,
  getFarmerRemainingBalances,
  getVLCCommissionReport,
  getFarmerWiseCollectionReport
};
