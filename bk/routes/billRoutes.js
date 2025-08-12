const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.get('/bill-download', billController.downloadBill);

module.exports = router;
