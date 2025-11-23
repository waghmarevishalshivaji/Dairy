const express = require('express');
const router = express.Router();
const { createVLCCommission, createVLCTS, upsertBill, getBillDetails } = require('../../controllers/Web/WebBillingController');

// POST /api/web/billing/vlc-commission
router.post('/vlc-commission', createVLCCommission);

// POST /api/web/billing/vlc-ts
router.post('/vlc-ts', createVLCTS);

// POST /api/web/billing/upsert-bill
router.post('/upsert-bill', upsertBill);

// GET /api/web/billing/bill-details?dairy_id=1&period_start=2025-11-01&period_end=2025-11-10
router.get('/bill-details', getBillDetails);

module.exports = router;
