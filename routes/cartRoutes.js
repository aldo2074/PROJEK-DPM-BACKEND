const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const authenticateUser = require('../middleware/authenticateUser');

// Get cart items for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    res.json(cart || { items: [], totalAmount: 0 });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Gagal mengambil data keranjang' });
  }
});

// Add item to cart
router.post('/add', authenticateUser, async (req, res) => {
  try {
    const { service, items, totalPrice } = req.body;
    
    if (!service || !items || items.length === 0) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [],
        totalAmount: 0
      });
    }

    // Add new service items
    cart.items.push({
      service,
      items,
      totalPrice
    });

    // Update total amount
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.updatedAt = Date.now();

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Gagal menambahkan ke keranjang' });
  }
});

// Remove item from cart
router.delete('/remove/:serviceId', authenticateUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Keranjang tidak ditemukan' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.serviceId);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.updatedAt = Date.now();

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Gagal menghapus dari keranjang' });
  }
});

// Clear cart
router.delete('/clear', authenticateUser, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id });
    res.json({ message: 'Keranjang berhasil dikosongkan' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Gagal mengosongkan keranjang' });
  }
});

module.exports = router; 