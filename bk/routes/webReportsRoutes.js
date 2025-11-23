const express = require('express');
const router = express.Router();
const webReportsController = require('../controllers/webReportsController');

// GET /api/webreports/collections?dairy_id=1&milk_type=Cow&shift=Morning&from=2025-11-01&to=2025-11-30
router.get('/collections', webReportsController.getCollectionsReport);

// GET /api/webreports/vlc-difference?dairy_id=1&vlc_id=VLC001&from=2025-11-01&to=2025-11-30&shift=Morning
router.get('/vlc-difference', webReportsController.getVLCDifferenceReport);

module.exports = router;
