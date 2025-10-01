const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// router.post('/create', orgController.createDairy);
// router.get('/:id', orgController.getDairyById);
// router.get('/get', orgController.getDairies);
// // router.get('/:id', orgController.getDairyById);

// router.post('/update', orgController.getDairyById);
// router.put('/updateDairydetails/:id', orgController.updateDairydetails);


router.post("/generate", billingController.generateBill);          // Generate bill
router.post("/generatebills", billingController.generateBills);          // Generate bill
router.put("/:billId", billingController.updateBill);              // Update bill
router.post("/finalize/:billId", billingController.finalizeBill);  // Finalize bill
router.get("/balance/:farmerId", billingController.getFarmerBalance); // Farmer balance

module.exports = router;