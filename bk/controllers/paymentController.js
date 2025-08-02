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

      if (startDate && endDate) {
        conditions.push('date BETWEEN ? AND ?');
        params.push(startDate, endDate);
      }
    }

    if (datefrom && dateto) {
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
      result: 1,
      success: true,
      message: 'Success',
      data: rows
    });

  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}





module.exports = {
    insertPayment,
    updatePayment,
    inactivatePayment,
    activatePayment,
    getpayment
};
