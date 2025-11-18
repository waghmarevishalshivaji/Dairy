const express = require('express');
const router = express.Router();
const { createVLCEntry } = require('../../controllers/Web/WebCollectionController');

// POST /api/web/collection/vlc-entry
router.post('/vlc-entry', createVLCEntry);

module.exports = router;
