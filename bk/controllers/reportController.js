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
  const rowStr = typeof rowDate === "string" ? rowDate.split("T")[0] : rowDate.toISOString().split("T")[0];

  // If row is before start or after end → reject
  if (rowStr < startDate || rowStr > endDate) return false;

  // If only one day range
  if (startDate === endDate) {
    if (startShift === "Morning" && endShift === "Evening") return true; // full day
    if (startShift === "Morning" && endShift === "Morning") return rowShift === "Morning";
    if (startShift === "Evening" && endShift === "Evening") return rowShift === "Evening";
    if (startShift === "Evening" && endShift === "Morning") return false; // invalid case
  }

  // If multi-day range
  if (rowStr === startDate) {
    // starting day
    if (startShift === "Morning") return true; // allow both Morning & Evening
    if (startShift === "Evening") return rowShift === "Evening"; // skip Morning
  }

  if (rowStr === endDate) {
    // ending day
    if (endShift === "Evening") return true; // allow both Morning & Evening
    if (endShift === "Morning") return rowShift === "Morning"; // skip Evening
  }

  // Any day strictly between start & end is fully included
  return true;
}


// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res
//         .status(400)
//         .json({ message: "dairyid, startDate, startShift, endDate, endShift required" });
//     }

//     // Build WHERE clause
//     let where = `c.dairy_id=? AND DATE(c.created_at) BETWEEN ? AND ?`;
//     const params = [dairyid, startDate, endDate];
//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // Query DB (per farmer)
//     const [rows] = await db.query(
//       `SELECT DATE(c.created_at) as date, c.shift, c.type,
//               c.farmer_id, u.fullName as farmer_name,
//               SUM(c.quantity) as liters,
//               ROUND(AVG(c.fat),1) as fat,
//               ROUND(AVG(c.snf),1) as snf,
//               ROUND(AVG(c.clr),1) as clr,
//               ROUND(AVG(c.rate),1) as rate,
//               SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
//       params
//     );

//     // Apply shift filter
//     const report = rows
//       .filter((r) =>
//         isShiftInRange(startDate, startShift, endDate, endShift, r.date, r.shift)
//       )
//       .map((r) => ({
//         date: r.date,
//         shift: r.shift,
//         type: r.type,
//         farmer_id: r.farmer_id,
//         farmer_name: r.farmer_name,
//         liters: parseFloat(r.liters) || 0,
//         fat: parseFloat(r.fat) || 0,
//         snf: parseFloat(r.snf) || 0,
//         clr: parseFloat(r.clr) || 0,
//         rate: parseFloat(r.rate) || 0,
//         amount: parseFloat(r.amount) || 0,
//       }));

//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }


// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({ message: "dairyid, startDate, startShift, endDate, endShift required" });
//     }

//     // Build WHERE clause
//     let where = `c.dairy_id=? AND DATE(c.created_at) BETWEEN ? AND ?`;
//     const params = [dairyid, startDate, endDate];
//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // Query DB
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

//     // Apply filter + map results
//     const report = rows
//       .filter(r => isShiftInRange(startDate, startShift, endDate, endShift, r.date, r.shift))
//       .map(r => ({
//         date: r.date,
//         shift: r.shift,
//         type: r.type,
//         liters: parseFloat(r.liters) || 0,
//         fat: parseFloat(r.fat) || 0,
//         snf: parseFloat(r.snf) || 0,
//         clr: parseFloat(r.clr) || 0,
//         rate: parseFloat(r.rate) || 0,
//         amount: parseFloat(r.amount) || 0
//       }));

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

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // Build datetime boundaries
//     const startDateTime = startShift === "Evening"
//       ? `${startDate} 12:00:00`
//       : `${startDate} 00:00:00`;

//     const endDateTime = endShift === "Morning"
//       ? `${endDate} 12:00:00`
//       : `${endDate} 23:59:59`;

//     // Build WHERE clause
//     let where = `c.dairy_id=? AND u.dairy_id=? AND c.created_at BETWEEN ? AND ?`;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];
//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // Query DB (keep shift column intact)
//     const [rows] = await db.query(
//       `SELECT DATE(c.created_at) as date, c.shift, c.type,
//               c.farmer_id, u.fullName as farmer_name,
//               SUM(c.quantity) as liters,
//               ROUND(AVG(c.fat),1) as fat,
//               ROUND(AVG(c.snf),1) as snf,
//               ROUND(AVG(c.clr),1) as clr,
//               ROUND(AVG(c.rate),1) as rate,
//               SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
//       params
//     );

//     // Format result
//     const report = rows.map(r => ({
//       date: r.date,
//       shift: r.shift,
//       type: r.type,
//       farmer_id: r.farmer_id,
//       farmer_name: r.farmer_name,
//       liters: Number(r.liters) || 0,
//       fat: Number(r.fat) || 0,
//       snf: Number(r.snf) || 0,
//       clr: Number(r.clr) || 0,
//       rate: Number(r.rate) || 0,
//       amount: Number(r.amount) || 0,
//     }));

//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // Build datetime boundaries
//     const startDateTime = startShift === "Evening"
//       ? `${startDate} 12:00:00`
//       : `${startDate} 00:00:00`;

//     const endDateTime = endShift === "Morning"
//       ? `${endDate} 12:00:00`
//       : `${endDate} 23:59:59`;

//     // Build WHERE clause
//     let where = `c.dairy_id=? AND u.dairy_id=? AND c.created_at BETWEEN ? AND ?`;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];
//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // Query DB (force IST conversion)
//     const [rows] = await db.query(
//       `SELECT DATE_FORMAT(CONVERT_TZ(c.created_at, '+00:00', '+05:30'), '%Y-%m-%d') as date,
//               c.shift, c.type,
//               c.farmer_id, u.fullName as farmer_name,
//               SUM(c.quantity) as liters,
//               ROUND(AVG(c.fat),1) as fat,
//               ROUND(AVG(c.snf),1) as snf,
//               ROUND(AVG(c.clr),1) as clr,
//               ROUND(AVG(c.rate),1) as rate,
//               SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(CONVERT_TZ(c.created_at, '+00:00', '+05:30')),
//                 c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(CONVERT_TZ(c.created_at, '+00:00', '+05:30')),
//                 FIELD(c.shift,'Morning','Evening'),
//                 c.farmer_id`,
//       params
//     );

//     // Format result
//     const report = rows.map(r => ({
//       date: r.date, // already formatted as YYYY-MM-DD (IST)
//       shift: r.shift,
//       type: r.type,
//       farmer_id: r.farmer_id,
//       farmer_name: r.farmer_name,
//       liters: Number(r.liters) || 0,
//       fat: Number(r.fat) || 0,
//       snf: Number(r.snf) || 0,
//       clr: Number(r.clr) || 0,
//       rate: Number(r.rate) || 0,
//       amount: Number(r.amount) || 0,
//     }));

//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // Build datetime boundaries
//     const startDateTime =
//       startShift === "Evening"
//         ? `${startDate} 12:00:00`
//         : `${startDate} 00:00:00`;

//     const endDateTime =
//       endShift === "Morning"
//         ? `${endDate} 12:00:00`
//         : `${endDate} 23:59:59`;

//     // Build WHERE clause
//     let where = `c.dairy_id=? AND u.dairy_id=? AND c.created_at BETWEEN ? AND ?`;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];
//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // Query DB (fix GROUP BY with same expr)
//     const [rows] = await db.query(
//       `SELECT DATE_FORMAT(CONVERT_TZ(c.created_at, '+00:00', '+05:30'), '%Y-%m-%d') as date,
//               c.shift, c.type,
//               c.farmer_id, u.fullName as farmer_name,
//               SUM(c.quantity) as liters,
//               ROUND(AVG(c.fat),1) as fat,
//               ROUND(AVG(c.snf),1) as snf,
//               ROUND(AVG(c.clr),1) as clr,
//               ROUND(AVG(c.rate),1) as rate,
//               SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE_FORMAT(CONVERT_TZ(c.created_at, '+00:00', '+05:30'), '%Y-%m-%d'),
//                 c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE_FORMAT(CONVERT_TZ(c.created_at, '+00:00', '+05:30'), '%Y-%m-%d'),
//                 FIELD(c.shift,'Morning','Evening'),
//                 c.farmer_id`,
//       params
//     );

//     // Format result
//     const report = rows.map(r => ({
//       date: r.date, // already formatted YYYY-MM-DD in IST
//       shift: r.shift,
//       type: r.type,
//       farmer_id: r.farmer_id,
//       farmer_name: r.farmer_name,
//       liters: Number(r.liters) || 0,
//       fat: Number(r.fat) || 0,
//       snf: Number(r.snf) || 0,
//       clr: Number(r.clr) || 0,
//       rate: Number(r.rate) || 0,
//       amount: Number(r.amount) || 0,
//     }));

//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // Shift boundaries in IST
//     const startDateTime =
//       startShift === "Evening"
//         ? `${startDate} 12:00:00`
//         : `${startDate} 00:00:00`;

//     const endDateTime =
//       endShift === "Morning"
//         ? `${endDate} 11:59:59`
//         : `${endDate} 23:59:59`;

//     // WHERE clause
//     let where = `c.dairy_id=? AND u.dairy_id=? 
//                  AND CONVERT_TZ(c.created_at,'+00:00','+05:30') BETWEEN ? AND ?`;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];
//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     const [rows] = await db.query(
//       `SELECT DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d') as date,
//               c.shift, c.type,
//               c.farmer_id, u.fullName as farmer_name,
//               SUM(c.quantity) as liters,
//               ROUND(AVG(c.fat),1) as fat,
//               ROUND(AVG(c.snf),1) as snf,
//               ROUND(AVG(c.clr),1) as clr,
//               ROUND(AVG(c.rate),1) as rate,
//               SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//                 c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//                 FIELD(c.shift,'Morning','Evening'),
//                 c.farmer_id`,
//       params
//     );

//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report: rows,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // Shift boundaries in IST
//     const startDateTime =
//       startShift === "Evening"
//         ? `${startDate} 12:00:00`
//         : `${startDate} 00:00:00`;

//     const endDateTime =
//       endShift === "Morning"
//         ? `${endDate} 11:59:59`
//         : `${endDate} 23:59:59`;

//     // WHERE clause
//     let where = `
//       c.dairy_id=? 
//       AND u.dairy_id=? 
//       AND CONVERT_TZ(c.created_at,'+00:00','+05:30') BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     const [rows] = await db.query(
//       `SELECT 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d') as date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName as farmer_name,
//           SUM(c.quantity) as liters,
//           ROUND(AVG(c.fat),1) as fat,
//           ROUND(AVG(c.snf),1) as snf,
//           ROUND(AVG(c.clr),1) as clr,
//           ROUND(AVG(c.rate),1) as rate,
//           SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//           c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//           FIELD(c.shift,'Morning','Evening'),
//           c.farmer_id`,
//       params
//     );

//     // ✅ additionally enforce shift filtering (edge case: same day with Morning+Evening)
//     const filtered = rows.filter(r => {
//       if (r.date === startDate && startShift === "Evening" && r.shift === "Morning") {
//         return false; // drop morning of startDate
//       }
//       if (r.date === endDate && endShift === "Morning" && r.shift === "Evening") {
//         return false; // drop evening of endDate
//       }
//       return true;
//     });

//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report: filtered,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // ---- Build datetime boundaries in IST ----
//     const startDateTime =
//       startShift === "Evening"
//         ? `${startDate} 12:00:00`
//         : `${startDate} 00:00:00`;

//     const endDateTime =
//       endShift === "Morning"
//         ? `${endDate} 11:59:59`
//         : `${endDate} 23:59:59`;

//     // ---- Base WHERE ----
//     let where = `
//       c.dairy_id=? 
//       AND u.dairy_id=? 
//       AND CONVERT_TZ(c.created_at,'+00:00','+05:30') BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // ---- Fetch data ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d') as date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName as farmer_name,
//           SUM(c.quantity) as liters,
//           ROUND(AVG(c.fat),1) as fat,
//           ROUND(AVG(c.snf),1) as snf,
//           ROUND(AVG(c.clr),1) as clr,
//           ROUND(AVG(c.rate),1) as rate,
//           SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//           c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//           FIELD(c.shift,'Morning','Evening'),
//           c.farmer_id`,
//       params
//     );

//     // ---- Smart filter logic for same-date case ----
//     let filtered = rows;
//     if (startDate === endDate) {
//       // If both are the same date, limit to requested shift or both if start==end==Both
//       filtered = rows.filter(r => {
//         if (startShift === endShift) {
//           return r.shift === startShift;
//         } else {
//           // e.g. startShift=Morning, endShift=Evening -> both allowed
//           return r.shift === "Morning" || r.shift === "Evening";
//         }
//       });
//     } else {
//       // For multi-day range, keep your existing edge shift filtering
//       filtered = rows.filter(r => {
//         if (r.date === startDate && startShift === "Evening" && r.shift === "Morning") {
//           return false;
//         }
//         if (r.date === endDate && endShift === "Morning" && r.shift === "Evening") {
//           return false;
//         }
//         return true;
//       });
//     }

//     // ---- Return final report ----
//     res.json({
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       report: filtered,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;

//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     let startDateTime, endDateTime;

//     // ✅ Same date case: use full day range explicitly
//     if (startDate === endDate) {
//       startDateTime = `${startDate} 00:00:00`;
//       endDateTime = `${endDate} 23:59:59`;
//     } else {
//       // ✅ Multi-day logic with shift-based range
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;

//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause
//     let where = `
//       c.dairy_id=? 
//       AND u.dairy_id=? 
//       AND CONVERT_TZ(c.created_at,'+00:00','+05:30') BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type=?`;
//       params.push(milkType);
//     }

//     // ---- Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d') as date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName as farmer_name,
//           SUM(c.quantity) as liters,
//           ROUND(AVG(c.fat),1) as fat,
//           ROUND(AVG(c.snf),1) as snf,
//           ROUND(AVG(c.clr),1) as clr,
//           ROUND(AVG(c.rate),1) as rate,
//           SUM(c.quantity * c.rate) as amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//           c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY 
//           DATE_FORMAT(CONVERT_TZ(c.created_at,'+00:00','+05:30'),'%Y-%m-%d'),
//           FIELD(c.shift,'Morning','Evening'),
//           c.farmer_id`,
//       params
//     );

//     // ✅ Handle filtering properly for same date
//     let filtered = rows;
//     if (startDate === endDate) {
//       filtered = rows.filter((r) => {
//         if (startShift === endShift) {
//           // Only one shift
//           return r.shift === startShift;
//         }
//         // Morning–Evening full day range → include both
//         return true;
//       });
//     } else {
//       // For multiple days, keep edge filtering
//       filtered = rows.filter((r) => {
//         if (r.date === startDate && startShift === "Evening" && r.shift === "Morning") {
//           return false;
//         }
//         if (r.date === endDate && endShift === "Morning" && r.shift === "Evening") {
//           return false;
//         }
//         return true;
//       });
//     }

//     // ✅ Add total averages at the end
//     const avgFat =
//       filtered.length > 0
//         ? (
//             filtered.reduce((sum, r) => sum + (Number(r.fat) || 0), 0) / filtered.length
//           ).toFixed(2)
//         : 0;

//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       avg_fat: Number(avgFat),
//       report: filtered,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;

//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // ---- Build time window ----
//     let startDateTime, endDateTime;

//     // ✅ Handle same-day requests properly
//     if (startDate === endDate) {
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;
//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     } else {
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;
//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause (manual timezone conversion)
//     let where = `
//       c.dairy_id = ?
//       AND u.dairy_id = ?
//       AND (c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE)
//           BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type = ?`;
//       params.push(milkType);
//     }

//     // ---- SQL Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE_FORMAT((c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE),'%Y-%m-%d') AS date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName AS farmer_name,
//           SUM(c.quantity) AS liters,
//           ROUND(AVG(c.fat),1) AS fat,
//           ROUND(AVG(c.snf),1) AS snf,
//           ROUND(AVG(c.clr),1) AS clr,
//           ROUND(AVG(c.rate),1) AS rate,
//           SUM(c.quantity * c.rate) AS amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY 
//           DATE_FORMAT((c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE),'%Y-%m-%d'),
//           c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY 
//           DATE_FORMAT((c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE),'%Y-%m-%d'),
//           FIELD(c.shift,'Morning','Evening'),
//           c.farmer_id`,
//       params
//     );

//     // ---- Filter by shifts if same date ----
//     let filtered = rows;
//     if (startDate === endDate) {
//       if (startShift === endShift) {
//         filtered = rows.filter((r) => r.shift === startShift);
//       }
//     } else {
//       filtered = rows.filter((r) => {
//         if (r.date === startDate && startShift === "Evening" && r.shift === "Morning") return false;
//         if (r.date === endDate && endShift === "Morning" && r.shift === "Evening") return false;
//         return true;
//       });
//     }

//     // ---- Average fat across filtered ----
//     const avgFat =
//       filtered.length > 0
//         ? (
//             filtered.reduce((sum, r) => sum + (Number(r.fat) || 0), 0) /
//             filtered.length
//           ).toFixed(2)
//         : 0;

//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       avg_fat: Number(avgFat),
//       report: filtered,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }


// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;

//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // ---- Build time window ----
//     let startDateTime, endDateTime;

//     // ✅ If same day → get entire day (00:00 → 23:59)
//     if (startDate === endDate) {
//       startDateTime = `${startDate} 00:00:00`;
//       endDateTime = `${endDate} 23:59:59`;
//     } else {
//       // normal range logic
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;

//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause (manual timezone conversion to IST)
//     let where = `
//       c.dairy_id = ?
//       AND u.dairy_id = ?
//       AND (c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE)
//           BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type = ?`;
//       params.push(milkType);
//     }

//     // ---- Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE_FORMAT((c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE),'%Y-%m-%d') AS date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName AS farmer_name,
//           SUM(c.quantity) AS liters,
//           ROUND(AVG(c.fat),1) AS fat,
//           ROUND(AVG(c.snf),1) AS snf,
//           ROUND(AVG(c.clr),1) AS clr,
//           ROUND(AVG(c.rate),1) AS rate,
//           SUM(c.quantity * c.rate) AS amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY 
//           DATE_FORMAT((c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE),'%Y-%m-%d'),
//           c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY 
//           DATE_FORMAT((c.created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE),'%Y-%m-%d'),
//           FIELD(c.shift,'Morning','Evening'),
//           c.farmer_id`,
//       params
//     );

//     // ---- For same date → include all (no shift filter)
//     let filtered = rows;
//     if (startDate !== endDate) {
//       filtered = rows.filter((r) => {
//         if (r.date === startDate && startShift === "Evening" && r.shift === "Morning") return false;
//         if (r.date === endDate && endShift === "Morning" && r.shift === "Evening") return false;
//         return true;
//       });
//     }

//     // ---- Calculate overall averages ----
//     const avgFat =
//       filtered.length > 0
//         ? (
//             filtered.reduce((sum, r) => sum + (Number(r.fat) || 0), 0) /
//             filtered.length
//           ).toFixed(2)
//         : 0;

//     const avgSnf =
//       filtered.length > 0
//         ? (
//             filtered.reduce((sum, r) => sum + (Number(r.snf) || 0), 0) /
//             filtered.length
//           ).toFixed(2)
//         : 0;

//     const avgClr =
//       filtered.length > 0
//         ? (
//             filtered.reduce((sum, r) => sum + (Number(r.clr) || 0), 0) /
//             filtered.length
//           ).toFixed(2)
//         : 0;

//     const totalLiters = filtered.reduce((sum, r) => sum + (Number(r.liters) || 0), 0);
//     const totalAmount = filtered.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

//     // ---- Final response ----
//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       summary: {
//         avg_fat: Number(avgFat),
//         avg_snf: Number(avgSnf),
//         avg_clr: Number(avgClr),
//         total_liters: Number(totalLiters),
//         total_amount: Number(totalAmount),
//       },
//       report: filtered,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     // ---- Time boundaries (IST stored) ----
//     let startDateTime, endDateTime;

//     // ✅ If same day, take full day
//     if (startDate === endDate) {
//       startDateTime = `${startDate} 00:00:00`;
//       endDateTime = `${endDate} 23:59:59`;
//     } else {
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;

//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause ----
//     let where = `
//       c.dairy_id = ?
//       AND u.dairy_id = ?
//       AND c.created_at BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type = ?`;
//       params.push(milkType);
//     }

//     // ---- Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE(c.created_at) AS date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName AS farmer_name,
//           SUM(c.quantity) AS liters,
//           ROUND(AVG(c.fat),1) AS fat,
//           ROUND(AVG(c.snf),1) AS snf,
//           ROUND(AVG(c.clr),1) AS clr,
//           ROUND(AVG(c.rate),1) AS rate,
//           SUM(c.quantity * c.rate) AS amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
//       params
//     );

//     // ---- If same date → no shift filtering ----
//     let filtered = rows;
//     if (startDate !== endDate) {
//       filtered = rows.filter((r) => {
//         if (r.date === startDate && startShift === "Evening" && r.shift === "Morning") return false;
//         if (r.date === endDate && endShift === "Morning" && r.shift === "Evening") return false;
//         return true;
//       });
//     }

//     // ---- Calculate totals and averages ----
//     const avgFat =
//       filtered.length > 0
//         ? (filtered.reduce((s, r) => s + (Number(r.fat) || 0), 0) / filtered.length).toFixed(2)
//         : 0;

//     const avgSnf =
//       filtered.length > 0
//         ? (filtered.reduce((s, r) => s + (Number(r.snf) || 0), 0) / filtered.length).toFixed(2)
//         : 0;

//     const avgClr =
//       filtered.length > 0
//         ? (filtered.reduce((s, r) => s + (Number(r.clr) || 0), 0) / filtered.length).toFixed(2)
//         : 0;

//     const totalLiters = filtered.reduce((s, r) => s + (Number(r.liters) || 0), 0);
//     const totalAmount = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);

//     // ---- Response ----
//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       summary: {
//         avg_fat: Number(avgFat),
//         avg_snf: Number(avgSnf),
//         avg_clr: Number(avgClr),
//         total_liters: Number(totalLiters),
//         total_amount: Number(totalAmount),
//       },
//       report: filtered,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     let startDateTime, endDateTime;

//     // ✅ Handle same date logic correctly
//     if (startDate === endDate) {
//       if (startShift === "Morning" && endShift === "Morning") {
//         // Only morning shift data
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 11:59:59`;
//       } else if (startShift === "Evening" && endShift === "Evening") {
//         // Only evening shift data
//         startDateTime = `${startDate} 12:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//       } else {
//         // Full day
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//       }
//     } else {
//       // Different dates
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;

//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause ----
//     let where = `
//       c.dairy_id = ?
//       AND u.dairy_id = ?
//       AND c.created_at BETWEEN ? AND ?
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type = ?`;
//       params.push(milkType);
//     }

//     // ---- Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE(c.created_at) AS date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName AS farmer_name,
//           SUM(c.quantity) AS liters,
//           ROUND(AVG(c.fat),1) AS fat,
//           ROUND(AVG(c.snf),1) AS snf,
//           ROUND(AVG(c.clr),1) AS clr,
//           ROUND(AVG(c.rate),1) AS rate,
//           SUM(c.quantity * c.rate) AS amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
//       params
//     );

//     // ---- Calculate totals and averages ----
//     const avgFat =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.fat) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const avgSnf =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.snf) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const avgClr =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.clr) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const totalLiters = rows.reduce((s, r) => s + (Number(r.liters) || 0), 0);
//     const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

//     // ---- Response ----
//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       summary: {
//         avg_fat: Number(avgFat),
//         avg_snf: Number(avgSnf),
//         avg_clr: Number(avgClr),
//         total_liters: Number(totalLiters),
//         total_amount: Number(totalAmount),
//       },
//       report: rows,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     let startDateTime, endDateTime, shiftFilter = "";

//     // ✅ Handle same date logic correctly
//     if (startDate === endDate) {
//       if (startShift === "Morning" && endShift === "Morning") {
//         // Only morning shift
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//         shiftFilter = "AND c.shift = 'Morning'";
//       } else if (startShift === "Evening" && endShift === "Evening") {
//         // Only evening shift
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//         shiftFilter = "AND c.shift = 'Evening'";
//       } else {
//         // Full day
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//       }
//     } else {
//       // Different dates
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;

//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause ----
//     let where = `
//       c.dairy_id = ?
//       AND u.dairy_id = ?
//       AND c.created_at BETWEEN ? AND ?
//       ${shiftFilter}
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type = ?`;
//       params.push(milkType);
//     }

//     // ---- Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE(c.created_at) AS date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName AS farmer_name,
//           SUM(c.quantity) AS liters,
//           ROUND(AVG(c.fat),1) AS fat,
//           ROUND(AVG(c.snf),1) AS snf,
//           ROUND(AVG(c.clr),1) AS clr,
//           ROUND(AVG(c.rate),1) AS rate,
//           SUM(c.quantity * c.rate) AS amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
//       params
//     );

//     // ---- Calculate totals and averages ----
//     const avgFat =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.fat) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const avgSnf =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.snf) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const avgClr =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.clr) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const totalLiters = rows.reduce((s, r) => s + (Number(r.liters) || 0), 0);
//     const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

//     // ---- Response ----
//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       summary: {
//         avg_fat: Number(avgFat),
//         avg_snf: Number(avgSnf),
//         avg_clr: Number(avgClr),
//         total_liters: Number(totalLiters),
//         total_amount: Number(totalAmount),
//       },
//       report: rows,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// async function getDailyShiftReport(req, res) {
//   try {
//     const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
//     if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
//       return res.status(400).json({
//         message: "dairyid, startDate, startShift, endDate, endShift required",
//       });
//     }

//     let startDateTime, endDateTime, shiftFilter = "";

//     // ✅ Handle same date logic correctly
//     if (startDate === endDate) {
//       if (startShift === "Morning" && endShift === "Morning") {
//         // Only morning shift
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//         shiftFilter = "AND c.shift = 'Morning'";
//       } else if (startShift === "Evening" && endShift === "Evening") {
//         // Only evening shift
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//         shiftFilter = "AND c.shift = 'Evening'";
//       } else {
//         // Full day
//         startDateTime = `${startDate} 00:00:00`;
//         endDateTime = `${endDate} 23:59:59`;
//       }
//     } else {
//       // Different dates
//       startDateTime =
//         startShift === "Evening"
//           ? `${startDate} 12:00:00`
//           : `${startDate} 00:00:00`;

//       endDateTime =
//         endShift === "Morning"
//           ? `${endDate} 11:59:59`
//           : `${endDate} 23:59:59`;
//     }

//     // ---- WHERE clause ----
//     let where = `
//       c.dairy_id = ?
//       AND u.dairy_id = ?
//       AND c.created_at BETWEEN ? AND ?
//       ${shiftFilter}
//     `;
//     const params = [dairyid, dairyid, startDateTime, endDateTime];

//     if (milkType && milkType !== "All") {
//       where += ` AND c.type = ?`;
//       params.push(milkType);
//     }

//     // ---- Query ----
//     const [rows] = await db.query(
//       `SELECT 
//           DATE(c.created_at) AS date,
//           c.shift, c.type,
//           c.farmer_id, u.fullName AS farmer_name,
//           SUM(c.quantity) AS liters,
//           ROUND(AVG(c.fat),1) AS fat,
//           ROUND(AVG(c.snf),1) AS snf,
//           ROUND(AVG(c.clr),1) AS clr,
//           ROUND(AVG(c.rate),1) AS rate,
//           SUM(c.quantity * c.rate) AS amount
//        FROM collections c
//        JOIN users u ON u.username = c.farmer_id
//        WHERE ${where}
//        GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
//        ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
//       params
//     );

//     // ---- Calculate totals and averages ----
//     const avgFat =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.fat) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const avgSnf =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.snf) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const avgClr =
//       rows.length > 0
//         ? (rows.reduce((s, r) => s + (Number(r.clr) || 0), 0) / rows.length).toFixed(2)
//         : 0;

//     const totalLiters = rows.reduce((s, r) => s + (Number(r.liters) || 0), 0);
//     const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

//     // ---- Response ----
//     res.json({
//       success: true,
//       dairy_id: dairyid,
//       period: { startDate, startShift, endDate, endShift },
//       type: milkType || "All",
//       summary: {
//         avg_fat: Number(avgFat),
//         avg_snf: Number(avgSnf),
//         avg_clr: Number(avgClr),
//         total_liters: Number(totalLiters),
//         total_amount: Number(totalAmount),
//       },
//       report: rows,
//     });
//   } catch (err) {
//     console.error("Error generating daily shift report:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

async function getDailyShiftReport(req, res) {
  try {
    const { dairyid, startDate, startShift, endDate, endShift, milkType } = req.query;
    if (!dairyid || !startDate || !startShift || !endDate || !endShift) {
      return res.status(400).json({
        message: "dairyid, startDate, startShift, endDate, endShift required",
      });
    }

    const params = [dairyid, dairyid];
    let where = `c.dairy_id = ? AND u.dairy_id = ?`;
    let shiftCondition = "";
    let dateConditions = [];

    // 🕓 1️⃣ SAME DATE
    if (startDate === endDate) {
      if (startShift === "Morning" && endShift === "Morning") {
        shiftCondition = `AND c.shift = 'Morning'`;
        dateConditions.push(`DATE(c.created_at) = '${startDate}'`);
      } else if (startShift === "Evening" && endShift === "Evening") {
        shiftCondition = `AND c.shift = 'Evening'`;
        dateConditions.push(`DATE(c.created_at) = '${startDate}'`);
      } else {
        // Full day
        dateConditions.push(`DATE(c.created_at) = '${startDate}'`);
      }
    }

    // 🕓 2️⃣ CROSS-DAY CASE (Evening → Morning)
    else if (startShift === "Evening" && endShift === "Morning") {
      dateConditions.push(`(
        (DATE(c.created_at) = '${startDate}' AND c.shift = 'Evening')
        OR
        (DATE(c.created_at) = '${endDate}' AND c.shift = 'Morning')
      )`);
    }

    // 🕓 3️⃣ NORMAL RANGE (Morning → Evening, or different dates)
    else {
      const startDateTime = startShift === "Evening"
        ? `${startDate} 12:00:00`
        : `${startDate} 00:00:00`;

      const endDateTime = endShift === "Morning"
        ? `${endDate} 11:59:59`
        : `${endDate} 23:59:59`;

      dateConditions.push(`c.created_at BETWEEN '${startDateTime}' AND '${endDateTime}'`);
    }

    // 🐮 Milk Type filter
    if (milkType && milkType !== "All") {
      where += ` AND c.type = ?`;
      params.push(milkType);
    }

    // Final WHERE clause
    where += ` AND (${dateConditions.join(" OR ")}) ${shiftCondition}`;

    // ---- Query ----
    const [rows] = await db.query(
      `SELECT 
          DATE(c.created_at) AS date,
          c.shift, c.type,
          c.farmer_id, u.fullName AS farmer_name,
          SUM(c.quantity) AS liters,
          ROUND(AVG(c.fat),1) AS fat,
          ROUND(AVG(c.snf),1) AS snf,
          ROUND(AVG(c.clr),1) AS clr,
          ROUND(AVG(c.rate),1) AS rate,
          SUM(c.quantity * c.rate) AS amount
       FROM collections c
       JOIN users u ON u.username = c.farmer_id
       WHERE ${where}
       GROUP BY DATE(c.created_at), c.shift, c.type, c.farmer_id, u.fullName
       ORDER BY DATE(c.created_at), FIELD(c.shift,'Morning','Evening'), c.farmer_id`,
      params
    );

    // ---- Totals ----
    const avgFat =
      rows.length > 0
        ? (rows.reduce((s, r) => s + (Number(r.fat) || 0), 0) / rows.length).toFixed(2)
        : 0;

    const avgSnf =
      rows.length > 0
        ? (rows.reduce((s, r) => s + (Number(r.snf) || 0), 0) / rows.length).toFixed(2)
        : 0;

    const avgClr =
      rows.length > 0
        ? (rows.reduce((s, r) => s + (Number(r.clr) || 0), 0) / rows.length).toFixed(2)
        : 0;

    const totalLiters = rows.reduce((s, r) => s + (Number(r.liters) || 0), 0);
    const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    // ---- Response ----
    res.json({
      success: true,
      dairy_id: dairyid,
      period: { startDate, startShift, endDate, endShift },
      type: milkType || "All",
      summary: {
        avg_fat: Number(avgFat),
        avg_snf: Number(avgSnf),
        avg_clr: Number(avgClr),
        total_liters: Number(totalLiters),
        total_amount: Number(totalAmount),
      },
      report: rows,
    });
  } catch (err) {
    console.error("Error generating daily shift report:", err);
    res.status(500).json({ message: "Server error" });
  }
}






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