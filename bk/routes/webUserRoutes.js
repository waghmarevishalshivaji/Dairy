const express = require('express');
const router = express.Router();
const { createWebUser, loginWebUser, setPassword } = require('../controllers/webUserController');

// POST /api/web-users/create
router.post('/create', createWebUser);

// POST /api/web-users/login
router.post('/login', loginWebUser);

// POST /api/web-users/set-password
router.post('/set-password', setPassword);

module.exports = router;
