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

async function getmonthpayment(req, res) {
  let { farmer_id, datefrom, dateto, dairyid } = req.query;
  const today = new Date();

  try {
    let query = 'SELECT * FROM farmer_payments';
    const conditions = [];
    const params = [];

    if (farmer_id) {
      conditions.push('farmer_id = ?');
      params.push(farmer_id.trim());
    }

    if (dairyid) {
      conditions.push('dairy_id = ?');
      params.push(dairyid.trim());
    }

    let startDate = '';
    let endDate = '';
    let groupByMonth = false;

    // Determine whether to apply manual grouping
    if (datefrom && dateto) {
      startDate = datefrom.trim();
      endDate = dateto.trim();
      groupByMonth = true;

      conditions.push('date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    } else {
      // Default behavior: auto-determine 10-day range based on today
      const day = today.getDate();
      const month = today.getMonth();
      const year = today.getFullYear();

      if (day <= 10) {
        const lastMonth = new Date(year, month - 1);
        startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-21`;
        endDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-30`;
      } else if (day <= 20) {
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-10`;
      } else {
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-11`;
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-20`;
      }

      conditions.push('date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: 'No payments found', data: [] });
    }

    // Grouping logic per month in 10-day ranges
    if (groupByMonth) {
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
        const lastDay = getDaysInMonth(y, m);

        const range1 = {
          label: `1-10 ${y}-${String(m + 1).padStart(2, '0')}`,
          from: formatDate(y, m, 1),
          to: formatDate(y, m, 10),
          data: []
        };
        const range2 = {
          label: `11-20 ${y}-${String(m + 1).padStart(2, '0')}`,
          from: formatDate(y, m, 11),
          to: formatDate(y, m, 20),
          data: []
        };
        const range3 = {
          label: `21-${lastDay} ${y}-${String(m + 1).padStart(2, '0')}`,
          from: formatDate(y, m, 21),
          to: formatDate(y, m, lastDay),
          data: []
        };

        groups.push(range1, range2, range3);
      }

      // Fill buckets
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

      // Add totals
      const resultGroups = groups.map(g => ({
        label: g.label,
        from: g.from,
        to: g.to,
        total: g.data.reduce((sum, r) => sum + r.amount_taken, 0),
        data: g.data
      }));

      return res.status(200).json({
        result: 1,
        success: true,
        message: 'Success',
        grouped: resultGroups
      });
    }

    // If no grouping
    return res.status(200).json({
      result: 1,
      success: true,
      message: 'Success',
      dateRange: { startDate, endDate },
      sum: rows.reduce((acc, curr) => acc + curr.amount_taken, 0),
      data: rows
    });

  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


async function getDairyBillSummary(req, res) {
  let { dairyid, datefrom, dateto } = req.query;
  if (!dairyid) {
    return res.status(400).json({ success: false, message: "dairyid is required" });
  }

  try {
    const conditions = ["dairy_id = ?"];
    const params = [dairyid];
    let stDate, endDate;

    // ---- Date filter ----
    if (datefrom && dateto) {
      stDate = datefrom.trim();
      endDate = dateto.trim();
      conditions.push("DATE(created_at) BETWEEN ? AND ?");
      params.push(stDate, endDate);
    } else if (datefrom) {
      stDate = datefrom.trim();
      conditions.push("DATE(created_at) >= ?");
      params.push(stDate);
    } else if (dateto) {
      endDate = dateto.trim();
      conditions.push("DATE(created_at) <= ?");
      params.push(endDate);
    }

    // ---- Collections Query ----
    let collectionQuery = `
      SELECT farmer_id, SUM(quantity*rate) as milk_total
      FROM collections
      WHERE ${conditions.join(" AND ")}
      GROUP BY farmer_id
    `;

    // ---- Payments Query ----
    let paymentQuery = `
      SELECT farmer_id,
             SUM(amount_taken) as total_deductions,
             SUM(received) as total_received
      FROM farmer_payments
      WHERE dairy_id = ?
    `;
    const payParams = [dairyid];
    if (stDate && endDate) {
      paymentQuery += " AND date BETWEEN ? AND ?";
      payParams.push(stDate, endDate);
    } else if (stDate) {
      paymentQuery += " AND date >= ?";
      payParams.push(stDate);
    } else if (endDate) {
      paymentQuery += " AND date <= ?";
      payParams.push(endDate);
    }
    paymentQuery += " GROUP BY farmer_id";

    // ---- Run Queries ----
    const [collections] = await db.execute(collectionQuery, params);
    const [payments] = await db.execute(paymentQuery, payParams);

    // ---- Merge by farmer ----
    const summary = {};
    // collections.forEach(c => {
    //   summary[c.farmer_id] = {
    //     farmer_id: c.farmer_id,
    //     milk_total: c.milk_total || 0,
    //     total_deductions: 0,
    //     total_received: 0,
    //     net_payable: c.milk_total || 0
    //   };
    // });

    // payments.forEach(p => {
    //   if (!summary[p.farmer_id]) {
    //     summary[p.farmer_id] = {
    //       farmer_id: p.farmer_id,
    //       milk_total: 0,
    //       total_deductions: 0,
    //       total_received: 0,
    //       net_payable: 0
    //     };
    //   }
    //   summary[p.farmer_id].total_deductions = p.total_deductions || 0;
    //   summary[p.farmer_id].total_received = p.total_received || 0;
    //   summary[p.farmer_id].net_payable =
    //     summary[p.farmer_id].milk_total -
    //     summary[p.farmer_id].total_deductions +
    //     parseInt(summary[p.farmer_id].total_received);
    // });

    // // ---- Convert object → array ----
    // const result = Object.values(summary);

    // // ---- Grand totals ----
    // const grand = result.reduce(
    //   (acc, f) => {
    //     acc.milk_total += f.milk_total;
    //     acc.total_deductions += f.total_deductions;
    //     acc.total_received += f.total_received;
    //     acc.net_payable += f.net_payable;
    //     return acc;
    //   },
    //   { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
    // );

    collections.forEach(c => {
      summary[c.farmer_id] = {
        farmer_id: c.farmer_id,
        milk_total: Number(c.milk_total) || 0,
        total_deductions: 0,
        total_received: 0,
        net_payable: Number(c.milk_total) || 0
      };
    });

    payments.forEach(p => {
      if (!summary[p.farmer_id]) {
        summary[p.farmer_id] = {
          farmer_id: p.farmer_id,
          milk_total: 0,
          total_deductions: 0,
          total_received: 0,
          net_payable: 0
        };
      }
      summary[p.farmer_id].total_deductions = Number(p.total_deductions) || 0;
      summary[p.farmer_id].total_received = Number(p.total_received) || 0;
      summary[p.farmer_id].net_payable =
        summary[p.farmer_id].milk_total -
        summary[p.farmer_id].total_deductions +
        summary[p.farmer_id].total_received;
    });

    // ---- Convert object → array ----
    const result = Object.values(summary);

    // ---- Grand totals ----
    const grand = result.reduce(
      (acc, f) => {
        acc.milk_total += Number(f.milk_total) || 0;
        acc.total_deductions += Number(f.total_deductions) || 0;
        acc.total_received += Number(f.total_received) || 0;
        acc.net_payable += Number(f.net_payable) || 0;
        return acc;
      },
      { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
    );

    res.status(200).json({
      success: true,
      dairy_id: dairyid,
      startDate: stDate || null,
      endDate: endDate || null,
      farmers: result,
      grandTotals: grand
    });
  } catch (err) {
    console.error("Error in getDairyBillSummary:", err);
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
    getDairyBillSummary
};
