const Order = require('../models/Order');
const Cart = require('../models/Cart');

const OrderController = {
    createOrder: async (req, res) => {
        try {
            // Token validation
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Token tidak valid'
                });
            }

            const userId = req.user.userId;
            const { 
                items, 
                totalAmount, 
                deliveryFee,
                subtotal,
                deliveryMethod, 
                deliveryAddress, 
                paymentMethod, 
                notes 
            } = req.body;

            // Validate required fields
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Data items tidak valid'
                });
            }

            if (!deliveryMethod || !['pickup', 'direct'].includes(deliveryMethod)) {
                return res.status(400).json({
                    success: false,
                    error: 'Metode pengiriman tidak valid'
                });
            }

            if (!paymentMethod || !['cash', 'dana'].includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    error: 'Metode pembayaran tidak valid'
                });
            }

            if (deliveryMethod === 'pickup' && !deliveryAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Alamat pengambilan harus diisi'
                });
            }

            // Generate order number
            const timestamp = Date.now().toString();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const orderNumber = `ORD${timestamp}${random}`;

            // Calculate estimated completion date (3 days from now)
            const estimatedDoneDate = new Date();
            estimatedDoneDate.setDate(estimatedDoneDate.getDate() + 3);

            // Create new order
            const order = new Order({
                userId,
                orderNumber,
                items: items.map(item => ({
                    service: item.service,
                    items: item.items.map(subItem => ({
                        name: subItem.name,
                        quantity: subItem.quantity,
                        price: subItem.price
                    })),
                    totalPrice: item.totalPrice
                })),
                totalAmount,
                deliveryFee,
                subtotal,
                deliveryMethod,
                deliveryAddress: deliveryMethod === 'pickup' ? deliveryAddress : '',
                paymentMethod,
                notes,
                status: 'Dalam Proses',
                estimatedDoneDate
            });

            await order.save();

            // Clear user's cart after successful order
            await Cart.findOneAndUpdate(
                { userId },
                { $set: { items: [] } }
            );

            // Send success response with order details
            res.status(201).json({
                success: true,
                message: 'Pesanan berhasil dibuat',
                order: {
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                    deliveryMethod: order.deliveryMethod,
                    estimatedDoneDate: order.estimatedDoneDate,
                    items: order.items,
                    status: order.status
                }
            });

        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal membuat pesanan'
            });
        }
    },

    getOrders: async (req, res) => {
        try {
            const userId = req.user.userId;
            const orders = await Order.find({ userId })
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                orders
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal mengambil data pesanan'
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