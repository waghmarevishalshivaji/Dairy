const express = require('express');
const router = express.Router();
const { createVLCEntry, getVLCEntries } = require('../../controllers/Web/WebCollectionController');

// POST /api/web/collection/vlc-entry
router.post('/vlc-entry', createVLCEntry);

// POST /api/web/collection/vlc-entries
router.post('/vlc-entries', getVLCEntries);

module.exports = router;
