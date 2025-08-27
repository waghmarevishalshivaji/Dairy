const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function generateBill(req, res) {
  try {
    const { farmer_id, period_start, period_end } = req.body;

    const [[milk]] = await db.query(
      `SELECT SUM(quantity*rate) as milk_total
       FROM collections
       WHERE farmer_id=? AND DATE(created_at) BETWEEN ? AND ?`,
      [farmer_id, period_start, period_end]
    );

    const [[payments]] = await db.query(
      `SELECT SUM(amount_taken) as advance_total, SUM(received) as received_total
       FROM farmer_payments
       WHERE farmer_id=? AND date BETWEEN ? AND ?`,
      [farmer_id, period_start, period_end]
    );

    const milkTotal = milk.milk_total || 0;
    const advanceTotal = payments.advance_total || 0;
    const receivedTotal = payments.received_total || 0;
    const netPayable = milkTotal - advanceTotal + receivedTotal;

    const [result] = await db.query(
      `INSERT INTO bills (farmer_id, period_start, period_end, milk_total, advance_total, received_total, net_payable, status, is_finalized)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [farmer_id, period_start, period_end, milkTotal, advanceTotal, receivedTotal, netPayable]
    );

    res.json({
      bill_id: result.insertId,
      farmer_id,
      milkTotal,
      advanceTotal,
      receivedTotal,
      netPayable,
      status: "pending"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


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
async function finalizeBill(req, res) {
  try {
    const { billId } = req.params;
    await db.query(`UPDATE bills SET is_finalized=1, status='paid' WHERE id=?`, [billId]);
    res.json({ success: true, message: "Bill finalized successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
    updateBill,
    finalizeBill,
    getFarmerBalance
};