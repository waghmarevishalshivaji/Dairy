const db = require('../config/db');
const bcrypt = require('bcryptjs');


// Create new collection
async function createCollection(req, res) {
    const { farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO collections (farmer_id, dairy_id,  type, quantity, fat, snf, clr, rate, shift)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [farmer_id, dairy_id, type, quantity, fat, snf, clr, rate, shift]
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
        const [rows] = await db.execute('SELECT * FROM collections WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Collection not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error fetching collection:', err);
        res.status(500).json({ message: 'Server error' });
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
    createCollection,
    getCollections,
    getCollectionById,
    updateCollection,
    deleteCollection
};
