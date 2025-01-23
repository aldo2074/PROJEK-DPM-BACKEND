const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticateUser = require('../middleware/authenticateUser');

// Register
router.post('/register', AuthController.register);

// Login
router.post('/login', AuthController.login);

// Protected routes
router.get('/validate', authenticateUser, (req, res) => {
    try {
        // Token sudah divalidasi di middleware authenticateUser
        res.json({
            success: true,
            message: 'Token valid',
            user: {
                userId: req.user.userId
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Token tidak valid'
        });
    }
});

module.exports = router;
