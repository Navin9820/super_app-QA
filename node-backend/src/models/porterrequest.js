const mongoose = require('mongoose');

const porterRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PorterDriver',
    required: false // Will be assigned when driver accepts
  },
  pickup_location: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    latitude: {
      type: Number,
      required: [true, 'Pickup latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Pickup longitude is required']
    }
  },
  dropoff_location: {
    address: {
      type: String,
      required: [true, 'Dropoff address is required']
    },
    latitude: {
      type: Number,
      required: [true, 'Dropoff latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Dropoff longitude is required']
    }
  },
  vehicle_type: {
    type: String,
    enum: ['Bike', 'Auto', 'Mini-Truck'],
    default: 'Auto'
  },
  distance: {
    type: Number, // in kilometers
    required: false,
    default: 0
  },
  duration: {
    type: Number, // in minutes
    required: false,
    default: 0
  },
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'razorpay', 'phonepay', 'paytm', 'amazonpay'],
    default: 'cash'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'failed'],
    default: 'pending'
  },
  item_description: {
    type: String,
    trim: true,
    default: 'Porter service'
  },
  item_weight: {
    type: Number, // in kg
    default: 0
  },
  special_instructions: {
    type: String,
    trim: true
  },
  scheduled_time: {
    type: Date
  },
  assigned_at: Date,
  picked_up_at: Date,
  completed_at: Date,
  cancelled_at: Date,
  cancellation_reason: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  delivery_otp: {
    code: {
      type: String,
      required: false
    },
    expiresAt: {
      type: Date,
      required: false
    },
    attempts_left: {
      type: Number,
      default: 5
    },
    resend_count: {
      type: Number,
      default: 0
    }
  },
  // ✅ NEW: Driver information for porter requests
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user relationship
porterRequestSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for driver relationship
porterRequestSchema.virtual('driver', {
  ref: 'PorterDriver',
  localField: 'driver_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for request duration
porterRequestSchema.virtual('request_duration').get(function() {
  if (this.completed_at && this.createdAt) {
    return Math.round((this.completed_at - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Ensure virtuals are serialized
porterRequestSchema.set('toJSON', { virtuals: true });
porterRequestSchema.set('toObject', { virtuals: true });

// Indexes for efficient queries
porterRequestSchema.index({ user_id: 1, createdAt: -1 });
porterRequestSchema.index({ driver_id: 1 });
porterRequestSchema.index({ status: 1 });
porterRequestSchema.index({ payment_status: 1 });
porterRequestSchema.index({ is_active: 1 });
porterRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.models.PorterRequest || mongoose.model('PorterRequest', porterRequestSchema);
