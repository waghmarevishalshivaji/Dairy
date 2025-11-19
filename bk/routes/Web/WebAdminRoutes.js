const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../../controllers/Web/WebAdminController');

// GET /api/web/admin/users
router.get('/users', getAllUsers);

module.exports = router;
