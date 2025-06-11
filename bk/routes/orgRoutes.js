const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');

router.post('/create', orgController.createOrganization);
router.get('/get', orgController.getOrganizations);
router.post('/update', orgController.getOrganizations);

module.exports = router;
