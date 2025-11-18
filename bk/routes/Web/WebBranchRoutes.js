const express = require('express');
const router = express.Router();
const { getBranchByMobile } = require('../../controllers/Web/WebBranchController');

// POST /web/branches/by-mobile
router.post('/by-mobile', getBranchByMobile);

module.exports = router;
