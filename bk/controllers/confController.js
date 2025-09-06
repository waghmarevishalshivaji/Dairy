const db = require('../config/db');
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' }); // File will be temporarily stored in 'uploads/'
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require("json2csv");


// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',  // Folder to temporarily store uploaded files
    limits: { fileSize: 10 * 1024 * 1024 }  // Limit to 10MB file size
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

const uploadRates = async (req, res) => {
  const filePath = req.file.path;
  const { created_by, organisation_id, name, type } = req.body;

  const results = [];

fs.createReadStream(filePath)
  .pipe(csvParser())
  .on('data', (row) => {
    const fat = parseFloat(row['FAT/SNF']?.trim());
    if (isNaN(fat)) return;

    // Loop through each SNF column
    Object.keys(row).forEach((key) => {
      if (key === 'FAT/SNF') return;

      const snf = parseFloat(key.trim());
      const price = parseFloat(row[key].trim());

      if (!isNaN(snf) && !isNaN(price)) {
        results.push([fat, snf, price, type, name, created_by, organisation_id]);
      } else {
        console.warn(`Skipping cell: FAT=${fat}, SNF=${key}, Value=${row[key]}`);
      }
    });
  })
  .on('end', async () => {
    if (results.length === 0) {
      return res.status(400).json({ message: 'No valid rate records found in CSV' });
    }

    try {

      await db.query(
          'DELETE FROM rate WHERE organisation_id = ? AND type = ? AND name = ?',
          [organisation_id, type, name]
      );

      await db.query(
        'INSERT INTO rate (fat, snf, price, type, name, created_by, organisation_id) VALUES ?',
        [results]
      );
      res.json({ message: 'Rates uploaded successfully.', inserted: results.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database insert error.' });
    }
  });

};


const getRate = async (req, res) => {
  const { fat, snf, orgid, name } = req.query;

  if (!fat || !snf) {
    return res.status(400).json({ message: 'Missing fat or snf' });
  }

  const fatFloat = parseFloat(fat);
  const snfFloat = parseFloat(snf);

  try {
    const [rows] = await db.query(
      `SELECT price 
       FROM rate 
       WHERE fat BETWEEN ? AND ? 
         AND snf BETWEEN ? AND ? 
         AND organisation_id = ?
         AND name = ?
       LIMIT 1`,
      [
        fatFloat - 0.01, fatFloat + 0.01,
        snfFloat - 0.01, snfFloat + 0.01,
        orgid,
        name
      ]
    );

    if (rows.length > 0) {
      res.json({ price: rows[0].price });
    } else {
      res.status(404).json({ message: 'No matching rate found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Query failed' });
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
    res.attachment(`rate_${id}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting rate CSV:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


module.exports = {
    uploadRates,
    getRate,
    getRatename,
    downloadRateById
};