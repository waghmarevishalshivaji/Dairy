const db = require('../config/db');

async function createRole(req, res) {
  const { roleName } = req.body;

  if (!roleName) {
    return res.status(400).json({ message: "Role name is required" });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO roles (role_name) VALUES (?)',
      [roleName]
    );
    res.status(201).json({ message: 'Role created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// async function getTodaysCollection(req, res) {
//     let { shift, dairy_id, date  } = req.query;

//     try {

//         let query = `
//             SELECT 
//                 SUM(quantity) AS total_quantity,
//                 ROUND(AVG(fat), 2) AS avg_fat,
//                 ROUND(AVG(snf), 2) AS avg_snf,
//                 ROUND(AVG(clr), 2) AS avg_clr
//             FROM collections
//             WHERE DATE(created_at) = ?
//         `;


//         const params = [];

//          // Date filter — if not given, default to current date
//         if (date) {
//             params.push(date); // expecting YYYY-MM-DD format
//         } else {
//             const today = new Date();
//             params.push(today.toISOString().slice(0, 10)); // YYYY-MM-DD
//         }

//         if (shift) {
//             query += ` AND shift = ?`;
//             params.push(shift);
//         }

//         if (dairy_id) {
//             query += ` AND dairy_id = ?`;
//             params.push(dairy_id);
//         }

//         const [rows] = await db.execute(query, params);


//         if (!rows || rows.length === 0 || rows[0].total_quantity === null) {
//             return res.status(200).json({ success: true, message: 'No data for today', data: {} });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Today’s collection fetched successfully',
//             data: rows[0],
//         });
//     } catch (err) {
//         console.error('Error fetching today’s collection:', err);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// }

// async function getTodaysCollectionreport(req, res) {
//     let { shift, dairy_id, date } = req.query;

//     try {
//         // Query records
//         let detailQuery = `
//             SELECT 
//                 type,
//                 quantity,
//                 fat,
//                 snf,
//                 SUM(quantity + rate) as amount 
//             FROM collections
//             WHERE DATE(created_at) = ?
//         `;

//         const params = [];

//         // Date filter
//         if (date) {
//             params.push(date);
//         } else {
//             const today = new Date();
//             params.push(today.toISOString().slice(0, 10));
//         }

//         if (shift) {
//             detailQuery += ` AND shift = ?`;
//             params.push(shift);
//         }

//         if (dairy_id) {
//             detailQuery += ` AND dairy_id = ?`;
//             params.push(dairy_id);
//         }

//         const [rows] = await db.execute(detailQuery, params);

//         if (!rows || rows.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 message: 'No data for today',
//                 data: { records: [], summary: {} }
//             });
//         }

//         // Assign Code based on FAT + SNF
//         const records = rows.map((row, index) => {
//             let code = "005"; // default

//             if (row.fat < 3.8 || row.snf < 8.2) {
//                 code = "001";
//             } else if (row.fat >= 3.8 && row.fat < 4.0 && row.snf >= 8.2 && row.snf < 8.5) {
//                 code = "002";
//             } else if (row.fat >= 4.0 && row.fat < 4.2 && row.snf >= 8.5 && row.snf < 8.7) {
//                 code = "003";
//             } else if (row.fat >= 4.2 && row.snf >= 8.7) {
//                 code = "004";
//             }

//             return {
//                 code,
//                 type: row.type,
//                 quantity: parseFloat(row.quantity),
//                 fat: parseFloat(row.fat),
//                 snf: parseFloat(row.snf),
//                 amount: parseFloat(row.amount)
//             };
//         });

//         // Summary calculation
//         const total_quantity = records.reduce((sum, r) => sum + r.quantity, 0);
//         const avg_fat = records.reduce((sum, r) => sum + r.fat * r.quantity, 0) / total_quantity;
//         const avg_snf = records.reduce((sum, r) => sum + r.snf * r.quantity, 0) / total_quantity;
//         const total_amount = records.reduce((sum, r) => sum + r.amount, 0);

//         const summary = {
//             total_quantity: total_quantity.toFixed(1),
//             avg_fat: avg_fat.toFixed(1),
//             avg_snf: avg_snf.toFixed(1),
//             total_amount: total_amount.toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             message: "Today’s collection fetched successfully",
//             data: {
//                 records,
//                 summary
//             }
//         });

//     } catch (err) {
//         console.error("Error fetching today’s collection:", err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// }

async function getTodaysCollectionreport(req, res) {
    let { shift, dairy_id, date } = req.query;

    try {
        const params = [];
        let baseCondition = `WHERE DATE(created_at) = ?`;

        // Date filter
        if (date) {
            params.push(date);
        } else {
            const today = new Date();
            params.push(today.toISOString().slice(0, 10));
        }

        if (shift) {
            baseCondition += ` AND shift = ?`;
            params.push(shift);
        }

        if (dairy_id) {
            baseCondition += ` AND dairy_id = ?`;
            params.push(dairy_id);
        }

        // 🔹 Query 1: fetch detailed records (with amount)
        let detailQuery = `
            SELECT 
                type,
                farmer_id,
                quantity,
                fat,
                snf,
                rate,
                (quantity * rate) AS amount
            FROM collections
            ${baseCondition}
        `;

        const [rows] = await db.execute(detailQuery, params);

        if (!rows || rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No data for today",
                data: { records: [], summary: {} }
            });
        }

        // 🔹 Assign code based on FAT & SNF
        const records = rows.map((row) => {

            return {
                code: row.farmer_id,
                type: row.type,
                quantity: parseFloat(row.quantity),
                fat: parseFloat(row.fat),
                snf: parseFloat(row.snf),
                rate: parseFloat(row.rate),
                amount: parseFloat(row.amount)
            };
        });

        // 🔹 Query 2: summary (with total amount)
        let summaryQuery = `
            SELECT 
                SUM(quantity) AS total_quantity,
                ROUND(AVG(fat), 2) AS avg_fat,
                ROUND(AVG(snf), 2) AS avg_snf,
                SUM(quantity * rate) AS total_amount
            FROM collections
            ${baseCondition}
        `;
        const [summaryRows] = await db.execute(summaryQuery, params);

        const summary = summaryRows[0] || {};

        res.status(200).json({
            success: true,
            message: "Today’s collection fetched successfully",
            data: {
                records,
                summary
            }
        });

    } catch (err) {
        console.error("Error fetching today’s collection:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

function isShiftInRange(startDate, startShift, endDate, endShift, rowDate, rowShift) {
  const rowStr = rowDate.toISOString().split("T")[0];

  if (startDate === endDate) {
    if (startShift === "Morning" && endShift === "Evening") return true;
    if (startShift === "Morning" && endShift === "Morning") return rowShift === "Morning";
    if (startShift === "Evening" && endShift === "Evening") return rowShift === "Evening";
    if (startShift === "Evening" && endShift === "Morning") return false; // invalid
  } else {
    if (rowStr === startDate && startShift === "Evening" && rowShift === "Morning") return false;
    if (rowStr === endDate && endShift === "Morning" && rowShift === "Evening") return false;
  }

  return true;
}

async function getDailyShiftReport(req, res) {
  try {
    const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
    if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
      return res.status(400).json({ message: "dairyid, startDate, startShift, endDate, endShift required" });
    }

    // Build WHERE clause
    let where = `c.dairy_id=? AND DATE(c.created_at) BETWEEN ? AND ?`;
    const params = [dairyid, startDate, endDate];
    if (milkType) {
      where += ` AND c.type=?`;
      params.push(milkType);
    }

    // Query DB
    const [rows] = await db.query(
      `SELECT DATE(c.created_at) as date, c.shift, c.type,
              SUM(c.quantity) as liters,
              ROUND(AVG(c.fat),1) as fat,
              ROUND(AVG(c.snf),1) as snf,
              ROUND(AVG(c.clr),1) as clr,
              ROUND(AVG(c.rate),1) as rate,
              SUM(c.quantity * c.rate) as amount
       FROM collections c
       WHERE ${where}
       GROUP BY DATE(c.created_at), c.shift, c.type
       ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening')`,
      params
    );

    // Apply filter + map results
    const report = rows
      .filter(r => isShiftInRange(startDate, startShift, endDate, endShift, r.date, r.shift))
      .map(r => ({
        date: r.date,
        shift: r.shift,
        type: r.type,
        liters: parseFloat(r.liters) || 0,
        fat: parseFloat(r.fat) || 0,
        snf: parseFloat(r.snf) || 0,
        clr: parseFloat(r.clr) || 0,
        rate: parseFloat(r.rate) || 0,
        amount: parseFloat(r.amount) || 0
      }));

    res.json({
      dairy_id: dairyid,
      period: { startDate, startShift, endDate, endShift },
      type: milkType || "All",
      report
    });
  } catch (err) {
    console.error("Error generating daily shift report:", err);
    res.status(500).json({ message: "Server error" });
  }
}




// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required"
//       });
//     }

//     // Build WHERE dynamically
//     let where = `c.dairy_id=? AND DATE(c.created_at) BETWEEN ? AND ?`;
//     const params = [dairyid, startDate, endDate];

//     if (milkType && milkType != 'All') {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // Query
//     const [rows] = await db.query(
//       `SELECT DATE(c.created_at) as date, c.shift, c.type,
//               SUM(c.quantity) as liters,
//               ROUND(AVG(c.fat),1) as fat,
//               ROUND(AVG(c.snf),1) as snf,
//               ROUND(AVG(c.clr),1) as clr,
//               ROUND(AVG(c.rate),1) as rate,
//               SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type
//        ORDER BY DATE(c.created_at), FIELD(c.shift, 'Morning','Evening')`,
//       params
//     );

//     // Filter according to startShift and endShift
//     // const report = rows.filter(r => {
//     //   const dateStr = r.date.toISOString().split("T")[0]; // YYYY-MM-DD

//     //   if (dateStr === startDate) {
//     //     if (startShift === "Evening" && r.shift === "Morning") return false;
//     //   }
//     //   if (dateStr === endDate) {
//     //     if (endShift === "Morning" && r.shift === "Evening") return false;
//     //   }
//     //   return true;
//     // }).map(r => ({
//     //   date: r.date,
//     //   shift: r.shift,
//     //   type: r.type,
//     //   liters: parseFloat(r.liters) || 0,
//     //   fat: parseFloat(r.fat) || 0,
//     //   snf: parseFloat(r.snf) || 0,
//     //   clr: parseFloat(r.clr) || 0,
//     //   rate: parseFloat(r.rate) || 0,
//     //   amount: parseFloat(r.amount) || 0
//     // }));

//     // Filter rows according to startShift and endShift
//     const report = rows.filter(r => {
//       const dateStr = r.date.toISOString().split("T")[0]; // YYYY-MM-DD

//       // Case: same start and end date
//       if (startDate === endDate) {
//         if (startShift === "Morning" && endShift === "Evening") {
//           // include both morning and evening
//           return true;
//         }
//         if (startShift === "Morning" && endShift === "Morning") {
//           return r.shift === "Morning";
//         }
//         if (startShift === "Evening" && endShift === "Evening") {
//           return r.shift === "Evening";
//         }
//         if (startShift === "Evening" && endShift === "Morning") {
//           // invalid range: no records
//           return false;
//         }
//       }

//       // Normal range (different days)
//       if (dateStr === startDate) {
//         if (startShift === "Evening" && r.shift === "Morning") return false;
//       }
//       if (dateStr === endDate) {
//         if (endShift === "Morning" && r.shift === "Evening") return false;
//       }

//       return true;
//     });


//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }



async function getFarmerReport(req, res) {
  try {
    const { farmer_id, datefrom, dateto } = req.query;

    if (!farmer_id || !datefrom || !dateto) {
      return res.status(400).json({ message: "farmer_id, datefrom, dateto required" });
    }

    // Get farmer details from users
    const [[farmer]] = await db.query(
      "SELECT username, full_name FROM users WHERE username = ?",
      [farmer_id]
    );

    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    // Collections
    const [collections] = await db.query(
      `SELECT DATE(created_at) as date, quantity, rate, (quantity*rate) as amount
       FROM collections
       WHERE farmer_id=? AND DATE(created_at) BETWEEN ? AND ?
       ORDER BY created_at ASC`,
      [farmer_id, datefrom, dateto]
    );

    // Payments
    const [payments] = await db.query(
      `SELECT date, payment_type, amount_taken, received, descriptions
       FROM farmer_payments
       WHERE farmer_id=? AND DATE(date) BETWEEN ? AND ?
       ORDER BY date ASC`,
      [farmer_id, datefrom, dateto]
    );

    // Totals
    const milk_total = collections.reduce((a, c) => a + Number(c.amount), 0);
    const advance_total = payments.filter(p => p.payment_type === "advance").reduce((a, p) => a + Number(p.amount_taken), 0);
    const feed_total = payments.filter(p => p.payment_type === "feed").reduce((a, p) => a + Number(p.amount_taken), 0);
    const total_received = payments.reduce((a, p) => a + Number(p.received), 0);
    const net_payable = milk_total - (advance_total + feed_total) + total_received;

    res.json({
      farmer_id: farmer.username,
      farmer_name: farmer.full_name,
      period: { from: datefrom, to: dateto },
      collections,
      payments,
      totals: { milk_total, advance_total, feed_total, total_received, net_payable }
    });
  } catch (err) {
    console.error("Error generating farmer report:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// async function getDairyReport(req, res) {
//   try {
//     const { dairyid, datefrom, dateto, type, shift } = req.query;
//     if (!dairyid || !datefrom || !dateto) {
//       return res.status(400).json({ message: "dairyid, datefrom, dateto required" });
//     }

//     // Collections joined with users
//     const [collections] = await db.query(
//       `SELECT c.farmer_id, c.type, c.shift,  u.fullName as farmer_name, SUM(c.quantity * c.rate) as milk_total
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE c.dairy_id=? AND milkType AND DATE(c.created_at) BETWEEN ? AND ?
//        GROUP BY c.farmer_id, u.fullName, c.type, c.shift
//        ORDER BY c.farmer_id`,
//       [dairyid, type, datefrom, dateto]
//     );

//     // Payments joined with users
//     const [payments] = await db.query(
//       `SELECT p.farmer_id, u.fullName as farmer_name,
//               SUM(p.amount_taken) as total_deductions,
//               SUM(p.received) as total_received
//        FROM farmer_payments p
//        JOIN users u ON u.username = p.farmer_id
//        WHERE p.dairy_id=? AND DATE(p.date) BETWEEN ? AND ?
//        GROUP BY p.farmer_id, u.fullName
//        ORDER BY p.farmer_id`,
//       [dairyid, datefrom, dateto]
//     );

//     // Merge farmer data
//     const farmerMap = {};
//     collections.forEach(c => {
//       farmerMap[c.farmer_id] = {
//         farmer_id: c.farmer_id,
//         farmer_name: c.farmer_name,
//         type: c.type,
//         shift: c.shift,
//         milk_total: Number(c.milk_total) || 0,
//         total_deductions: 0,
//         total_received: 0,
//         net_payable: Number(c.milk_total) || 0
//       };
//     });

//     payments.forEach(p => {
//       if (!farmerMap[p.farmer_id]) {
//         farmerMap[p.farmer_id] = {
//           farmer_id: p.farmer_id,
//           farmer_name: p.farmer_name,
//           type: null,
//           shift: null,
//           milk_total: 0,
//           total_deductions: 0,
//           total_received: 0,
//           net_payable: 0
//         };
//       }
//       farmerMap[p.farmer_id].total_deductions = Number(p.total_deductions) || 0;
//       farmerMap[p.farmer_id].total_received = Number(p.total_received) || 0;
//       farmerMap[p.farmer_id].net_payable =
//         farmerMap[p.farmer_id].milk_total -
//         farmerMap[p.farmer_id].total_deductions +
//         farmerMap[p.farmer_id].total_received;
//     });

//     const farmers = Object.values(farmerMap);

//     // Grand totals
//     const grandTotals = farmers.reduce(
//       (acc, f) => {
//         acc.milk_total += f.milk_total;
//         acc.total_deductions += f.total_deductions;
//         acc.total_received += f.total_received;
//         acc.net_payable += f.net_payable;
//         return acc;
//       },
//       { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
//     );

//     res.json({
//       dairy_id: dairyid,
//       period: { from: datefrom, to: dateto },
//       farmers,
//       grandTotals
//     });
//   } catch (err) {
//     console.error("Error generating dairy report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDairyReport(req, res) {
//   try {
//     const { dairyid, type, shift, datefrom, dateto } = req.query;
//     if (!dairyid || !datefrom || !dateto) {
//       return res.status(400).json({ message: "dairyid, datefrom, dateto required" });
//     }

//     // Collections grouped by farmer+type+shift
//     const [collections] = await db.query(
//       `SELECT c.farmer_id, c.type, c.shift, u.fullName as farmer_name,
//               SUM(c.quantity * c.rate) as milk_total
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE c.dairy_id=? AND type=? AND shift=? AND DATE(c.created_at) BETWEEN ? AND ?
//        GROUP BY c.farmer_id, u.fullName, c.type, c.shift
//        ORDER BY c.farmer_id`,
//       [dairyid, type, shift, datefrom, dateto]
//     );

//     // Payments grouped by farmer
//     const [payments] = await db.query(
//       `SELECT p.farmer_id, u.fullName as farmer_name,
//               SUM(p.amount_taken) as total_deductions,
//               SUM(p.received) as total_received
//        FROM farmer_payments p
//        JOIN users u ON u.username = p.farmer_id
//        WHERE p.dairy_id=? AND DATE(p.date) BETWEEN ? AND ?
//        GROUP BY p.farmer_id, u.fullName
//        ORDER BY p.farmer_id`,
//       [dairyid, datefrom, dateto]
//     );

//     // Build payment map
//     const paymentMap = {};
//     payments.forEach(p => {
//       paymentMap[p.farmer_id] = {
//         farmer_name: p.farmer_name,
//         total_deductions: Number(p.total_deductions) || 0,
//         total_received: Number(p.total_received) || 0
//       };
//     });

//     // Merge payments into each collection row
//     const farmers = collections.map(c => {
//       const pay = paymentMap[c.farmer_id] || { total_deductions: 0, total_received: 0 };
//       const milk_total = Number(c.milk_total) || 0;
//       return {
//         farmer_id: c.farmer_id,
//         farmer_name: c.farmer_name,
//         type: c.type,
//         shift: c.shift,
//         milk_total,
//         total_deductions: pay.total_deductions,
//         total_received: pay.total_received,
//         net_payable: milk_total - pay.total_deductions + pay.total_received
//       };
//     });

//     // Also include farmers who have only payments but no collections
//     payments.forEach(p => {
//       const exists = farmers.find(f => f.farmer_id === p.farmer_id);
//       if (!exists) {
//         farmers.push({
//           farmer_id: p.farmer_id,
//           farmer_name: p.farmer_name,
//           type: "N/A",
//           shift: "N/A",
//           milk_total: 0,
//           total_deductions: p.total_deductions,
//           total_received: p.total_received,
//           net_payable: 0 - p.total_deductions + p.total_received
//         });
//       }
//     });

//     // Grand totals
//     const grandTotals = farmers.reduce(
//       (acc, f) => {
//         acc.milk_total += f.milk_total;
//         acc.total_deductions += f.total_deductions;
//         acc.total_received += f.total_received;
//         acc.net_payable += f.net_payable;
//         return acc;
//       },
//       { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
//     );

//     res.json({
//       dairy_id: dairyid,
//       period: { from: datefrom, to: dateto },
//       farmers,
//       grandTotals
//     });
//   } catch (err) {
//     console.error("Error generating dairy report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

async function getDairyReport(req, res) {
  try {
    const { dairyid, type, shift, datefrom, dateto } = req.query;
    if (!dairyid || !datefrom || !dateto) {
      return res.status(400).json({ message: "dairyid, datefrom, dateto required" });
    }

    // Collections grouped by farmer+type+shift
    const [collections] = await db.query(
      `SELECT c.farmer_id, c.type, c.shift, u.fullName as farmer_name,
              SUM(c.quantity * c.rate) as milk_total
       FROM collections c
       JOIN users u ON u.username = c.farmer_id
       WHERE c.dairy_id=? AND type=? AND shift=? AND DATE(c.created_at) BETWEEN ? AND ?
       GROUP BY c.farmer_id, u.fullName, c.type, c.shift
       ORDER BY c.farmer_id`,
      [dairyid, type, shift, datefrom, dateto]
    );

    // Payments grouped by farmer
    const [payments] = await db.query(
      `SELECT p.farmer_id, u.fullName as farmer_name,
              SUM(p.amount_taken) as total_deductions,
              SUM(p.received) as total_received
       FROM farmer_payments p
       JOIN users u ON u.username = p.farmer_id
       WHERE p.dairy_id=? AND DATE(p.date) BETWEEN ? AND ?
       GROUP BY p.farmer_id, u.fullName
       ORDER BY p.farmer_id`,
      [dairyid, datefrom, dateto]
    );

    // Build payment map
    const paymentMap = {};
    payments.forEach(p => {
      paymentMap[p.farmer_id] = {
        farmer_name: p.farmer_name,
        total_deductions: parseInt(p.total_deductions) || 0,
        total_received: parseInt(p.total_received) || 0
      };
    });

    // Merge payments into each collection row
    let farmers = collections.map(c => {
      const pay = paymentMap[c.farmer_id] || { total_deductions: 0, total_received: 0 };
      const milk_total = parseInt(c.milk_total) || 0;
      return {
        farmer_id: c.farmer_id,
        farmer_name: c.farmer_name,
        type: c.type,
        shift: c.shift,
        milk_total,
        total_deductions: pay.total_deductions,
        total_received: pay.total_received,
        net_payable: milk_total - pay.total_deductions + pay.total_received
      };
    });

    // Filter out records without type or shift
    farmers = farmers.filter(f => f.type && f.shift);

    // Also include farmers who have only payments but no collections
    payments.forEach(p => {
      const exists = farmers.find(f => f.farmer_id === p.farmer_id);
      if (!exists) {
        // farmers.push({
        //   farmer_id: p.farmer_id,
        //   farmer_name: p.farmer_name,
        //   type: "N/A",
        //   shift: "N/A",
        //   milk_total: 0,
        //   total_deductions: parseInt(p.total_deductions) || 0,
        //   total_received: parseInt(p.total_received) || 0,
        //   net_payable: 0 - (parseInt(p.total_deductions) || 0) + (parseInt(p.total_received) || 0)
        // });
      }
    });

    // Grand totals
    const grandTotals = farmers.reduce(
      (acc, f) => {
        acc.milk_total += parseInt(f.milk_total) || 0;
        acc.total_deductions += parseInt(f.total_deductions) || 0;
        acc.total_received += parseInt(f.total_received) || 0;
        acc.net_payable += parseInt(f.net_payable) || 0;
        return acc;
      },
      { milk_total: 0, total_deductions: 0, total_received: 0, net_payable: 0 }
    );

    res.json({
      dairy_id: dairyid,
      period: { from: datefrom, to: dateto },
      farmers,
      grandTotals
    });
  } catch (err) {
    console.error("Error generating dairy report:", err);
    res.status(500).json({ message: "Server error" });
  }
}






module.exports = {
    createRole,
    getTodaysCollectionreport,
    getFarmerReport,
    getDairyReport,
    getDailyShiftReport
};