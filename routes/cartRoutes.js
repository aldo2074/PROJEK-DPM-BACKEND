const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const authenticateUser = require('../middleware/authenticateUser');

// Apply authentication middleware to all cart routes
router.use(authenticateUser);

// Get cart items
router.get('/', CartController.getCart);

// Add item to cart
router.post('/', CartController.addItem);

// Update service in cart
router.put('/update/:serviceId', CartController.updateService);

// Update existing service in cart
router.put('/service/:serviceId', CartController.updateService);

// Update quantity
router.patch('/quantity', CartController.updateQuantity);

// Remove specific item
router.delete('/remove/:serviceId', CartController.removeItem);

// Clear cart
router.delete('/clear', CartController.clearCart);

// Tambahkan logging untuk debugging
router.use((req, res, next) => {
    console.log('Requested URL:', req.method, req.originalUrl);
    next();
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Cart route error:', err);
    res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan pada server',
        details: err.message
    });
});

module.exports = router; 