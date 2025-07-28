const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);


router.post('/registerfarmer', authController.registefarmer);

router.post('/registerfarmerid', authController.registefarmerid);

router.post('/login', authController.login);

// OTP generation route
router.post('/send-otp', authController.generateOTP);

// OTP verification route
router.post('/verify-otp', authController.verifyOTP);


router.post('/reset-password', authController.resetPassword);


router.post('/confirm', authController.updateConfirm);


router.post('/updateuser', authController.updateUser);

module.exports = router;
