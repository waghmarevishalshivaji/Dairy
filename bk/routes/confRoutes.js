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
    // limits: { fileSize: 10 * 1024 * 1024 }  // Limit to 10MB file size
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const uploadnew = multer({ storage });

router.post('/upload-image', uploadnew.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  res.json({
    success: true,
    message: 'Image uploaded successfully',
    file: {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size
    }
  });
});


// router.post('/upload-image', uploadnew.single('image'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ success: false, message: 'No image uploaded' });
//   }

//   res.json({
//     success: true,
//     message: 'Image uploaded successfully',
//     file: {
//       originalname: req.file.originalname,
//       filename: req.file.filename,
//       path: `/uploads/${req.file.filename}`,
//       size: req.file.size
//     }
//   });
// });



router.post('/createrate', upload.single('csv'), confController.uploadRates);
router.get('/get-rate', confController.getRate); // GET /get-rate?fat=3.5&snf=7.1
router.get('/get-rate-names', confController.getRatename); // GET /get-rate?fat=3.5&snf=7.1
router.get("/downloadrates", confController.downloadRateMatrix);
router.get("/previewRateMatrix", confController.previewRateMatrix);
// router.post('/login', authController.login);

// // OTP generation route
// router.post('/send-otp', authController.generateOTP);

// // OTP verification route
// router.post('/verify-otp', authController.verifyOTP);


// router.post('/reset-password', authController.resetPassword);


// router.post('/confirm', authController.updateConfirm);

module.exports = router;