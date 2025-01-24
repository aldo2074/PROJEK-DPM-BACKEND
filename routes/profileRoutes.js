const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

// Get user profile
router.get('/', auth, profileController.getProfile);

// Update profile
router.put('/', auth, profileController.updateProfile);

// Change password
router.put('/change-password', auth, profileController.changePassword);

module.exports = router;
