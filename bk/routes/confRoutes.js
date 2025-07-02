const express = require('express');
const router = express.Router();
const confController = require('../controllers/confController');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',  // Folder to temporarily store uploaded files
    limits: { fileSize: 10 * 1024 * 1024 }  // Limit to 10MB file size
});



router.post('/createrate', upload.single('csv'), confController.createrate);
// router.post('/login', authController.login);

// // OTP generation route
// router.post('/send-otp', authController.generateOTP);

// // OTP verification route
// router.post('/verify-otp', authController.verifyOTP);


// router.post('/reset-password', authController.resetPassword);


// router.post('/confirm', authController.updateConfirm);

module.exports = router;