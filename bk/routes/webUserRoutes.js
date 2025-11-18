const express = require('express');
const router = express.Router();
const { createWebUser, loginWebUser, setPassword, updateBranches } = require('../controllers/webUserController');

// POST /api/web-users/create
router.post('/create', createWebUser);

// POST /api/web-users/login
router.post('/login', loginWebUser);

// POST /api/web-users/set-password
router.post('/set-password', setPassword);

// POST /api/web-users/update-branches
router.post('/update-branches', updateBranches);

module.exports = router;
