const express = require('express');
const router = express.Router();
const controller = require('../controllers/collectionsController');

router.post('/', controller.createCollection);
// router.get('/', controller.getAllCollections);
router.get('/', controller.getCollectionBytab);
// router.get('/all', controller.getCollection);
router.get('/collectionsummary', controller.getTodaysCollection);
router.get('/getTodayscollectionfarmer', controller.getTodaysCollectionfarmer);
router.get('/getTodayscollectionbyfarmer', controller.getTodaysCollectionByFarmer);
router.get('/billing-period-amount', controller.getBillingPeriodAmount);
router.get('/:id', controller.getCollectionById);
router.put('/:id', controller.updateCollection);
router.delete('/:id', controller.deleteCollection);
router.post("/update-rates-effective", controller.updateRatesByEffectiveDate);


module.exports = router;