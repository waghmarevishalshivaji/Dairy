const db = require('../config/db');

async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('SELECT usr.*, dr.*  FROM users as usr LEFT JOIN dairy as dr ON dr.id = usr.dairy_id WHERE usr.id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


async function getUserBydairyId(req, res) {
  const { dairyid } = req.query;
  console.log(dairyid)
  try {
    const [rows] = await db.execute('SELECT usr.*, dr.*  FROM users as usr LEFT JOIN dairy as dr ON dr.id = usr.dairy_id WHERE usr.dairy_id = ?', [dairyid]);
    if (rows.length === 0) {
      return res.status(200).json({ success: false, message: "user not found" });
    }
    // res.status(200).json(rows);
    return res.status(200).json({ success: true, message: "user found", data : rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// async function getUserByName(req, res) {
//   const { username } = req.params;

//   try {
//     const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json(rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }

async function getUserByName(req, res) {
  const { username } = req.params;
  const { dairy_id } = req.query; // Dairy ID from query params

  try {
    let query = 'SELECT * FROM users WHERE username = ?';
    const params = [username];

    // If dairy_id is provided, add it to WHERE clause
    if (dairy_id) {
      query += ' AND dairy_id = ?';
      params.push(dairy_id);
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
    getUserById,
    getUserByName,
    getUserBydairyId
};
