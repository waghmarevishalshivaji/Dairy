const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/collection-report', reportController.getTodaysCollectionreport);

module.exports = router;
