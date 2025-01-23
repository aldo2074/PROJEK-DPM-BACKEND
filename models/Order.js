const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    items: [{
      service: {
        type: String,
        required: true,
        enum: ['Cuci Setrika', 'Setrika', 'Cuci Kering']
      },
      items: [{
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }],
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      required: true,
      enum: ['Dalam Proses', 'Menunggu Pickup', 'Selesai', 'Dibatalkan'],
      default: 'Dalam Proses'
    },
    deliveryAddress: {
      type: String,
      default: ''
    },
    deliveryMethod: {
      type: String,
      required: true,
      enum: ['pickup', 'direct']
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'dana']
    },
    notes: {
      type: String,
      default: ''
    },
    estimatedDoneDate: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  });

  // Add indexes for common queries
  OrderSchema.index({ userId: 1, createdAt: -1 });
  OrderSchema.index({ orderNumber: 1 }, { unique: true });

  module.exports = mongoose.model('Order', OrderSchema);

  