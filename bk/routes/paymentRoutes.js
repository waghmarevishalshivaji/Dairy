const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/', paymentController.insertPayment);
router.get('/getpayment', paymentController.getpayment);
router.put('/:id', paymentController.updatePayment);
router.put('/inactivate/:id', paymentController.inactivatePayment);
router.put('/activate/:id', paymentController.activatePayment);

module.exports = router;
