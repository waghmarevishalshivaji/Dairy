const db = require('../config/db');
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' }); // File will be temporarily stored in 'uploads/'
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');


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

async function createrate (req, res) {
const csvFilePath = path.join(__dirname, req.file.path);
const organisation_id = req.body.organisation_id; // from the frontend form
const created_by = req.body.created_by; // from the frontend form

// Parse the CSV file and insert into the database
const results = [];

 fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on('data', (data) => {
    // Add organisation_id and created_by to the parsed data
    data.organisation_id = organisation_id;
    data.created_by = created_by;
    results.push(data);
    })
    .on('end', async ()  =>  {

        // Prepare the data for insertion using map
        const values = results.map(record => [
            record.fat,
            record.snf,
            record.type,
            record.created_by,
            record.organisation_id,
            record.price
        ]);

        try {
            // Perform the batch insert
            const [result] = await db.execute(
            'INSERT INTO rate (fat, snf, type, created_by, organisation_id, price) VALUES ?',
            [values]
            );

            // Respond with success message
            res.status(201).json({ message: 'Rates created successfully', data: result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }



    // After parsing, insert the data into the MySQL database

    // const [result] = await db.execute(
    //   'INSERT INTO rate (fat, snf, type, created_by, organisation_id, price) VALUES (?, ?, ?, ?, ?, ?)',
    //   [orgName, orgDetails, address]
    // );
    // res.status(201).json({ message: 'Organization created successfully' });

    // const insertQuery = `
    //     INSERT INTO rate (fat, snf, type, created_by, organisation_id, price)
    //     VALUES ?
    // `;

    // const values = results.map(row => [
    //     row.fat,
    //     row.snf,
    //     row.type,
    //     row.created_by,
    //     row.organisation_id,
    //     row.price
    // ]);

    // pool.query(insertQuery, [values], (err, result) => {
    //     if (err) {
    //     console.error('Error inserting data:', err);
    //     return res.status(500).json({ message: 'Error inserting data', error: err });
    //     }

    //     // Delete the uploaded file after processing
    //     fs.unlinkSync(csvFilePath);

    //     // Send success response
    //     res.status(200).json({ message: 'Data uploaded successfully', data: result });
    // });
    });
};

// async function getOrganizations(req, res) {
//   try {
//     // Fetch all organizations from the database
//     const [rows] = await db.execute('SELECT * FROM organizations');

//     if (rows.length === 0) {
//       return res.status(404).json({ message: 'No organizations found' });
//     }

//     // Return organizations list
//     res.status(200).json({ organizations: rows });
//   } catch (err) {
//     console.error('Error fetching organizations:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// }


// async function updateOrganization(req, res) {
//   const { organization_id, address } = req.body;

//   // Validate input
//   if (!organization_id || !address) {
//     return res.status(400).json({ message: 'Organization ID and address are required' });
//   }

//   try {
//     // Query the database to find the organization by ID
//     const [rows] = await db.execute('SELECT * FROM organization WHERE id = ?', [organization_id]);

//     if (rows.length === 0) {
//       return res.status(400).json({ message: 'Organization not found' });
//     }

//     // Update the organization's address
//     const [updateResult] = await db.execute(
//       'UPDATE organization SET address = ? WHERE id = ?',
//       [address, organization_id]
//     );

//     if (updateResult.affectedRows === 0) {
//       return res.status(400).json({ message: 'Failed to update organization' });
//     }

//     // Return a success response
//     res.status(200).json({ message: 'Organization updated successfully' });

//   } catch (err) {
//     console.error('Error updating organization:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// }

module.exports = {
    createrate
};