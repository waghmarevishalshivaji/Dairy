const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../../controllers/Web/WebSettingsController');

// POST /api/web/settings/get
router.post('/get', getSettings);

// POST /api/web/settings/update
router.post('/update', updateSettings);

module.exports = router;
