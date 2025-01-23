const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authenticateUser = require('../middleware/authenticateUser');
const OrderController = require('../controllers/orderController');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
};

// Middleware untuk validasi token
const validateToken = async (req, res, next) => {
    try {
        if (!req.user || !req.user.exp) {
            return res.status(401).json({
                success: false,
                error: 'Token tidak valid',
                isExpired: true
            });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp >= req.user.exp) {
            return res.status(401).json({
                success: false,
                error: 'Sesi anda telah berakhir',
                isExpired: true
            });
        }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Token tidak valid',
            isExpired: true
        });
    }
};

// Apply authentication and token validation middleware
router.use(authenticateUser);
router.use(validateToken);

// Create new order
router.post('/create', OrderController.createOrder);

// Get user's orders
router.get('/', OrderController.getOrders);

// Get order details
router.get('/:orderId', OrderController.getOrderById);

// Cancel order
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      userId
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pesanan tidak ditemukan'
      });
    }

    if (order.status !== 'Dalam Proses') {
      return res.status(400).json({
        success: false,
        error: 'Pesanan tidak dapat dibatalkan'
      });
    }

    order.status = 'Dibatalkan';
    await order.save();
    
    res.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan',
      order
    });
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membatalkan pesanan'
    });
  }
});

module.exports = router; 