const express = require('express');
const router = express.Router();
const { getDashboardData, getCollectionsSummary } = require('../../controllers/Web/WebDashboardController');

// POST /api/web/dashboard/data
router.post('/data', getDashboardData);

// POST /api/web/dashboard/collections
router.post('/collections', getCollectionsSummary);

module.exports = router;
