const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/collection-report', reportController.getTodaysCollectionreport);
router.get('/shift-collection-report', reportController.getDailyShiftReport);
router.get('/getFarmerReport', reportController.getFarmerReport);
router.get('/getDairyReport', reportController.getDairyReport);

module.exports = router;
