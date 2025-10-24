const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { Expo } = require('expo-server-sdk')

let expo = new Expo();


async function createCollection(req, res) {
  const { farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, date } = req.body;

  try {
    // Use provided date OR default to now (IST)
    // let currentDate;
    // if (date) {
    //   currentDate = new Date(`${date}T00:00:00+05:30`);
    // } else {
    //   currentDate = new Date();
    // }

    // // Convert to IST formatted string
    // const istDateTime = currentDate.toLocaleString("en-US", {
    //   timeZone: "Asia/Kolkata",
    //   year: "numeric",
    //   month: "2-digit",
    //   day: "2-digit",
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   second: "2-digit",
    //   hourCycle: "h23",
    // });

    // const [datePart, timePart] = istDateTime.split(", ");
    // const [month, day, year] = datePart.split("/");
    // const formattedIdtDateTime = `${year}-${month}-${day} ${timePart}`;

    // // 1️⃣ Insert collection
    // const [result] = await db.execute(
    //   `INSERT INTO collections 
    //    (farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, created_at)
    //    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    //   [farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, formattedIdtDateTime]
    // );

    let currentDate;

    if (date) {
      // If frontend sends full "YYYY-MM-DD HH:mm:ss"
      currentDate = new Date(date.replace(" ", "T") + "+05:30");
    } else {
      // Default to now
      currentDate = new Date();
    }

    // Format IST datetime → "YYYY-MM-DD HH:mm:ss"
    const istDateTime = currentDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });

    const [datePart, timePart] = istDateTime.split(", ");
    const [month, day, year] = datePart.split("/");
    const formattedIdtDateTime = `${year}-${month}-${day} ${timePart}`;

    const [result] = await db.execute(
      `INSERT INTO collections 
       (farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, formattedIdtDateTime]
    );

    // 2️⃣ Fetch farmer Expo token
    const [farmerRows] = await db.execute(
      `SELECT expo_token, username FROM users WHERE username = ? AND dairy_id = ?`,
      [farmer_id, dairy_id]
    );

    // const io = req.app.get("io");

  

    if (farmerRows.length > 0) {
      // const { expo_token, username } = farmerRows[0];
      const expo_token = farmerRows[0].expo_token
      const username = farmerRows[0].username

     

      let titlesocket = "Milk Collection Update";
      let message = `Dear ${username || 'Farmer'}, your ${type} milk collection of ${quantity}L has been recorded successfully.`;
     
      
       await db.execute(
        "INSERT INTO notifications (dairy_id, title, message, farmer_id) VALUES (?, ?, ?, ?)",
        [dairy_id, titlesocket, message, username]
      );


      if (expo_token && Expo.isExpoPushToken(expo_token)) {
        const messages = [{
          to: expo_token,
          sound: 'default',
          title: 'Milk Collection Update',
          body: `Dear ${username || 'Farmer'}, your ${type} milk collection of ${quantity}L has been recorded successfully.`,
          data: { type: 'collection', farmer_id, date: formattedIdtDateTime },
        }];

        // 3️⃣ Send Notification
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            console.error("Expo push error:", error);
          }
        }
      } else {
        console.log("Invalid or missing Expo token for farmer:", farmer_id);
      }
    }

    // ✅ Respond to client
    res.status(201).json({
      success: true,
      message: "Collection added and farmer notified",
      id: result.insertId,
      created_at: formattedIdtDateTime,
    });

  } catch (err) {
    console.error("Error creating collection:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


// Create new collection
// async function createCollection(req, res) {
//   const { farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, date } = req.body;

//   try {
//     // Use provided date OR default to now (IST)
//     let currentDate;
//     if (date) {
//       // If frontend sends only YYYY-MM-DD, make it full datetime in IST
//       currentDate = new Date(`${date}T00:00:00+05:30`);
//     } else {
//       currentDate = new Date();
//     }

//     // Convert to IST and format as YYYY-MM-DD HH:mm:ss
//     const istDateTime = currentDate.toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hourCycle: "h23", // 24-hour format
//     });

//     // Split into date + time and reformat
//     const [datePart, timePart] = istDateTime.split(", ");
//     const [month, day, year] = datePart.split("/");
//     const formattedIdtDateTime = `${year}-${month}-${day} ${timePart}`;

//     // Insert into DB
//     const [result] = await db.execute(
//       `INSERT INTO collections 
//        (farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift, formattedIdtDateTime]
//     );

//     res.status(201).json({
//       success: true,
//       message: "Collection added",
//       id: result.insertId,
//       created_at: formattedIdtDateTime,
//     });
//   } catch (err) {
//     console.error("Error creating collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }


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



// async function getTodaysCollectionfarmer(req, res) {
//   let { type, dairy_id, date, farmer_id } = req.query;

//   try {
//     if (!dairy_id || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairy_id and farmer_id are required" });
//     }

//     // Date filter — default to today if not passed
//     const today = new Date();
//     const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

//     // ---- Collections grouped by shift ----
//     let query = `
//       SELECT 
//         shift,
//         MIN(created_at) as first_entry,   
//         MAX(created_at) as last_entry,    
//         SUM(quantity) AS total_quantity,
//         ROUND(AVG(fat), 2) AS avg_fat,
//         ROUND(AVG(snf), 2) AS avg_snf,
//         ROUND(AVG(clr), 2) AS avg_clr,
//         SUM(quantity * rate) AS total_amount
//       FROM collections
//       WHERE DATE(created_at) = ?
//         AND dairy_id = ?
//         AND farmer_id = ?
//     `;
//     const params = [reportDate, dairy_id, farmer_id];

//     if (type && type !== "All") {
//       query += ` AND type = ?`;
//       params.push(type);
//     }

//     query += ` GROUP BY shift ORDER BY shift`;

//     const [rows] = await db.execute(query, params);

//     // ---- Payments / deductions for that farmer on that day ----
//     const [paymentRows] = await db.execute(
//       `SELECT 
//          SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//          SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//          SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//          SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//          SUM(amount_taken) AS total_deductions,
//          SUM(received) AS total_received
//        FROM farmer_payments
//        WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const payments = paymentRows[0] || {};

//     let lastpaydatestatus = "paid"
//      // ---- Last payment date from bill ----
//     const [lastPayRows] = await db.execute(
//       `SELECT MAX(created_at) as lastPayDate
//        FROM bills
//        WHERE farmer_id=? AND dairy_id=? AND status=?`,
//       [farmer_id, dairy_id, lastpaydatestatus]
//     );

//     const lastPayDate = lastPayRows[0]?.lastPayDate || "NA";


//     // ---- Prepare result ----
//     const result = {
//       morning: {
//         shift: "Morning",
//         created_at: "NA", // default
//         total_quantity: 0,
//         avg_fat: 0,
//         avg_snf: 0,
//         avg_clr: 0,
//         total_amount: 0,
//       },
//       evening: {
//         shift: "Evening",
//         created_at: "NA", // default
//         total_quantity: 0,
//         avg_fat: 0,
//         avg_snf: 0,
//         avg_clr: 0,
//         total_amount: 0,
//       },
//     };

//     rows.forEach((r) => {
//       const entry = {
//         shift: r.shift,
//         created_at: r.last_entry || r.first_entry || "NA", // use last entry as collection time
//         total_quantity: Number(r.total_quantity) || 0,
//         avg_fat: Number(r.avg_fat) || 0,
//         avg_snf: Number(r.avg_snf) || 0,
//         avg_clr: Number(r.avg_clr) || 0,
//         total_amount: Number(r.total_amount) || 0,
//       };
//       if (r.shift.toLowerCase() === "morning") result.morning = entry;
//       if (r.shift.toLowerCase() === "evening") result.evening = entry;
//     });

//     // ---- Totals ----
//     const totalQty =
//       (result.morning.total_quantity || 0) +
//       (result.evening.total_quantity || 0);

//     const totalAmount =
//       (result.morning.total_amount || 0) +
//       (result.evening.total_amount || 0);

//     const dailyAvg =
//       totalQty > 0
//         ? (totalQty / 2).toFixed(2) // average per shift
//         : 0;

//     const deductions = {
//       advance: Number(payments.advance) || 0,
//       cattle_feed: Number(payments.cattle_feed) || 0,
//       other1: Number(payments.other1) || 0,
//       other2: Number(payments.other2) || 0,
//       total: Number(payments.total_deductions) || 0,
//     };

//     const netAmount = totalAmount - deductions.total + (Number(payments.total_received) || 0);

//     // ---- Final Response ----
//     res.status(200).json({
//       success: true,
//       message: "Today’s collection fetched successfully",
//       date: reportDate,
//       data: {
//         ...result,
//         totals: {
//           totalQty,
//           totalAmount,
//           dailyAvg: Number(dailyAvg),
//         },
//         financials: {
//           deductions,
//           total_received: Number(payments.total_received) || 0,
//           netAmount,
//           lastPayDate
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching today’s collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getTodaysCollectionfarmer(req, res) {
//   let { type, dairy_id, date, farmer_id } = req.query;

//   try {
//     if (!dairy_id || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairy_id and farmer_id are required" });
//     }

//     // Default date = today
//     const today = new Date();
//     const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

//     // ---- Collections grouped by shift ----
//     let query = `
//       SELECT 
//         shift,
//         MIN(created_at) AS first_entry,
//         MAX(created_at) AS last_entry,
//         SUM(quantity) AS total_quantity,
//         ROUND(AVG(fat), 2) AS avg_fat,
//         ROUND(AVG(snf), 2) AS avg_snf,
//         ROUND(AVG(clr), 2) AS avg_clr,
//         SUM(quantity * rate) AS total_amount
//       FROM collections
//       WHERE DATE(created_at) = ?
//         AND dairy_id = ?
//         AND farmer_id = ?
//     `;
//     const params = [reportDate, dairy_id, farmer_id];

//     if (type && type !== "All") {
//       query += ` AND type = ?`;
//       params.push(type);
//     }

//     query += ` GROUP BY shift ORDER BY shift`;

//     const [rows] = await db.execute(query, params);

//     // ---- Payments / deductions ----
//     const [paymentRows] = await db.execute(
//       `SELECT 
//          SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//          SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//          SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//          SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//          SUM(amount_taken) AS total_deductions,
//          SUM(received) AS total_received
//        FROM farmer_payments
//        WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const payments = paymentRows[0] || {};

//     // ---- Last bill payment date ----
//     const [lastPayRows] = await db.execute(
//       `SELECT MAX(created_at) as lastPayDate
//        FROM bills
//        WHERE farmer_id=? AND dairy_id=? AND status='paid'`,
//       [farmer_id, dairy_id]
//     );

//     const lastPayDate = lastPayRows[0]?.lastPayDate || "NA";

//     // ---- Initialize results ----
//     const result = {
//       morning: {
//         shift: "Morning",
//         created_at: "NA",
//         total_quantity: 0,
//         avg_fat: 0,
//         avg_snf: 0,
//         avg_clr: 0,
//         total_amount: 0,
//       },
//       evening: {
//         shift: "Evening",
//         created_at: "NA",
//         total_quantity: 0,
//         avg_fat: 0,
//         avg_snf: 0,
//         avg_clr: 0,
//         total_amount: 0,
//       },
//     };

//     rows.forEach((r) => {
//       const entry = {
//         shift: r.shift,
//         created_at: r.last_entry || r.first_entry || "NA", // Show last recorded entry
//         total_quantity: Number(r.total_quantity) || 0,
//         avg_fat: Number(r.avg_fat) || 0,
//         avg_snf: Number(r.avg_snf) || 0,
//         avg_clr: Number(r.avg_clr) || 0,
//         total_amount: Number(r.total_amount) || 0,
//       };
//       if (r.shift.toLowerCase() === "morning") result.morning = entry;
//       if (r.shift.toLowerCase() === "evening") result.evening = entry;
//     });

//     // ---- Totals ----
//     const totalQty =
//       (result.morning.total_quantity || 0) +
//       (result.evening.total_quantity || 0);
//     const totalAmount =
//       (result.morning.total_amount || 0) +
//       (result.evening.total_amount || 0);
//     const dailyAvg =
//       totalQty > 0 ? (totalQty / 2).toFixed(2) : 0;

//     const deductions = {
//       advance: Number(payments.advance) || 0,
//       cattle_feed: Number(payments.cattle_feed) || 0,
//       other1: Number(payments.other1) || 0,
//       other2: Number(payments.other2) || 0,
//       total: Number(payments.total_deductions) || 0,
//     };

//     const netAmount =
//       totalAmount - deductions.total + (Number(payments.total_received) || 0);

//     // ---- Final Response ----
//     res.status(200).json({
//       success: true,
//       message: "Today’s collection fetched successfully",
//       date: reportDate,
//       data: {
//         ...result,
//         totals: {
//           totalQty,
//           totalAmount,
//           dailyAvg: Number(dailyAvg),
//         },
//         financials: {
//           deductions,
//           total_received: Number(payments.total_received) || 0,
//           netAmount,
//           lastPayDate,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching today’s collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }


// async function getTodaysCollectionfarmer(req, res) {
//   let { type, dairy_id, date, farmer_id } = req.query;

//   try {
//     if (!dairy_id || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairy_id and farmer_id are required" });
//     }

//     // Date filter — default to today
//     const today = new Date();
//     const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

//     // ---- Fetch all collections for the day ----
//     let query = `
//       SELECT 
//         id,
//         shift,
//         type,
//         quantity,
//         fat,
//         snf,
//         clr,
//         rate,
//         (quantity * rate) as amount,
//         created_at
//       FROM collections
//       WHERE DATE(created_at) = ?
//         AND dairy_id = ?
//         AND farmer_id = ?
//     `;
//     const params = [reportDate, dairy_id, farmer_id];

//     if (type && type !== "All") {
//       query += ` AND type = ?`;
//       params.push(type);
//     }

//     query += ` ORDER BY shift, created_at`;

//     const [rows] = await db.execute(query, params);

//     // ---- Payments / deductions ----
//     const [paymentRows] = await db.execute(
//       `SELECT 
//          SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//          SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//          SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//          SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//          SUM(amount_taken) AS total_deductions,
//          SUM(received) AS total_received
//        FROM farmer_payments
//        WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const payments = paymentRows[0] || {};

//     // ---- Last payment date ----
//     const [lastPayRows] = await db.execute(
//       `SELECT MAX(created_at) as lastPayDate
//        FROM bills
//        WHERE farmer_id=? AND dairy_id=? AND status='paid'`,
//       [farmer_id, dairy_id]
//     );
//     const lastPayDate = lastPayRows[0]?.lastPayDate || "NA";

//     // ---- Group data by shift ----
//     const grouped = { morning: [], evening: [] };

//     rows.forEach(r => {
//       const entry = {
//         id: r.id,
//         type: r.type,
//         shift: r.shift,
//         quantity: Number(r.quantity),
//         fat: Number(r.fat),
//         snf: Number(r.snf),
//         clr: Number(r.clr),
//         rate: Number(r.rate),
//         amount: Number(r.amount),
//         created_at: r.created_at
//       };
//       if (r.shift.toLowerCase() === "morning") grouped.morning.push(entry);
//       if (r.shift.toLowerCase() === "evening") grouped.evening.push(entry);
//     });

//     // ---- Calculate shift averages ----
//     function calcShiftTotals(entries) {
//       if (!entries.length)
//         return {
//           total_quantity: 0,
//           avg_fat: 0,
//           avg_snf: 0,
//           avg_clr: 0,
//           total_amount: 0,
//         };

//       const totalQty = entries.reduce((a, b) => a + b.quantity, 0);
//       const avgFat = entries.reduce((a, b) => a + b.fat, 0) / entries.length;
//       const avgSnf = entries.reduce((a, b) => a + b.snf, 0) / entries.length;
//       const avgClr = entries.reduce((a, b) => a + b.clr, 0) / entries.length;
//       const totalAmount = entries.reduce((a, b) => a + b.amount, 0);

//       return {
//         total_quantity: totalQty,
//         avg_fat: avgFat.toFixed(2),
//         avg_snf: avgSnf.toFixed(2),
//         avg_clr: avgClr.toFixed(2),
//         total_amount: totalAmount,
//       };
//     }

//     const morningTotals = calcShiftTotals(grouped.morning);
//     const eveningTotals = calcShiftTotals(grouped.evening);

//     const totalQty = morningTotals.total_quantity + eveningTotals.total_quantity;
//     const totalAmount = morningTotals.total_amount + eveningTotals.total_amount;
//     const dailyAvgFat =
//       (Number(morningTotals.avg_fat) + Number(eveningTotals.avg_fat)) / 2 || 0;

//     const deductions = {
//       advance: Number(payments.advance) || 0,
//       cattle_feed: Number(payments.cattle_feed) || 0,
//       other1: Number(payments.other1) || 0,
//       other2: Number(payments.other2) || 0,
//       total: Number(payments.total_deductions) || 0,
//     };

//     const netAmount = totalAmount - deductions.total + (Number(payments.total_received) || 0);

//     // ---- Final Response ----
//     res.status(200).json({
//       success: true,
//       message: "Today's collection fetched successfully",
//       date: reportDate,
//       data: {
//         morning: {
//           shift: "Morning",
//           entries: grouped.morning,
//           totals: morningTotals,
//         },
//         evening: {
//           shift: "Evening",
//           entries: grouped.evening,
//           totals: eveningTotals,
//         },
//         overall: {
//           totalQty,
//           totalAmount,
//           avgFat: dailyAvgFat.toFixed(2),
//         },
//         financials: {
//           deductions,
//           total_received: Number(payments.total_received) || 0,
//           netAmount,
//           lastPayDate,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching today's collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getTodaysCollectionfarmer(req, res) {
//   let { type, dairy_id, date, farmer_id } = req.query;

//   try {
//     if (!dairy_id || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairy_id and farmer_id are required" });
//     }

//     // Date filter — default to today
//     const today = new Date();
//     const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

//     // ---- Fetch all collections for the day ----
//     let query = `
//       SELECT 
//         id,
//         shift,
//         type,
//         quantity,
//         fat,
//         snf,
//         clr,
//         rate,
//         (quantity * rate) as amount,
//         created_at
//       FROM collections
//       WHERE DATE(created_at) = ?
//         AND dairy_id = ?
//         AND farmer_id = ?
//     `;
//     const params = [reportDate, dairy_id, farmer_id];

//     if (type && type !== "All") {
//       query += ` AND type = ?`;
//       params.push(type);
//     }

//     query += ` ORDER BY shift, created_at`;

//     const [rows] = await db.execute(query, params);

//     // ---- Payments / deductions ----
//     const [paymentRows] = await db.execute(
//       `SELECT 
//          SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//          SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//          SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//          SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//          SUM(amount_taken) AS total_deductions,
//          SUM(received) AS total_received
//        FROM farmer_payments
//        WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const payments = paymentRows[0] || {};

//     // ---- Last payment date ----
//     const [lastPayRows] = await db.execute(
//       `SELECT MAX(created_at) as lastPayDate
//        FROM bills
//        WHERE farmer_id=? AND dairy_id=? AND status='paid'`,
//       [farmer_id, dairy_id]
//     );
//     const lastPayDate = lastPayRows[0]?.lastPayDate || "NA";

//     // ---- 🧮 Average fat till date ----
//     const [avgFatTillDateRows] = await db.execute(
//       `SELECT 
//          ROUND(AVG(fat),2) AS avg_fat_till_date,
//          ROUND(AVG(snf),2) AS avg_snf_till_date,
//          ROUND(AVG(clr),2) AS avg_clr_till_date
//        FROM collections
//        WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) <= ?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const avgTillDate = avgFatTillDateRows[0] || {
//       avg_fat_till_date: 0,
//       avg_snf_till_date: 0,
//       avg_clr_till_date: 0,
//     };

//     // ---- Group data by shift ----
//     const grouped = { morning: [], evening: [] };

//     rows.forEach(r => {
//       const entry = {
//         id: r.id,
//         type: r.type,
//         shift: r.shift,
//         quantity: Number(r.quantity),
//         fat: Number(r.fat),
//         snf: Number(r.snf),
//         clr: Number(r.clr),
//         rate: Number(r.rate),
//         amount: Number(r.amount),
//         created_at: r.created_at
//       };
//       if (r.shift.toLowerCase() === "morning") grouped.morning.push(entry);
//       if (r.shift.toLowerCase() === "evening") grouped.evening.push(entry);
//     });

//     // ---- Calculate shift averages ----
//     function calcShiftTotals(entries) {
//       if (!entries.length)
//         return {
//           total_quantity: 0,
//           avg_fat: 0,
//           avg_snf: 0,
//           avg_clr: 0,
//           total_amount: 0,
//         };

//       const totalQty = entries.reduce((a, b) => a + b.quantity, 0);
//       const avgFat = entries.reduce((a, b) => a + b.fat, 0) / entries.length;
//       const avgSnf = entries.reduce((a, b) => a + b.snf, 0) / entries.length;
//       const avgClr = entries.reduce((a, b) => a + b.clr, 0) / entries.length;
//       const totalAmount = entries.reduce((a, b) => a + b.amount, 0);

//       return {
//         total_quantity: totalQty,
//         avg_fat: avgFat.toFixed(2),
//         avg_snf: avgSnf.toFixed(2),
//         avg_clr: avgClr.toFixed(2),
//         total_amount: totalAmount,
//       };
//     }

//     const morningTotals = calcShiftTotals(grouped.morning);
//     const eveningTotals = calcShiftTotals(grouped.evening);

//     const totalQty = morningTotals.total_quantity + eveningTotals.total_quantity;
//     const totalAmount = morningTotals.total_amount + eveningTotals.total_amount;
//     const dailyAvgFat =
//       (Number(morningTotals.avg_fat) + Number(eveningTotals.avg_fat)) / 2 || 0;

//     const deductions = {
//       advance: Number(payments.advance) || 0,
//       cattle_feed: Number(payments.cattle_feed) || 0,
//       other1: Number(payments.other1) || 0,
//       other2: Number(payments.other2) || 0,
//       total: Number(payments.total_deductions) || 0,
//     };

//     const netAmount = totalAmount - deductions.total + (Number(payments.total_received) || 0);

//     // ---- Final Response ----
//     res.status(200).json({
//       success: true,
//       message: "Today's collection fetched successfully",
//       date: reportDate,
//       data: {
//         morning: {
//           shift: "Morning",
//           entries: grouped.morning,
//           totals: morningTotals,
//         },
//         evening: {
//           shift: "Evening",
//           entries: grouped.evening,
//           totals: eveningTotals,
//         },
//         overall: {
//           totalQty,
//           totalAmount,
//           avgFat: dailyAvgFat.toFixed(2),
//         },
//         tillDateAverages: {
//           avg_fat_till_date: avgTillDate.avg_fat_till_date,
//           avg_snf_till_date: avgTillDate.avg_snf_till_date,
//           avg_clr_till_date: avgTillDate.avg_clr_till_date,
//         },
//         financials: {
//           deductions,
//           total_received: Number(payments.total_received) || 0,
//           netAmount,
//           lastPayDate,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching today's collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getTodaysCollectionfarmer(req, res) {
//   let { type, dairy_id, date, farmer_id } = req.query;

//   try {
//     if (!dairy_id || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairy_id and farmer_id are required" });
//     }

//     const today = new Date();
//     const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

//     // 🧾 1️⃣ Fetch last finalized bill
//     const [lastBillRows] = await db.execute(
//       `SELECT *
//        FROM bills
//        WHERE dairy_id = ? AND farmer_id = ? AND is_finalized = 1
//        ORDER BY period_end DESC
//        LIMIT 1`,
//       [dairy_id, farmer_id]
//     );
//     const lastBill = lastBillRows[0] || null;
//     const lastBillEndDate = lastBill ? lastBill.period_end : null;

//     // 🧮 2️⃣ Fetch all collections for the day
//     let dayQuery = `
//       SELECT 
//         id, shift, type, quantity, fat, snf, clr, rate,
//         (quantity * rate) AS amount, created_at
//       FROM collections
//       WHERE DATE(created_at) = ? AND dairy_id = ? AND farmer_id = ?
//     `;
//     const params = [reportDate, dairy_id, farmer_id];

//     if (type && type !== "All") {
//       dayQuery += ` AND type = ?`;
//       params.push(type);
//     }

//     dayQuery += ` ORDER BY shift, created_at`;
//     const [rows] = await db.execute(dayQuery, params);

//     // 💰 3️⃣ Payments / deductions for the day
//     const [paymentRows] = await db.execute(
//       `SELECT 
//          SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//          SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//          SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//          SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//          SUM(amount_taken) AS total_deductions,
//          SUM(received) AS total_received
//        FROM farmer_payments
//        WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
//       [dairy_id, farmer_id, reportDate]
//     );
//     const payments = paymentRows[0] || {};

//     // 📅 4️⃣ Average fat till date
//     const [avgFatTillDateRows] = await db.execute(
//       `SELECT 
//          ROUND(AVG(fat),2) AS avg_fat_till_date,
//          ROUND(AVG(snf),2) AS avg_snf_till_date,
//          ROUND(AVG(clr),2) AS avg_clr_till_date
//        FROM collections
//        WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) <= ?`,
//       [dairy_id, farmer_id, reportDate]
//     );
//     const avgTillDate = avgFatTillDateRows[0] || {
//       avg_fat_till_date: 0,
//       avg_snf_till_date: 0,
//       avg_clr_till_date: 0,
//     };

//     // 🧾 5️⃣ Totals after last bill (if exists)
//     let afterBillTotals = {};
//     if (lastBillEndDate) {
//       const [afterCollections] = await db.execute(
//         `SELECT 
//             SUM(quantity) AS total_liters,
//             ROUND(AVG(fat),2) AS avg_fat,
//             ROUND(AVG(snf),2) AS avg_snf,
//             ROUND(AVG(clr),2) AS avg_clr,
//             SUM(quantity * rate) AS total_amount
//          FROM collections
//          WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) > ?`,
//         [dairy_id, farmer_id, lastBillEndDate]
//       );

//       const [afterPayments] = await db.execute(
//         `SELECT 
//            SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//            SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//            SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//            SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//            SUM(amount_taken) AS total_deductions,
//            SUM(received) AS total_received
//          FROM farmer_payments
//          WHERE dairy_id=? AND farmer_id=? AND DATE(date) > ?`,
//         [dairy_id, farmer_id, lastBillEndDate]
//       );

//       afterBillTotals = {
//         collections: afterCollections[0] || {},
//         payments: afterPayments[0] || {},
//       };
//     } else {
//       afterBillTotals = { collections: {}, payments: {} };
//     }

//     // 🧮 6️⃣ Group day’s data by shift
//     const grouped = { morning: [], evening: [] };
//     rows.forEach(r => {
//       const entry = {
//         id: r.id,
//         type: r.type,
//         shift: r.shift,
//         quantity: Number(r.quantity),
//         fat: Number(r.fat),
//         snf: Number(r.snf),
//         clr: Number(r.clr),
//         rate: Number(r.rate),
//         amount: Number(r.amount),
//         created_at: r.created_at
//       };
//       if (r.shift.toLowerCase() === "morning") grouped.morning.push(entry);
//       if (r.shift.toLowerCase() === "evening") grouped.evening.push(entry);
//     });

//     // 🧾 Shift-wise totals
//     function calcShiftTotals(entries) {
//       if (!entries.length)
//         return { total_quantity: 0, avg_fat: 0, avg_snf: 0, avg_clr: 0, total_amount: 0 };

//       const totalQty = entries.reduce((a, b) => a + b.quantity, 0);
//       const avgFat = entries.reduce((a, b) => a + b.fat, 0) / entries.length;
//       const avgSnf = entries.reduce((a, b) => a + b.snf, 0) / entries.length;
//       const avgClr = entries.reduce((a, b) => a + b.clr, 0) / entries.length;
//       const totalAmount = entries.reduce((a, b) => a + b.amount, 0);

//       return {
//         total_quantity: totalQty,
//         avg_fat: avgFat.toFixed(2),
//         avg_snf: avgSnf.toFixed(2),
//         avg_clr: avgClr.toFixed(2),
//         total_amount: totalAmount,
//       };
//     }

//     const morningTotals = calcShiftTotals(grouped.morning);
//     const eveningTotals = calcShiftTotals(grouped.evening);

//     const totalQty = morningTotals.total_quantity + eveningTotals.total_quantity;
//     const totalAmount = morningTotals.total_amount + eveningTotals.total_amount;
//     const dailyAvgFat =
//       (Number(morningTotals.avg_fat) + Number(eveningTotals.avg_fat)) / 2 || 0;

//     const deductions = {
//       advance: Number(payments.advance) || 0,
//       cattle_feed: Number(payments.cattle_feed) || 0,
//       other1: Number(payments.other1) || 0,
//       other2: Number(payments.other2) || 0,
//       total: Number(payments.total_deductions) || 0,
//     };

//     const netAmount = totalAmount - deductions.total + (Number(payments.total_received) || 0);

//     // ✅ Final Response
//     res.status(200).json({
//       success: true,
//       message: "Today's collection fetched successfully",
//       date: reportDate,
//       lastBill: lastBill || null,
//       afterLastBillTotals,
//       data: {
//         morning: { shift: "Morning", entries: grouped.morning, totals: morningTotals },
//         evening: { shift: "Evening", entries: grouped.evening, totals: eveningTotals },
//         overall: { totalQty, totalAmount, avgFat: dailyAvgFat.toFixed(2) },
//         tillDateAverages: avgTillDate,
//         financials: {
//           deductions,
//           total_received: Number(payments.total_received) || 0,
//           netAmount,
//           lastPayDate: lastBill ? lastBill.period_end : "NA",
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching today's collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function getTodaysCollectionfarmer(req, res) {
//   let { type, dairy_id, date, farmer_id } = req.query;

//   try {
//     if (!dairy_id || !farmer_id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "dairy_id and farmer_id are required" });
//     }

//     const today = new Date();
//     const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

//     // 🧾 1️⃣ Fetch last finalized bill
//     const [lastBillRows] = await db.execute(
//       `SELECT * 
//        FROM bills 
//        WHERE dairy_id=? AND farmer_id=? AND is_finalized=1 
//        ORDER BY period_end DESC 
//        LIMIT 1`,
//       [dairy_id, farmer_id]
//     );
//     const lastBill = lastBillRows[0] || null;
//     const lastBillEndDate = lastBill ? lastBill.period_end : null;

//     // 🧮 2️⃣ Fetch all collections for the day
//     let query = `
//       SELECT 
//         id,
//         shift,
//         type,
//         quantity,
//         fat,
//         snf,
//         clr,
//         rate,
//         (quantity * rate) as amount,
//         created_at
//       FROM collections
//       WHERE DATE(created_at) = ?
//         AND dairy_id = ?
//         AND farmer_id = ?
//     `;
//     const params = [reportDate, dairy_id, farmer_id];

//     if (type && type !== "All") {
//       query += ` AND type = ?`;
//       params.push(type);
//     }

//     query += ` ORDER BY shift, created_at`;

//     const [rows] = await db.execute(query, params);

//     // 💰 3️⃣ Payments / deductions
//     const [paymentRows] = await db.execute(
//       `SELECT 
//          SUM(CASE WHEN payment_type='advance' THEN amount_taken ELSE 0 END) AS advance,
//          SUM(CASE WHEN payment_type='cattle feed' THEN amount_taken ELSE 0 END) AS cattle_feed,
//          SUM(CASE WHEN payment_type='Other1' THEN amount_taken ELSE 0 END) AS other1,
//          SUM(CASE WHEN payment_type='Other2' THEN amount_taken ELSE 0 END) AS other2,
//          SUM(amount_taken) AS total_deductions,
//          SUM(received) AS total_received
//        FROM farmer_payments
//        WHERE dairy_id=? AND farmer_id=? AND DATE(date)=?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const payments = paymentRows[0] || {};

//     // 📅 4️⃣ Average fat till date
//     const [avgFatTillDateRows] = await db.execute(
//       `SELECT 
//          ROUND(AVG(fat),2) AS avg_fat_till_date,
//          ROUND(AVG(snf),2) AS avg_snf_till_date,
//          ROUND(AVG(clr),2) AS avg_clr_till_date
//        FROM collections
//        WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) <= ?`,
//       [dairy_id, farmer_id, reportDate]
//     );

//     const avgTillDate = avgFatTillDateRows[0] || {
//       avg_fat_till_date: 0,
//       avg_snf_till_date: 0,
//       avg_clr_till_date: 0,
//     };

//     // 🧾 5️⃣ Get totals after last bill (if any)
//     let afterLastBillTotals = null;
//     if (lastBillEndDate) {
//       const [afterTotals] = await db.execute(
//         `SELECT 
//           SUM(quantity) AS total_liters,
//           SUM(quantity * rate) AS total_amount,
//           ROUND(AVG(fat),2) AS avg_fat,
//           ROUND(AVG(snf),2) AS avg_snf,
//           ROUND(AVG(clr),2) AS avg_clr
//          FROM collections
//          WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) > ?`,
//         [dairy_id, farmer_id, lastBillEndDate]
//       );
//       afterLastBillTotals = afterTotals[0] || null;
//     }

//     // 🧮 6️⃣ Group by shift
//     const grouped = { morning: [], evening: [] };

//     rows.forEach(r => {
//       const entry = {
//         id: r.id,
//         type: r.type,
//         shift: r.shift,
//         quantity: Number(r.quantity),
//         fat: Number(r.fat),
//         snf: Number(r.snf),
//         clr: Number(r.clr),
//         rate: Number(r.rate),
//         amount: Number(r.amount),
//         created_at: r.created_at
//       };
//       if (r.shift.toLowerCase() === "morning") grouped.morning.push(entry);
//       if (r.shift.toLowerCase() === "evening") grouped.evening.push(entry);
//     });

//     // 🧮 Shift totals
//     function calcShiftTotals(entries) {
//       if (!entries.length)
//         return {
//           total_quantity: 0,
//           avg_fat: 0,
//           avg_snf: 0,
//           avg_clr: 0,
//           total_amount: 0,
//         };

//       const totalQty = entries.reduce((a, b) => a + b.quantity, 0);
//       const avgFat = entries.reduce((a, b) => a + b.fat, 0) / entries.length;
//       const avgSnf = entries.reduce((a, b) => a + b.snf, 0) / entries.length;
//       const avgClr = entries.reduce((a, b) => a + b.clr, 0) / entries.length;
//       const totalAmount = entries.reduce((a, b) => a + b.amount, 0);

//       return {
//         total_quantity: totalQty,
//         avg_fat: avgFat.toFixed(2),
//         avg_snf: avgSnf.toFixed(2),
//         avg_clr: avgClr.toFixed(2),
//         total_amount: totalAmount,
//       };
//     }

//     const morningTotals = calcShiftTotals(grouped.morning);
//     const eveningTotals = calcShiftTotals(grouped.evening);

//     const totalQty = morningTotals.total_quantity + eveningTotals.total_quantity;
//     const totalAmount = morningTotals.total_amount + eveningTotals.total_amount;
//     const dailyAvgFat =
//       (Number(morningTotals.avg_fat) + Number(eveningTotals.avg_fat)) / 2 || 0;

//     const deductions = {
//       advance: Number(payments.advance) || 0,
//       cattle_feed: Number(payments.cattle_feed) || 0,
//       other1: Number(payments.other1) || 0,
//       other2: Number(payments.other2) || 0,
//       total: Number(payments.total_deductions) || 0,
//     };

//     const netAmount =
//       totalAmount - deductions.total + (Number(payments.total_received) || 0);

//     // ✅ Final Response (kept structure identical, just added lastBill & afterLastBillTotals)
//     res.status(200).json({
//       success: true,
//       message: "Today's collection fetched successfully",
//       date: reportDate,
//       lastBill,                // 🆕 full last bill details
//       afterLastBillTotals,     // 🆕 totals after that bill
//       data: {
//         morning: {
//           shift: "Morning",
//           entries: grouped.morning,
//           totals: morningTotals,
//         },
//         evening: {
//           shift: "Evening",
//           entries: grouped.evening,
//           totals: eveningTotals,
//         },
//         overall: {
//           totalQty,
//           totalAmount,
//           avgFat: dailyAvgFat.toFixed(2),
//         },
//         tillDateAverages: {
//           avg_fat_till_date: avgTillDate.avg_fat_till_date,
//           avg_snf_till_date: avgTillDate.avg_snf_till_date,
//           avg_clr_till_date: avgTillDate.avg_clr_till_date,
//         },
//         financials: {
//           deductions,
//           total_received: Number(payments.total_received) || 0,
//           netAmount,
//           lastPayDate: lastBill?.period_end || "NA",
//         },
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching today's collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

async function getTodaysCollectionfarmer(req, res) {
  let { type, dairy_id, date, farmer_id } = req.query;

  try {
    if (!dairy_id || !farmer_id) {
      return res
        .status(400)
        .json({ success: false, message: "dairy_id and farmer_id are required" });
    }

    const today = new Date();
    const reportDate = date || today.toISOString().slice(0, 10); // YYYY-MM-DD

    // 🧾 1️⃣ Fetch last finalized bill
    const [lastBillRows] = await db.execute(
      `SELECT * 
       FROM bills 
       WHERE dairy_id=? AND farmer_id=? AND is_finalized=1 
       ORDER BY period_end DESC 
       LIMIT 1`,
      [dairy_id, farmer_id]
    );

    const lastBill = lastBillRows[0] || null;
    const lastBillEndDate = lastBill ? lastBill.period_end : null;

    // 🧮 2️⃣ Fetch all collections for the day
    let query = `
      SELECT 
        id,
        shift,
        type,
        quantity,
        fat,
        snf,
        clr,
        rate,
        (quantity * rate) as amount,
        created_at
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

    query += ` ORDER BY shift, created_at`;

    const [rows] = await db.execute(query, params);

    // 💰 3️⃣ Payments / deductions for that day
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

    // 📅 4️⃣ Average fat till date
    const [avgFatTillDateRows] = await db.execute(
      `SELECT 
         ROUND(AVG(fat),2) AS avg_fat_till_date,
         ROUND(AVG(snf),2) AS avg_snf_till_date,
         ROUND(AVG(clr),2) AS avg_clr_till_date
       FROM collections
       WHERE dairy_id=? AND farmer_id=? AND DATE(created_at) <= ?`,
      [dairy_id, farmer_id, reportDate]
    );

    const avgTillDate = avgFatTillDateRows[0] || {
      avg_fat_till_date: 0,
      avg_snf_till_date: 0,
      avg_clr_till_date: 0,
    };

    // 🧾 5️⃣ Get totals after last bill (or all if no bill found)
    // let afterLastBillTotals = null;

    // if (lastBillEndDate) {
    //   // 🟢 Case: Bill exists → all collections after bill end
    //   const [afterTotals] = await db.execute(
    //     `SELECT 
    //       SUM(quantity) AS total_liters,
    //       SUM(quantity * rate) AS total_amount,
    //       ROUND(AVG(fat),2) AS avg_fat,
    //       ROUND(AVG(snf),2) AS avg_snf,
    //       ROUND(AVG(clr),2) AS avg_clr
    //      FROM collections
    //      WHERE dairy_id=? AND farmer_id=? AND created_at > ?`,  // ✅ FIXED
    //     [dairy_id, farmer_id, lastBillEndDate]
    //   );
    //   afterLastBillTotals = afterTotals[0] || {
    //     total_liters: 0,
    //     total_amount: 0,
    //     avg_fat: 0,
    //     avg_snf: 0,
    //     avg_clr: 0,
    //   };
    // } else {
    //   // 🔵 Case: No bill found → all collections so far
    //   const [allTotals] = await db.execute(
    //     `SELECT 
    //       SUM(quantity) AS total_liters,
    //       SUM(quantity * rate) AS total_amount,
    //       ROUND(AVG(fat),2) AS avg_fat,
    //       ROUND(AVG(snf),2) AS avg_snf,
    //       ROUND(AVG(clr),2) AS avg_clr
    //      FROM collections
    //      WHERE dairy_id=? AND farmer_id=?`,
    //     [dairy_id, farmer_id]
    //   );
    //   afterLastBillTotals = allTotals[0] || {
    //     total_liters: 0,
    //     total_amount: 0,
    //     avg_fat: 0,
    //     avg_snf: 0,
    //     avg_clr: 0,
    //   };
    // }

    // 🧾 5️⃣ Get totals after last bill (or all if no bill found)
    let afterLastBillTotals = null;

    if (lastBillEndDate) {
      // ✅ Bill exists → all collections strictly after that date
      const [afterTotals] = await db.execute(
        `SELECT 
          SUM(quantity) AS total_liters,
          SUM(quantity * rate) AS total_amount,
          ROUND(AVG(fat),2) AS avg_fat,
          ROUND(AVG(snf),2) AS avg_snf,
          ROUND(AVG(clr),2) AS avg_clr
        FROM collections
        WHERE dairy_id=? AND farmer_id=? AND created_at > ?`,
        [dairy_id, farmer_id, lastBillEndDate]
      );
      afterLastBillTotals = afterTotals[0];
    } else {
      // ✅ No bill → include *all* collections
      const [allTotals] = await db.execute(
        `SELECT 
          SUM(quantity) AS total_liters,
          SUM(quantity * rate) AS total_amount,
          ROUND(AVG(fat),2) AS avg_fat,
          ROUND(AVG(snf),2) AS avg_snf,
          ROUND(AVG(clr),2) AS avg_clr
        FROM collections
        WHERE dairy_id=? AND farmer_id=?`,
        [dairy_id, farmer_id]
      );
      afterLastBillTotals = allTotals[0];
    }

    // 🧮 6️⃣ Group data by shift
    const grouped = { morning: [], evening: [] };

    rows.forEach((r) => {
      const entry = {
        id: r.id,
        type: r.type,
        shift: r.shift,
        quantity: Number(r.quantity),
        fat: Number(r.fat),
        snf: Number(r.snf),
        clr: Number(r.clr),
        rate: Number(r.rate),
        amount: Number(r.amount),
        created_at: r.created_at,
      };
      if (r.shift.toLowerCase() === "morning") grouped.morning.push(entry);
      if (r.shift.toLowerCase() === "evening") grouped.evening.push(entry);
    });

    // 🧾 7️⃣ Calculate shift totals
    function calcShiftTotals(entries) {
      if (!entries.length)
        return {
          total_quantity: 0,
          avg_fat: 0,
          avg_snf: 0,
          avg_clr: 0,
          total_amount: 0,
        };

      const totalQty = entries.reduce((a, b) => a + b.quantity, 0);
      const avgFat = entries.reduce((a, b) => a + b.fat, 0) / entries.length;
      const avgSnf = entries.reduce((a, b) => a + b.snf, 0) / entries.length;
      const avgClr = entries.reduce((a, b) => a + b.clr, 0) / entries.length;
      const totalAmount = entries.reduce((a, b) => a + b.amount, 0);

      return {
        total_quantity: totalQty,
        avg_fat: avgFat.toFixed(2),
        avg_snf: avgSnf.toFixed(2),
        avg_clr: avgClr.toFixed(2),
        total_amount: totalAmount,
      };
    }

    const morningTotals = calcShiftTotals(grouped.morning);
    const eveningTotals = calcShiftTotals(grouped.evening);

    const totalQty =
      morningTotals.total_quantity + eveningTotals.total_quantity;
    const totalAmount = morningTotals.total_amount + eveningTotals.total_amount;
    const dailyAvgFat =
      (Number(morningTotals.avg_fat) + Number(eveningTotals.avg_fat)) / 2 || 0;

    const deductions = {
      advance: Number(payments.advance) || 0,
      cattle_feed: Number(payments.cattle_feed) || 0,
      other1: Number(payments.other1) || 0,
      other2: Number(payments.other2) || 0,
      total: Number(payments.total_deductions) || 0,
    };

    const netAmount =
      totalAmount - deductions.total + (Number(payments.total_received) || 0);

    // ✅ 8️⃣ Final Response (unchanged structure)
    res.status(200).json({
      success: true,
      message: "Today's collection fetched successfully",
      date: reportDate,
      lastBill,                // 🆕 last finalized bill (if any)
      afterLastBillTotals,     // 🆕 correct total after last bill (or all if none)
      data: {
        morning: {
          shift: "Morning",
          entries: grouped.morning,
          totals: morningTotals,
        },
        evening: {
          shift: "Evening",
          entries: grouped.evening,
          totals: eveningTotals,
        },
        overall: {
          totalQty,
          totalAmount,
          avgFat: dailyAvgFat.toFixed(2),
        },
        tillDateAverages: {
          avg_fat_till_date: avgTillDate.avg_fat_till_date,
          avg_snf_till_date: avgTillDate.avg_snf_till_date,
          avg_clr_till_date: avgTillDate.avg_clr_till_date,
        },
        financials: {
          deductions,
          total_received: Number(payments.total_received) || 0,
          netAmount,
          lastPayDate: lastBill?.period_end || "NA",
        },
      },
    });
  } catch (err) {
    console.error("Error fetching today's collection:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
}







async function getCollectionBytab(req, res) {
  let { farmer_id, shift, type, date, dairy_id } = req.query;

  try {
    // Base query: now we select farmer name with a subquery (avoids duplicate rows from JOIN)
    // let query = `
    //   SELECT coll.*,
    //          (SELECT u.fullName 
    //           FROM users u 
    //           WHERE u.username = coll.farmer_id 
    //           LIMIT 1) as fname
    //   FROM collections as coll
    // `;

    let query = `
      SELECT coll.*,
             u.fullName as fname
      FROM collections coll
      JOIN users u ON u.username = coll.farmer_id
    `;

    const conditions = [];
    const params = [];

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
    // if (dairy_id) {
    //   conditions.push('coll.dairy_id = ?');
    //   params.push(dairy_id);
    // }

    if (dairy_id) {
      // ✅ Ensure dairy match in BOTH collections and users
      conditions.push('coll.dairy_id = ?');
      conditions.push('u.dairy_id = ?');
      params.push(dairy_id, dairy_id);
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
      const dateObj = new Date(record.created_at);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      if (!collectionData[dateKey]) {
        collectionData[dateKey] = [];
      }

      collectionData[dateKey].push({
        type: record.type,
        qty: record.quantity,
        fat: record.fat,
        snf: record.snf,
        rate: record.rate,
        amount: (record.quantity * record.rate).toFixed(2), // fixed: amount = qty * rate
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


// async function getCollectionBytab(req, res) {
//   let { farmer_id, shift, type, date, dairy_id } = req.query;

//   try {
//     let query = 'SELECT coll.*, usr.fullName as fname FROM collections as coll LEFT JOIN users as usr ON usr.username = coll.farmer_id';
//     const conditions = [];
//     const params = [];

//     console.log(query)

//     // Add filters based on query params
//     if (farmer_id) {
//       conditions.push('coll.farmer_id = ?');
//       params.push(farmer_id);
//     }
//     if (shift) {
//       conditions.push('coll.shift = ?');
//       params.push(shift);
//     }
//     if (type && type !== 'Both') {
//       conditions.push('coll.type = ?');
//       params.push(type);
//     }

//     if (date) {
//       conditions.push('DATE(coll.created_at) = ?');
//       params.push(date);
//     }

//     if (dairy_id) {
//       conditions.push('coll.dairy_id = ?');
//       params.push(dairy_id);
//     }

    

//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     console.log('QUERY:', query);
//     console.log('PARAMS:', params);

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(200).json({ success: false, message: 'Collection not found' });
//     }

//     // Group records by formatted date
//     const collectionData = {};

//     rows.forEach(record => {
//       // Adjust date field name as per your schema
//       const dateObj = new Date(record.created_at);
//       const day = String(dateObj.getDate()).padStart(2, '0');
//       const month = String(dateObj.getMonth() + 1).padStart(2, '0');
//       const year = dateObj.getFullYear();
//       const dateKey = `${day}-${month}-${year}`;

//       if (!collectionData[dateKey]) {
//         collectionData[dateKey] = [];
//       }

//       // Push only the needed fields
//       collectionData[dateKey].push({
//         type: record.type,
//         qty: record.quantity,
//         fat: record.fat,
//         snf: record.snf,
//         rate: record.rate,
//         amount: record.rate,
//         type: record.type,
//         shift: record.shift,
//         fname: record.fname,
//       });
//     });

//     // Convert object to array with desired structure
//     const resultArray = Object.keys(collectionData).map(date => ({
//       date,
//       collections: collectionData[date],
//     }));

//     res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       data: resultArray,
//     });
//   } catch (err) {
//     console.error('Error fetching collection:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }






// Update collection
// async function updateCollection(req, res) {
//     const { id } = req.params;
//     const { farmer_id, type, quantity, fat, snf, clr, rate, shift } = req.body;

//     try {
//         const [result] = await db.execute(
//             `UPDATE collections 
//              SET farmer_id = ?, type = ?, quantity = ?, fat = ?, snf = ?, clr = ?, rate = ?, shift = ? 
//              WHERE id = ?`,
//             [farmer_id, type, quantity, fat, snf, clr, rate, shift, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Collection not found or not updated' });
//         }

//         res.status(200).json({ message: 'Collection updated' });
//     } catch (err) {
//         console.error('Error updating collection:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

// async function getCollectionBytab(req, res) {
//   let { farmer_id, shift, type, date, dairy_id } = req.query;

//   try {
//     let query = `
//       SELECT coll.id, coll.farmer_id, coll.type, coll.quantity, coll.fat, coll.snf,
//              coll.rate, coll.shift, coll.created_at, usr.fullName as fname
//       FROM collections coll
//       INNER JOIN users usr 
//         ON usr.username = coll.farmer_id
//     `;
//     const conditions = [];
//     const params = [];

//     if (farmer_id) {
//       conditions.push('coll.farmer_id = ?');
//       params.push(farmer_id);
//     }
//     if (shift) {
//       conditions.push('coll.shift = ?');
//       params.push(shift);
//     }
//     if (type && type !== 'Both') {
//       conditions.push('coll.type = ?');
//       params.push(type);
//     }
//     // if (date) {
//     //   conditions.push('DATE(coll.created_at) = ?');
//     //   params.push(date);
//     // }

//     if (date) {
//       conditions.push('DATE(coll.created_at) = ?');
//       params.push(new Date(date).toISOString().slice(0, 10)); // ensures YYYY-MM-DD
//     }

//     if (dairy_id) {
//       conditions.push('coll.dairy_id = ?');
//       params.push(dairy_id);
//     }

//     if (conditions.length > 0) {
//       query += ' WHERE ' + conditions.join(' AND ');
//     }

//     query += ' ORDER BY coll.created_at DESC';

//     const [rows] = await db.execute(query, params);

//     if (rows.length === 0) {
//       return res.status(200).json({ success: false, message: 'Collection not found' });
//     }

//     // Group by date
//     const collectionData = {};
//     rows.forEach(record => {
//       const dateObj = new Date(record.created_at);
//       const day = String(dateObj.getDate()).padStart(2, '0');
//       const month = String(dateObj.getMonth() + 1).padStart(2, '0');
//       const year = dateObj.getFullYear();
//       const dateKey = `${day}-${month}-${year}`;

//       if (!collectionData[dateKey]) {
//         collectionData[dateKey] = [];
//       }

//       collectionData[dateKey].push({
//         id: record.id,
//         farmer_id: record.farmer_id,
//         fname: record.fname,
//         type: record.type,
//         qty: Number(record.quantity),
//         fat: Number(record.fat),
//         snf: Number(record.snf),
//         rate: Number(record.rate),
//         amount: Number(record.quantity) * Number(record.rate),
//         shift: record.shift,
//       });
//     });

//     const resultArray = Object.keys(collectionData).map(date => ({
//       date,
//       collections: collectionData[date],
//     }));

//     res.status(200).json({
//       result: 1,
//       success: true,
//       message: 'Success',
//       data: resultArray,
//     });
//   } catch (err) {
//     console.error('Error fetching collection:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }


// async function updateCollection(req, res) {
//   const { id } = req.params;
//   const { farmer_id, type, quantity, fat, snf, clr, rate, shift, date } = req.body;

//   try {
//     // Use provided date OR default to now (IST)
//     let currentDate;
//     if (date) {
//       // If only YYYY-MM-DD is passed, append 00:00:00
//       if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//         currentDate = new Date(`${date}T00:00:00+05:30`);
//       } else {
//         // Assume full datetime is passed in string
//         currentDate = new Date(date);
//       }
//     } else {
//       currentDate = new Date();
//     }

//     // Convert to IST formatted datetime
//     const istDateTime = currentDate.toLocaleString("en-US", {
//       timeZone: "Asia/Kolkata",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hourCycle: "h23",
//     });

//     const [datePart, timePart] = istDateTime.split(", ");
//     const [month, day, year] = datePart.split("/");
//     const formattedIdtDateTime = `${year}-${month}-${day} ${timePart}`;

//     // Run update
//     const [result] = await db.execute(
//       `UPDATE collections 
//        SET farmer_id = ?, type = ?, quantity = ?, fat = ?, snf = ?, clr = ?, rate = ?, shift = ?, created_at = ?
//        WHERE id = ?`,
//       [farmer_id, type, quantity, fat, snf, clr, rate, shift, formattedIdtDateTime, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Collection not found or not updated" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Collection updated",
//       updated_at: formattedIdtDateTime,
//     });
//   } catch (err) {
//     console.error("Error updating collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// async function updateCollection(req, res) {
//   const { id } = req.params;
//   const { farmer_id, type, quantity, fat, snf, clr, rate, shift, date } = req.body;

//   try {
//     // 1️⃣ Determine base date — use provided or now
//     let currentDate;
//     if (date) {
//       // If only YYYY-MM-DD is passed, append midnight
//       if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//         currentDate = new Date(`${date}T00:00:00+05:30`);
//       } else {
//         currentDate = new Date(date);
//       }
//     } else {
//       currentDate = new Date();
//     }

//     // 2️⃣ Convert UTC → IST manually
//     const utcOffsetMs = currentDate.getTime();
//     const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hrs
//     const istDate = new Date(utcOffsetMs + istOffset);

//     // 3️⃣ Format IST datetime for MySQL (YYYY-MM-DD HH:mm:ss)
//     const pad = (n) => n.toString().padStart(2, "0");
//     const formattedIST = `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(
//       istDate.getDate()
//     )} ${pad(istDate.getHours())}:${pad(istDate.getMinutes())}:${pad(
//       istDate.getSeconds()
//     )}`;

//     // 4️⃣ Update collection
//     const [result] = await db.execute(
//       `UPDATE collections 
//        SET farmer_id = ?, type = ?, quantity = ?, fat = ?, snf = ?, clr = ?, rate = ?, shift = ?, created_at = ?
//        WHERE id = ?`,
//       [farmer_id, type, quantity, fat, snf, clr, rate, shift, formattedIST, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ success: false, message: "Collection not found or not updated" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Collection updated successfully",
//       updated_at: formattedIST, // IST datetime confirmation
//     });
//   } catch (err) {
//     console.error("Error updating collection:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

async function updateCollection(req, res) {
  const { id } = req.params;
  const { farmer_id, type, quantity, fat, snf, clr, rate, shift, date } = req.body;

  try {
    let istDate;

    if (date) {
      // If only date is passed (no time), append midnight
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        istDate = `${date} 00:00:00`;
      } else {
        // Keep given datetime as IST, no conversion
        istDate = date;
      }
    } else {
      // Current IST datetime
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(utc + istOffset);
      const pad = (n) => n.toString().padStart(2, "0");
      istDate = `${istNow.getFullYear()}-${pad(istNow.getMonth() + 1)}-${pad(
        istNow.getDate()
      )} ${pad(istNow.getHours())}:${pad(istNow.getMinutes())}:${pad(
        istNow.getSeconds()
      )}`;
    }

    const [result] = await db.execute(
      `UPDATE collections 
       SET farmer_id = ?, type = ?, quantity = ?, fat = ?, snf = ?, clr = ?, rate = ?, shift = ?, created_at = ?
       WHERE id = ?`,
      [farmer_id, type, quantity, fat, snf, clr, rate, shift, istDate, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Collection not found or not updated" });
    }

    res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      saved_datetime: istDate,
    });
  } catch (err) {
    console.error("Error updating collection:", err);
    res.status(500).json({ success: false, message: "Server error" });
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

async function updateRatesByEffectiveDate(req, res) {
  try {
    const { dairy_id, effective_date } = req.body;

    if (!dairy_id || !effective_date) {
      return res.status(400).json({
        success: false,
        message: "dairy_id and effective_date are required",
      });
    }

    // 🔹 Step 1: Get all collections before the effective_date that are not part of finalized bills
    const [collections] = await db.query(
      `
      SELECT c.id, c.farmer_id, c.fat, c.snf, c.created_at
      FROM collections c
      LEFT JOIN bills b 
        ON c.farmer_id = b.farmer_id
        AND c.dairy_id = b.dairy_id
        AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
      WHERE c.dairy_id = ? 
        AND DATE(c.created_at) <= ?
        AND (b.is_finalized IS NULL OR b.is_finalized = 0)
      `,
      [dairy_id, effective_date]
    );

    if (collections.length === 0) {
      return res.json({
        success: true,
        message: "No eligible collections found to update rates",
        updated: 0,
      });
    }

    // 🔹 Step 2: Get all rate chart entries effective on or before the date
    const [rateChart] = await db.query(
      `
      SELECT fat, snf, rate 
      FROM rate 
      WHERE dairy_id = ? 
        AND effective_date <= ?
      `,
      [dairy_id, effective_date]
    );

    // Build lookup for fast access
    const rateLookup = {};
    rateChart.forEach(r => {
      rateLookup[`${r.fat}_${r.snf}`] = r.rate;
    });

    // 🔹 Step 3: Update collection rates
    let updateCount = 0;
    for (const col of collections) {
      const rate = rateLookup[`${col.fat}_${col.snf}`] || 0;
      await db.query(`UPDATE collections SET rate = ? WHERE id = ?`, [rate, col.id]);
      updateCount++;
    }

    res.json({
      success: true,
      message: `Rates updated successfully for ${updateCount} collections`,
      updated: updateCount,
      effective_date,
    });
  } catch (err) {
    console.error("Error updating rates:", err);
    res.status(500).json({ success: false, error: err.message });
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
    getTodaysCollectionfarmer,
    updateRatesByEffectiveDate
};
