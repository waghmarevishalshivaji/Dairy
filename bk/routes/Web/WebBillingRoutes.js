const express = require('express');
const router = express.Router();
const { createVLCCommission, createVLCTS, upsertBill } = require('../../controllers/Web/WebBillingController');

// POST /api/web/billing/vlc-commission
router.post('/vlc-commission', createVLCCommission);

// POST /api/web/billing/vlc-ts
router.post('/vlc-ts', createVLCTS);

// POST /api/web/billing/upsert-bill
router.post('/upsert-bill', upsertBill);

module.exports = router;
