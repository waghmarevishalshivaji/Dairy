const express = require('express');
const router = express.Router();
const { createWebUser } = require('../controllers/webUserController');

// POST /api/web-users/create
router.post('/create', createWebUser);

module.exports = router;
