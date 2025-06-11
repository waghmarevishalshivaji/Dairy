const express = require('express');
const router = express.Router();
const orgController = require('../controllers/branchController');

router.post('/create', orgController.createDairy);
router.get('/get', orgController.getDairies);
router.post('/update', orgController.getDairyById);

module.exports = router;