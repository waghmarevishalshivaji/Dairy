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

module.exports = {
    createRole,
};