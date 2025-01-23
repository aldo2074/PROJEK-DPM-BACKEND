const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser');
const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');

// Tambahkan middleware untuk logging
router.use((req, res, next) => {
    console.log('Profile Route Headers:', req.headers);
    next();
});

// Get profile
router.get('/', authenticateUser, profileController.getProfile);

// Update profile
router.put('/', 
  authenticateUser, 
  upload.single('profileImage'), 
  profileController.updateProfile
);

module.exports = router; 