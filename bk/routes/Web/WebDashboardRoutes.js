const express = require('express');
const router = express.Router();
const { getDashboardData, getCollectionsSummary, getFarmerCollections } = require('../../controllers/Web/WebDashboardController');

// POST /api/web/dashboard/data
router.post('/data', getDashboardData);

// POST /api/web/dashboard/collections
router.post('/collections', getCollectionsSummary);

// POST /api/web/dashboard/farmer-collections
router.post('/farmer-collections', getFarmerCollections);

module.exports = router;
