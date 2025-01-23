const Order = require('../models/Order');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
};

const OrderController = {
    createOrder: async (req, res) => {
        try {
            console.log('=== START CREATE ORDER ===');
            console.log('User ID:', req.user.userId);
            console.log('Request body:', JSON.stringify(req.body, null, 2));

            const userId = req.user.userId;
            const {
                items,
                totalAmount,
                deliveryFee,
                subtotal,
                deliveryMethod,
                deliveryAddress,
                paymentMethod,
                notes,
                estimatedDoneDate
            } = req.body;

            console.log('Validating order data...');
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                console.error('Invalid items data:', items);
                return res.status(400).json({
                    success: false,
                    error: 'Items tidak valid'
                });
            }

            if (!userId) {
                console.error('Invalid userId:', userId);
                return res.status(400).json({
                    success: false,
                    error: 'User ID tidak valid'
                });
            }

            if (!['pickup', 'direct'].includes(deliveryMethod)) {
                console.error('Invalid delivery method:', deliveryMethod);
                return res.status(400).json({
                    success: false,
                    error: 'Metode pengiriman tidak valid'
                });
            }

            if (!['cash', 'dana'].includes(paymentMethod)) {
                console.error('Invalid payment method:', paymentMethod);
                return res.status(400).json({
                    success: false,
                    error: 'Metode pembayaran tidak valid'
                });
            }

            if (deliveryMethod === 'pickup' && !deliveryAddress?.trim()) {
                console.error('Missing delivery address for pickup method');
                return res.status(400).json({
                    success: false,
                    error: 'Alamat pengambilan harus diisi untuk metode jemput'
                });
            }

            const orderNumber = generateOrderNumber();
            console.log('Generated order number:', orderNumber);

            try {
                let userObjectId;
                try {
                    userObjectId = new mongoose.Types.ObjectId(userId);
                } catch (err) {
                    console.error('Error converting userId to ObjectId:', err);
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid user ID format'
                    });
                }

                const newOrder = new Order({
                    userId: userObjectId,
                    orderNumber,
                    items: items.map(item => ({
                        service: String(item.service),
                        items: item.items.map(subItem => ({
                            name: String(subItem.name),
                            quantity: Number(subItem.quantity) || 0,
                            price: Number(subItem.price) || 0
                        })),
                        totalPrice: Number(item.totalPrice) || 0
                    })),
                    totalAmount: Number(totalAmount) || 0,
                    deliveryFee: Number(deliveryFee) || 0,
                    subtotal: Number(subtotal) || 0,
                    deliveryMethod: String(deliveryMethod),
                    deliveryAddress: String(deliveryAddress || ''),
                    paymentMethod: String(paymentMethod),
                    notes: String(notes || ''),
                    estimatedDoneDate: new Date(estimatedDoneDate),
                    status: 'Dalam Proses'
                });

                console.log('Prepared order data:', JSON.stringify(newOrder, null, 2));

                const calculatedTotal = newOrder.items.reduce((sum, item) => sum + item.totalPrice, 0) + newOrder.deliveryFee;
                if (Math.abs(calculatedTotal - newOrder.totalAmount) > 1) {
                    console.error('Total amount mismatch:', {
                        calculated: calculatedTotal,
                        provided: newOrder.totalAmount
                    });
                    return res.status(400).json({
                        success: false,
                        error: 'Total amount tidak sesuai dengan perhitungan'
                    });
                }

                console.log('Saving order...');
                const savedOrder = await newOrder.save();
                console.log('Order saved successfully:', savedOrder._id);

                await Cart.findOneAndDelete({ userId: userObjectId });
                console.log('Cart cleared successfully');

                res.status(201).json({
                    success: true,
                    message: "Pesanan berhasil dibuat",
                    order: savedOrder
                });

            } catch (validationError) {
                console.error('Validation/Save Error:', validationError);
                return res.status(400).json({
                    success: false,
                    error: 'Data pesanan tidak valid: ' + validationError.message
                });
            }

        } catch (error) {
            console.error('Error in createOrder:', error);
            res.status(500).json({
                success: false,
                message: "Gagal membuat pesanan",
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    getOrders: async (req, res) => {
        try {
            const userId = req.user.userId;
            const orders = await Order.find({ userId }).sort({ orderDate: -1 });

            res.status(200).json({
                success: true,
                orders
            });

        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil data order'
            });
        }
    },

    getOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            const userId = req.user.userId;

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

            res.json({
                success: true,
                order
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil detail pesanan'
            });
        }
    }
};

module.exports = OrderController; 