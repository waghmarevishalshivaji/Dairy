const db = require('../config/db');
async function createOrganization(req, res) {
  const { orgName, orgDetails, address } = req.body;

  if (!orgName || !orgDetails) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO organizations (org_name, org_details, address) VALUES (?, ?, ?)',
      [orgName, orgDetails, address]
    );
    res.status(201).json({ message: 'Organization created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getOrganizations(req, res) {
  try {
    // Fetch all organizations from the database
    const [rows] = await db.execute('SELECT * FROM organizations');

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No organizations found' });
    }

    // Return organizations list
    res.status(200).json({ organizations: rows });
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


async function updateOrganization(req, res) {
  const { organization_id, address } = req.body;

  // Validate input
  if (!organization_id || !address) {
    return res.status(400).json({ message: 'Organization ID and address are required' });
  }

  try {
    // Query the database to find the organization by ID
    const [rows] = await db.execute('SELECT * FROM organization WHERE id = ?', [organization_id]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    // Update the organization's address
    const [updateResult] = await db.execute(
      'UPDATE organization SET address = ? WHERE id = ?',
      [address, organization_id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update organization' });
    }

    // Return a success response
    res.status(200).json({ message: 'Organization updated successfully' });

  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
    createOrganization,
    getOrganizations,
    updateOrganization
};