const mongoose = require('mongoose');

const groceryOrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  order_number: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true
  },
  order_type: {
    type: String,
    enum: ['grocery', 'ecommerce', 'restaurant'],
    default: 'grocery'
  },
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  total_amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  
  payment_method: {
    type: String,
    enum: ['cod', 'razorpay', 'phonepay', 'paytm', 'amazonpay', 'credit_card', 'debit_card', 'upi', 'net_banking', 'cash'],
    default: 'cod'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_id: {
    type: String
  },
  
  // ✅ OTP System: Payment details with delivery OTP
  payment_details: {
    delivery_otp: {
      code: String,
      expiresAt: Date,
      attempts_left: { type: Number, default: 5 },
      resend_count: { type: Number, default: 0 }
    }
  },
  
  // ✅ ORIGINAL: Simple address field (keep as primary)
  address: {
    type: String,
    trim: true
  },
  
  // ✅ ENHANCED: Optional detailed delivery address (for future use)
  delivery_address: {
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
    phone: String,
    landmark: String
  },
  
  // ✅ ENHANCED: Optional delivery preferences (for future use)
  delivery_instructions: String,
  preferred_delivery_time: Date,
  packaging_preferences: String,
  special_requests: String,
  
  // ✅ ENHANCED: Optional tracking information (for future use)
  tracking_info: {
    order_confirmed_at: Date,
    processing_started_at: Date,
    ready_for_pickup_at: Date,
    picked_up_at: Date,
    delivered_at: Date
  },
  
  // ✅ ENHANCED: Optional delivery partner info (for future use)
  delivery_partner: {
    name: String,
    phone: String,
    vehicle_number: String
  },
  // ✅ NEW: Driver information for grocery orders
  driver_info: {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider'
    },
    driver_name: {
      type: String,
      trim: true
    },
    driver_phone: {
      type: String,
      trim: true
    },
    vehicle_type: {
      type: String,
      trim: true
    },
    vehicle_number: {
      type: String,
      trim: true
    },
    assigned_at: {
      type: Date,
      default: Date.now
    }
  },
  
  // ✅ ENHANCED: Optional customer feedback (for future use)
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, trim: true },
  
  // ✅ ENHANCED: Optional cancellation info (for future use)
  cancellation_reason: { type: String, trim: true },
  cancelled_by: { type: String, enum: ['customer', 'admin', 'system'] },
  refund_amount: { type: Number, default: 0 },
  
  // ✅ ENHANCED: Optional additional fields (for future use)
  notes: { type: String, trim: true },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ ORIGINAL: Virtual for user relationship
groceryOrderSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// ✅ ORIGINAL: Virtual for order items
groceryOrderSchema.virtual('items', {
  ref: 'GroceryOrderItem',
  localField: '_id',
  foreignField: 'order_id'
});

// ✅ ENHANCED: Method to format delivery address (optional enhancement)
groceryOrderSchema.methods.getFormattedDeliveryAddress = function() {
  if (this.delivery_address && this.delivery_address.address_line1) {
    const addr = this.delivery_address;
    const parts = [
      addr.address_line1,
      addr.address_line2,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  // Fallback to original address field
  return this.address || 'Address not available';
};

// ✅ ENHANCED: Method to update tracking info (optional enhancement)
groceryOrderSchema.methods.updateTrackingInfo = function(status) {
  if (!this.tracking_info) {
    this.tracking_info = {};
  }
  
  const now = new Date();
  
  switch (status) {
    case 'confirmed':
      this.tracking_info.order_confirmed_at = now;
      break;
    case 'processing':
      this.tracking_info.processing_started_at = now;
      break;
    case 'out_for_delivery':
      this.tracking_info.ready_for_pickup_at = now;
      break;
    case 'delivered':
      this.tracking_info.delivered_at = now;
      break;
  }
  
  this.updated_at = now;
  return this.save();
};

// ✅ ORIGINAL: Indexes for better performance
groceryOrderSchema.index({ user_id: 1 });
groceryOrderSchema.index({ order_number: 1 });
groceryOrderSchema.index({ status: 1 });
groceryOrderSchema.index({ payment_status: 1 });

// Safe export pattern
module.exports = mongoose.models.GroceryOrder || mongoose.model('GroceryOrder', groceryOrderSchema); 