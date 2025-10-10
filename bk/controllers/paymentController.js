const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const moment = require('moment');
const crypto = require('crypto');


// POST /api/payments
async function insertPayment(req, res) {  

    const allowedFields = [
      'date',
      'dairy_id',
      'farmer_id',
      'farmer_name',
      'payment_type',
      'amount_taken',
      'received',
      'descriptions'
    ];

    

    const requiredFields = ['date', 'dairy_id', 'farmer_id', 'payment_type'];

    // 1. Validate required fields
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required field(s): ${missingFields.join(', ')}` });
    }

    // 2. Filter fields to insert based on request
    const fieldsToInsert = allowedFields.filter(field => req.body.hasOwnProperty(field));
    const values = fieldsToInsert.map(field => req.body[field]);

    // 3. Create placeholders and build query
    const placeholders = fieldsToInsert.map(() => '?').join(', ');
    const query = `INSERT INTO farmer_payments (${fieldsToInsert.join(', ')}) VALUES (${placeholders})`;

    try {
      const [result] = await db.execute(query, values);
      res.status(200).json({ success: true, message: 'Payment record added successfully', id: result.insertId });
    } catch (error) {
      console.error('Error inserting payment:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }

}


// PUT /api/payments/:id
async function updatePayment(req, res) {
  const { id } = req.params;
  const fields = req.body;

  if (!id) return res.status(400).json({ message: 'Missing payment id' });

  const updates = Object.keys(fields).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(fields), id];

  try {
    const [result] = await db.query(
      `UPDATE farmer_payments SET ${updates} WHERE id = ?`,
      values
    );

    res.json({ message: 'Payment record updated', affected: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
}


// PUT /api/payments/inactivate/:id
async function inactivatePayment(req, res) {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `UPDATE farmer_payments SET status = 0 WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Payment record inactivated', affected: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Inactivation failed' });
  }
};

async function activatePayment(req, res) {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `UPDATE farmer_payments SET status = 1 WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Payment record activated', affected: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Inactivation failed' });
  }
};


// Get collection by ID
// async function getpayment(req, res) {
//     let { farmer_id, datefrom, dateto, dairyid } = req.query;
//     if(!type){
//         type = 'Both';
//     }
//     console.log('Fetching payment with ID:', farmer_id, shift);
//     try {

//         // query = 'SELECT * FROM users WHERE mobile_number = ? AND role = ?';  // Filter by both mobile_number and role
//         // params = [mobile_number, role];
//         const [rows] = await db.execute('SELECT * FROM farmer_payments WHERE farmer_id = ?', [farmer_id]);
//         if (rows.length === 0) {
//             return res.status(404).json({ success: false, message: 'Collection not found' });
//         }
//         res.status(200).json({result : 1, success: true, message : "sucess", data : rows});
//     } catch (err) {
//         console.error('Error fetching collection:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// }
// async function getpayment(req, res) {
//   let { farmer_id, datefrom, dateto, dairyid } = req.query;

//   try {
//     let query = 'SELECT * FROM farmer_payments WHERE 1=1';
//     const params = [];

//     // Apply filters conditionally
//     if (farmer_id) {
//       query += ' AND farmer_id = ?';
//       params.push(farmer_id);
//     }

//     if (dairyid) {
//       query += ' AND dairy_id = ?';
//       params.push(dairyid);
//     }

//     if (datefrom && dateto) {
//       query += ' AND date BETWEEN ? AND ?';
//       params.push(datefrom, dateto);
//     } else if (datefrom) {
//       query += ' AND date >= ?';
//       params.push(datefrom);
//     } else if (dateto) {
//       query += ' AND date <= ?';
//       params.push(dateto);
//     }

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'No payments found' });
//     }

//     res.status(200).json({ result: 1, success: true, message: 'Success', data: rows });

//   } catch (err) {
//     console.error('Error fetching payments:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

async function getpayment(req, res) {
  let { farmer_id, datefrom, dateto, dairyid } = req.query;
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth(); // 0-based
  const year = today.getFullYear();

  try {
    let query = 'SELECT * FROM farmer_payments';
    const conditions = [];
    const params = [];

    // Conditionally build WHERE clause
    if (farmer_id) {
      farmer_id = farmer_id.trim()
      conditions.push('farmer_id = ?');
      params.push(farmer_id);
    }

    if (dairyid) {
      conditions.push('dairy_id = ?');
      params.push(dairyid);
    }

    let stDate, endDate = '';

    if (!datefrom && !dateto) {
      let startDate, endDate;

      if (day >= 1 && day <= 10) {
        // Last month's 21 → 30
        const lastMonth = new Date(year, month - 1);
        const y = lastMonth.getFullYear();
        const m = lastMonth.getMonth() + 1; // 1-based for string format
        startDate = `${y}-${String(m).padStart(2, '0')}-21`;
        endDate = `${y}-${String(m).padStart(2, '0')}-30`;
      } else if (day >= 11 && day <= 20) {
        // This month's 1 → 10
        const m = month + 1;
        startDate = `${year}-${String(m).padStart(2, '0')}-01`;
        endDate = `${year}-${String(m).padStart(2, '0')}-10`;
      } else if (day >= 21) {
        // This month's 11 → 20
        const m = month + 1;
        startDate = `${year}-${String(m).padStart(2, '0')}-11`;
        endDate = `${year}-${String(m).padStart(2, '0')}-20`;
      }
      stDate = startDate.trim()
      endDate = endDate.trim()
      if (startDate && endDate) {
        conditions.push('date BETWEEN ? AND ?');
        params.push(startDate, endDate);
      }
    }

    console.log(endDate)

    if (datefrom && dateto) {
      stDate = datefrom.trim()
      endDate = dateto.trim()
      conditions.push('date BETWEEN ? AND ?');
      params.push(datefrom, dateto);
    } else if (datefrom) {
      conditions.push('date >= ?');
      params.push(datefrom);
    } else if (dateto) {
      conditions.push('date <= ?');
      params.push(dateto);
    }

    // Append WHERE clause only if conditions exist
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('SQL:', query);
    console.log('Params:', params);

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: 'No payments found', data: [] });
    }

    res.status(200).json({
      startDate: params[1],
      endDate: params[2],
      result: 1,
      sum : rows.reduce((acc, curr) => acc + curr.amount_taken, 0),
      success: true,
      message: 'Success',
      data: rows
    });

  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


async function getPaymentsByDairy(req, res) {
  let { datefrom, dateto, dairyid } = req.query;
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth(); // 0-based
  const year = today.getFullYear();

  try {
    if (!dairyid) {
      return res.status(400).json({ success: false, message: "dairyid is required" });
    }

    let query = `
      SELECT 
        farmer_id, 
        dairy_id, 
        farmer_name,
        SUM(amount_taken) AS total_amount, 
        MIN(date) AS first_date, 
        MAX(date) AS last_date
      FROM farmer_payments
    `;
    const conditions = ["dairy_id = ?"];
    const params = [dairyid];

    let stDate, endDate = "";

    // Default date ranges based on current day
    if (!datefrom && !dateto) {
      let startDate, endDateCalc;

      if (day >= 1 && day <= 10) {
        const lastMonth = new Date(year, month - 1);
        const y = lastMonth.getFullYear();
        const m = lastMonth.getMonth() + 1;
        startDate = `${y}-${String(m).padStart(2, "0")}-21`;
        endDateCalc = `${y}-${String(m).padStart(2, "0")}-30`;
      } else if (day >= 11 && day <= 20) {
        const m = month + 1;
        startDate = `${year}-${String(m).padStart(2, "0")}-01`;
        endDateCalc = `${year}-${String(m).padStart(2, "0")}-10`;
      } else {
        const m = month + 1;
        startDate = `${year}-${String(m).padStart(2, "0")}-11`;
        endDateCalc = `${year}-${String(m).padStart(2, "0")}-20`;
      }
      stDate = startDate.trim();
      endDate = endDateCalc.trim();
      conditions.push("date BETWEEN ? AND ?");
      params.push(startDate, endDateCalc);
    }

    // If date range provided manually
    if (datefrom && dateto) {
      stDate = datefrom.trim();
      endDate = dateto.trim();
      conditions.push("date BETWEEN ? AND ?");
      params.push(datefrom, dateto);
    } else if (datefrom) {
      stDate = datefrom.trim();
      conditions.push("date >= ?");
      params.push(datefrom);
    } else if (dateto) {
      endDate = dateto.trim();
      conditions.push("date <= ?");
      params.push(dateto);
    }

    // Build final query
    query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY farmer_id, farmer_name, dairy_id ORDER BY farmer_id";

    console.log("SQL:", query);
    console.log("Params:", params);

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: "No payments found", data: [] });
    }

    res.status(200).json({
      startDate: stDate,
      endDate: endDate,
      result: 1,
      grand_total: rows.reduce((acc, curr) => acc + curr.total_amount, 0),
      success: true,
      message: "Success",
      data: rows
    });

  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}



// const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// function formatDate(y, m, d) {
//   return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
// }

// async function getmonthpayment(req, res) {
//   let { farmer_id, datefrom, dateto, dairyid } = req.query;
//   const today = new Date();
//   const day = today.getDate();
//   const month = today.getMonth(); // 0-based
//   const year = today.getFullYear();

//   try {
//     let query = 'SELECT * FROM farmer_payments';
//     const conditions = [];
//     const params = [];

//     if (farmer_id) {
//       farmer_id = farmer_id.trim();
//       conditions.push('farmer_id = ?');
//       params.push(farmer_id);
//     }

//     if (dairyid) {
//       conditions.push('dairy_id = ?');
//       params.push(dairyid);
//     }

//     let startDate = '';
//     let endDate = '';
//     let manualMonthMode = false;

//     // Determine date range
//     if (!datefrom && !dateto) {
//       // Auto-range by day-of-month
//       if (day >= 1 && day <= 10) {
//         const lastMonth = new Date(year, month - 1);
//         const y = lastMonth.getFullYear();
//         const m = lastMonth.getMonth() + 1;
//         startDate = `${y}-${String(m).padStart(2, '0')}-21`;
//         endDate = `${y}-${String(m).padStart(2, '0')}-30`;
//       } else if (day >= 11 && day <= 20) {
//         const m = month + 1;
//         startDate = `${year}-${String(m).padStart(2, '0')}-01`;
//         endDate = `${year}-${String(m).padStart(2, '0')}-10`;
//       } else {
//         const m = month + 1;
//         startDate = `${year}-${String(m).padStart(2, '0')}-11`;
//         endDate = `${year}-${String(m).padStart(2, '0')}-20`;
//       }

//       if (startDate && endDate) {
//         conditions.push('date BETWEEN ? AND ?');
//         params.push(startDate, endDate);
//       }
//     } else {
//       // Grouping mode for full month
//       startDate = datefrom.trim();
//       endDate = dateto.trim();
//       manualMonthMode = true;

//       conditions.push('date BETWEEN ? AND ?');
//       params.push(startDate, endDate);
//     }

//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     console.log('SQL:', query);
//     console.log('Params:', params);

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(200).json({ success: true, message: 'No payments found', data: [] });
//     }

//     // Group rows into 3 periods if full month selected
//     let group1 = [], group2 = [], group3 = [];

//     if (manualMonthMode) {
//       rows.forEach(row => {
//         const d = new Date(row.date).getDate();
//         if (d >= 1 && d <= 10) group1.push(row);
//         else if (d >= 11 && d <= 20) group2.push(row);
//         else if (d >= 21) group3.push(row);
//       });

//       return res.status(200).json({
//         result: 1,
//         success: true,
//         message: 'Success',
//         dateRange: { startDate, endDate },
//         groups: {
//           '1-10': { data: group1, total: group1.reduce((sum, r) => sum + r.amount_taken, 0) },
//           '11-20': { data: group2, total: group2.reduce((sum, r) => sum + r.amount_taken, 0) },
//           '21-30': { data: group3, total: group3.reduce((sum, r) => sum + r.amount_taken, 0) }
//         }
//       });
//     }

//     // Default non-grouped response
//     res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       dateRange: { startDate, endDate },
//       sum: rows.reduce((acc, curr) => acc + curr.amount_taken, 0),
//       data: rows
//     });

//   } catch (err) {
//     console.error('Error fetching payments:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// async function getmonthpayment(req, res) {
//   let { farmer_id, datefrom, dateto, dairyid } = req.query;
//   const today = new Date();

//   try {
//     let query = 'SELECT * FROM farmer_payments';
//     const conditions = [];
//     const params = [];

//     if (farmer_id) {
//       conditions.push('farmer_id = ?');
//       params.push(farmer_id.trim());
//     }

//     if (dairyid) {
//       conditions.push('dairy_id = ?');
//       params.push(dairyid.trim());
//     }

//     let startDate = '';
//     let endDate = '';
//     let groupByMonth = false;

//     // Determine whether to apply manual grouping
//     if (datefrom && dateto) {
//       startDate = datefrom.trim();
//       endDate = dateto.trim();
//       groupByMonth = true;

//       conditions.push('date BETWEEN ? AND ?');
//       params.push(startDate, endDate);
//     } else {
//       // Default behavior: auto-determine 10-day range based on today
//       const day = today.getDate();
//       const month = today.getMonth();
//       const year = today.getFullYear();

//       if (day <= 10) {
//         const lastMonth = new Date(year, month - 1);
//         startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-21`;
//         endDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-30`;
//       } else if (day <= 20) {
//         startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
//         endDate = `${year}-${String(month + 1).padStart(2, '0')}-10`;
//       } else {
//         startDate = `${year}-${String(month + 1).padStart(2, '0')}-11`;
//         endDate = `${year}-${String(month + 1).padStart(2, '0')}-20`;
//       }

//       conditions.push('date BETWEEN ? AND ?');
//       params.push(startDate, endDate);
//     }

//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(200).json({ success: true, message: 'No payments found', data: [] });
//     }

//     // Grouping logic per month in 10-day ranges
//     if (groupByMonth) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);

//       const groups = [];

//       for (
//         let d = new Date(start.getFullYear(), start.getMonth(), 1);
//         d <= end;
//         d.setMonth(d.getMonth() + 1)
//       ) {
//         const y = d.getFullYear();
//         const m = d.getMonth();
//         const lastDay = getDaysInMonth(y, m);

//         const range1 = {
//           label: `1-10 ${y}-${String(m + 1).padStart(2, '0')}`,
//           from: formatDate(y, m, 1),
//           to: formatDate(y, m, 10),
//           data: []
//         };
//         const range2 = {
//           label: `11-20 ${y}-${String(m + 1).padStart(2, '0')}`,
//           from: formatDate(y, m, 11),
//           to: formatDate(y, m, 20),
//           data: []
//         };
//         const range3 = {
//           label: `21-${lastDay} ${y}-${String(m + 1).padStart(2, '0')}`,
//           from: formatDate(y, m, 21),
//           to: formatDate(y, m, lastDay),
//           data: []
//         };

//         groups.push(range1, range2, range3);
//       }

//       // Fill buckets
//       for (const row of rows) {
//         const rowDate = new Date(row.date);
//         for (const group of groups) {
//           const from = new Date(group.from);
//           const to = new Date(group.to);
//           if (rowDate >= from && rowDate <= to) {
//             group.data.push(row);
//             break;
//           }
//         }
//       }

//       // Add totals
//       const resultGroups = groups.map(g => ({
//         label: g.label,
//         from: g.from,
//         to: g.to,
//         total: g.data.reduce((sum, r) => sum + r.amount_taken, 0),
//         data: g.data
//       }));

//       return res.status(200).json({
//         result: 1,
//         success: true,
//         message: 'Success',
//         grouped: resultGroups
//       });
//     }

//     // If no grouping
//     return res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       dateRange: { startDate, endDate },
//       sum: rows.reduce((acc, curr) => acc + curr.amount_taken, 0),
//       data: rows
//     });

//   } catch (err) {
//     console.error('Error fetching payments:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// async function getmonthpayment(req, res) {
//   let { farmer_id, datefrom, dateto, dairyid } = req.query;
//   const today = new Date();

//   try {
//     const conditions = [];
//     const params = [];

//     if (farmer_id) {
//       conditions.push("farmer_id = ?");
//       params.push(farmer_id.trim());
//     }

//     if (dairyid) {
//       conditions.push("dairy_id = ?");
//       params.push(dairyid.trim());
//     }

//     let startDate = "";
//     let endDate = "";
//     let groupByMonth = false;

//     if (datefrom && dateto) {
//       startDate = datefrom.trim();
//       endDate = dateto.trim();
//       groupByMonth = true;
//       conditions.push("date BETWEEN ? AND ?");
//       params.push(startDate, endDate);
//     } else {
//       const day = today.getDate();
//       const month = today.getMonth();
//       const year = today.getFullYear();

//       if (day <= 10) {
//         const lastMonth = new Date(year, month - 1);
//         startDate = `${lastMonth.getFullYear()}-${String(
//           lastMonth.getMonth() + 1
//         ).padStart(2, "0")}-21`;
//         endDate = `${lastMonth.getFullYear()}-${String(
//           lastMonth.getMonth() + 1
//         ).padStart(2, "0")}-30`;
//       } else if (day <= 20) {
//         startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
//         endDate = `${year}-${String(month + 1).padStart(2, "0")}-10`;
//       } else {
//         startDate = `${year}-${String(month + 1).padStart(2, "0")}-11`;
//         endDate = `${year}-${String(month + 1).padStart(2, "0")}-20`;
//       }
//       conditions.push("date BETWEEN ? AND ?");
//       params.push(startDate, endDate);
//     }

//     let query = `
//       SELECT 
//         farmer_id,
//         SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//         SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//         SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//         SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//         SUM(amount_taken) as total_deductions,
//         SUM(received) as total_received
//       FROM farmer_payments
//     `;

//     if (conditions.length > 0) {
//       query += " WHERE " + conditions.join(" AND ");
//     }

//     query += " GROUP BY farmer_id";

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res
//         .status(200)
//         .json({ success: true, message: "No payments found", data: [] });
//     }

//     // Till-date balance for each farmer
//     for (const r of rows) {
//       const [milkTill] = await db.execute(
//         `SELECT SUM(quantity * rate) as milk_total
//          FROM collections WHERE farmer_id=? AND DATE(created_at) <= ?`,
//         [r.farmer_id, endDate]
//       );

//       const [payTill] = await db.execute(
//         `SELECT SUM(amount_taken) as total_deductions, SUM(received) as total_received
//          FROM farmer_payments WHERE farmer_id=? AND DATE(date) <= ?`,
//         [r.farmer_id, endDate]
//       );

//       const [billTill] = await db.execute(
//         `SELECT SUM(net_payable) as total_billed
//          FROM bills WHERE farmer_id=? AND status='paid' AND DATE(created_at) <= ?`,
//         [r.farmer_id, endDate]
//       );

//       const milk_total = Number(milkTill[0]?.milk_total) || 0;
//       const total_deductions_till = Number(payTill[0]?.total_deductions) || 0;
//       const total_received_till = Number(payTill[0]?.total_received) || 0;
//       const total_billed_till = Number(billTill[0]?.total_billed) || 0;

//       r.remaining_balance =
//         milk_total - total_deductions_till + total_received_till - total_billed_till;
//     }

//     return res.status(200).json({
//       result: 1,
//       success: true,
//       message: "Success",
//       dateRange: { startDate, endDate },
//       data: rows,
//     });
//   } catch (err) {
//     console.error("Error fetching payments:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getmonthpayment(req, res) {
//   let { farmer_id, datefrom, dateto, dairyid } = req.query;
//   const today = new Date();

//   try {
//     if (!farmer_id || !dairyid) {
//       return res.status(400).json({
//         success: false,
//         message: "farmer_id and dairyid are required",
//       });
//     }

//     let query = "SELECT * FROM farmer_payments";
//     const conditions = [];
//     const params = [];

//     conditions.push("farmer_id = ?");
//     params.push(farmer_id.trim());

//     conditions.push("dairy_id = ?");
//     params.push(dairyid.trim());

//     let startDate = "";
//     let endDate = "";
//     let groupByMonth = false;

//     if (datefrom && dateto) {
//       startDate = datefrom.trim();
//       endDate = dateto.trim();
//       groupByMonth = true;

//       conditions.push("date BETWEEN ? AND ?");
//       params.push(startDate, endDate);
//     } else {
//       // default 10-day range
//       const day = today.getDate();
//       const month = today.getMonth();
//       const year = today.getFullYear();

//       if (day <= 10) {
//         const lastMonth = new Date(year, month - 1);
//         startDate = `${lastMonth.getFullYear()}-${String(
//           lastMonth.getMonth() + 1
//         ).padStart(2, "0")}-21`;
//         endDate = `${lastMonth.getFullYear()}-${String(
//           lastMonth.getMonth() + 1
//         ).padStart(2, "0")}-30`;
//       } else if (day <= 20) {
//         startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
//         endDate = `${year}-${String(month + 1).padStart(2, "0")}-10`;
//       } else {
//         startDate = `${year}-${String(month + 1).padStart(2, "0")}-11`;
//         endDate = `${year}-${String(month + 1).padStart(2, "0")}-20`;
//       }

//       conditions.push("date BETWEEN ? AND ?");
//       params.push(startDate, endDate);
//     }

//     if (conditions.length > 0) {
//       query += " WHERE " + conditions.join(" AND ");
//     }

//     const [rows] = await db.execute(query, params);

//     // --- Grouping logic ---
//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     const groups = [];

//     for (
//       let d = new Date(start.getFullYear(), start.getMonth(), 1);
//       d <= end;
//       d.setMonth(d.getMonth() + 1)
//     ) {
//       const y = d.getFullYear();
//       const m = d.getMonth();
//       const lastDay = new Date(y, m + 1, 0).getDate();

//       groups.push(
//         {
//           label: `1-10 ${y}-${String(m + 1).padStart(2, "0")}`,
//           from: `${y}-${String(m + 1).padStart(2, "0")}-01`,
//           to: `${y}-${String(m + 1).padStart(2, "0")}-10`,
//           data: [],
//         },
//         {
//           label: `11-20 ${y}-${String(m + 1).padStart(2, "0")}`,
//           from: `${y}-${String(m + 1).padStart(2, "0")}-11`,
//           to: `${y}-${String(m + 1).padStart(2, "0")}-20`,
//           data: [],
//         },
//         {
//           label: `21-${lastDay} ${y}-${String(m + 1).padStart(2, "0")}`,
//           from: `${y}-${String(m + 1).padStart(2, "0")}-21`,
//           to: `${y}-${String(m + 1).padStart(2, "0")}-${lastDay}`,
//           data: [],
//         }
//       );
//     }

//     // Place payments in groups
//     for (const row of rows) {
//       const rowDate = new Date(row.date);
//       for (const group of groups) {
//         const from = new Date(group.from);
//         const to = new Date(group.to);
//         if (rowDate >= from && rowDate <= to) {
//           group.data.push(row);
//           break;
//         }
//       }
//     }

//     // --- Compute totals + remaining balance ---
//     const resultGroups = [];

//     for (const g of groups) {
//       const totalDeductions = g.data.reduce(
//         (sum, r) => sum + (Number(r.amount_taken) || 0),
//         0
//       );
//       const totalReceived = g.data.reduce(
//         (sum, r) => sum + (Number(r.received) || 0),
//         0
//       );

//       // Get milk total till group end date
//       const [milkRows] = await db.execute(
//         `SELECT SUM(quantity*rate) as milk_total
//          FROM collections
//          WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) <= ?`,
//         [dairyid, farmer_id, g.to]
//       );

//       const milkTotal = Number(milkRows[0]?.milk_total) || 0;

//       const remaining_balance = milkTotal - totalDeductions + totalReceived;

//       resultGroups.push({
//         label: g.label,
//         from: g.from,
//         to: g.to,
//         total: totalDeductions,
//         received: totalReceived,
//         remaining_balance,
//         data: g.data,
//       });
//     }

//     return res.status(200).json({
//       result: 1,
//       success: true,
//       message: "Success",
//       grouped: resultGroups,
//     });
//   } catch (err) {
//     console.error("Error fetching payments:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

async function getmonthpayment(req, res) {
  let { farmer_id, datefrom, dateto, dairyid } = req.query;
  const today = new Date();

  try {
    if (!farmer_id || !dairyid) {
      return res.status(400).json({
        success: false,
        message: "farmer_id and dairyid are required",
      });
    }

    let query = "SELECT * FROM farmer_payments";
    const conditions = [];
    const params = [];

    conditions.push("farmer_id = ?");
    params.push(farmer_id.trim());

    conditions.push("dairy_id = ?");
    params.push(dairyid.trim());

    let startDate = "";
    let endDate = "";
    let groupByMonth = false;

    if (datefrom && dateto) {
      startDate = datefrom.trim();
      endDate = dateto.trim();
      groupByMonth = true;

      conditions.push("date BETWEEN ? AND ?");
      params.push(startDate, endDate);
    } else {
      // default 10-day range
      const day = today.getDate();
      const month = today.getMonth();
      const year = today.getFullYear();

      if (day <= 10) {
        const lastMonth = new Date(year, month - 1);
        startDate = `${lastMonth.getFullYear()}-${String(
          lastMonth.getMonth() + 1
        ).padStart(2, "0")}-21`;
        endDate = `${lastMonth.getFullYear()}-${String(
          lastMonth.getMonth() + 1
        ).padStart(2, "0")}-30`;
      } else if (day <= 20) {
        startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        endDate = `${year}-${String(month + 1).padStart(2, "0")}-10`;
      } else {
        startDate = `${year}-${String(month + 1).padStart(2, "0")}-11`;
        endDate = `${year}-${String(month + 1).padStart(2, "0")}-20`;
      }

      conditions.push("date BETWEEN ? AND ?");
      params.push(startDate, endDate);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await db.execute(query, params);

    // --- Grouping logic ---
    const start = new Date(startDate);
    const end = new Date(endDate);

    const groups = [];

    for (
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      d <= end;
      d.setMonth(d.getMonth() + 1)
    ) {
      const y = d.getFullYear();
      const m = d.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();

      groups.push(
        {
          label: `1-10 ${y}-${String(m + 1).padStart(2, "0")}`,
          from: `${y}-${String(m + 1).padStart(2, "0")}-01`,
          to: `${y}-${String(m + 1).padStart(2, "0")}-10`,
          data: [],
        },
        {
          label: `11-20 ${y}-${String(m + 1).padStart(2, "0")}`,
          from: `${y}-${String(m + 1).padStart(2, "0")}-11`,
          to: `${y}-${String(m + 1).padStart(2, "0")}-20`,
          data: [],
        },
        {
          label: `21-${lastDay} ${y}-${String(m + 1).padStart(2, "0")}`,
          from: `${y}-${String(m + 1).padStart(2, "0")}-21`,
          to: `${y}-${String(m + 1).padStart(2, "0")}-${lastDay}`,
          data: [],
        }
      );
    }

    // Place payments in groups
    for (const row of rows) {
      const rowDate = new Date(row.date);
      for (const group of groups) {
        const from = new Date(group.from);
        const to = new Date(group.to);
        if (rowDate >= from && rowDate <= to) {
          group.data.push(row);
          break;
        }
      }
    }

    // --- Compute totals per group (without remaining balance) ---
    const resultGroups = groups.map((g) => ({
      label: g.label,
      from: g.from,
      to: g.to,
      total: g.data.reduce((sum, r) => sum + Number(r.amount_taken || 0), 0),
      received: g.data.reduce((sum, r) => sum + Number(r.received || 0), 0),
      data: g.data,
    }));

    // --- Compute overall remaining balance ---
    const [milkRows] = await db.execute(
      `SELECT SUM(quantity*rate) as milk_total
       FROM collections
       WHERE dairy_id=? AND farmer_id=?`,
      [dairyid, farmer_id]
    );

    const [payRows] = await db.execute(
      `SELECT 
         SUM(amount_taken) as total_deductions,
         SUM(received) as total_received
       FROM farmer_payments
       WHERE dairy_id=? AND farmer_id=?`,
      [dairyid, farmer_id]
    );

    const milkTotal = Number(milkRows[0]?.milk_total) || 0;
    const totalDeductions = Number(payRows[0]?.total_deductions) || 0;
    const totalReceived = Number(payRows[0]?.total_received) || 0;

    const remaining_balance = milkTotal - totalDeductions + totalReceived;

    // --- Final response ---
    return res.status(200).json({
      result: 1,
      success: true,
      message: "Success",
      grouped: resultGroups,
      remaining_balance,
    });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;
//   if (!dairyid) {
//     return res.status(400).json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     const conditions = ["dairy_id = ?"];
//     const params = [dairyid];
//     let stDate, endDate;

//     // ---- Date filter ----
//     if (datefrom && dateto) {
//       stDate = datefrom.trim();
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) BETWEEN ? AND ?");
//       params.push(stDate, endDate);
//     } else if (datefrom) {
//       stDate = datefrom.trim();
//       conditions.push("DATE(created_at) >= ?");
//       params.push(stDate);
//     } else if (dateto) {
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) <= ?");
//       params.push(endDate);
//     }

//     // ---- Collections Query (farmer-wise total) ----
//     let collectionQuery = `
//       SELECT farmer_id, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE ${conditions.join(" AND ")}
//       GROUP BY farmer_id
//     `;

//     // ---- Payments Query (farmer-wise total) ----
//     let paymentQuery = `
//       SELECT farmer_id,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//     `;
//     const payParams = [dairyid];

//     if (stDate && endDate) {
//       paymentQuery += " AND DATE(date) BETWEEN ? AND ?";
//       payParams.push(stDate, endDate);
//     } else if (stDate) {
//       paymentQuery += " AND DATE(date) >= ?";
//       payParams.push(stDate);
//     } else if (endDate) {
//       paymentQuery += " AND DATE(date) <= ?";
//       payParams.push(endDate);
//     }

//     paymentQuery += " GROUP BY farmer_id";

//     // ---- Run Queries ----
//     const [collections] = await db.execute(collectionQuery, params);
//     const [payments] = await db.execute(paymentQuery, payParams);

//     // ---- Merge farmer totals ----
//     const summary = {};

//     collections.forEach(c => {
//       summary[c.farmer_id] = {
//         farmer_id: c.farmer_id,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: {
//           advance: 0,
//           cattle_feed: 0,
//           other1: 0,
//           other2: 0,
//           total: 0
//         },
//         net_payable: Number(c.milk_total) || 0
//       };
//     });

//     payments.forEach(p => {
//       if (!summary[p.farmer_id]) {
//         summary[p.farmer_id] = {
//           farmer_id: p.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: {
//             advance: 0,
//             cattle_feed: 0,
//             other1: 0,
//             other2: 0,
//             total: 0
//           },
//           net_payable: 0
//         };
//       }

//       summary[p.farmer_id].total_received = Number(p.total_received) || 0;
//       summary[p.farmer_id].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0
//       };

//       summary[p.farmer_id].net_payable =
//         summary[p.farmer_id].milk_total -
//         summary[p.farmer_id].deductions.total +
//         summary[p.farmer_id].total_received;
//     });

//     // ---- Convert object → array ----
//     const result = Object.values(summary);

//     // ---- Grand totals ----
//     const grand = result.reduce(
//       (acc, f) => {
//         acc.milk_total += f.milk_total;
//         acc.total_deductions += f.deductions?.total || 0;
//         acc.total_received += f.total_received || 0;
//         acc.net_payable += f.net_payable || 0;
//         return acc;
//       },
//       { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
//     );

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate || null,
//       endDate: endDate || null,
//       farmers: result,
//       grandTotals: grand
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;
//   if (!dairyid) {
//     return res.status(400).json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     const conditions = ["dairy_id = ?"];
//     const params = [dairyid];
//     let stDate, endDate;

//     // ---- Date filter ----
//     if (datefrom && dateto) {
//       stDate = datefrom.trim();
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) BETWEEN ? AND ?");
//       params.push(stDate, endDate);
//     } else if (datefrom) {
//       stDate = datefrom.trim();
//       conditions.push("DATE(created_at) >= ?");
//       params.push(stDate);
//     } else if (dateto) {
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) <= ?");
//       params.push(endDate);
//     }

//     // ---- Collections Query (farmer-wise total) ----
//     let collectionQuery = `
//       SELECT farmer_id, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE ${conditions.join(" AND ")}
//       GROUP BY farmer_id
//     `;

//     // ---- Payments Query (farmer-wise total) ----
//     let paymentQuery = `
//       SELECT farmer_id,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//     `;
//     const payParams = [dairyid];

//     if (stDate && endDate) {
//       paymentQuery += " AND DATE(date) BETWEEN ? AND ?";
//       payParams.push(stDate, endDate);
//     } else if (stDate) {
//       paymentQuery += " AND DATE(date) >= ?";
//       payParams.push(stDate);
//     } else if (endDate) {
//       paymentQuery += " AND DATE(date) <= ?";
//       payParams.push(endDate);
//     }

//     paymentQuery += " GROUP BY farmer_id";

//     // ---- Bills Query (farmer-wise total) ----
//     let billQuery = `
//       SELECT farmer_id,
//             milk_total,
//             advance_total,
//             received_total,
//             net_payable,
//             period_start,
//             period_end,
//             status,
//             is_finalized
//       FROM bills
//       WHERE dairy_id = ?
//     `;

//     const billParams = [dairyid];

//     if (stDate && endDate) {
//       billQuery += " AND DATE(period_start) >= ? AND DATE(period_end) <= ?";
//       billParams.push(stDate, endDate);
//     } else if (stDate) {
//       billQuery += " AND DATE(period_end) >= ?";
//       billParams.push(stDate);
//     } else if (endDate) {
//       billQuery += " AND DATE(period_start) <= ?";
//       billParams.push(endDate);
//     }

//     billQuery += " ORDER BY farmer_id, period_start";

//     // ---- Run Queries ----
//     const [collections] = await db.execute(collectionQuery, params);
//     const [payments] = await db.execute(paymentQuery, payParams);
//     const [bills] = await db.execute(billQuery, billParams);

//     // ---- Merge farmer totals ----
//     const summary = {};

//     // 1. Collections
//     collections.forEach(c => {
//       summary[c.farmer_id] = {
//         farmer_id: c.farmer_id,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//         net_payable: Number(c.milk_total) || 0,
//         from_bills: { milk_total: 0, advance_total: 0, received_total: 0, net_payable: 0 }
//       };
//     });

//     // 2. Payments
//     payments.forEach(p => {
//       if (!summary[p.farmer_id]) {
//         summary[p.farmer_id] = {
//           farmer_id: p.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: { milk_total: 0, advance_total: 0, received_total: 0, net_payable: 0 }
//         };
//       }

//       summary[p.farmer_id].total_received = Number(p.total_received) || 0;
//       summary[p.farmer_id].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0
//       };

//       summary[p.farmer_id].net_payable =
//         summary[p.farmer_id].milk_total -
//         summary[p.farmer_id].deductions.total +
//         summary[p.farmer_id].total_received;
//     });

//     // 3. Bills (merge existing bill data too)
//     bills.forEach(b => {
//       if (!summary[b.farmer_id]) {
//         summary[b.farmer_id] = {
//           farmer_id: b.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: { milk_total: 0, advance_total: 0, received_total: 0, net_payable: 0 }
//         };
//       }

//       summary[b.farmer_id].from_bills = {
//         milk_total: Number(b.milk_total) || 0,
//         advance_total: Number(b.advance_total) || 0,
//         received_total: Number(b.received_total) || 0,
//         net_payable: Number(b.net_payable) || 0
//       };

//       // Add bill values to current totals
//       summary[b.farmer_id].milk_total += Number(b.milk_total) || 0;
//       summary[b.farmer_id].total_received += Number(b.received_total) || 0;
//       summary[b.farmer_id].net_payable += Number(b.net_payable) || 0;
//     });

//     // ---- Convert object → array ----
//     const result = Object.values(summary);

//     // ---- Grand totals ----
//     const grand = result.reduce(
//       (acc, f) => {
//         acc.milk_total += f.milk_total;
//         acc.total_deductions += f.deductions?.total || 0;
//         acc.total_received += f.total_received || 0;
//         acc.net_payable += f.net_payable || 0;
//         return acc;
//       },
//       { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
//     );

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate || null,
//       endDate: endDate || null,
//       farmers: result,
//       grandTotals: grand
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;
//   if (!dairyid) {
//     return res.status(400).json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     const conditions = ["dairy_id = ?"];
//     const params = [dairyid];
//     let stDate, endDate;

//     // ---- Date filter ----
//     if (datefrom && dateto) {
//       stDate = datefrom.trim();
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) BETWEEN ? AND ?");
//       params.push(stDate, endDate);
//     } else if (datefrom) {
//       stDate = datefrom.trim();
//       conditions.push("DATE(created_at) >= ?");
//       params.push(stDate);
//     } else if (dateto) {
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) <= ?");
//       params.push(endDate);
//     }

//     // ---- Collections Query ----
//     let collectionQuery = `
//       SELECT farmer_id, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE ${conditions.join(" AND ")}
//       GROUP BY farmer_id
//     `;

//     // ---- Payments Query ----
//     let paymentQuery = `
//       SELECT farmer_id,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//     `;
//     const payParams = [dairyid];

//     if (stDate && endDate) {
//       paymentQuery += " AND DATE(date) BETWEEN ? AND ?";
//       payParams.push(stDate, endDate);
//     } else if (stDate) {
//       paymentQuery += " AND DATE(date) >= ?";
//       payParams.push(stDate);
//     } else if (endDate) {
//       paymentQuery += " AND DATE(date) <= ?";
//       payParams.push(endDate);
//     }

//     paymentQuery += " GROUP BY farmer_id";

//     // ---- Bills Query ----
//     let billQuery = `
//       SELECT farmer_id,
//             milk_total,
//             advance_total,
//             received_total,
//             net_payable,
//             advance_remaining,
//             cattlefeed_remaining,
//             other1_remaining,
//             other2_remaining,
//             period_start,
//             period_end,
//             status,
//             is_finalized
//       FROM bills
//       WHERE dairy_id = ?
//     `;

//     const billParams = [dairyid];

//     if (stDate && endDate) {
//       billQuery += " AND DATE(period_start) >= ? AND DATE(period_end) <= ?";
//       billParams.push(stDate, endDate);
//     } else if (stDate) {
//       billQuery += " AND DATE(period_end) >= ?";
//       billParams.push(stDate);
//     } else if (endDate) {
//       billQuery += " AND DATE(period_start) <= ?";
//       billParams.push(endDate);
//     }

//     billQuery += " ORDER BY farmer_id, period_start";

//     // ---- Run Queries ----
//     const [collections] = await db.execute(collectionQuery, params);
//     const [payments] = await db.execute(paymentQuery, payParams);
//     const [bills] = await db.execute(billQuery, billParams);

//     // ---- Merge farmer totals ----
//     const summary = {};

//     // 1. Collections
//     collections.forEach(c => {
//       summary[c.farmer_id] = {
//         farmer_id: c.farmer_id,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//         net_payable: Number(c.milk_total) || 0,
//         from_bills: {
//           milk_total: 0,
//           advance_total: 0,
//           received_total: 0,
//           net_payable: 0,
//           advance_remaining: 0,
//           cattlefeed_remaining: 0,
//           other1_remaining: 0,
//           other2_remaining: 0
//         }
//       };
//     });

//     // 2. Payments
//     payments.forEach(p => {
//       if (!summary[p.farmer_id]) {
//         summary[p.farmer_id] = {
//           farmer_id: p.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0
//           }
//         };
//       }

//       summary[p.farmer_id].total_received = Number(p.total_received) || 0;
//       summary[p.farmer_id].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0
//       };

//       summary[p.farmer_id].net_payable =
//         summary[p.farmer_id].milk_total -
//         summary[p.farmer_id].deductions.total +
//         summary[p.farmer_id].total_received;
//     });

//     // 3. Bills
//     bills.forEach(b => {
//       if (!summary[b.farmer_id]) {
//         summary[b.farmer_id] = {
//           farmer_id: b.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0
//           }
//         };
//       }

//       summary[b.farmer_id].from_bills = {
//         milk_total: Number(b.milk_total) || 0,
//         advance_total: Number(b.advance_total) || 0,
//         received_total: Number(b.received_total) || 0,
//         net_payable: Number(b.net_payable) || 0,
//         advance_remaining: Number(b.advance_remaining) || 0,
//         cattlefeed_remaining: Number(b.cattlefeed_remaining) || 0,
//         other1_remaining: Number(b.other1_remaining) || 0,
//         other2_remaining: Number(b.other2_remaining) || 0
//       };

//       // Add bill values to current totals
//       summary[b.farmer_id].milk_total += Number(b.milk_total) || 0;
//       summary[b.farmer_id].total_received += Number(b.received_total) || 0;
//       summary[b.farmer_id].net_payable += Number(b.net_payable) || 0;
//     });

//     // ---- Convert object → array ----
//     const result = Object.values(summary);

//     // ---- Grand totals ----
//     const grand = result.reduce(
//       (acc, f) => {
//         acc.milk_total += f.milk_total;
//         acc.total_deductions += f.deductions?.total || 0;
//         acc.total_received += f.total_received || 0;
//         acc.net_payable += f.net_payable || 0;
//         return acc;
//       },
//       { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
//     );

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate || null,
//       endDate: endDate || null,
//       farmers: result,
//       grandTotals: grand
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }


// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;
//   if (!dairyid) {
//     return res.status(400).json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     const conditions = ["dairy_id = ?"];
//     const params = [dairyid];
//     let stDate, endDate;

//     if (datefrom && dateto) {
//       stDate = datefrom.trim();
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) BETWEEN ? AND ?");
//       params.push(stDate, endDate);
//     } else if (datefrom) {
//       stDate = datefrom.trim();
//       conditions.push("DATE(created_at) >= ?");
//       params.push(stDate);
//     } else if (dateto) {
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) <= ?");
//       params.push(endDate);
//     }

//     const collectionQuery = `
//       SELECT farmer_id, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE ${conditions.join(" AND ")}
//       GROUP BY farmer_id
//     `;

//     const paymentQuery = `
//       SELECT farmer_id,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//       GROUP BY farmer_id
//     `;
//     const payParams = [dairyid];

//     const billQuery = `
//       SELECT farmer_id,
//             milk_total, advance_total, received_total, net_payable,
//             advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//             cattlefeed_total, other1_total, other2_total,
//             period_start, period_end, status, is_finalized
//       FROM bills
//       WHERE dairy_id = ?
//       ORDER BY farmer_id, period_start
//     `;
//     const billParams = [dairyid];

//     const [collections] = await db.execute(collectionQuery, params);
//     const [payments] = await db.execute(paymentQuery, payParams);
//     const [bills] = await db.execute(billQuery, billParams);

//     const summary = {};

//     // collections
//     collections.forEach(c => {
//       summary[c.farmer_id] = {
//         farmer_id: c.farmer_id,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//         net_payable: Number(c.milk_total) || 0,
//         from_bills: {
//           milk_total: 0,
//           advance_total: 0,
//           received_total: 0,
//           net_payable: 0,
//           advance_remaining: 0,
//           cattlefeed_remaining: 0,
//           other1_remaining: 0,
//           other2_remaining: 0,
//           cattlefeed_total: 0,
//           other1_total: 0,
//           other2_total: 0
//         }
//       };
//     });

//     // payments
//     payments.forEach(p => {
//       if (!summary[p.farmer_id]) {
//         summary[p.farmer_id] = {
//           farmer_id: p.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0
//           }
//         };
//       }
//       summary[p.farmer_id].total_received = Number(p.total_received) || 0;
//       summary[p.farmer_id].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0
//       };
//       summary[p.farmer_id].net_payable =
//         summary[p.farmer_id].milk_total -
//         summary[p.farmer_id].deductions.total +
//         summary[p.farmer_id].total_received;
//     });

//     // bills
//     bills.forEach(b => {
//       if (!summary[b.farmer_id]) {
//         summary[b.farmer_id] = {
//           farmer_id: b.farmer_id,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0
//           }
//         };
//       }

//       summary[b.farmer_id].from_bills = {
//         milk_total: Number(b.milk_total) || 0,
//         advance_total: Number(b.advance_total) || 0,
//         received_total: Number(b.received_total) || 0,
//         net_payable: Number(b.net_payable) || 0,
//         advance_remaining: Number(b.advance_remaining) || 0,
//         cattlefeed_remaining: Number(b.cattlefeed_remaining) || 0,
//         other1_remaining: Number(b.other1_remaining) || 0,
//         other2_remaining: Number(b.other2_remaining) || 0,
//         cattlefeed_total: Number(b.cattlefeed_total) || 0,
//         other1_total: Number(b.other1_total) || 0,
//         other2_total: Number(b.other2_total) || 0
//       };

//       summary[b.farmer_id].milk_total += Number(b.milk_total) || 0;
//       summary[b.farmer_id].total_received += Number(b.received_total) || 0;
//       summary[b.farmer_id].net_payable += Number(b.net_payable) || 0;
//     });

//     const result = Object.values(summary);
//     const grand = result.reduce(
//       (acc, f) => {
//         acc.milk_total += f.milk_total;
//         acc.total_deductions += f.deductions?.total || 0;
//         acc.total_received += f.total_received || 0;
//         acc.net_payable += f.net_payable || 0;
//         return acc;
//       },
//       { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
//     );

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate || null,
//       endDate: endDate || null,
//       farmers: result,
//       grandTotals: grand
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;
//   if (!dairyid) {
//     return res.status(400).json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     const conditions = ["dairy_id = ?"];
//     const params = [dairyid];
//     let stDate, endDate;

//     if (datefrom && dateto) {
//       stDate = datefrom.trim();
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) BETWEEN ? AND ?");
//       params.push(stDate, endDate);
//     } else if (datefrom) {
//       stDate = datefrom.trim();
//       conditions.push("DATE(created_at) >= ?");
//       params.push(stDate);
//     } else if (dateto) {
//       endDate = dateto.trim();
//       conditions.push("DATE(created_at) <= ?");
//       params.push(endDate);
//     }

//     // ---- Collections grouped by date + farmer ----
//     const collectionQuery = `
//       SELECT farmer_id, DATE(created_at) as date, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE ${conditions.join(" AND ")}
//       GROUP BY farmer_id, DATE(created_at)
//       ORDER BY DATE(created_at)
//     `;

//     // ---- Payments grouped by date + farmer ----
//     const paymentQuery = `
//       SELECT farmer_id, DATE(date) as date,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//       GROUP BY farmer_id, DATE(date)
//       ORDER BY DATE(date)
//     `;
//     const payParams = [dairyid];

//     // ---- Bills grouped by date + farmer ----
//     const billQuery = `
//       SELECT farmer_id,
//              DATE(period_start) as date,
//              milk_total, advance_total, received_total, net_payable,
//              advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//              cattlefeed_total, other1_total, other2_total,
//              status, is_finalized
//       FROM bills
//       WHERE dairy_id = ?
//       ORDER BY DATE(period_start)
//     `;
//     const billParams = [dairyid];

//     const [collections] = await db.execute(collectionQuery, params);
//     const [payments] = await db.execute(paymentQuery, payParams);
//     const [bills] = await db.execute(billQuery, billParams);

//     // ---- Merge data by farmer_id + date ----
//     const summary = {};

//     // collections
//     collections.forEach(c => {
//       const key = `${c.farmer_id}_${c.date}`;
//       summary[key] = {
//         farmer_id: c.farmer_id,
//         date: c.date,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//         net_payable: Number(c.milk_total) || 0,
//         from_bills: {
//           milk_total: 0,
//           advance_total: 0,
//           received_total: 0,
//           net_payable: 0,
//           advance_remaining: 0,
//           cattlefeed_remaining: 0,
//           other1_remaining: 0,
//           other2_remaining: 0,
//           cattlefeed_total: 0,
//           other1_total: 0,
//           other2_total: 0,
//           status: "pending"
//         }
//       };
//     });

//     // payments
//     payments.forEach(p => {
//       const key = `${p.farmer_id}_${p.date}`;
//       if (!summary[key]) {
//         summary[key] = {
//           farmer_id: p.farmer_id,
//           date: p.date,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0,
//             status: "pending"
//           }
//         };
//       }
//       summary[key].total_received = Number(p.total_received) || 0;
//       summary[key].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0
//       };
//       summary[key].net_payable =
//         summary[key].milk_total -
//         summary[key].deductions.total +
//         summary[key].total_received;
//     });

//     // bills
//     bills.forEach(b => {
//       const key = `${b.farmer_id}_${b.date}`;
//       if (!summary[key]) {
//         summary[key] = {
//           farmer_id: b.farmer_id,
//           date: b.date,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0,
//             status: b.status
//           }
//         };
//       }

//       summary[key].from_bills = {
//         milk_total: Number(b.milk_total) || 0,
//         advance_total: Number(b.advance_total) || 0,
//         received_total: Number(b.received_total) || 0,
//         net_payable: Number(b.net_payable) || 0,
//         advance_remaining: Number(b.advance_remaining) || 0,
//         cattlefeed_remaining: Number(b.cattlefeed_remaining) || 0,
//         other1_remaining: Number(b.other1_remaining) || 0,
//         other2_remaining: Number(b.other2_remaining) || 0,
//         cattlefeed_total: Number(b.cattlefeed_total) || 0,
//         other1_total: Number(b.other1_total) || 0,
//         other2_total: Number(b.other2_total) || 0,
//         status: b.status
//       };
//     });

//     // Convert object to date-grouped array
//     const groupedByDate = {};
//     Object.values(summary).forEach(item => {
//       if (!groupedByDate[item.date]) groupedByDate[item.date] = [];
//       groupedByDate[item.date].push(item);
//     });

//     // Format final result
//     const result = Object.keys(groupedByDate)
//       .sort()
//       .map(date => ({
//         date,
//         farmers: groupedByDate[date]
//       }));

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate || null,
//       endDate: endDate || null,
//       data: result
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;

//   if (!dairyid) {
//     return res.status(400).json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     // --- Base variables ---
//     let stDate = datefrom ? datefrom.trim() : null;
//     let endDate = dateto ? dateto.trim() : null;
//     if (!stDate || !endDate) {
//       return res.status(400).json({ success: false, message: "datefrom and dateto are required" });
//     }

//     // ---- COLLECTIONS (grouped by date & farmer) ----
//     const [collections] = await db.execute(
//       `
//       SELECT farmer_id, DATE(created_at) as date, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE dairy_id = ?
//         AND DATE(created_at) BETWEEN ? AND ?
//       GROUP BY farmer_id, DATE(created_at)
//       ORDER BY DATE(created_at)
//       `,
//       [dairyid, stDate, endDate]
//     );

//     // ---- PAYMENTS (grouped by date & farmer) ----
//     const [payments] = await db.execute(
//       `
//       SELECT farmer_id, DATE(date) as date,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//         AND DATE(date) BETWEEN ? AND ?
//       GROUP BY farmer_id, DATE(date)
//       ORDER BY DATE(date)
//       `,
//       [dairyid, stDate, endDate]
//     );

//     // ---- BILLS (grouped by date & farmer) ----
//     const [bills] = await db.execute(
//       `
//       SELECT farmer_id, DATE(period_start) as date,
//              milk_total, advance_total, received_total, net_payable,
//              advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//              cattlefeed_total, other1_total, other2_total,
//              status, is_finalized
//       FROM bills
//       WHERE dairy_id = ?
//         AND DATE(period_start) BETWEEN ? AND ?
//       ORDER BY DATE(period_start)
//       `,
//       [dairyid, stDate, endDate]
//     );

//     // ---- Combine results ----
//     const summary = {};

//     // Collections
//     collections.forEach(c => {
//       const key = `${c.farmer_id}_${c.date}`;
//       summary[key] = {
//         farmer_id: c.farmer_id,
//         date: c.date,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//         net_payable: Number(c.milk_total) || 0,
//         from_bills: {
//           milk_total: 0,
//           advance_total: 0,
//           received_total: 0,
//           net_payable: 0,
//           advance_remaining: 0,
//           cattlefeed_remaining: 0,
//           other1_remaining: 0,
//           other2_remaining: 0,
//           cattlefeed_total: 0,
//           other1_total: 0,
//           other2_total: 0,
//           status: "pending"
//         }
//       };
//     });

//     // Payments
//     payments.forEach(p => {
//       const key = `${p.farmer_id}_${p.date}`;
//       if (!summary[key]) {
//         summary[key] = {
//           farmer_id: p.farmer_id,
//           date: p.date,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0,
//             status: "pending"
//           }
//         };
//       }

//       summary[key].total_received = Number(p.total_received) || 0;
//       summary[key].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0
//       };
//       summary[key].net_payable =
//         summary[key].milk_total -
//         summary[key].deductions.total +
//         summary[key].total_received;
//     });

//     // Bills
//     bills.forEach(b => {
//       const key = `${b.farmer_id}_${b.date}`;
//       if (!summary[key]) {
//         summary[key] = {
//           farmer_id: b.farmer_id,
//           date: b.date,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0,
//             status: b.status
//           }
//         };
//       }

//       summary[key].from_bills = {
//         milk_total: Number(b.milk_total) || 0,
//         advance_total: Number(b.advance_total) || 0,
//         received_total: Number(b.received_total) || 0,
//         net_payable: Number(b.net_payable) || 0,
//         advance_remaining: Number(b.advance_remaining) || 0,
//         cattlefeed_remaining: Number(b.cattlefeed_remaining) || 0,
//         other1_remaining: Number(b.other1_remaining) || 0,
//         other2_remaining: Number(b.other2_remaining) || 0,
//         cattlefeed_total: Number(b.cattlefeed_total) || 0,
//         other1_total: Number(b.other1_total) || 0,
//         other2_total: Number(b.other2_total) || 0,
//         status: b.status
//       };
//     });

//     // ---- Group by date ----
//     const groupedByDate = {};
//     Object.values(summary).forEach(item => {
//       if (!groupedByDate[item.date]) groupedByDate[item.date] = [];
//       groupedByDate[item.date].push(item);
//     });

//     // ---- Final formatted result ----
//     const result = Object.keys(groupedByDate)
//       .sort()
//       .map(date => ({
//         date,
//         farmers: groupedByDate[date]
//       }));

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate,
//       endDate: endDate,
//       data: result
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getDairyBillSummary(req, res) {
//   let { dairyid, datefrom, dateto } = req.query;

//   if (!dairyid) {
//     return res
//       .status(400)
//       .json({ success: false, message: "dairyid is required" });
//   }

//   try {
//     // --- Validate date range ---
//     const stDate = datefrom ? datefrom.trim() : null;
//     const endDate = dateto ? dateto.trim() : null;

//     if (!stDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Both datefrom and dateto are required",
//       });
//     }

//     // ---- COLLECTIONS (grouped by date & farmer) ----
//     const [collections] = await db.execute(
//       `
//       SELECT farmer_id, DATE(created_at) as date, SUM(quantity*rate) as milk_total
//       FROM collections
//       WHERE dairy_id = ?
//         AND DATE(created_at) BETWEEN ? AND ?
//       GROUP BY farmer_id, DATE(created_at)
//       ORDER BY DATE(created_at) ASC
//       `,
//       [dairyid, stDate, endDate]
//     );

//     // ---- PAYMENTS (grouped by date & farmer) ----
//     const [payments] = await db.execute(
//       `
//       SELECT farmer_id, DATE(date) as date,
//              SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
//              SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
//              SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
//              SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
//              SUM(amount_taken) as total_deductions,
//              SUM(received) as total_received
//       FROM farmer_payments
//       WHERE dairy_id = ?
//         AND DATE(date) BETWEEN ? AND ?
//       GROUP BY farmer_id, DATE(date)
//       ORDER BY DATE(date) ASC
//       `,
//       [dairyid, stDate, endDate]
//     );

//     // ---- BILLS (grouped by date & farmer) ----
//     const [bills] = await db.execute(
//       `
//       SELECT farmer_id, DATE(period_start) as date,
//              milk_total, advance_total, received_total, net_payable,
//              advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//              cattlefeed_total, other1_total, other2_total,
//              status, is_finalized
//       FROM bills
//       WHERE dairy_id = ?
//         AND DATE(period_start) BETWEEN ? AND ?
//       ORDER BY DATE(period_start) ASC
//       `,
//       [dairyid, stDate, endDate]
//     );

//     // ---- Merge all ----
//     const summary = {};

//     // Collections
//     collections.forEach((c) => {
//       const key = `${c.farmer_id}_${c.date}`;
//       summary[key] = {
//         farmer_id: c.farmer_id,
//         date: c.date,
//         milk_total: Number(c.milk_total) || 0,
//         total_received: 0,
//         deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//         net_payable: Number(c.milk_total) || 0,
//         from_bills: {
//           milk_total: 0,
//           advance_total: 0,
//           received_total: 0,
//           net_payable: 0,
//           advance_remaining: 0,
//           cattlefeed_remaining: 0,
//           other1_remaining: 0,
//           other2_remaining: 0,
//           cattlefeed_total: 0,
//           other1_total: 0,
//           other2_total: 0,
//           status: "pending",
//         },
//       };
//     });

//     // Payments
//     payments.forEach((p) => {
//       const key = `${p.farmer_id}_${p.date}`;
//       if (!summary[key]) {
//         summary[key] = {
//           farmer_id: p.farmer_id,
//           date: p.date,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0,
//             status: "pending",
//           },
//         };
//       }

//       summary[key].total_received = Number(p.total_received) || 0;
//       summary[key].deductions = {
//         advance: Number(p.advance) || 0,
//         cattle_feed: Number(p.cattle_feed) || 0,
//         other1: Number(p.other1) || 0,
//         other2: Number(p.other2) || 0,
//         total: Number(p.total_deductions) || 0,
//       };
//       summary[key].net_payable =
//         summary[key].milk_total -
//         summary[key].deductions.total +
//         summary[key].total_received;
//     });

//     // Bills
//     bills.forEach((b) => {
//       const key = `${b.farmer_id}_${b.date}`;
//       if (!summary[key]) {
//         summary[key] = {
//           farmer_id: b.farmer_id,
//           date: b.date,
//           milk_total: 0,
//           total_received: 0,
//           deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
//           net_payable: 0,
//           from_bills: {
//             milk_total: 0,
//             advance_total: 0,
//             received_total: 0,
//             net_payable: 0,
//             advance_remaining: 0,
//             cattlefeed_remaining: 0,
//             other1_remaining: 0,
//             other2_remaining: 0,
//             cattlefeed_total: 0,
//             other1_total: 0,
//             other2_total: 0,
//             status: b.status,
//           },
//         };
//       }

//       summary[key].from_bills = {
//         milk_total: Number(b.milk_total) || 0,
//         advance_total: Number(b.advance_total) || 0,
//         received_total: Number(b.received_total) || 0,
//         net_payable: Number(b.net_payable) || 0,
//         advance_remaining: Number(b.advance_remaining) || 0,
//         cattlefeed_remaining: Number(b.cattlefeed_remaining) || 0,
//         other1_remaining: Number(b.other1_remaining) || 0,
//         other2_remaining: Number(b.other2_remaining) || 0,
//         cattlefeed_total: Number(b.cattlefeed_total) || 0,
//         other1_total: Number(b.other1_total) || 0,
//         other2_total: Number(b.other2_total) || 0,
//         status: b.status,
//       };
//     });

//     // ---- Group by date ----
//     const groupedByDate = {};
//     Object.values(summary).forEach((item) => {
//       if (!groupedByDate[item.date]) groupedByDate[item.date] = [];
//       groupedByDate[item.date].push(item);
//     });

//     // ---- Sort dates ascending ----
//     const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
//       new Date(a) - new Date(b)
//     );

//     const result = sortedDates.map((date) => ({
//       date,
//       farmers: groupedByDate[date],
//     }));

//     res.status(200).json({
//       success: true,
//       dairy_id: dairyid,
//       startDate: stDate,
//       endDate: endDate,
//       data: result,
//     });
//   } catch (err) {
//     console.error("Error in getDairyBillSummary:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// }

async function getDairyBillSummary(req, res) {
  let { dairyid, datefrom, dateto } = req.query;

  if (!dairyid) {
    return res
      .status(400)
      .json({ success: false, message: "dairyid is required" });
  }

  try {
    const stDate = datefrom ? datefrom.trim() : null;
    const endDate = dateto ? dateto.trim() : null;

    if (!stDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both datefrom and dateto are required",
      });
    }

    // ---- COLLECTIONS ----
    const [collections] = await db.execute(
      `
      SELECT farmer_id, DATE(created_at) as date, SUM(quantity*rate) as milk_total
      FROM collections
      WHERE dairy_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY farmer_id, DATE(created_at)
      ORDER BY DATE(created_at) ASC
      `,
      [dairyid, stDate, endDate]
    );

    // ---- PAYMENTS ----
    const [payments] = await db.execute(
      `
      SELECT farmer_id, DATE(date) as date,
             SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) as advance,
             SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) as cattle_feed,
             SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) as other1,
             SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) as other2,
             SUM(amount_taken) as total_deductions,
             SUM(received) as total_received
      FROM farmer_payments
      WHERE dairy_id = ?
        AND DATE(date) BETWEEN ? AND ?
      GROUP BY farmer_id, DATE(date)
      ORDER BY DATE(date) ASC
      `,
      [dairyid, stDate, endDate]
    );

    // ---- BILLS ----
    const [bills] = await db.execute(
      `
      SELECT farmer_id, DATE(period_start) as date,
             milk_total, advance_total, received_total, net_payable,
             advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
             cattlefeed_total, other1_total, other2_total,
             status, is_finalized
      FROM bills
      WHERE dairy_id = ?
        AND DATE(period_start) BETWEEN ? AND ?
      ORDER BY DATE(period_start) ASC
      `,
      [dairyid, stDate, endDate]
    );

    // ---- Merge all ----
    const summary = {};

    // Collections
    collections.forEach((c) => {
      const key = `${c.farmer_id}_${c.date}`;
      summary[key] = {
        farmer_id: c.farmer_id,
        date: c.date,
        milk_total: Number(c.milk_total) || 0,
        total_received: 0,
        deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
        net_payable: Number(c.milk_total) || 0,
        from_bills: {
          milk_total: 0,
          advance_total: 0,
          received_total: 0,
          net_payable: 0,
          advance_remaining: 0,
          cattlefeed_remaining: 0,
          other1_remaining: 0,
          other2_remaining: 0,
          cattlefeed_total: 0,
          other1_total: 0,
          other2_total: 0,
          status: "pending",
          is_finalized: 0
        },
      };
    });

    // Payments
    payments.forEach((p) => {
      const key = `${p.farmer_id}_${p.date}`;
      if (!summary[key]) {
        summary[key] = {
          farmer_id: p.farmer_id,
          date: p.date,
          milk_total: 0,
          total_received: 0,
          deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
          net_payable: 0,
          from_bills: {
            milk_total: 0,
            advance_total: 0,
            received_total: 0,
            net_payable: 0,
            advance_remaining: 0,
            cattlefeed_remaining: 0,
            other1_remaining: 0,
            other2_remaining: 0,
            cattlefeed_total: 0,
            other1_total: 0,
            other2_total: 0,
            status: "pending",
            is_finalized: 0
          },
        };
      }

      summary[key].total_received = Number(p.total_received) || 0;
      summary[key].deductions = {
        advance: Number(p.advance) || 0,
        cattle_feed: Number(p.cattle_feed) || 0,
        other1: Number(p.other1) || 0,
        other2: Number(p.other2) || 0,
        total: Number(p.total_deductions) || 0,
      };
      summary[key].net_payable =
        summary[key].milk_total -
        summary[key].deductions.total +
        summary[key].total_received;
    });

    // Bills
    bills.forEach((b) => {
      const key = `${b.farmer_id}_${b.date}`;
      if (!summary[key]) {
        summary[key] = {
          farmer_id: b.farmer_id,
          date: b.date,
          milk_total: 0,
          total_received: 0,
          deductions: { advance: 0, cattle_feed: 0, other1: 0, other2: 0, total: 0 },
          net_payable: 0,
          from_bills: {
            milk_total: 0,
            advance_total: 0,
            received_total: 0,
            net_payable: 0,
            advance_remaining: 0,
            cattlefeed_remaining: 0,
            other1_remaining: 0,
            other2_remaining: 0,
            cattlefeed_total: 0,
            other1_total: 0,
            other2_total: 0,
            status: b.status,
            is_finalized: b.is_finalized
          },
        };
      }

      summary[key].from_bills = {
        milk_total: Number(b.milk_total) || 0,
        advance_total: Number(b.advance_total) || 0,
        received_total: Number(b.received_total) || 0,
        net_payable: Number(b.net_payable) || 0,
        advance_remaining: Number(b.advance_remaining) || 0,
        cattlefeed_remaining: Number(b.cattlefeed_remaining) || 0,
        other1_remaining: Number(b.other1_remaining) || 0,
        other2_remaining: Number(b.other2_remaining) || 0,
        cattlefeed_total: Number(b.cattlefeed_total) || 0,
        other1_total: Number(b.other1_total) || 0,
        other2_total: Number(b.other2_total) || 0,
        status: b.status,
        is_finalized: b.is_finalized
      };
    });

    // ---- Group by date ----
    const groupedByDate = {};
    Object.values(summary).forEach((item) => {
      if (!groupedByDate[item.date]) groupedByDate[item.date] = [];
      groupedByDate[item.date].push(item);
    });

    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const result = sortedDates.map((date) => ({
      date,
      farmers: groupedByDate[date],
    }));

    res.status(200).json({
      success: true,
      dairy_id: dairyid,
      startDate: stDate,
      endDate: endDate,
      data: result,
    });
  } catch (err) {
    console.error("Error in getDairyBillSummary:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
}








async function getFarmerBillDetails(req, res) {
  let { farmer_id, dairyid, datefrom, dateto } = req.query;

  if (!farmer_id || !dairyid) {
    return res.status(400).json({ success: false, message: "farmer_id and dairyid required" });
  }

  try {
    const params = [farmer_id, dairyid];
    let dateFilter = "";

    if (datefrom && dateto) {
      dateFilter = " AND DATE(created_at) BETWEEN ? AND ?";
      params.push(datefrom, dateto);
    }

    // collections
    const [collections] = await db.query(
      `SELECT id, date(created_at) as date, quantity, rate, (quantity*rate) as amount
       FROM collections 
       WHERE farmer_id=? AND dairy_id=? ${dateFilter}
       ORDER BY created_at ASC`,
      params
    );

    // payments
    const [payments] = await db.query(
      `SELECT id, date, payment_type, amount_taken, received, descriptions
       FROM farmer_payments
       WHERE farmer_id=? AND dairy_id=? ${dateFilter.replace("created_at", "date")}
       ORDER BY date ASC`,
      params
    );

    // category-wise breakdown
    const paymentBreakdown = payments.reduce((acc, p) => {
      const type = p.payment_type.toLowerCase();
      if (!acc[type]) acc[type] = { amount_taken: 0, received: 0 };
      acc[type].amount_taken += Number(p.amount_taken || 0);
      acc[type].received += Number(p.received || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      farmer_id,
      dairyid,
      period: { from: datefrom, to: dateto },
      collections,
      payments,
      paymentBreakdown,
      totals: {
        milk_total: collections.reduce((a, c) => a + Number(c.amount), 0),
        total_advance: paymentBreakdown.advance?.amount_taken || 0,
        total_feed: paymentBreakdown.feed?.amount_taken || 0,
        total_other: paymentBreakdown.other?.amount_taken || 0,
        total_received: payments.reduce((a, p) => a + Number(p.received || 0), 0),
      }
    });
  } catch (err) {
    console.error("Error in getFarmerBillDetails:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


// async function updateFarmerBill(req, res) {
//   try {
//     const { farmer_id, milk_total, total_advance, total_feed, total_other, total_received, net_payable } = req.body; //dairy_id

//     if (!farmer_id) { //|| !dairy_id
//       return res.status(400).json({ success: false, message: "farmer_id and dairy_id are required" });
//     }

//     // Check if a bill exists
//     const [[existing]] = await db.query(
//       `SELECT * FROM bills WHERE farmer_id=?  AND is_finalized=0 ORDER BY id DESC LIMIT 1`, //AND dairy_id=?
//       [farmer_id] //dairy_id
//     );

//     const finalNet = net_payable || (Number(milk_total) - (Number(total_advance) + Number(total_feed) + Number(total_other)) + Number(total_received));

//     if (existing) {
//       await db.query(
//         `UPDATE bills 
//          SET milk_total=?, advance_total=?, feed_total=?, other_total=?, received_total=?, net_payable=? 
//          WHERE id=?`,
//         [milk_total, total_advance, total_feed, total_other, total_received, finalNet, existing.id]
//       );
//       return res.json({ success: true, message: "Farmer bill updated", bill_id: existing.id });
//     } else {
//       const [result] = await db.query(
//         `INSERT INTO bills (farmer_id, milk_total, advance_total, feed_total, other_total, received_total, net_payable, status, is_finalized)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
//         [farmer_id, milk_total, total_advance, total_feed, total_other, total_received, finalNet]
//       );
//       return res.json({ success: true, message: "Farmer bill created", bill_id: result.insertId });
//     }
//   } catch (err) {
//     console.error("Error updating farmer bill:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

async function updateFarmerBill(req, res) {
  try {
    const { farmer_id, dairy_id, period_start, period_end, milk_total, advance_total, received_total, net_payable } = req.body;

    if (!farmer_id) {
      return res.status(400).json({ success: false, message: "farmer_id is required" });
    }

    // Check if there is an existing pending bill
    const [[existing]] = await db.query(
      `SELECT * FROM bills 
       WHERE farmer_id=? AND is_finalized=0 
       ORDER BY id DESC LIMIT 1`,
      [farmer_id]
    );

    const finalNet =
      net_payable ||
      (Number(milk_total) - Number(advance_total) + Number(received_total));

    if (existing) {
      // Update existing pending bill
      await db.query(
        `UPDATE bills 
         SET period_start=?, period_end=?, milk_total=?, advance_total=?, received_total=?, net_payable=? 
         WHERE id=?`,
        [
          period_start || existing.period_start,
          period_end || existing.period_end,
          Number(milk_total) || 0,
          Number(advance_total) || 0,
          Number(received_total) || 0,
          finalNet,
          existing.id,
        ]
      );
      return res.json({ success: true, message: "Farmer bill updated", bill_id: existing.id });
    } else {
      // Insert a new bill
      const [result] = await db.query(
        `INSERT INTO bills (farmer_id, period_start, period_end, milk_total, advance_total, received_total, net_payable, status, is_finalized)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
        [
          farmer_id,
          period_start,
          period_end,
          Number(milk_total) || 0,
          Number(advance_total) || 0,
          Number(received_total) || 0,
          finalNet,
        ]
      );
      return res.json({ success: true, message: "Farmer bill created", bill_id: result.insertId });
    }
  } catch (err) {
    console.error("Error updating farmer bill:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}



module.exports = {
    insertPayment,
    updatePayment,
    inactivatePayment,
    activatePayment,
    getpayment,
    getmonthpayment,
    getPaymentsByDairy,
    getDairyBillSummary,
    getFarmerBillDetails,
    updateFarmerBill
};
