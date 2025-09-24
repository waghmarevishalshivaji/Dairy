const db = require('../config/db');
const bcrypt = require('bcryptjs');


// Create new collection
async function createCollection(req, res) {
    const { farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift } = req.body;

    // const now = new Date();
    // const istDateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const currentDate = new Date();
    const idtDateTime = currentDate.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23' // Ensures 24-hour format
    });

    // To reformat the output to YYYY-MM-DD HH:mm:ss
    const [datePart, timePart] = idtDateTime.split(', ');
    const [month, day, year] = datePart.split('/');
    const formattedIdtDateTime = `${year}-${month}-${day} ${timePart}`;

    try {
        const [result] = await db.execute(
            `INSERT INTO collections (farmer_id, dairy_id,  type, quantity, fat, snf, clr, rate, shift, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, formattedIdtDateTime]
        );
        res.status(201).json({ message: 'Collection added', id: result.insertId });
    } catch (err) {
        console.error('Error creating collection:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

// Get all collections
async function getCollections(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM collections ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching collections:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

// Get collection by ID
async function getCollectionById(req, res) {
    const { id } = req.params;

    console.log('Fetching collection with ID:', id);
    try {
        const [rows] = await db.execute('SELECT * FROM collections WHERE id', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error fetching collection:', err);
        res.status(500).json({ message: 'Server error' });
    }
}


async function getTodaysCollection(req, res) {
    let { type, shift, dairy_id, date  } = req.query;

    try {
        // Base query
        // let query = `
        //     SELECT 
        //         SUM(quantity) AS total_quantity,
        //         ROUND(AVG(fat), 2) AS avg_fat,
        //         ROUND(AVG(snf), 2) AS avg_snf,
        //         ROUND(AVG(clr), 2) AS avg_clr
        //     FROM milk_collection
        //     WHERE DATE(created_at) = CURDATE()
        // `;
        // let query = `
        //     SELECT 
        //         SUM(quantity) AS total_quantity,
        //         ROUND(AVG(fat), 2) AS avg_fat,
        //         ROUND(AVG(snf), 2) AS avg_snf,
        //         ROUND(AVG(clr), 2) AS avg_clr
        //     FROM collections
        //     WHERE DATE(created_at) = ?
        // `;

        let query = `
            SELECT 
                COUNT(DISTINCT farmer_id) AS total_farmers,
                SUM(quantity) AS total_quantity,
                ROUND(AVG(fat), 2) AS avg_fat,
                ROUND(AVG(snf), 2) AS avg_snf,
                ROUND(AVG(clr), 2) AS avg_clr
            FROM collections
            WHERE DATE(created_at) = ?
        `;


        const params = [];

         // Date filter — if not given, default to current date
        if (date) {
            params.push(date); // expecting YYYY-MM-DD format
        } else {
            const today = new Date();
            params.push(today.toISOString().slice(0, 10)); // YYYY-MM-DD
        }

        // Optional filters
        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }
        if (shift) {
            query += ` AND shift = ?`;
            params.push(shift);
        }

        if (dairy_id) {
            query += ` AND dairy_id = ?`;
            params.push(dairy_id);
        }

        

        console.log(params)

        const [rows] = await db.execute(query, params);


        let query1 = `SELECT count(id) as cnt FROM users WHERE dairy_id = ?`;
        //SELECT COUNT(id) as cnt FROM `users` WHERE dairy_id = 5;

        const params1 = [dairy_id];
        const [rows1] = await db.execute(query1, params1);

        if (!rows || rows.length === 0 || rows[0].total_quantity === null) {
            return res.status(200).json({ success: true, message: 'No data for today', data: {} });
        }

        res.status(200).json({
            success: true,
            message: 'Today’s collection fetched successfully',
            data: rows[0],
            user: rows1,
        });
    } catch (err) {
        console.error('Error fetching today’s collection:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// async function getTodaysCollectionfarmer(req, res) {
//     let { type, dairy_id, date, farmer_id } = req.query;

//     try {
//         // Base query: group by shift to get both morning and evening
//         let query = `
//             SELECT 
//                 shift,
//                 SUM(quantity) AS total_quantity,
//                 ROUND(AVG(fat), 2) AS avg_fat,
//                 ROUND(AVG(snf), 2) AS avg_snf,
//                 ROUND(AVG(clr), 2) AS avg_clr
//             FROM collections
//             WHERE DATE(created_at) = ?
//         `;

//         const params = [];

//         // Date filter — if not given, default to current date
//         if (date) {
//             params.push(date); // expecting YYYY-MM-DD format
//         } else {
//             const today = new Date();
//             params.push(today.toISOString().slice(0, 10)); // YYYY-MM-DD
//         }

//         // Optional filters
//         if (type) {
//             query += ` AND type = ?`;
//             params.push(type);
//         }
//         if (dairy_id) {
//             query += ` AND dairy_id = ?`;
//             params.push(dairy_id);
//         }
//         if (farmer_id) {
//             query += ` AND farmer_id = ?`;
//             params.push(farmer_id);
//         }

//         query += ` GROUP BY shift ORDER BY shift`;

//         const [rows] = await db.execute(query, params);

//         // Count users in that dairy
//         // let query1 = `SELECT COUNT(id) as cnt FROM users WHERE dairy_id = ?`;
//         // const params1 = [dairy_id];
//         // const [rows1] = await db.execute(query1, params1);

//         if (!rows || rows.length === 0) {
//             return res.status(200).json({ 
//                 success: true, 
//                 message: 'No data for today', 
//                 data: { morning: {}, evening: {} }
//                 // user: rows1[0]
//             });
//         }

//         // Format results into morning/evening explicitly
//         const result = { morning: {}, evening: {} };
//         rows.forEach(r => {
//             if (r.shift.toLowerCase() === 'morning') result.morning = r;
//             if (r.shift.toLowerCase() === 'evening') result.evening = r;
//         });

//         result.total = "1000"
//         result.fincncialdesc = {};
//         result.fincncialdesc.advance = "2000"
//         result.fincncialdesc.cattlefeed = "3000"
//         result.fincncialdesc.fat = "3.6"
//         result.totalamount = "10000"
//         result.netamount = "12000"
//         result.lastpay = "15000"
//         result.totalqty = "1400"
//         result.dailyavg = "14"

//         res.status(200).json({
//             success: true,
//             message: 'Today’s collection fetched successfully',
//             data: result,
//             // user: rows1[0]
//         });
//     } catch (err) {
//         console.error('Error fetching today’s collection:', err);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// }



// Get collection by ID
// async function getCollectionBytab(req, res) {
//     let { farmer_id, shift, type } = req.query;
//     if(!type){
//         type = 'Both';
//     }
//     console.log('Fetching collection with ID:', farmer_id, shift);
//     try {

//         // query = 'SELECT * FROM users WHERE mobile_number = ? AND role = ?';  // Filter by both mobile_number and role
//         // params = [mobile_number, role];
//         const [rows] = await db.execute('SELECT * FROM collections WHERE farmer_id = ? AND shift = ? AND type = ?', [farmer_id, shift, type]);
//         if (rows.length === 0) {
//             return res.status(404).json({ success: false, message: 'Collection not found' });
//         }
//         res.status(200).json({result : 1, success: true, message : "sucess", data : rows});
//     } catch (err) {
//         console.error('Error fetching collection:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

// async function getCollectionBytab(req, res) {
//   let { farmer_id, shift, type } = req.query;


//   console.log(req.query)
//   // Default type if not provided
//   if (!type) type = 'Both';

//   try {
//     let query = 'SELECT * FROM collections';
//     const conditions = [];
//     const params = [];

//     // Conditionally add filters
//     if (farmer_id) {
//       conditions.push('farmer_id = ?');
//       params.push(farmer_id);
//     }

//     if (shift) {
//       conditions.push('shift = ?');
//       params.push(shift);
//     }

//     if (type) {
//       conditions.push('type = ?');
//       params.push(type);
//     }

//     // Join WHERE conditions only if they exist
//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     console.log(query)

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Collection not found' });
//     }

//     res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       data: rows
//     });

//   } catch (err) {
//     console.error('Error fetching collection:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// async function getCollectionBytab(req, res) {
//   let { farmer_id, shift, type } = req.query;

//   try {
//     let query = 'SELECT * FROM collections';
//     const conditions = [];
//     const params = [];

//     // Conditionally add filters
//     if (farmer_id) {
//       conditions.push('farmer_id = ?');
//       params.push(farmer_id);
//     }

//     if (shift) {
//       conditions.push('shift = ?');
//       params.push(shift);
//     }

//     // Only filter by type if it's not "Both"
//     if (type && type !== 'Both') {
//       conditions.push('type = ?');
//       params.push(type);
//     }

//     // Add WHERE clause if needed
//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     console.log('QUERY:', query);
//     console.log('PARAMS:', params);

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Collection not found' });
//     }

//     res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       data: rows
//     });

//   } catch (err) {
//     console.error('Error fetching collection:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// async function getCollectionBytab(req, res) {
//   let { farmer_id, shift, type } = req.query;

//   try {
//     let query = 'SELECT * FROM collections';
//     const conditions = [];
//     const params = [];

//     // Conditionally add filters
//     if (farmer_id) {
//       conditions.push('farmer_id = ?');
//       params.push(farmer_id);
//     }

//     if (shift) {
//       conditions.push('shift = ?');
//       params.push(shift);
//     }

//     // Only filter by type if it's not "Both"
//     if (type && type !== 'Both') {
//       conditions.push('type = ?');
//       params.push(type);
//     }

//     // Add WHERE clause if needed
//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     console.log('QUERY:', query);
//     console.log('PARAMS:', params);

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Collection not found' });
//     }

//     // Group records by date
//     const groupedData = {};
//     rows.forEach(record => {
//       // Assuming there's a date field, e.g., 'date' (adjust as needed)
//       const dateKey = record.date ? new Date(record.date).toISOString().slice(0, 10) : 'Unknown';

//       if (!groupedData[dateKey]) {
//         groupedData[dateKey] = [];
//       }
//       groupedData[dateKey].push(record);
//     });

//     res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       data: groupedData
//     });

//   } catch (err) {
//     console.error('Error fetching collection:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// async function getTodaysCollectionByFarmer(req, res) {
//   try {
//     const { dairyid, farmer_id } = req.query;

//     if (!dairyid || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairyid and farmer_id are required" });
//     }

//     const [rows] = await db.execute(
//       `SELECT id, farmer_id, shift, type, quantity, fat, snf, clr, rate, (quantity * rate) as amount, created_at
//        FROM collections
//        WHERE DATE(created_at) = CURDATE()
//          AND dairy_id = ?
//          AND farmer_id = ?
//        ORDER BY created_at`,
//       [dairyid, farmer_id]
//     );

//     res.status(200).json({
//       success: true,
//       date: new Date().toISOString().slice(0, 10),
//       farmer_id,
//       dairy_id: dairyid,
//       data: rows
//     });

//   } catch (err) {
//     console.error("Error fetching today's collection by farmer:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

async function getTodaysCollectionByFarmer(req, res) {
  try {
    const { dairyid, farmer_id, date } = req.query;

    if (!dairyid || !farmer_id) {
      return res
        .status(400)
        .json({ success: false, message: "dairyid and farmer_id are required" });
    }

    // Use either passed date or today
    // const reportDate = date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // const startOfDay = `${reportDate} 00:00:00`;
    // const endOfDay = `${reportDate} 23:59:59`;

     // Use either passed date or today (IST-safe)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const reportDate = date || today;

    const startOfDay = `${reportDate} 00:00:00`;
    const endOfDay = `${reportDate} 23:59:59`;

    const [rows] = await db.execute(
      `SELECT id, farmer_id, shift, type, quantity, fat, snf, clr, rate, (quantity * rate) as amount, created_at
       FROM collections
       WHERE created_at BETWEEN ? AND ?
         AND dairy_id = ?
         AND farmer_id = ?
       ORDER BY created_at`,
      [startOfDay, endOfDay, dairyid, farmer_id]
    );

    res.status(200).json({
      success: true,
      date: reportDate,
      farmer_id,
      dairy_id: dairyid,
      data: rows
    });

  } catch (err) {
    console.error("Error fetching today's collection by farmer:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}



async function getTodaysCollectionfarmer(req, res) {
  let { type, dairy_id, date, farmer_id } = req.query;

  try {
    if (!dairy_id || !farmer_id) {
      return res
        .status(400)
        .json({ success: false, message: "dairy_id and farmer_id are required" });
    }

    // Date filter — default to today if not passed
    const today = new Date();
    const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

    // ---- Collections grouped by shift ----
    let query = `
      SELECT 
        shift,
        MIN(created_at) as first_entry,   
        MAX(created_at) as last_entry,    
        SUM(quantity) AS total_quantity,
        ROUND(AVG(fat), 2) AS avg_fat,
        ROUND(AVG(snf), 2) AS avg_snf,
        ROUND(AVG(clr), 2) AS avg_clr,
        SUM(quantity * rate) AS total_amount
      FROM collections
      WHERE DATE(created_at) = ?
        AND dairy_id = ?
        AND farmer_id = ?
    `;
    const params = [reportDate, dairy_id, farmer_id];

    if (type && type !== "All") {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` GROUP BY shift ORDER BY shift`;

    const [rows] = await db.execute(query, params);

    // ---- Payments / deductions for that farmer on that day ----
    const [paymentRows] = await db.execute(
      `SELECT 
         SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
         SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
         SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
         SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
         SUM(amount_taken) AS total_deductions,
         SUM(received) AS total_received
       FROM farmer_payments
       WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
      [dairy_id, farmer_id, reportDate]
    );

    const payments = paymentRows[0] || {};

    let lastpaydatestatus = "paid"
     // ---- Last payment date from bill ----
    const [lastPayRows] = await db.execute(
      `SELECT MAX(created_at) as lastPayDate
       FROM bills
       WHERE farmer_id=? AND status=?`,
      [farmer_id, lastpaydatestatus]
    );

    const lastPayDate = lastPayRows[0]?.lastPayDate || "NA";


    // ---- Prepare result ----
    const result = {
      morning: {
        shift: "Morning",
        created_at: "NA", // default
        total_quantity: 0,
        avg_fat: 0,
        avg_snf: 0,
        avg_clr: 0,
        total_amount: 0,
      },
      evening: {
        shift: "Evening",
        created_at: "NA", // default
        total_quantity: 0,
        avg_fat: 0,
        avg_snf: 0,
        avg_clr: 0,
        total_amount: 0,
      },
    };

    rows.forEach((r) => {
      const entry = {
        shift: r.shift,
        created_at: r.last_entry || r.first_entry || "NA", // use last entry as collection time
        total_quantity: Number(r.total_quantity) || 0,
        avg_fat: Number(r.avg_fat) || 0,
        avg_snf: Number(r.avg_snf) || 0,
        avg_clr: Number(r.avg_clr) || 0,
        total_amount: Number(r.total_amount) || 0,
      };
      if (r.shift.toLowerCase() === "morning") result.morning = entry;
      if (r.shift.toLowerCase() === "evening") result.evening = entry;
    });

    // ---- Totals ----
    const totalQty =
      (result.morning.total_quantity || 0) +
      (result.evening.total_quantity || 0);

    const totalAmount =
      (result.morning.total_amount || 0) +
      (result.evening.total_amount || 0);

    const dailyAvg =
      totalQty > 0
        ? (totalQty / 2).toFixed(2) // average per shift
        : 0;

    const deductions = {
      advance: Number(payments.advance) || 0,
      cattle_feed: Number(payments.cattle_feed) || 0,
      other1: Number(payments.other1) || 0,
      other2: Number(payments.other2) || 0,
      total: Number(payments.total_deductions) || 0,
    };

    const netAmount = totalAmount - deductions.total + (Number(payments.total_received) || 0);

    // ---- Final Response ----
    res.status(200).json({
      success: true,
      message: "Today’s collection fetched successfully",
      date: reportDate,
      data: {
        ...result,
        totals: {
          totalQty,
          totalAmount,
          dailyAvg: Number(dailyAvg),
        },
        financials: {
          deductions,
          total_received: Number(payments.total_received) || 0,
          netAmount,
          lastPayDate
        },
      },
    });
  } catch (err) {
    console.error("Error fetching today’s collection:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


async function getCollectionBytab(req, res) {
  let { farmer_id, shift, type, date, dairy_id } = req.query;

  try {
    let query = 'SELECT coll.*, usr.fullName as fname FROM collections as coll LEFT JOIN users as usr ON usr.username = coll.farmer_id';
    const conditions = [];
    const params = [];

    console.log(query)

    // Add filters based on query params
    if (farmer_id) {
      conditions.push('coll.farmer_id = ?');
      params.push(farmer_id);
    }
    if (shift) {
      conditions.push('coll.shift = ?');
      params.push(shift);
    }
    if (type && type !== 'Both') {
      conditions.push('coll.type = ?');
      params.push(type);
    }

    if (date) {
      conditions.push('DATE(coll.created_at) = ?');
      params.push(date);
    }

    if (dairy_id) {
      conditions.push('coll.dairy_id = ?');
      params.push(dairy_id);
    }

    

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('QUERY:', query);
    console.log('PARAMS:', params);

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(200).json({ success: false, message: 'Collection not found' });
    }

    // Group records by formatted date
    const collectionData = {};

    rows.forEach(record => {
      // Adjust date field name as per your schema
      const dateObj = new Date(record.created_at);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      if (!collectionData[dateKey]) {
        collectionData[dateKey] = [];
      }

      // Push only the needed fields
      collectionData[dateKey].push({
        type: record.type,
        qty: record.quantity,
        fat: record.fat,
        snf: record.snf,
        rate: record.rate,
        amount: record.rate,
        type: record.type,
        shift: record.shift,
        fname: record.fname,
      });
    });

    // Convert object to array with desired structure
    const resultArray = Object.keys(collectionData).map(date => ({
      date,
      collections: collectionData[date],
    }));

    res.status(200).json({
      result: 1,
      success: true,
      message: 'Success',
      data: resultArray,
    });
  } catch (err) {
    console.error('Error fetching collection:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}






// Update collection
async function updateCollection(req, res) {
    const { id } = req.params;
    const { farmer_id, type, quantity, fat, snf, clr, rate, shift } = req.body;

    try {
        const [result] = await db.execute(
            `UPDATE collections 
             SET farmer_id = ?, type = ?, quantity = ?, fat = ?, snf = ?, clr = ?, rate = ?, shift = ? 
             WHERE id = ?`,
            [farmer_id, type, quantity, fat, snf, clr, rate, shift, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Collection not found or not updated' });
        }

        res.status(200).json({ message: 'Collection updated' });
    } catch (err) {
        console.error('Error updating collection:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

// Delete collection
async function deleteCollection(req, res) {
    const { id } = req.params;

    try {
        const [result] = await db.execute('DELETE FROM collections WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        res.status(200).json({ message: 'Collection deleted' });
    } catch (err) {
        console.error('Error deleting collection:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getTodaysCollectionByFarmer,
    createCollection,
    getCollections,
    getCollectionById,
    updateCollection,
    deleteCollection,
    getCollectionBytab,
    getTodaysCollection,
    getTodaysCollectionfarmer
};
