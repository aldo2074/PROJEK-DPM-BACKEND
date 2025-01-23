const Cart = require('../models/Cart');

const CartController = {
    getCart: async (req, res) => {
        try {
            const userId = req.user.userId;
            const cart = await Cart.findOne({ userId })
                .select('items createdAt')
                .sort({ 'items.createdAt': -1 });
            
            if (!cart || !cart.items.length) {
                return res.json({
                    success: true,
                    items: [],
                    message: 'Keranjang kosong'
                });
            }

            // Pastikan setiap item memiliki _id yang valid
            const items = cart.items.map(item => ({
                ...item.toObject(),
                _id: item._id.toString()
            }));

            res.json({
                success: true,
                items: items,
                totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
                message: 'Berhasil mengambil data keranjang'
            });
        } catch (error) {
            console.error('Error fetching cart:', error);
            res.status(500).json({ 
                success: false,
                error: 'Gagal mengambil data keranjang'
            });
        }
    },

    removeItem: async (req, res) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User tidak terautentikasi'
                });
            }

            const userId = req.user.userId;
            const { serviceId } = req.params;

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Keranjang tidak ditemukan' 
                });
            }

            cart.items = cart.items.filter(item => 
                item._id.toString() !== serviceId
            );

            await cart.save();
            res.json({ 
                success: true, 
                message: 'Item berhasil dihapus',
                cart
            });
        } catch (error) {
            console.error('Error removing item:', error);
            res.status(500).json({ 
                success: false,
                error: 'Gagal menghapus item'
            });
        }
    },

    clearCart: async (req, res) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User tidak terautentikasi'
                });
            }

            const userId = req.user.userId;
            const cart = await Cart.findOne({ userId });
            
            if (!cart) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Keranjang tidak ditemukan' 
                });
            }

            cart.items = [];
            await cart.save();
            
            res.json({ 
                success: true, 
                message: 'Keranjang berhasil dikosongkan',
                cart
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({ 
                success: false,
                error: 'Gagal mengosongkan keranjang'
            });
        }
    },

    addItem: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { service, items, totalPrice, serviceId, isEdit } = req.body;

            // Tambahkan logging detail
            console.log('Request body:', req.body);
            console.log('User ID:', userId);

            // Validasi input dasar
            if (!service || !items || !Array.isArray(items) || items.length === 0) {
                console.log('Invalid input:', { service, items, totalPrice });
                return res.status(400).json({
                    success: false,
                    error: 'Data pesanan tidak valid',
                    details: { service, itemsLength: items?.length }
                });
            }

            let cart = await Cart.findOne({ userId });
            console.log('Existing cart:', cart);

            if (!cart) {
                cart = new Cart({ userId, items: [] });
                console.log('Created new cart');
            }

            if (isEdit && serviceId) {
                console.log('Editing mode - Service ID:', serviceId);
                const serviceIndex = cart.items.findIndex(
                    item => item._id.toString() === serviceId
                );

                if (serviceIndex === -1) {
                    console.log('Service not found for editing');
                    return res.status(404).json({
                        success: false,
                        error: 'Layanan tidak ditemukan'
                    });
                }

                // Update existing service
                cart.items[serviceIndex] = {
                    ...cart.items[serviceIndex],
                    service,
                    items,
                    totalPrice,
                    updatedAt: new Date()
                };

                console.log('Updated service:', cart.items[serviceIndex]);
            } else {
                // Check for duplicate service
                const existingService = cart.items.find(item => 
                    item.service === service && 
                    (!serviceId || item._id.toString() !== serviceId)
                );

                if (existingService) {
                    console.log('Duplicate service found');
                    return res.status(400).json({
                        success: false,
                        error: 'Layanan ini sudah ada di keranjang',
                        existingService: true
                    });
                }

                // Add new service
                const newService = {
                    service,
                    items,
                    totalPrice,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                cart.items.push(newService);
                console.log('Added new service:', newService);
            }

            // Save cart with error handling
            try {
                const savedCart = await cart.save();
                console.log('Cart saved successfully:', savedCart);
                
                res.status(200).json({
                    success: true,
                    message: isEdit ? 'Layanan berhasil diperbarui' : 'Layanan berhasil ditambahkan',
                    cart: savedCart
                });
            } catch (saveError) {
                console.error('Error saving cart:', saveError);
                return res.status(500).json({
                    success: false,
                    error: 'Gagal menyimpan ke database',
                    details: saveError.message
                });
            }

        } catch (error) {
            console.error('Error in addItem:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                error: 'Gagal memproses pesanan',
                details: error.message
            });
        }
    },

    updateQuantity: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { serviceId, itemName, quantity, service } = req.body;

            // Validasi input
            if (!serviceId || !itemName || typeof quantity !== 'number' || !service) {
                return res.status(400).json({
                    success: false,
                    error: 'Parameter tidak lengkap'
                });
            }

            if (quantity <= 0 || quantity > 20) {
                return res.status(400).json({
                    success: false,
                    error: 'Jumlah harus antara 1-20'
                });
            }

            // Cari dan update cart dengan atomic operation
            const cart = await Cart.findOneAndUpdate(
                { 
                    userId,
                    'items._id': serviceId,
                    'items.service': service
                },
                {
                    $set: {
                        'items.$[outer].items.$[inner].quantity': quantity,
                        'items.$[outer].updatedAt': new Date()
                    }
                },
                {
                    arrayFilters: [
                        { 'outer._id': serviceId },
                        { 'inner.name': itemName }
                    ],
                    new: true,
                    runValidators: true
                }
            );

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart atau item tidak ditemukan'
                });
            }

            // Hitung ulang total harga untuk service yang diupdate
            const updatedService = cart.items.find(item => 
                item._id.toString() === serviceId
            );

            if (updatedService) {
                updatedService.totalPrice = updatedService.items.reduce(
                    (sum, item) => sum + (item.price * item.quantity),
                    0
                );
                await cart.save();
            }

            // Hitung total keseluruhan
            const totalAmount = cart.items.reduce(
                (sum, item) => sum + item.totalPrice,
                0
            );

            res.json({
                success: true,
                message: 'Jumlah berhasil diperbarui',
                cart,
                totalAmount
            });
        } catch (error) {
            console.error('Error updating quantity:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal memperbarui jumlah'
            });
        }
    },

    updateService: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { serviceId } = req.params;
            const { service, items, totalPrice } = req.body;

            // Validasi input
            if (!service || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Data layanan tidak valid'
                });
            }

            // Cari cart
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart tidak ditemukan'
                });
            }

            // Cari index service yang akan diupdate
            const serviceIndex = cart.items.findIndex(
                item => item._id.toString() === serviceId
            );

            if (serviceIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Layanan tidak ditemukan'
                });
            }

            // Update service
            cart.items[serviceIndex] = {
                ...cart.items[serviceIndex],
                service,
                items,
                totalPrice,
                updatedAt: new Date()
            };

            await cart.save();

            res.json({
                success: true,
                message: 'Layanan berhasil diperbarui',
                cart
            });

        } catch (error) {
            console.error('Error updating service:', error);
            res.status(500).json({
                success: false,
                error: 'Gagal memperbarui layanan'
            });
        }
    }
};

module.exports = CartController; 