const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
        price: {
          type: Number,
          required: true
        }
      }],
      totalPrice: {
        type: Number,
        required: true
      }
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Dalam Proses', 'Menunggu Pickup', 'Selesai', 'Dibatalkan'],
      default: 'Dalam Proses'
    },
    deliveryAddress: {
      type: String,
      required: function() {
        return this.deliveryMethod === 'pickup';
      }
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
    notes: String,
    estimatedDoneDate: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  module.exports = mongoose.model('Order', OrderSchema);

  