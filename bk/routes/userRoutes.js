const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:id', userController.getUserById);
router.put("/user/:id/expo-token", userController.updateExpoToken);
router.get('/', userController.getUserBydairyId);
router.get('/username/:username', userController.getUserByName);

module.exports = router;


