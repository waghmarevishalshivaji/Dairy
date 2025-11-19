const express = require('express');
const router = express.Router();
const { createVLCCommission, createVLCTS } = require('../../controllers/Web/WebBillingController');

// POST /api/web/billing/vlc-commission
router.post('/vlc-commission', createVLCCommission);

// POST /api/web/billing/vlc-ts
router.post('/vlc-ts', createVLCTS);

module.exports = router;
