const express = require('express');
const router = express.Router();
const controller = require('../controllers/collectionsController');

router.post('/', controller.createCollection);
// router.get('/', controller.getAllCollections);
router.get('/', controller.getCollectionById);
router.get('/:id', controller.getCollectionById);
router.put('/:id', controller.updateCollection);
router.delete('/:id', controller.deleteCollection);

module.exports = router;