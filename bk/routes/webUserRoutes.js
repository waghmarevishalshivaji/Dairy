const express = require('express');
const router = express.Router();
const { createWebUser, loginWebUser, setPassword, updateBranches, getPriority, updatePriority } = require('../controllers/webUserController');

// POST /api/web-users/create
router.post('/create', createWebUser);

// POST /api/web-users/login
router.post('/login', loginWebUser);

// POST /api/web-users/set-password
router.post('/set-password', setPassword);

// POST /api/web-users/update-branches
router.post('/update-branches', updateBranches);

// GET /api/web-users/priority/:userId
router.get('/priority/:userId', getPriority);

// PUT /api/web-users/priority
router.put('/priority', updatePriority);

module.exports = router;
