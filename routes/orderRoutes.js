const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authenticateUser = require('../middleware/authenticateUser');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
};

// Create new order from cart
router.post('/create', authenticateUser, async (req, res) => {
  try {
    const { deliveryMethod, deliveryAddress, paymentMethod, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Keranjang kosong' });
    }

    // Calculate estimated done date (3 days from now)
    const estimatedDoneDate = new Date();
    estimatedDoneDate.setDate(estimatedDoneDate.getDate() + 3);

    // Create new order
    const order = new Order({
      userId: req.user.id,
      orderNumber: generateOrderNumber(),
      items: cart.items,
      totalAmount: cart.totalAmount,
      deliveryMethod,
      deliveryAddress,
      paymentMethod,
      notes,
      estimatedDoneDate
    });

    await order.save();

    // Clear cart after order is created
    await Cart.findOneAndDelete({ userId: req.user.id });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
});

// Get user's orders
router.get('/', authenticateUser, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Gagal mengambil data pesanan' });
  }
});

// Get order details
router.get('/:orderId', authenticateUser, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Gagal mengambil detail pesanan' });
  }
});

// Cancel order
router.put('/:orderId/cancel', authenticateUser, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'Dalam Proses') {
      return res.status(400).json({ error: 'Pesanan tidak dapat dibatalkan' });
    }

    order.status = 'Dibatalkan';
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Gagal membatalkan pesanan' });
  }
});

module.exports = router; 