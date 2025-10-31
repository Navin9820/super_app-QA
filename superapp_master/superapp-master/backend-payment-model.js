const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order_id: {
    type: String,
    required: true
  },
  razorpay_order_id: {
    type: String,
    required: true
  },
  razorpay_payment_id: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['cod', 'razorpay', 'paytm', 'phonepay', 'amazonpay', 'creditdebit', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'wallet']
  },
  order_model: {
    type: String,
    required: true,
    enum: ['Order', 'FoodOrder', 'GroceryOrder', 'Booking', 'TaxiRide', 'PorterBooking']
  },
  captured_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
paymentSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
