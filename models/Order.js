const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        service: {
            type: String,
            required: true
        },
        items: [{
            name: String,
            quantity: Number,
            price: Number
        }],
        totalPrice: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryFee: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        required: true
    },
    deliveryMethod: {
        type: String,
        enum: ['pickup', 'direct'],
        required: true
    },
    deliveryAddress: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'dana'],
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    estimatedDoneDate: {
        type: Date,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add indexes for common queries
orderSchema.index({ userId: 1, orderDate: -1 });

// Tambahkan method untuk mendapatkan status dalam bahasa Indonesia
orderSchema.methods.getStatusInIndonesian = function() {
    const statusMap = {
        'pending': 'Menunggu Konfirmasi',
        'processing': 'Dalam Proses',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[this.status] || this.status;
};

// Tambahkan virtual field untuk status dalam bahasa Indonesia
orderSchema.virtual('statusInIndonesian').get(function() {
    return this.getStatusInIndonesian();
});

// Pastikan virtuals dimasukkan saat mengubah ke JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);

  