const db = require('../config/db');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require("json2csv");
const XLSX = require('xlsx');


// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    }
});

// async function createrate(req, res) {
//   const { orgName, orgDetails, address } = req.body;

//   if (!orgName || !orgDetails) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const [result] = await db.execute(
//       'INSERT INTO organizations (org_name, org_details, address) VALUES (?, ?, ?)',
//       [orgName, orgDetails, address]
//     );
//     res.status(201).json({ message: 'Organization created successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }

// async function createrate (req, res) {
// // const csvFilePath = path.join(__dirname, req.file.path);
// const csvFilePath = req.file.path;
// const organisation_id = req.body.organisation_id; // from the frontend form
// const created_by = req.body.created_by; // from the frontend form

// // Parse the CSV file and insert into the database
// const results = [];

//  fs.createReadStream(csvFilePath)
//     .pipe(csvParser())
//     .on('data', (data) => {
//     // Add organisation_id and created_by to the parsed data
//     data.organisation_id = organisation_id;
//     data.created_by = created_by;
//     results.push(data);
//     })
//     .on('end', async ()  =>  {

//         // Prepare the data for insertion using map
//         const values = results.map(record => [
//             record.fat,
//             record.snf,
//             record.type,
//             record.created_by,
//             record.organisation_id,
//             record.price
//         ]);

//         try {
//             // Perform the batch insert
//             // const [result] = await db.execute(
//             // 'INSERT INTO rate (fat, snf, type, created_by, organisation_id, price) VALUES ?',
//             // [values]
//             // );

//             // Respond with success message
//             res.status(201).json({ message: 'Rates created successfully', data: values });
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ message: 'Server error' });
//         }

//     });
// };

// const uploadRates = async (req, res) => {
//   const filePath = req.file.path;
//   const { created_by, organisation_id, name, type } = req.body;

//   const results = [];

// fs.createReadStream(filePath)
//   .pipe(csvParser())
//   .on('data', (row) => {
//     const fat = parseFloat(row['FAT/SNF']?.trim());
//     if (isNaN(fat)) return;

//     // Loop through each SNF column
//     Object.keys(row).forEach((key) => {
//       if (key === 'FAT/SNF') return;

//       const snf = parseFloat(key.trim());
//       const price = parseFloat(row[key].trim());

//       if (!isNaN(snf) && !isNaN(price)) {
//         results.push([fat, snf, price, type, name, created_by, organisation_id]);
//       } else {
//         console.warn(`Skipping cell: FAT=${fat}, SNF=${key}, Value=${row[key]}`);
//       }
//     });
//   })
//   .on('end', async () => {
//     if (results.length === 0) {
//       return res.status(400).json({ message: 'No valid rate records found in CSV' });
//     }

//     try {

//       await db.query(
//           'DELETE FROM rate WHERE organisation_id = ? AND type = ? AND name = ?',
//           [organisation_id, type, name]
//       );

//       await db.query(
//         'INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id) VALUES ?',
//         [results]
//       );
//       res.json({ message: 'Rates uploaded successfully.', inserted: results.length });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: 'Database insert error.' });
//     }
//   });

// };

// const uploadRates = async (req, res) => {
//   const filePath = req.file.path;
//   const { created_by, organisation_id, name, type, effective_date } = req.body;

//   const results = [];

//   fs.createReadStream(filePath)
//     .pipe(csvParser())
//     .on("data", (row) => {
//       const fat = parseFloat(row["FAT/SNF"]?.trim());
//       if (isNaN(fat)) return;

//       Object.keys(row).forEach((key) => {
//         if (key === "FAT/SNF") return;

//         const snf = parseFloat(key.trim());
//         const price = parseFloat(row[key].trim());

//         if (!isNaN(snf) && !isNaN(price)) {
//           results.push([
//             fat,
//             snf,
//             price,
//             type,
//             name,
//             created_by,
//             organisation_id,
//             effective_date || null,
//           ]);
//         }
//       });
//     })
//     .on("end", async () => {
//       if (results.length === 0) {
//         return res
//           .status(400)
//           .json({ message: "No valid rate records found in CSV" });
//       }

//       try {
//         // Remove old rates of same chart
//         await db.query(
//           "DELETE FROM rate WHERE organisation_id=? AND type=? AND name=?",
//           [organisation_id, type, name]
//         );

//         // Insert new rates
//         await db.query(
//           `INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id, effective_date)
//            VALUES ?`,
//           [results]
//         );

//         let updatedCollections = 0;

//         // Update collections only if effective date provided
//         if (effective_date) {
//           // Get all rates for this dairy/type
//           const [rateRows] = await db.query(
//             `SELECT fat, snf, price FROM rate
//              WHERE organisation_id=? AND type=? AND (effective_date=? OR effective_date IS NULL)`,
//             [organisation_id, type, effective_date]
//           );

//           for (const rateRow of rateRows) {
//             const { fat, snf, price } = rateRow;

//             // Update collections (not finalized bills)
//             const [collections] = await db.query(
//               `
//               SELECT c.id
//               FROM collections c
//               LEFT JOIN bills b 
//                 ON c.farmer_id = b.farmer_id
//                 AND c.dairy_id = b.dairy_id
//                 AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
//               WHERE c.dairy_id=? 
//                 AND c.type=? 
//                 AND ROUND(c.fat,1)=? 
//                 AND ROUND(c.snf,1)=? 
//                 AND DATE(c.created_at) <= ?
//                 AND (b.is_finalized IS NULL OR b.is_finalized=0)
//               `,
//               [organisation_id, type, fat, snf, effective_date]
//             );

//             for (const col of collections) {
//               await db.query(`UPDATE collections SET rate=? WHERE id=?`, [
//                 price,
//                 col.id,
//               ]);
//               updatedCollections++;
//             }
//           }

//           // 🟡 Set rate=0 for collections with no matching rate
//           await db.query(
//             `
//             UPDATE collections c
//             LEFT JOIN bills b 
//               ON c.farmer_id = b.farmer_id
//               AND c.dairy_id = b.dairy_id
//               AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
//             LEFT JOIN rate r
//               ON c.dairy_id = r.organisation_id
//               AND c.type = r.type
//               AND ROUND(c.fat,1)=r.fat
//               AND ROUND(c.snf,1)=r.snf
//               AND (r.effective_date=? OR r.effective_date IS NULL)
//             SET c.rate=0
//             WHERE c.dairy_id=? 
//               AND c.type=?
//               AND DATE(c.created_at) <= ?
//               AND (b.is_finalized IS NULL OR b.is_finalized=0)
//               AND r.rate_id IS NULL
//             `,
//             [effective_date, organisation_id, type, effective_date]
//           );
//         }

//         res.json({
//           success: true,
//           message: "Rates uploaded and collections updated successfully",
//           inserted: results.length,
//           updatedCollections,
//           organisation_id,
//           type,
//           name,
//           effective_date: effective_date || null,
//         });
//       } catch (err) {
//         console.error("Error processing rates:", err);
//         res.status(500).json({ message: "Database error", error: err.message });
//       }
//     });
// };

// const uploadRates = async (req, res) => {
//   const filePath = req.file.path;
//   const { created_by, organisation_id, name, type, effective_date } = req.body;

//   const results = [];

//   fs.createReadStream(filePath)
//     .pipe(csvParser())
//     .on("data", (row) => {
//       const fat = parseFloat(row["FAT/SNF"]?.trim());
//       if (isNaN(fat)) return;

//       Object.keys(row).forEach((key) => {
//         if (key === "FAT/SNF") return;

//         const snf = parseFloat(key.trim());
//         const price = parseFloat(row[key].trim());

//         if (!isNaN(snf) && !isNaN(price)) {
//           results.push([
//             fat,
//             snf,
//             price,
//             type,
//             name,
//             created_by,
//             organisation_id,
//             effective_date || null,
//           ]);
//         }
//       });
//     })
//     .on("end", async () => {
//       if (results.length === 0) {
//         return res
//           .status(400)
//           .json({ message: "No valid rate records found in CSV" });
//       }

//       try {
//         // 🔹 Remove old rates for same chart name + type
//         await db.query(
//           "DELETE FROM rate WHERE organisation_id=? AND type=? AND name=?",
//           [organisation_id, type, name]
//         );

//         // 🔹 Insert new rate records
//         await db.query(
//           `INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id, effective_date)
//            VALUES ?`,
//           [results]
//         );

//         let updatedCollections = 0;

//         // 🔹 If effective_date provided → update collections accordingly
//         if (effective_date) {
//           // Step 1️⃣: Fetch unfinalized bills whose period includes the effective date
//           const [unfinalizedBills] = await db.query(
//             `
//             SELECT id, dairy_id, farmer_id, period_start, period_end 
//             FROM bills 
//             WHERE dairy_id=? 
//               AND is_finalized=0 
//               AND ? BETWEEN DATE(period_start) AND DATE(period_end)
//             `,
//             [organisation_id, effective_date]
//           );

//           if (unfinalizedBills.length > 0) {
//             // Step 2️⃣: Get all rate entries for that effective date or null
//             const [rateRows] = await db.query(
//               `
//               SELECT fat, snf, price 
//               FROM rate
//               WHERE organisation_id=? AND type=? 
//                 AND name=? 
//                 AND (effective_date=? OR effective_date IS NULL)
//               `,
//               [organisation_id, type, name, effective_date]
//             );

//             // Step 3️⃣: For each collection in those unfinalized bills, update rate if matched
//             for (const bill of unfinalizedBills) {
//               for (const rateRow of rateRows) {
//                 const { fat, snf, price } = rateRow;

//                 const [affected] = await db.query(
//                   `
//                   UPDATE collections c
//                   SET c.rate = ?
//                   WHERE c.dairy_id=? 
//                     AND c.farmer_id=? 
//                     AND c.type=? 
//                     AND DATE(c.created_at) BETWEEN DATE(?) AND DATE(?)
//                     AND DATE(c.created_at) >= ?
//                     AND ROUND(c.fat,1)=?
//                     AND ROUND(c.snf,1)=?
//                   `,
//                   [
//                     price,
//                     organisation_id,
//                     bill.farmer_id,
//                     type,
//                     bill.period_start,
//                     bill.period_end,
//                     effective_date,
//                     fat,
//                     snf,
//                   ]
//                 );

//                 updatedCollections += affected.affectedRows || 0;
//               }
//             }

//             // Step 4️⃣: Set rate = 0 for unmatched collections (same name/type/date window)
//             await db.query(
//               `
//               UPDATE collections c
//               LEFT JOIN bills b
//                 ON c.dairy_id=b.dairy_id
//                 AND c.farmer_id=b.farmer_id
//                 AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
//               LEFT JOIN rate r
//                 ON c.dairy_id=r.organisation_id
//                 AND c.type=r.type
//                 AND ROUND(c.fat,1)=r.fat
//                 AND ROUND(c.snf,1)=r.snf
//                 AND r.name=?
//                 AND (r.effective_date=? OR r.effective_date IS NULL)
//               SET c.rate=0
//               WHERE c.dairy_id=? 
//                 AND c.type=?
//                 AND DATE(c.created_at)>=?
//                 AND (b.is_finalized=0)
//                 AND r.price IS NULL
//               `,
//               [name, effective_date, organisation_id, type, effective_date]
//             );
//           }
//         }

//         // ✅ Response
//         res.json({
//           success: true,
//           message: "Rates uploaded and collections updated successfully",
//           inserted: results.length,
//           updatedCollections,
//           organisation_id,
//           type,
//           name,
//           effective_date: effective_date || null,
//         });
//       } catch (err) {
//         console.error("Error processing rates:", err);
//         res.status(500).json({
//           message: "Database error while applying new rates",
//           error: err.message,
//         });
//       }
//     });
// };

// const uploadRates = async (req, res) => {
//   const filePath = req.file.path;
//   const { created_by, organisation_id, name, type, effective_date } = req.body;

//   const results = [];

//   fs.createReadStream(filePath)
//     .pipe(csvParser())
//     .on("data", (row) => {
//       const fat = parseFloat(row["FAT/SNF"]?.trim());
//       if (isNaN(fat)) return;

//       Object.keys(row).forEach((key) => {
//         if (key === "FAT/SNF") return;
//         const snf = parseFloat(key.trim());
//         const price = parseFloat(row[key].trim());
//         if (!isNaN(snf) && !isNaN(price)) {
//           results.push([
//             fat,
//             snf,
//             price,
//             type,
//             name,
//             created_by,
//             organisation_id,
//             effective_date || null,
//           ]);
//         }
//       });
//     })
//     .on("end", async () => {
//       if (results.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "No valid rate records found in CSV",
//         });
//       }

//       try {
//         // 1️⃣ Delete previous rates for same chart/type
//         await db.query(
//           `DELETE FROM rate WHERE organisation_id=? AND type=? AND name=?`,
//           [organisation_id, type, name]
//         );

//         // 2️⃣ Insert new rates
//         await db.query(
//           `INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id, effective_date)
//            VALUES ?`,
//           [results]
//         );

//         let updatedCollections = 0;

//         // 3️⃣ Only proceed if effective_date provided
//         if (effective_date) {
//           // 3.1️⃣ Find unfinalized bills that include this date
//           const [unfinalizedBills] = await db.query(
//             `
//             SELECT id, farmer_id, period_start, period_end
//             FROM bills
//             WHERE dairy_id = ?
//               AND is_finalized = 0
//               AND DATE(?) BETWEEN DATE(period_start) AND DATE(period_end)
//             `,
//             [organisation_id, effective_date]
//           );

//           if (unfinalizedBills.length > 0) {
//             // 3.2️⃣ Get all new rates for this name/type
//             const [rateRows] = await db.query(
//               `
//               SELECT fat, snf, price
//               FROM rate
//               WHERE organisation_id=? AND type=? AND name=?
//                 AND (effective_date=? OR effective_date IS NULL)
//               `,
//               [organisation_id, type, name, effective_date]
//             );

//             // 3.3️⃣ Loop through each bill and update its collections
//             for (const bill of unfinalizedBills) {
//               // For every (fat,snf) pair, update matching collections
//               for (const rateRow of rateRows) {
//                 const { fat, snf, price } = rateRow;

//                 const [updateRes] = await db.query(
//                   `
//                   UPDATE collections c
//                   SET c.rate = ?
//                   WHERE c.dairy_id = ?
//                     AND c.farmer_id = ?
//                     AND c.type = ?
//                     AND DATE(c.created_at) BETWEEN DATE(?) AND DATE(?)
//                     AND DATE(c.created_at) >= DATE(?)
//                     AND ROUND(c.fat, 1) = ?
//                     AND ROUND(c.snf, 1) = ?
//                   `,
//                   [
//                     price,
//                     organisation_id,
//                     bill.farmer_id,
//                     type,
//                     bill.period_start,
//                     bill.period_end,
//                     effective_date,
//                     fat,
//                     snf,
//                   ]
//                 );

//                 updatedCollections += updateRes.affectedRows || 0;
//               }

//               // 3.4️⃣ Set rate=0 for collections that didn’t match any new rate
//               const [zeroRes] = await db.query(
//                 `
//                 UPDATE collections c
//                 LEFT JOIN rate r ON 
//                   c.dairy_id = r.organisation_id
//                   AND c.type = r.type
//                   AND ROUND(c.fat,1)=r.fat
//                   AND ROUND(c.snf,1)=r.snf
//                   AND r.name = ?
//                   AND (r.effective_date=? OR r.effective_date IS NULL)
//                 WHERE c.dairy_id = ?
//                   AND c.farmer_id = ?
//                   AND c.type = ?
//                   AND DATE(c.created_at) BETWEEN DATE(?) AND DATE(?)
//                   AND DATE(c.created_at) >= DATE(?)
//                   AND r.price IS NULL
//                 SET c.rate = 0
//                 `,
//                 [
//                   name,
//                   effective_date,
//                   organisation_id,
//                   bill.farmer_id,
//                   type,
//                   bill.period_start,
//                   bill.period_end,
//                   effective_date,
//                 ]
//               );

//               updatedCollections += zeroRes.affectedRows || 0;
//             }
//           }
//         }

//         // ✅ 4️⃣ Final response
//         res.json({
//           success: true,
//           message: "Rates uploaded and previous collections updated successfully",
//           inserted: results.length,
//           updatedCollections,
//           organisation_id,
//           type,
//           name,
//           effective_date: effective_date || null,
//         });
//       } catch (err) {
//         console.error("Error processing rates:", err);
//         res.status(500).json({
//           success: false,
//           message: "Database error while processing rates",
//           error: err.message,
//         });
//       }
//     });
// };

// const uploadRates = async (req, res) => {
//   const filePath = req.file.path;
//   const { created_by, organisation_id, name, type, effective_date } = req.body;

//   const results = [];

//   fs.createReadStream(filePath)
//     .pipe(csvParser())
//     .on("data", (row) => {
//       const fat = parseFloat(row["FAT/SNF"]?.trim());
//       if (isNaN(fat)) return;

//       Object.keys(row).forEach((key) => {
//         if (key === "FAT/SNF") return;
//         const snf = parseFloat(key.trim());
//         const price = parseFloat(row[key].trim());

//         if (!isNaN(snf) && !isNaN(price)) {
//           results.push([
//             fat,
//             snf,
//             price,
//             type,
//             name,
//             created_by,
//             organisation_id,
//             effective_date || null,
//           ]);
//         }
//       });
//     })
//     .on("end", async () => {
//       if (results.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "No valid rate records found in CSV",
//         });
//       }

//       try {
//         // 1️⃣ Delete previous rate chart of same name and type
//         await db.query(
//           "DELETE FROM rate WHERE organisation_id=? AND type=? AND name=?",
//           [organisation_id, type, name]
//         );

//         // 2️⃣ Insert new rate rows
//         await db.query(
//           `INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id, effective_date)
//            VALUES ?`,
//           [results]
//         );

//         let updatedCollections = 0;

//         // 3️⃣ Only run update if effective date exists
//         if (effective_date) {
//           // Fetch all relevant rate entries
//           const [rateRows] = await db.query(
//             `
//             SELECT fat, snf, price
//             FROM rate
//             WHERE organisation_id=? AND type=? AND name=?
//               AND (effective_date=? OR effective_date IS NULL)
//             `,
//             [organisation_id, type, name, effective_date]
//           );

//           // 🔹 Step A: Update collections that belong to *unfinalized bills*
//           const [unfinalizedBills] = await db.query(
//             `
//             SELECT farmer_id, period_start, period_end
//             FROM bills
//             WHERE dairy_id=? 
//               AND is_finalized=0
//               AND DATE(?) BETWEEN DATE(period_start) AND DATE(period_end)
//             `,
//             [organisation_id, effective_date]
//           );

//           // For each unfinalized bill, update its collections after effective date
//           for (const bill of unfinalizedBills) {
//             for (const r of rateRows) {
//               const [res1] = await db.query(
//                 `
//                 UPDATE collections
//                 SET rate=?, amount = quantity * ?
//                 WHERE dairy_id=? AND farmer_id=?
//                   AND type=? 
//                   AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
//                   AND DATE(created_at) >= DATE(?)
//                   AND ROUND(fat,1)=? AND ROUND(snf,1)=?
//                 `,
//                 [
//                   r.price,
//                   r.price,
//                   organisation_id,
//                   bill.farmer_id,
//                   type,
//                   bill.period_start,
//                   bill.period_end,
//                   effective_date,
//                   r.fat,
//                   r.snf,
//                 ]
//               );
//               updatedCollections += res1.affectedRows || 0;
//             }
//           }

//           // 🔹 Step B: Update collections *not belonging to any bill*
//           // (No bill or no finalized bill)
//           for (const r of rateRows) {
//             const [res2] = await db.query(
//               `
//               UPDATE collections c
//               LEFT JOIN bills b 
//                 ON c.dairy_id=b.dairy_id 
//                 AND c.farmer_id=b.farmer_id
//                 AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
//               SET c.rate=?, c.amount = c.quantity * ?
//               WHERE c.dairy_id=? 
//                 AND c.type=? 
//                 AND DATE(c.created_at) >= DATE(?)
//                 AND ROUND(c.fat,1)=? AND ROUND(c.snf,1)=?
//                 AND (b.id IS NULL OR b.is_finalized=0)
//               `,
//               [
//                 r.price,
//                 r.price,
//                 organisation_id,
//                 type,
//                 effective_date,
//                 r.fat,
//                 r.snf,
//               ]
//             );
//             updatedCollections += res2.affectedRows || 0;
//           }

//           // 🔹 Step C: Set rate=0 for unmatched collections
//           const [res3] = await db.query(
//             `
//             UPDATE collections c
//             LEFT JOIN rate r 
//               ON c.dairy_id=r.organisation_id
//               AND c.type=r.type
//               AND ROUND(c.fat,1)=r.fat
//               AND ROUND(c.snf,1)=r.snf
//               AND r.name=? 
//               AND (r.effective_date=? OR r.effective_date IS NULL)
//             LEFT JOIN bills b 
//               ON c.dairy_id=b.dairy_id
//               AND c.farmer_id=b.farmer_id
//               AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
//             SET c.rate=0, c.amount=0
//             WHERE c.dairy_id=? 
//               AND c.type=? 
//               AND DATE(c.created_at) >= DATE(?)
//               AND r.price IS NULL
//               AND (b.id IS NULL OR b.is_finalized=0)
//             `,
//             [name, effective_date, organisation_id, type, effective_date]
//           );
//           updatedCollections += res3.affectedRows || 0;
//         }

//         // ✅ 4️⃣ Send Response
//         res.json({
//           success: true,
//           message:
//             "Rates uploaded successfully and all previous collections updated",
//           inserted: results.length,
//           updatedCollections,
//           organisation_id,
//           type,
//           name,
//           effective_date: effective_date || null,
//         });
//       } catch (err) {
//         console.error("Error processing rates:", err);
//         res.status(500).json({
//           success: false,
//           message: "Database error while processing rate upload",
//           error: err.message,
//         });
//       }
//     });
// };

const uploadRates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const { created_by, organisation_id, name, type, effective_date } = req.body;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    const results = [];

  const processData = async () => {
    if (fileExt === '.csv') {
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (row) => {
            const fat = parseFloat(row["FAT/SNF"]?.trim());
            if (isNaN(fat)) return;

            Object.keys(row).forEach((key) => {
              if (key === "FAT/SNF") return;
              const snf = parseFloat(key.trim());
              const price = parseFloat(row[key].trim());

              if (!isNaN(snf) && !isNaN(price)) {
                results.push([
                  Number(fat.toFixed(1)),
                  Number(snf.toFixed(1)),
                  price,
                  type,
                  name,
                  created_by,
                  organisation_id,
                  effective_date || null,
                ]);
              }
            });
          })
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (fileExt === '.xls' || fileExt === '.xlsx') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const fat = parseFloat(row[0]);
        if (isNaN(fat)) continue;

        for (let j = 1; j < row.length; j++) {
          const snf = parseFloat(headers[j]);
          const price = parseFloat(row[j]);

          if (!isNaN(snf) && !isNaN(price)) {
            results.push([
              Number(fat.toFixed(1)),
              Number(snf.toFixed(1)),
              price,
              type,
              name,
              created_by,
              organisation_id,
              effective_date || null,
            ]);
          }
        }
      }
    }
  };

  try {
    await processData();
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid rate records found in file",
      });
    }

    try {
        // 🧹 Remove old rates with same name/type/org
        await db.query(
          "DELETE FROM rate WHERE organisation_id=? AND type=? AND name=?",
          [organisation_id, type, name]
        );

        // 🧾 Insert new rates
        await db.query(
          `INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id, effective_date)
           VALUES ?`,
          [results]
        );

        let updatedCollections = 0;

        // 🟢 If effective date provided, update relevant collections
        if (effective_date) {
          const [rateRows] = await db.query(
            `
            SELECT fat, snf, price
            FROM rate
            WHERE organisation_id=? AND type=? AND name=?
              AND (effective_date=? OR effective_date IS NULL)
            `,
            [organisation_id, type, name, effective_date]
          );

          const [unfinalizedBills] = await db.query(
            `
            SELECT farmer_id, period_start, period_end
            FROM bills
            WHERE dairy_id=? 
              AND is_finalized=0
              AND DATE(?) BETWEEN DATE(period_start) AND DATE(period_end)
            `,
            [organisation_id, effective_date]
          );

          for (const bill of unfinalizedBills) {
            for (const r of rateRows) {
              const [res1] = await db.query(
                `
                UPDATE collections
                SET rate=?, amount = quantity * ?
                WHERE dairy_id=? AND farmer_id=?
                  AND type=? 
                  AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
                  AND DATE(created_at) >= DATE(?)
                  AND ROUND(fat,1)=ROUND(?,1)
                  AND ROUND(snf,1)=ROUND(?,1)
                `,
                [
                  r.price,
                  r.price,
                  organisation_id,
                  bill.farmer_id,
                  type,
                  bill.period_start,
                  bill.period_end,
                  effective_date,
                  r.fat,
                  r.snf,
                ]
              );
              updatedCollections += res1.affectedRows || 0;
            }
          }

          // 🟡 Update all non-finalized collections outside bill range too
          for (const r of rateRows) {
            const [res2] = await db.query(
              `
              UPDATE collections c
              LEFT JOIN bills b 
                ON c.dairy_id=b.dairy_id 
                AND c.farmer_id=b.farmer_id
                AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
              SET c.rate=?, c.amount = c.quantity * ?
              WHERE c.dairy_id=? 
                AND c.type=? 
                AND DATE(c.created_at) >= DATE(?)
                AND ROUND(c.fat,1)=ROUND(?,1)
                AND ROUND(c.snf,1)=ROUND(?,1)
                AND (b.id IS NULL OR b.is_finalized=0)
              `,
              [
                r.price,
                r.price,
                organisation_id,
                type,
                effective_date,
                r.fat,
                r.snf,
              ]
            );
            updatedCollections += res2.affectedRows || 0;
          }

          // 🟠 Set rate=0 for unmatched combinations
          const [res3] = await db.query(
            `
            UPDATE collections c
            LEFT JOIN rate r 
              ON c.dairy_id=r.organisation_id
              AND c.type=r.type
              AND ROUND(c.fat,1)=ROUND(r.fat,1)
              AND ROUND(c.snf,1)=ROUND(r.snf,1)
              AND r.name=? 
              AND (r.effective_date=? OR r.effective_date IS NULL)
            LEFT JOIN bills b 
              ON c.dairy_id=b.dairy_id
              AND c.farmer_id=b.farmer_id
              AND DATE(c.created_at) BETWEEN DATE(b.period_start) AND DATE(b.period_end)
            SET c.rate=0, c.amount=0
            WHERE c.dairy_id=? 
              AND c.type=? 
              AND DATE(c.created_at) >= DATE(?)
              AND r.price IS NULL
              AND (b.id IS NULL OR b.is_finalized=0)
            `,
            [name, effective_date, organisation_id, type, effective_date]
          );
          updatedCollections += res3.affectedRows || 0;
        }

        res.json({
          success: true,
          message:
            "Rates uploaded successfully and collections updated (fat/snf normalized)",
          inserted: results.length,
          updatedCollections,
          organisation_id,
          type,
          name,
          effective_date: effective_date || null,
        });
      } catch (err) {
        console.error("Error processing rates:", err);
        res.status(500).json({
          success: false,
          message: "Database error while processing rate upload",
          error: err.message,
        });
      }
  } catch (err) {
    console.error("Error reading file:", err);
    return res.status(500).json({
      success: false,
      message: "Error reading uploaded file",
      error: err.message,
    });
  } finally {
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up file:", cleanupErr);
    }
  }
  } catch (err) {
    console.error('Unexpected error in uploadRates:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};



// const getRate = async (req, res) => {
//   const { fat, snf, orgid, name, type, date } = req.query;

//   if (!fat || !snf) {
//     return res.status(400).json({ message: 'Missing fat or snf' });
//   }

//   const fatFloat = parseFloat(fat);
//   const snfFloat = parseFloat(snf);

//   try {
//     const [rows] = await db.query(
//       `SELECT price 
//        FROM rate 
//        WHERE fat BETWEEN ? AND ? 
//          AND snf BETWEEN ? AND ? 
//          AND organisation_id = ?
//          AND name = ?
//          AND type = ?
//        LIMIT 1`,
//       [
//         fatFloat - 0.01, fatFloat + 0.01,
//         snfFloat - 0.01, snfFloat + 0.01,
//         orgid,
//         name,
//         type
//       ]
//     );

//     if (rows.length > 0) {
//       res.json({ price: rows[0].price });
//     } else {
//       res.status(404).json({ message: 'No matching rate found' });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Query failed' });
//   }
// };


const getRate = async (req, res) => {
  const { fat, snf, orgid, name, type, date } = req.query;

  if (!fat || !snf || !date) {
    return res.status(400).json({ message: "Missing fat, snf, or date" });
  }

  const fatFloat = parseFloat(fat);
  const snfFloat = parseFloat(snf);
  const givenDate = new Date(date);

  try {
    // 1️⃣ Fetch nearest matching rate
    const [rows] = await db.query(
      `SELECT price, effective_date 
       FROM rate 
       WHERE organisation_id = ?
         AND name = ?
         AND type = ?
         AND ROUND(fat,1) = ROUND(?,1)
         AND ROUND(snf,1) = ROUND(?,1)
       ORDER BY effective_date DESC
       LIMIT 1`,
      [orgid, name, type, fatFloat, snfFloat]
    );

    if (rows.length === 0) {
      return res.status(404).json({ price: 0, message: "No matching rate found" });
    }

    const rate = rows[0];
    const effectiveDate = rate.effective_date ? new Date(rate.effective_date) : null;

    // 2️⃣ If effective_date > givenDate → not yet effective
    if (effectiveDate && effectiveDate > givenDate) {
      return res.json({
        price: 0,
        message: `Rate not effective until ${effectiveDate.toISOString().split("T")[0]}`,
      });
    }

    // 3️⃣ Return valid price
    res.json({
      price: rate.price,
      effective_date: effectiveDate ? effectiveDate.toISOString().split("T")[0] : null,
    });

  } catch (err) {
    console.error("Error fetching rate:", err);
    res.status(500).json({ message: "Query failed", error: err.message });
  }
};



const getRatename = async (req, res) => {
  const { orgid, type } = req.query;

  if (!orgid) {
    return res.status(400).json({ message: 'Missing org Id' });
  }

  try {
    const [rows] = await db.query(
      `SELECT DISTINCT name 
        FROM rate 
       WHERE organisation_id = ? AND type = ?`,
      [
        orgid,
        type
      ]
    );

    if (rows.length > 0) {
      res.status(200).json({  message: 'Sucess', data: rows });
    } else {
      res.status(404).json({ message: 'No matching record found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Query failed' });
  }
};

async function downloadRateById(req, res) {
  try {
    const { name } = req.query;

    // Fetch one record
    const [rows] = await db.query("SELECT * FROM rate WHERE name = ?", [name]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Rate not found" });
    }

    // Convert JSON → CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(rows);

    // Set headers for CSV download
    res.header("Content-Type", "text/csv");
    res.attachment(`rate_${name}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting rate CSV:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


// async function downloadRateMatrix(req, res) {
//   try {
//     const { organisation_id, type, name } = req.query;

//     if (!organisation_id || !type || !name) {
//       return res.status(400).json({ message: "organisation_id, type, name are required" });
//     }

//     // Fetch all rate rows for this set
//     const [rows] = await db.query(
//       `SELECT fat, snf, price 
//        FROM rate 
//        WHERE organisation_id=? AND type=? AND name=? 
//        ORDER BY fat ASC, snf ASC`,
//       [organisation_id, type, name]
//     );

//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ message: "No rates found" });
//     }

//     // Extract unique FATs & SNFs
//     const fats = [...new Set(rows.map(r => Number(r.fat)))].sort((a, b) => a - b);
//     const snfs = [...new Set(rows.map(r => Number(r.snf)))].sort((a, b) => a - b);

//     // Build header row
//     let csv = "FAT/SNF," + snfs.join(",") + "\n";

//     // Build rows for each FAT
//     fats.forEach(fat => {
//       let line = [fat];
//       snfs.forEach(snf => {
//         const rate = rows.find(r => Number(r.fat) === fat && Number(r.snf) === snf);
//         line.push(rate ? rate.price : "");
//       });
//       csv += line.join(",") + "\n";
//     });

//     // Send as downloadable file
//     res.header("Content-Type", "text/csv");
//     res.attachment(`${name}_${type}_rates.csv`);
//     res.send(csv);
//   } catch (err) {
//     console.error("Error exporting rate CSV:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }

async function downloadRateMatrix(req, res) {
  try {
    const { organisation_id, type, name } = req.query;

    if (!organisation_id || !type || !name) {
      return res.status(400).json({ message: "organisation_id, type, name are required" });
    }

    // Fetch rates
    const [rows] = await db.query(
      `SELECT fat, snf, price 
       FROM rate 
       WHERE organisation_id=? AND type=? AND name=? 
       ORDER BY fat ASC, snf ASC`,
      [organisation_id, type, name]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No rates found" });
    }

    // Get unique FATs and SNFs
    const fats = [...new Set(rows.map(r => Number(r.fat)))].sort((a, b) => a - b);
    const snfs = [...new Set(rows.map(r => Number(r.snf)))].sort((a, b) => a - b);

    // Build CSV header
    let csv = "FAT/SNF," + snfs.join(",") + "\n";

    // Build each FAT row
    fats.forEach(fat => {
      let line = [fat];
      snfs.forEach(snf => {
        const rate = rows.find(r => Number(r.fat) === fat && Number(r.snf) === snf);
        line.push(rate ? rate.price : "");
      });
      csv += line.join(",") + "\n";
    });

    // Send as file
    res.header("Content-Type", "text/csv");
    res.attachment(`${name}_${type}_rates.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting rate CSV:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function previewRateMatrix(req, res) {
  try {
    const { organisation_id, type, name } = req.query;

    if (!organisation_id || !type || !name) {
      return res.status(400).json({ message: "organisation_id, type, name are required" });
    }

    // Fetch rates
    const [rows] = await db.query(
      `SELECT fat, snf, price 
       FROM rate 
       WHERE organisation_id=? AND type=? AND name=? 
       ORDER BY fat ASC, snf ASC`,
      [organisation_id, type, name]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No rates found" });
    }

    // Extract unique FATs and SNFs
    const fats = [...new Set(rows.map(r => Number(r.fat)))].sort((a, b) => a - b);
    const snfs = [...new Set(rows.map(r => Number(r.snf)))].sort((a, b) => a - b);

    // Build JSON matrix
    const matrix = [];
    const header = ["FAT/SNF", ...snfs];
    matrix.push(header);

    fats.forEach(fat => {
      let row = [fat];
      snfs.forEach(snf => {
        const rate = rows.find(r => Number(r.fat) === fat && Number(r.snf) === snf);
        row.push(rate ? rate.price : "");
      });
      matrix.push(row);
    });

    // Respond with JSON preview
    res.json({ success: true, name, type, organisation_id, matrix });
  } catch (err) {
    console.error("Error previewing rate matrix:", err);
    res.status(500).json({ message: "Server error" });
  }
}


module.exports = {
    uploadRates,
    getRate,
    getRatename,
    downloadRateById,
    downloadRateMatrix,
    previewRateMatrix
};