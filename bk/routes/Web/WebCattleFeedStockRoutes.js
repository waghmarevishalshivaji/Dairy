const express = require('express');
const router = express.Router();
const { upsertCattleFeedStock, getCattleFeedStock } = require('../../controllers/Web/WebCattleFeedStockController');

router.post('/upsert', upsertCattleFeedStock);
router.get('/get', getCattleFeedStock);

module.exports = router;
