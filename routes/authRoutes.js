const express = require('express');
const router = express.Router();
const { login, register, registerAdmin } = require('../controllers/authController');
const authenticateUser = require('../middleware/authenticateUser');

// Debug middleware
router.use((req, res, next) => {
    console.log('Auth Route accessed:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/register-admin', registerAdmin);

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

router.post('/admin/login', login);  // Endpoint khusus admin

module.exports = router;
