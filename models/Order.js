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
        enum: ['Dalam Proses', 'Selesai', 'Dibatalkan'],
        default: 'Dalam Proses'
    },
    estimatedDoneDate: {
        type: Date,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for common queries
orderSchema.index({ userId: 1, orderDate: -1 });

module.exports = mongoose.model('Order', orderSchema);

  