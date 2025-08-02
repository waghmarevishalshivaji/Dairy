const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const moment = require('moment');
const crypto = require('crypto');


// POST /api/payments
async function insertPayment(req, res) {
  // const {
  //   date,
  //   dairy_id,
  //   farmer_id,
  //   farmer_name,
  //   payment_type,
  //   amount_taken,
  //   received,
  //   descriptions
  // } = req.body;

  // if (!date || !dairy_id || !farmer_id || !payment_type || !amount_taken) {
  //   return res.status(400).json({ message: 'Missing required fields' });
  // }

  // try {
  //   const [result] = await db.query(
  //     `INSERT INTO farmer_payments 
  //     (date, dairy_id, farmer_id, farmer_name, payment_type, amount_taken, received, descriptions) 
  //     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  //     [date, dairy_id, farmer_id, farmer_name, payment_type, amount_taken, received || 0, descriptions || '']
  //   );

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


  //   res.json({ message: 'Payment record inserted', id: result.insertId });
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).json({ message: 'Insert failed' });
  // }
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






module.exports = {
    insertPayment,
    updatePayment,
    inactivatePayment,
    activatePayment
};
