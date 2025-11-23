const express = require('express');
const router = express.Router();
const webReportsController = require('../controllers/webReportsController');

// GET /api/webreports/collections?dairy_id=1&milk_type=Cow&shift=Morning&from=2025-11-01&to=2025-11-30
router.get('/collections', webReportsController.getCollectionsReport);

module.exports = router;
