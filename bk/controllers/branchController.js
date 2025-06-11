const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function createDairy(req, res) {
    const { name, branchname, ownername, days, villagename, address, password } = req.body;

    if (!name || !password || !createdby) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {

        await db.execute('INSERT INTO users (username, password, mobile_number, role) VALUES (?, ?, ?, ?, ?)', [
            ownername, hashedPassword, mobile_number, role
          ]);

        const [result] = await db.execute(
        'INSERT INTO dairy (name, branchname, ownername, days, villagename, address, password, createdby) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, branchname, ownername, days, villagename, address, hashedPassword, createdby]
        );



        res.status(201).json({ message: 'Dairy record created successfully' });
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
    const { dairy_id } = req.params;

    if (!dairy_id) {
        return res.status(400).json({ message: 'Dairy ID is required' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM dairy WHERE id = ?', [dairy_id]);

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
    toggleDairyActive
};