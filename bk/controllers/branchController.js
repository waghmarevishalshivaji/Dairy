const db = require('../config/db');
const bcrypt = require('bcryptjs');


function generateUniqueTimeNumber() {
    return Date.now();
}

// async function createDairy(req, res) {
//     const { name, branchname, ownername, days, villagename, address, password, mobile_number, role } = req.body;

//     let mgrname = branchname+"_"+generateUniqueTimeNumber();
    
//      let rolemgr = 'Dairymgr'
//     if (!name || !password || !branchname || !ownername || !mobile_number) {
//         return res.status(400).json({ message: "All fields are required" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
   
//     try {

//         const [existingUser] = await db.execute('SELECT * FROM users WHERE mobile_number = ?', [mobile_number]);

//         console.log(existingUser)

//         if (existingUser.length > 0) {

//             const dairyresult = await db.execute(
//                 'INSERT INTO dairy (name, branchname, ownername, days, villagename, address, password, createdby) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//                 [name, branchname, ownername, days, villagename, address, hashedPassword, existingUser[0]['id']]
//             );

//             const result1 =  await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [
//                 mgrname, hashedPassword, rolemgr, 
//             ]);

           
//             const dairyuser =  await db.execute('INSERT INTO userDairy (user_id, dairy_id, role) VALUES (?, ?, ?)', [
//                 result1[0]['insertId'], dairyresult[0]['insertId'], rolemgr, 
//             ]);

//             const [userdata] = await db.execute('SELECT * FROM users WHERE id = ?', [result1[0]['insertId']]);

//             userdata.pass = password

//             res.status(201).json({ message: 'Dairy record created successfully', data : userdata });

//         }else{

            
//             const result =  await db.execute('INSERT INTO users (username, password, mobile_number, role) VALUES (?, ?, ?, ?)', [
//                 ownername, hashedPassword, mobile_number, role, 
//             ]);

//             const result1 =  await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [
//                 mgrname, hashedPassword, rolemgr, 
//             ]);

            
//             const dairyresult = await db.execute(
//                 'INSERT INTO dairy (name, branchname, ownername, days, villagename, address, password, createdby) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//                 [name, branchname, ownername, days, villagename, address, hashedPassword, result[0]['insertId']]
//             );

//             const dairyuser =  await db.execute('INSERT INTO userDairy (user_id, dairy_id, role) VALUES (?, ?, ?)', [
//                 result1[0]['insertId'], dairyresult[0]['insertId'], rolemgr, 
//             ]);

//             const [userdata] = await db.execute('SELECT * FROM users WHERE id = ?', [result1[0]['insertId']]);
//             userdata.pass = password
//             res.status(201).json({ message: 'Dairy record created successfully', data : userdata });

//         }
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

async function createDairy(req, res) {
  const { name, branchname, ownername, days, villagename, address, password, mobile_number, role } = req.body;

  let rolemgr = 'Dairymgr';
  if (!name || !password || !branchname || !ownername || !mobile_number) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // ---- Generate Manager Username ----
    const [rows] = await db.execute(
      `SELECT username FROM users WHERE role = ? ORDER BY id DESC LIMIT 1`,
      [rolemgr]
    );

    let nextNumber = 1;
    if (rows.length > 0) {
      // Extract last number part (e.g. "00005")
      const lastUsername = rows[0].username.replace(/\D/g, ""); // keep only digits
      if (lastUsername) {
        nextNumber = parseInt(lastUsername) + 1;
      }
    }

    const mgrname = String(nextNumber).padStart(5, "0"); // e.g. "00001"

    // ---- Check existing user by mobile ----
    const [existingUser] = await db.execute(
      'SELECT * FROM users WHERE mobile_number = ?',
      [mobile_number]
    );

    let ownerId;
    if (existingUser.length > 0) {
      ownerId = existingUser[0]['id'];
    } else {
      const [ownerResult] = await db.execute(
        'INSERT INTO users (username, password, mobile_number, role) VALUES (?, ?, ?, ?)',
        [ownername, hashedPassword, mobile_number, role]
      );
      ownerId = ownerResult.insertId;
    }

    // ---- Create Dairy ----
    const [dairyresult] = await db.execute(
      'INSERT INTO dairy (name, branchname, ownername, days, villagename, address, password, createdby) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, branchname, ownername, days, villagename, address, hashedPassword, ownerId]
    );

    // ---- Create Manager User ----
    const [mgrResult] = await db.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [mgrname, hashedPassword, rolemgr]
    );

    // ---- Map user to dairy ----
    await db.execute(
      'INSERT INTO userDairy (user_id, dairy_id, role) VALUES (?, ?, ?)',
      [mgrResult.insertId, dairyresult.insertId, rolemgr]
    );

    // ---- Fetch user ----
    const [userdata] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [mgrResult.insertId]
    );
    userdata[0].pass = password;

    res.status(201).json({
      message: 'Dairy record created successfully',
      data: userdata[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


async function getDairies(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM dairy');

        if (rows.length === 0) {
        return res.status(404).json({ message: 'No dairy records found' });
        }

        res.status(200).json({ dairies: rows });
    } catch (err) {
        console.error('Error fetching dairies:', err);
        res.status(500).json({ message: 'Server error' });
    }
}




async function getDairyById(req, res) {

    console.log("test")
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Dairy ID is required' });
    }

    try {
        // const [rows] = await db.execute('SELECT * FROM dairy WHERE id = ?', [id]);

        const [rows] = await db.execute(`
            SELECT 
                d.*, 
                u.*
            FROM dairy d
            LEFT JOIN users u ON d.createdby = u.id
            WHERE d.id = ?
            `, [id]);


        if (rows.length === 0) {
        return res.status(404).json({ message: 'Dairy record not found' });
        }

        res.status(200).json({ dairy: rows[0] });
    } catch (err) {
        console.error('Error fetching dairy by ID:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function updateDairy(req, res) {
    const { dairy_id, address, ownername, updatedby } = req.body;

    if (!dairy_id || !address || !ownername || !updatedby) {
        return res.status(400).json({ message: 'Dairy ID, address, owner name, and updatedby are required' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM dairy WHERE id = ?', [dairy_id]);

        if (rows.length === 0) {
        return res.status(400).json({ message: 'Dairy not found' });
        }

        const [updateResult] = await db.execute(
        'UPDATE dairy SET address = ?, ownername = ?, updatedby = ?, updated_date = CURRENT_TIMESTAMP WHERE id = ?',
        [address, ownername, updatedby, dairy_id]
        );

        if (updateResult.affectedRows === 0) {
        return res.status(400).json({ message: 'Failed to update dairy' });
        }

        res.status(200).json({ message: 'Dairy updated successfully' });

    } catch (err) {
        console.error('Error updating dairy:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/dairy/:id
async function updateDairydetails(req, res) {
    const { id } = req.params;  // dairy id from URL
    const { 
        name, 
        branchname, 
        ownername, 
        days, 
        villagename, 
        address 
    } = req.body;

    try {
        // Build update query dynamically (only update passed fields)
        let updates = [];
        let params = [];

        if (name) {
            updates.push("name = ?");
            params.push(name);
        }
        if (branchname) {
            updates.push("branchname = ?");
            params.push(branchname);
        }
        if (ownername) {
            updates.push("ownername = ?");
            params.push(ownername);
        }
        if (days !== undefined) {
            updates.push("days = ?");
            params.push(days);
        }
        if (villagename) {
            updates.push("villagename = ?");
            params.push(villagename);
        }
        if (address) {
            updates.push("address = ?");
            params.push(address);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        params.push(id);

        const query = `
            UPDATE dairy
            SET ${updates.join(", ")}
            WHERE id = ?
        `;

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Dairy not found" });
        }

        res.status(200).json({
            success: true,
            message: "Dairy updated successfully",
        });

    } catch (err) {
        console.error("Error updating dairy:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


async function deleteDairy(req, res) {
    const { dairy_id } = req.params;

    if (!dairy_id) {
        return res.status(400).json({ message: 'Dairy ID is required' });
    }

    try {
        const [deleteResult] = await db.execute('DELETE FROM dairy WHERE id = ?', [dairy_id]);

        if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Dairy not found' });
        }

        res.status(200).json({ message: 'Dairy deleted successfully' });

    } catch (err) {
        console.error('Error deleting dairy:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

  
async function toggleDairyActive(req, res) {
    const { dairy_id } = req.params;
    const { active } = req.body; // Expected true or false

    if (typeof active !== 'boolean') {
        return res.status(400).json({ message: 'Active status must be a boolean' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM dairy WHERE id = ?', [dairy_id]);

        if (rows.length === 0) {
        return res.status(404).json({ message: 'Dairy not found' });
        }

        const [updateResult] = await db.execute(
        'UPDATE dairy SET active = ?, updated_date = CURRENT_TIMESTAMP WHERE id = ?',
        [active, dairy_id]
        );

        if (updateResult.affectedRows === 0) {
        return res.status(400).json({ message: 'Failed to update dairy status' });
        }

        res.status(200).json({ message: 'Dairy status updated successfully' });

    } catch (err) {
        console.error('Error toggling dairy active status:', err);
        res.status(500).json({ message: 'Server error' });
    }
}


module.exports = {
    createDairy,
    getDairies,
    getDairyById,
    updateDairy,
    deleteDairy,
    toggleDairyActive,
    updateDairydetails
};