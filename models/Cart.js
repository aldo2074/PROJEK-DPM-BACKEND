const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    service: {
      type: String,
      required: true,
      enum: ['Cuci & Setrika', 'Setrika', 'Alas Kasur', 'Cuci Sepatu']
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
    required: true,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', CartSchema);
