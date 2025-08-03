const express = require('express');
const router = express.Router();
const orgController = require('../controllers/branchController');

router.post('/create', orgController.createDairy);
router.get('/:id', orgController.getDairyById);
router.get('/get', orgController.getDairies);
// router.get('/:id', orgController.getDairyById);

router.post('/update', orgController.getDairyById);

module.exports = router;