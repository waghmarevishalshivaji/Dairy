const db = require('../config/db');

async function createRole(req, res) {
  const { roleName } = req.body;

  if (!roleName) {
    return res.status(400).json({ message: "Role name is required" });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO roles (role_name) VALUES (?)',
      [roleName]
    );
    res.status(201).json({ message: 'Role created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// async function getTodaysCollection(req, res) {
//     let { shift, dairy_id, date  } = req.query;

//     try {

//         let query = `
//             SELECT 
//                 SUM(quantity) AS total_quantity,
//                 ROUND(AVG(fat), 2) AS avg_fat,
//                 ROUND(AVG(snf), 2) AS avg_snf,
//                 ROUND(AVG(clr), 2) AS avg_clr
//             FROM collections
//             WHERE DATE(created_at) = ?
//         `;


//         const params = [];

//          // Date filter — if not given, default to current date
//         if (date) {
//             params.push(date); // expecting YYYY-MM-DD format
//         } else {
//             const today = new Date();
//             params.push(today.toISOString().slice(0, 10)); // YYYY-MM-DD
//         }

//         if (shift) {
//             query += ` AND shift = ?`;
//             params.push(shift);
//         }

//         if (dairy_id) {
//             query += ` AND dairy_id = ?`;
//             params.push(dairy_id);
//         }

//         const [rows] = await db.execute(query, params);


//         if (!rows || rows.length === 0 || rows[0].total_quantity === null) {
//             return res.status(200).json({ success: true, message: 'No data for today', data: {} });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Today’s collection fetched successfully',
//             data: rows[0],
//         });
//     } catch (err) {
//         console.error('Error fetching today’s collection:', err);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// }

async function getTodaysCollectionreport(req, res) {
    let { shift, dairy_id, date } = req.query;

    try {
        // Query records
        let detailQuery = `
            SELECT 
                type,
                quantity,
                fat,
                snf,
                amount
            FROM collections
            WHERE DATE(created_at) = ?
        `;

        const params = [];

        // Date filter
        if (date) {
            params.push(date);
        } else {
            const today = new Date();
            params.push(today.toISOString().slice(0, 10));
        }

        if (shift) {
            detailQuery += ` AND shift = ?`;
            params.push(shift);
        }

        if (dairy_id) {
            detailQuery += ` AND dairy_id = ?`;
            params.push(dairy_id);
        }

        const [rows] = await db.execute(detailQuery, params);

        if (!rows || rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No data for today',
                data: { records: [], summary: {} }
            });
        }

        // Assign Code based on FAT + SNF
        const records = rows.map((row, index) => {
            let code = "005"; // default

            if (row.fat < 3.8 || row.snf < 8.2) {
                code = "001";
            } else if (row.fat >= 3.8 && row.fat < 4.0 && row.snf >= 8.2 && row.snf < 8.5) {
                code = "002";
            } else if (row.fat >= 4.0 && row.fat < 4.2 && row.snf >= 8.5 && row.snf < 8.7) {
                code = "003";
            } else if (row.fat >= 4.2 && row.snf >= 8.7) {
                code = "004";
            }

            return {
                code,
                type: row.type,
                quantity: parseFloat(row.quantity),
                fat: parseFloat(row.fat),
                snf: parseFloat(row.snf),
                amount: parseFloat(row.amount)
            };
        });

        // Summary calculation
        const total_quantity = records.reduce((sum, r) => sum + r.quantity, 0);
        const avg_fat = records.reduce((sum, r) => sum + r.fat * r.quantity, 0) / total_quantity;
        const avg_snf = records.reduce((sum, r) => sum + r.snf * r.quantity, 0) / total_quantity;
        const total_amount = records.reduce((sum, r) => sum + r.amount, 0);

        const summary = {
            total_quantity: total_quantity.toFixed(1),
            avg_fat: avg_fat.toFixed(1),
            avg_snf: avg_snf.toFixed(1),
            total_amount: total_amount.toFixed(2)
        };

        res.status(200).json({
            success: true,
            message: "Today’s collection fetched successfully",
            data: {
                records,
                summary
            }
        });

    } catch (err) {
        console.error("Error fetching today’s collection:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


module.exports = {
    createRole,
    getTodaysCollectionreport
};