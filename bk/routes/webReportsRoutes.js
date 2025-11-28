const express = require('express');
const router = express.Router();
const webReportsController = require('../controllers/webReportsController');

// GET /api/webreports/collections?dairy_id=1&milk_type=Cow&shift=Morning&from=2025-11-01&to=2025-11-30
router.get('/collections', webReportsController.getCollectionsReport);

// GET /api/webreports/vlc-difference?dairy_id=1&vlc_id=VLC001&from=2025-11-01&to=2025-11-30&shift=Morning
router.get('/vlc-difference', webReportsController.getVLCDifferenceReport);

// GET /api/webreports/farmer-balances?dairy_id=1&date=2025-11-23
router.get('/farmer-balances', webReportsController.getFarmerRemainingBalances);

// GET /api/webreports/vlc-commission?vlc_id=500001&start_date=2025-11-01&end_date=2025-11-30
router.get('/vlc-commission', webReportsController.getVLCCommissionReport);

// GET /api/webreports/farmer-wise-collection?dairy_id=1&from=2025-11-01&to=2025-11-30&farmer_id=F001 (farmer_id optional)
router.get('/farmer-wise-collection', webReportsController.getFarmerWiseCollectionReport);

module.exports = router;
