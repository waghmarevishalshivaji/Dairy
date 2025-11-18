const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../../controllers/Web/WebDashboardController');

// POST /api/web/dashboard/data
router.post('/data', getDashboardData);

module.exports = router;
