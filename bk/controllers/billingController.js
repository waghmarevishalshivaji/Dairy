const db = require('../config/db');
const bcrypt = require('bcryptjs');

// async function generateBill(req, res) {
//   try {
//     const { farmer_id, period_start, period_end, dairy_id } = req.body;

//     const [[milk]] = await db.query(
//       `SELECT SUM(quantity*rate) as milk_total
//        FROM collections
//        WHERE farmer_id=? AND dairy_id=? AND DATE(created_at) BETWEEN ? AND ?`,
//       [farmer_id, dairy_id, period_start, period_end]
//     );

//     const [[payments]] = await db.query(
//       `SELECT SUM(amount_taken) as advance_total, SUM(received) as received_total
//        FROM farmer_payments
//        WHERE farmer_id=? AND dairy_id=? AND date BETWEEN ? AND ?`,
//       [farmer_id, dairy_id, period_start, period_end]
//     );

//     const milkTotal = milk.milk_total || 0;
//     const advanceTotal = payments.advance_total || 0;
//     const receivedTotal = payments.received_total || 0;
//     const netPayable = milkTotal - advanceTotal + receivedTotal;

//     const [result] = await db.query(
//       `INSERT INTO bills (farmer_id, dairy_id, period_start, period_end, milk_total, advance_total, received_total, net_payable, status, is_finalized)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
//       [farmer_id, dairy_id, period_start, period_end, milkTotal, advanceTotal, receivedTotal, netPayable]
//     );

//     res.json({
//       bill_id: result.insertId,
//       farmer_id,
//       dairy_id,
//       milkTotal,
//       advanceTotal,
//       receivedTotal,
//       netPayable,
//       status: "pending"
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// async function generateBill(req, res) {
//   try {
//     const {
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total,
//       net_payable,
//       total_advance,
//       total_feed,
//       total_other,
//       total_received,
//       remaining_advance,
//       remaining_cattle_feed,
//       remaining_other1,
//       remaining_other2
//     } = req.body;

//     // If values not passed from frontend, fallback to DB calculation
//     let milkTotal = Number(milk_total) || 0;
//     let advanceTotal = Number(total_advance) || 0;
//     let receivedTotal = Number(total_received) || 0;
//     let feedTotal = Number(total_feed) || 0;
//     let otherTotal = Number(total_other) || 0;
//     let netPayable = Number(net_payable) || (milkTotal - advanceTotal - feedTotal - otherTotal + receivedTotal);

//     // Insert into bills
//     const [result] = await db.query(
//       `INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, feed_total, other_total,
//         received_total, net_payable,
//         remaining_advance, remaining_cattle_feed, remaining_other1, remaining_other2,
//         status, is_finalized
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
//       [
//         farmer_id, dairy_id, period_start, period_end,
//         milkTotal, advanceTotal, feedTotal, otherTotal,
//         receivedTotal, netPayable,
//         Number(remaining_advance) || 0,
//         Number(remaining_cattle_feed) || 0,
//         Number(remaining_other1) || 0,
//         Number(remaining_other2) || 0
//       ]
//     );

//     res.json({
//       success: true,
//       bill_id: result.insertId,
//       farmer_id,
//       dairy_id,
//       milkTotal,
//       advanceTotal,
//       feedTotal,
//       otherTotal,
//       receivedTotal,
//       netPayable,
//       remaining: {
//         advance: Number(remaining_advance) || 0,
//         cattle_feed: Number(remaining_cattle_feed) || 0,
//         other1: Number(remaining_other1) || 0,
//         other2: Number(remaining_other2) || 0
//       },
//       status: "pending"
//     });
//   } catch (err) {
//     console.error("Error generating bill:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

// async function generateBill(req, res) {
//   try {
//     const {
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total,
//       advance_total,
//       received_total,
//       net_payable
//     } = req.body;

//     // Use payload values, fallback to 0
//     const milkTotal = Number(milk_total) || 0;
//     const advanceTotal = Number(advance_total) || 0;
//     const receivedTotal = Number(received_total) || 0;
//     const netPayable = Number(net_payable) || (milkTotal - advanceTotal + receivedTotal);

//     // Insert into bills
//     const [result] = await db.query(
//       `INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable, status, is_finalized
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
//       [
//         farmer_id,
//         dairy_id,
//         period_start,
//         period_end,
//         milkTotal,
//         advanceTotal,
//         receivedTotal,
//         netPayable
//       ]
//     );

//     res.json({
//       success: true,
//       bill_id: result.insertId,
//       farmer_id,
//       dairy_id,
//       milkTotal,
//       advanceTotal,
//       receivedTotal,
//       netPayable,
//       status: "pending"
//     });
//   } catch (err) {
//     console.error("Error generating bill:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

// async function generateBill(req, res) {
//   try {
//     const {
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total,
//       advance_total,
//       received_total,
//       net_payable
//     } = req.body;

//     // Ensure numeric values
//     const milkTotal = Number(milk_total) || 0;
//     const advanceTotal = Number(advance_total) || 0;
//     const receivedTotal = Number(received_total) || 0;
//     const netPayable = Number(net_payable) || (milkTotal - advanceTotal + receivedTotal);

//     // Upsert query → insert if not exists, else update
//     const [result] = await db.query(
//       `INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable, status, is_finalized
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
//       ON DUPLICATE KEY UPDATE
//         milk_total = VALUES(milk_total),
//         advance_total = VALUES(advance_total),
//         received_total = VALUES(received_total),
//         net_payable = VALUES(net_payable),
//         status = 'pending',
//         is_finalized = 0`,
//       [
//         farmer_id,
//         dairy_id,
//         period_start,
//         period_end,
//         milkTotal,
//         advanceTotal,
//         receivedTotal,
//         netPayable
//       ]
//     );

//     res.json({
//       success: true,
//       action: result.affectedRows > 1 ? "updated" : "inserted",
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milkTotal,
//       advanceTotal,
//       receivedTotal,
//       netPayable,
//       status: "pending"
//     });
//   } catch (err) {
//     console.error("Error generating bill:", err);
//     res.status(500).json({ error: err.message });
//   }
// }


// async function generateBill(req, res) {
//   try {
//     const {
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total,
//       advance_total,
//       received_total,
//       net_payable,
//       advance_remaining,
//       cattlefeed_remaining,
//       other1_remaining,
//       other2_remaining
//     } = req.body;

//     // Ensure numeric values
//     const milkTotal = Number(milk_total) || 0;
//     const advanceTotal = Number(advance_total) || 0;
//     const receivedTotal = Number(received_total) || 0;
//     const netPayable =
//       Number(net_payable) || (milkTotal - advanceTotal + receivedTotal);

//     const advRemaining = Number(advance_remaining) || 0;
//     const feedRemaining = Number(cattlefeed_remaining) || 0;
//     const o1Remaining = Number(other1_remaining) || 0;
//     const o2Remaining = Number(other2_remaining) || 0;

//     // Upsert query → insert if not exists, else update
//     const [result] = await db.query(
//       `INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable,
//         advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//         status, is_finalized
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
//       ON DUPLICATE KEY UPDATE
//         milk_total = VALUES(milk_total),
//         advance_total = VALUES(advance_total),
//         received_total = VALUES(received_total),
//         net_payable = VALUES(net_payable),
//         advance_remaining = VALUES(advance_remaining),
//         cattlefeed_remaining = VALUES(cattlefeed_remaining),
//         other1_remaining = VALUES(other1_remaining),
//         other2_remaining = VALUES(other2_remaining),
//         status = 'pending',
//         is_finalized = 0`,
//       [
//         farmer_id,
//         dairy_id,
//         period_start,
//         period_end,
//         milkTotal,
//         advanceTotal,
//         receivedTotal,
//         netPayable,
//         advRemaining,
//         feedRemaining,
//         o1Remaining,
//         o2Remaining
//       ]
//     );

//     res.json({
//       success: true,
//       action: result.affectedRows > 1 ? "updated" : "inserted",
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total: milkTotal,
//       advance_total: advanceTotal,
//       received_total: receivedTotal,
//       net_payable: netPayable,
//       advance_remaining: advRemaining,
//       cattlefeed_remaining: feedRemaining,
//       other1_remaining: o1Remaining,
//       other2_remaining: o2Remaining,
//       status: "pending"
//     });
//   } catch (err) {
//     console.error("Error generating bill:", err);
//     res.status(500).json({ error: err.message });
//   }
// }


// async function generateBill(req, res) {
//   try {
//     const {
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total,
//       advance_total,
//       received_total,
//       net_payable,
//       advance_remaining,
//       cattlefeed_remaining,
//       other1_remaining,
//       other2_remaining,
//       cattlefeed_total,
//       other1_total,
//       other2_total
//     } = req.body;

//     const [result] = await db.query(
//       `INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable,
//         advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//         cattlefeed_total, other1_total, other2_total,
//         status, is_finalized
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
//       ON DUPLICATE KEY UPDATE
//         milk_total = VALUES(milk_total),
//         advance_total = VALUES(advance_total),
//         received_total = VALUES(received_total),
//         net_payable = VALUES(net_payable),
//         advance_remaining = VALUES(advance_remaining),
//         cattlefeed_remaining = VALUES(cattlefeed_remaining),
//         other1_remaining = VALUES(other1_remaining),
//         other2_remaining = VALUES(other2_remaining),
//         cattlefeed_total = VALUES(cattlefeed_total),
//         other1_total = VALUES(other1_total),
//         other2_total = VALUES(other2_total),
//         status = 'pending',
//         is_finalized = 0`,
//       [
//         farmer_id,
//         dairy_id,
//         period_start,
//         period_end,
//         milk_total || 0,
//         advance_total || 0,
//         received_total || 0,
//         net_payable || 0,
//         advance_remaining || 0,
//         cattlefeed_remaining || 0,
//         other1_remaining || 0,
//         other2_remaining || 0,
//         cattlefeed_total || 0,
//         other1_total || 0,
//         other2_total || 0
//       ]
//     );

//     res.json({
//       success: true,
//       action: result.affectedRows > 1 ? "updated" : "inserted",
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milk_total,
//       advance_total,
//       received_total,
//       net_payable,
//       advance_remaining,
//       cattlefeed_remaining,
//       other1_remaining,
//       other2_remaining,
//       cattlefeed_total,
//       other1_total,
//       other2_total,
//       status: "pending"
//     });
//   } catch (err) {
//     console.error("Error generating bill:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

async function generateBill(req, res) {
  try {
    const {
      farmer_id,
      dairy_id,
      period_start,
      period_end,
      milk_total,
      advance_total,
      received_total,
      net_payable,
      advance_remaining,
      cattlefeed_remaining,
      other1_remaining,
      other2_remaining,
      cattlefeed_total,
      other1_total,
      other2_total
    } = req.body;

    // Insert or update bill
    const [result] = await db.query(
      `INSERT INTO bills (
        farmer_id, dairy_id, period_start, period_end,
        milk_total, advance_total, received_total, net_payable,
        advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
        cattlefeed_total, other1_total, other2_total,
        status, is_finalized
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)
      ON DUPLICATE KEY UPDATE
        milk_total = VALUES(milk_total),
        advance_total = VALUES(advance_total),
        received_total = VALUES(received_total),
        net_payable = VALUES(net_payable),
        advance_remaining = VALUES(advance_remaining),
        cattlefeed_remaining = VALUES(cattlefeed_remaining),
        other1_remaining = VALUES(other1_remaining),
        other2_remaining = VALUES(other2_remaining),
        cattlefeed_total = VALUES(cattlefeed_total),
        other1_total = VALUES(other1_total),
        other2_total = VALUES(other2_total),
        status = 'pending',
        is_finalized = 0`,
      [
        farmer_id,
        dairy_id,
        period_start,
        period_end,
        milk_total || 0,
        advance_total || 0,
        received_total || 0,
        net_payable || 0,
        advance_remaining || 0,
        cattlefeed_remaining || 0,
        other1_remaining || 0,
        other2_remaining || 0,
        cattlefeed_total || 0,
        other1_total || 0,
        other2_total || 0
      ]
    );

    // 🔹 Fetch the inserted or updated bill ID
    const [billRow] = await db.query(
      `SELECT id FROM bills WHERE farmer_id=? AND dairy_id=? AND period_start=? AND period_end=? LIMIT 1`,
      [farmer_id, dairy_id, period_start, period_end]
    );

    const bill_id = billRow[0]?.id || null;

    // Response with bill_id
    res.json({
      success: true,
      action: result.affectedRows > 1 ? "updated" : "inserted",
      bill_id,
      farmer_id,
      dairy_id,
      period_start,
      period_end,
      milk_total,
      advance_total,
      received_total,
      net_payable,
      advance_remaining,
      cattlefeed_remaining,
      other1_remaining,
      other2_remaining,
      cattlefeed_total,
      other1_total,
      other2_total,
      status: "pending"
    });
  } catch (err) {
    console.error("Error generating bill:", err);
    res.status(500).json({ error: err.message });
  }
}



// async function generateBill(req, res) {
//   try {
//     const { farmer_id, dairy_id, date, milk_total, net_payable, remaining_advance, total_advance  } = req.body;

//     if (!farmer_id || !dairy_id || !date) {
//       return res.status(400).json({ error: "farmer_id, dairy_id and date are required" });
//     }

//     // 1. Work out cycle (1–10, 11–20, 21–end)
//     const billDate = new Date(date);
//     const year = billDate.getFullYear();
//     const month = billDate.getMonth(); // 0-based
//     const day = billDate.getDate();

//     let period_start, period_end;
//     if (day <= 10) {
//       period_start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
//       period_end = `${year}-${String(month + 1).padStart(2, "0")}-10`;
//     } else if (day <= 20) {
//       period_start = `${year}-${String(month + 1).padStart(2, "0")}-11`;
//       period_end = `${year}-${String(month + 1).padStart(2, "0")}-20`;
//     } else {
//       const lastDay = new Date(year, month + 1, 0).getDate(); // last day of month
//       period_start = `${year}-${String(month + 1).padStart(2, "0")}-21`;
//       period_end = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
//     }

//     // 2. Calculate totals (milk + payments)
//     const [[milk]] = await db.query(
//       `SELECT SUM(quantity*rate) as milk_total
//        FROM collections
//        WHERE farmer_id=? AND dairy_id=? AND DATE(created_at) BETWEEN ? AND ?`,
//       [farmer_id, dairy_id, period_start, period_end]
//     );

//     const [[payments]] = await db.query(
//       `SELECT SUM(amount_taken) as advance_total, SUM(received) as received_total
//        FROM farmer_payments
//        WHERE farmer_id=? AND dairy_id=? AND DATE(date) BETWEEN ? AND ?`,
//       [farmer_id, dairy_id, period_start, period_end]
//     );

//     const milkTotal = milk.milk_total || 0;
//     const advanceTotal = payments.advance_total || 0;
//     const receivedTotal = payments.received_total || 0;
//     const netPayable = milkTotal - advanceTotal + receivedTotal;

//     // 3. Check if bill exists for this farmer & cycle
//     const [existing] = await db.query(
//       `SELECT id FROM bills 
//        WHERE farmer_id=? AND dairy_id=? AND period_start=? AND period_end=?`,
//       [farmer_id, dairy_id, period_start, period_end]
//     );

//     let billId;
//     if (existing.length > 0) {
//       // 4. Update existing bill
//       billId = existing[0].id;
//       await db.query(
//         `UPDATE bills 
//          SET milk_total=?, advance_total=?, received_total=?, net_payable=?, status='pending', is_finalized=0 
//          WHERE id=?`,
//         [milkTotal, advanceTotal, receivedTotal, netPayable, billId]
//       );
//     } else {
//       // 5. Insert new bill
//       const [result] = await db.query(
//         `INSERT INTO bills (farmer_id, dairy_id, period_start, period_end, milk_total, advance_total, received_total, net_payable, status, is_finalized)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
//         [farmer_id, dairy_id, period_start, period_end, milkTotal, advanceTotal, receivedTotal, netPayable]
//       );
//       billId = result.insertId;
//     }

//     // 6. Return response
//     res.json({
//       bill_id: billId,
//       farmer_id,
//       dairy_id,
//       period_start,
//       period_end,
//       milkTotal,
//       advanceTotal,
//       receivedTotal,
//       netPayable,
//       status: "pending"
//     });

//   } catch (err) {
//     console.error("Error generating bill:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

// async function generateBills(req, res) {
//   try {
//     const { records, dairy_id } = req.body;

//     if (!dairy_id || !records || !Array.isArray(records) || records.length === 0) {
//       return res.status(400).json({ message: "dairy_id and records array required" });
//     }

//     // Build values array for bulk insert
//     const values = records.map(r => [
//       r.farmer_id,
//       dairy_id,
//       r.period_start,
//       r.period_end,
//       r.milk_total || 0,
//       r.advance_total || 0,
//       r.received_total || 0,
//       r.net_payable || 0
//     ]);

//     const placeholders = values.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`).join(",");

//     const sql = `
//       INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable,
//         status, is_finalized
//       )
//       VALUES ${placeholders}
//       ON DUPLICATE KEY UPDATE 
//         milk_total = VALUES(milk_total),
//         advance_total = VALUES(advance_total),
//         received_total = VALUES(received_total),
//         net_payable = VALUES(net_payable),
//         status = 'pending',
//         is_finalized = 0
//     `;

//     const flatValues = values.flat();

//     const [result] = await db.query(sql, flatValues);

//     res.json({
//       success: true,
//       message: "Bills inserted/updated successfully",
//       affectedRows: result.affectedRows,
//       records: records.map(r => ({
//         farmer_id: r.farmer_id,
//         dairy_id,
//         period_start: r.period_start,
//         period_end: r.period_end,
//         milk_total: r.milk_total,
//         advance_total: r.advance_total,
//         received_total: r.received_total,
//         net_payable: r.net_payable,
//         status: "pending"
//       }))
//     });
//   } catch (err) {
//     console.error("Error in generateOrUpdateBills:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

// async function generateBills(req, res) {
//   try {
//     const { records, dairy_id } = req.body;

//     if (!dairy_id || !records || !Array.isArray(records) || records.length === 0) {
//       return res.status(400).json({ message: "dairy_id and records array required" });
//     }

//     // Build values array for bulk insert including new fields
//     const values = records.map(r => [
//       r.farmer_id,
//       dairy_id,
//       r.period_start,
//       r.period_end,
//       r.milk_total || 0,
//       r.advance_total || 0,
//       r.received_total || 0,
//       r.net_payable || 0,
//       r.advance_remaining || 0,
//       r.cattlefeed_remaining || 0,
//       r.other1_remaining || 0,
//       r.other2_remaining || 0
//     ]);

//     const placeholders = values
//       .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`)
//       .join(",");

//     const sql = `
//       INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable,
//         advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//         status, is_finalized
//       )
//       VALUES ${placeholders}
//       ON DUPLICATE KEY UPDATE 
//         milk_total = VALUES(milk_total),
//         advance_total = VALUES(advance_total),
//         received_total = VALUES(received_total),
//         net_payable = VALUES(net_payable),
//         advance_remaining = VALUES(advance_remaining),
//         cattlefeed_remaining = VALUES(cattlefeed_remaining),
//         other1_remaining = VALUES(other1_remaining),
//         other2_remaining = VALUES(other2_remaining),
//         status = 'pending',
//         is_finalized = 0
//     `;

//     const flatValues = values.flat();
//     const [result] = await db.query(sql, flatValues);

//     res.json({
//       success: true,
//       message: "Bills inserted/updated successfully",
//       affectedRows: result.affectedRows,
//       records: records.map(r => ({
//         farmer_id: r.farmer_id,
//         dairy_id,
//         period_start: r.period_start,
//         period_end: r.period_end,
//         milk_total: r.milk_total || 0,
//         advance_total: r.advance_total || 0,
//         received_total: r.received_total || 0,
//         net_payable: r.net_payable || 0,
//         advance_remaining: r.advance_remaining || 0,
//         cattlefeed_remaining: r.cattlefeed_remaining || 0,
//         other1_remaining: r.other1_remaining || 0,
//         other2_remaining: r.other2_remaining || 0,
//         status: "pending"
//       }))
//     });
//   } catch (err) {
//     console.error("Error in generateBills:", err);
//     res.status(500).json({ error: err.message });
//   }
// }


// last one
// async function generateBills(req, res) {
//   try {
//     const { records, dairy_id } = req.body;

//     if (!dairy_id || !records || !Array.isArray(records) || records.length === 0) {
//       return res.status(400).json({ message: "dairy_id and records array required" });
//     }

//     const values = records.map(r => [
//       r.farmer_id,
//       dairy_id,
//       r.period_start,
//       r.period_end,
//       r.milk_total || 0,
//       r.advance_total || 0,
//       r.received_total || 0,
//       r.net_payable || 0,
//       r.advance_remaining || 0,
//       r.cattlefeed_remaining || 0,
//       r.other1_remaining || 0,
//       r.other2_remaining || 0,
//       r.cattlefeed_total || 0,
//       r.other1_total || 0,
//       r.other2_total || 0
//     ]);

//     const placeholders = values.map(() =>
//       `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`
//     ).join(",");

//     const sql = `
//       INSERT INTO bills (
//         farmer_id, dairy_id, period_start, period_end,
//         milk_total, advance_total, received_total, net_payable,
//         advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
//         cattlefeed_total, other1_total, other2_total,
//         status, is_finalized
//       )
//       VALUES ${placeholders}
//       ON DUPLICATE KEY UPDATE 
//         milk_total = VALUES(milk_total),
//         advance_total = VALUES(advance_total),
//         received_total = VALUES(received_total),
//         net_payable = VALUES(net_payable),
//         advance_remaining = VALUES(advance_remaining),
//         cattlefeed_remaining = VALUES(cattlefeed_remaining),
//         other1_remaining = VALUES(other1_remaining),
//         other2_remaining = VALUES(other2_remaining),
//         cattlefeed_total = VALUES(cattlefeed_total),
//         other1_total = VALUES(other1_total),
//         other2_total = VALUES(other2_total),
//         status = 'pending',
//         is_finalized = 0
//     `;

//     const flatValues = values.flat();
//     const [result] = await db.query(sql, flatValues);

//     res.json({
//       success: true,
//       message: "Bills inserted/updated successfully",
//       affectedRows: result.affectedRows,
//       records
//     });
//   } catch (err) {
//     console.error("Error in generateBills:", err);
//     res.status(500).json({ error: err.message });
//   }
// }

async function generateBills(req, res) {
  try {
    const { records, dairy_id } = req.body;

    if (!dairy_id || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "dairy_id and records array required" });
    }

    // Build value arrays for bulk insert
    const values = records.map(r => [
      r.farmer_id,
      dairy_id,
      r.period_start,
      r.period_end,
      r.milk_total || 0,
      r.advance_total || 0,
      r.received_total || 0,
      r.net_payable || 0,
      r.advance_remaining || 0,
      r.cattlefeed_remaining || 0,
      r.other1_remaining || 0,
      r.other2_remaining || 0,
      r.cattlefeed_total || 0,
      r.other1_total || 0,
      r.other2_total || 0
    ]);

    // Build placeholders for each record
    const placeholders = values.map(() =>
      `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`
    ).join(",");

    // Main upsert query
    const sql = `
      INSERT INTO bills (
        farmer_id, dairy_id, period_start, period_end,
        milk_total, advance_total, received_total, net_payable,
        advance_remaining, cattlefeed_remaining, other1_remaining, other2_remaining,
        cattlefeed_total, other1_total, other2_total,
        status, is_finalized
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE 
        milk_total = VALUES(milk_total),
        advance_total = VALUES(advance_total),
        received_total = VALUES(received_total),
        net_payable = VALUES(net_payable),
        advance_remaining = VALUES(advance_remaining),
        cattlefeed_remaining = VALUES(cattlefeed_remaining),
        other1_remaining = VALUES(other1_remaining),
        other2_remaining = VALUES(other2_remaining),
        cattlefeed_total = VALUES(cattlefeed_total),
        other1_total = VALUES(other1_total),
        other2_total = VALUES(other2_total),
        status = 'pending',
        is_finalized = 0
    `;

    const flatValues = values.flat();

    // Execute insert/update
    const [result] = await db.query(sql, flatValues);

    // --- Fetch the actual IDs (both inserted and updated) ---
    const [billRows] = await db.query(
      `
      SELECT id, farmer_id, period_start, period_end
      FROM bills
      WHERE dairy_id = ?
        AND (${records.map(() => "(farmer_id = ? AND period_start = ? AND period_end = ?)").join(" OR ")})
      `,
      [
        dairy_id,
        ...records.flatMap(r => [r.farmer_id, r.period_start, r.period_end])
      ]
    );

    res.json({
      success: true,
      message: "Bills inserted/updated successfully",
      affectedRows: result.affectedRows,
      billIds: billRows.map(r => r.id),
      records: billRows
    });
  } catch (err) {
    console.error("Error in generateBills:", err);
    res.status(500).json({ error: err.message });
  }
}






async function updateBill(req, res) {
  try {
    const { billId } = req.params;
    const { milk_total, advance_total, received_total, net_payable } = req.body;

    const [[bill]] = await db.query(`SELECT * FROM bills WHERE id=?`, [billId]);
    if (!bill) return res.status(404).json({ error: "Bill not found" });
    if (bill.is_finalized) return res.status(400).json({ error: "Bill is finalized" });

    await db.query(
      `UPDATE bills SET milk_total=?, advance_total=?, received_total=?, net_payable=? WHERE id=?`,
      [milk_total, advance_total, received_total, net_payable, billId]
    );

    res.json({ success: true, message: "Bill updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Finalize Bill
// exports.finalizeBill = async (req, res) => {
// async function finalizeBill(req, res) {
//   try {
//     const { billId } = req.params;
//     await db.query(`UPDATE bills SET is_finalized=1, status='paid' WHERE id=?`, [billId]);
//     res.json({ success: true, message: "Bill finalized successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

async function finalizeBill(req, res) {
  try {
    const { billIds } = req.body;

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "billIds (array) is required in body"
      });
    }

    // Convert billIds to SQL placeholders like (?, ?, ?)
    const placeholders = billIds.map(() => '?').join(',');

    const sql = `
      UPDATE bills 
      SET is_finalized = 1, status = 'paid'
      WHERE id IN (${placeholders})
    `;

    const [result] = await db.query(sql, billIds);

    res.json({
      success: true,
      message: "Bills finalized successfully",
      updatedCount: result.affectedRows,
      finalizedIds: billIds
    });
  } catch (err) {
    console.error("Error finalizing bills:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}


async function getFarmerBalance(req, res) {
  try {
    const { farmerId } = req.params;

    const [[lastBill]] = await db.query(
      `SELECT id, period_end, net_payable FROM bills WHERE farmer_id=? AND is_finalized=1 ORDER BY id DESC LIMIT 1`,
      [farmerId]
    );

    const lastEnd = lastBill ? lastBill.period_end : "1970-01-01";
    const carryForward = lastBill ? lastBill.net_payable : 0;

    const [[milk]] = await db.query(
      `SELECT SUM(quantity*rate) as milk_total FROM collections WHERE farmer_id=? AND DATE(created_at) > ?`,
      [farmerId, lastEnd]
    );

    const [[payments]] = await db.query(
      `SELECT SUM(amount_taken) as advance_total, SUM(received) as received_total
       FROM farmer_payments WHERE farmer_id=? AND date > ?`,
      [farmerId, lastEnd]
    );

    const milkTotal = milk.milk_total || 0;
    const advanceTotal = payments.advance_total || 0;
    const receivedTotal = payments.received_total || 0;
    const netDue = milkTotal - advanceTotal + receivedTotal;

    res.json({
      farmer_id: farmerId,
      last_finalized_bill: lastBill || null,
      current_cycle: {
        from: lastEnd,
        milkTotal,
        advanceTotal,
        receivedTotal,
        netDue
      },
      total_due: carryForward + netDue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
    generateBill,
    generateBills,
    updateBill,
    finalizeBill,
    getFarmerBalance
};