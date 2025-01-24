const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
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
            const userObjectId = new mongoose.Types.ObjectId(userId);
            
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

            // Validate status
            const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
            if (req.body.status && !validStatuses.includes(req.body.status)) {
                return res.status(400).json({
                    success: false,
                    error: `Status tidak valid. Status yang diperbolehkan: ${validStatuses.join(', ')}`
                });
            }

            const orderNumber = generateOrderNumber();
            console.log('Generated order number:', orderNumber);

            const newOrder = new Order({
                userId: userObjectId,
                orderNumber,
                items,
                totalAmount,
                deliveryFee,
                subtotal,
                deliveryMethod,
                deliveryAddress,
                paymentMethod,
                notes,
                estimatedDoneDate,
                status: req.body.status || 'pending'  // Default to pending if not provided
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

            // Setelah order berhasil dibuat, buat notifikasi
            const notification = new Notification({
                userId: req.user.userId,
                orderId: savedOrder._id,
                type: 'order',
                title: 'Pesanan Baru',
                message: `Pesanan #${orderNumber} telah dibuat dan menunggu konfirmasi.`
            });

            await notification.save();

            res.status(201).json({
                success: true,
                message: "Pesanan berhasil dibuat",
                order: savedOrder
            });

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
    },

    acceptOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID pesanan tidak valid'
                });
            }

            const order = await Order.findById(orderId);
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan'
                });
            }

            order.status = 'processing';
            await order.save();

            // Customize confirmation message based on delivery method
            let confirmationMessage;
            if (order.deliveryMethod === 'direct') {
                confirmationMessage = `Pesanan #${order.orderNumber} telah dikonfirmasi dan sedang diproses.`;
            } else if (order.deliveryMethod === 'pickup') {
                confirmationMessage = `Pesanan #${order.orderNumber} telah dikonfirmasi. Kurir kami akan segera menjemput pesanan Anda.`;
            }

            // Add estimated time if available
            if (order.estimatedDoneDate) {
                confirmationMessage += ` Estimasi selesai pada ${new Date(order.estimatedDoneDate).toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            }

            const notification = new Notification({
                userId: order.userId,
                orderId: order._id,
                type: 'order',
                title: 'Pesanan Dikonfirmasi',
                message: confirmationMessage
            });

            await notification.save();

            res.json({
                success: true,
                message: 'Status pesanan berhasil diupdate',
                order
            });

        } catch (error) {
            console.error('Accept order error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengupdate status pesanan',
                error: error.message
            });
        }
    },

    completeOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan'
                });
            }

            order.status = 'completed';
            await order.save();

            // Customize notification based on delivery method
            let notificationTitle = 'Pesanan Selesai';
            let notificationMessage;

            if (order.deliveryMethod === 'direct') {
                notificationMessage = `Pesanan #${order.orderNumber} telah selesai dan siap untuk diambil di toko.`;
            } else if (order.deliveryMethod === 'pickup') {
                notificationMessage = `Pesanan #${order.orderNumber} telah selesai dan akan segera dikirim ke alamat Anda.`;
            }

            const notification = new Notification({
                userId: order.userId,
                orderId: order._id,
                type: 'order',
                title: notificationTitle,
                message: notificationMessage
            });

            await notification.save();

            // Payment notification logic remains unchanged
            if (order.paymentMethod === 'cash') {
                let paymentMessage;
                if (order.deliveryMethod === 'direct') {
                    paymentMessage = `Silakan lakukan pembayaran sebesar Rp ${order.totalAmount.toLocaleString('id-ID')} saat pengambilan pesanan di toko.`;
                } else if (order.deliveryMethod === 'pickup') {
                    paymentMessage = `Silakan siapkan pembayaran sebesar Rp ${order.totalAmount.toLocaleString('id-ID')} saat pesanan diantar ke alamat Anda.`;
                }

                const paymentNotification = new Notification({
                    userId: order.userId,
                    orderId: order._id,
                    type: 'payment',
                    title: 'Informasi Pembayaran',
                    message: paymentMessage
                });

                await paymentNotification.save();
            }

            res.json({
                success: true,
                message: 'Status pesanan berhasil diupdate',
                order
            });
        } catch (error) {
            console.error('Complete order error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengupdate status pesanan',
                error: error.message
            });
        }
    },

    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findByIdAndUpdate(
                orderId,
                { status: 'cancelled' },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan'
                });
            }

            // Buat notifikasi untuk user bahwa pesanan dibatalkan
            const notification = new Notification({
                userId: order.userId,
                orderId: order._id,
                type: 'order',
                title: 'Pesanan Dibatalkan',
                message: `Pesanan #${order.orderNumber} telah dibatalkan.`
            });

            await notification.save();

            res.json({
                success: true,
                message: 'Status pesanan berhasil diupdate',
                order
            });
        } catch (error) {
            console.error('Cancel order error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal mengupdate status pesanan',
                error: error.message
            });
        }
    }
};

module.exports = OrderController; 