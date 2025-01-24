const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authenticateUser = require('../middleware/authenticateUser');
const OrderController = require('../controllers/orderController');
const Notification = require('../models/Notification');

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

    if (order.status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Pesanan tidak dapat dibatalkan'
      });
    }

    order.status = 'cancelled';
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

// Get all orders (admin only)
router.get('/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .populate('userId', 'name email phone'); // Add user details

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pesanan'
    });
  }
});

// Update order status (admin only)
router.put('/admin/update-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Validasi status yang diterima
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Status tidak valid. Status yang diperbolehkan: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Pesanan tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Status pesanan berhasil diperbarui',
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal memperbarui status pesanan'
        });
    }
});

// Get notifications
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .populate('orderId');

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal mengambil notifikasi'
        });
    }
});

// Create notification
router.post('/notifications', async (req, res) => {
    try {
        const { userId, orderId, type, title, message } = req.body;

        const notification = new Notification({
            userId,
            orderId,
            type,
            title,
            message
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: 'Notifikasi berhasil dibuat',
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal membuat notifikasi'
        });
    }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notifikasi tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Notifikasi ditandai telah dibaca',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal memperbarui status notifikasi'
        });
    }
});

// Accept Order route
router.put('/:orderId/accept', OrderController.acceptOrder);
router.put('/:orderId/complete', OrderController.completeOrder);
router.put('/:orderId/cancel', OrderController.cancelOrder);

module.exports = router; 