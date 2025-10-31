const mongoose = require('mongoose');

const taxiRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
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
    enum: ['Bike', 'Auto', 'Car', 'Mini', 'Sedan', 'SUV'],
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
  special_instructions: {
    type: String,
    trim: true
  },
  scheduled_time: {
    type: Date
  },
  assigned_at: Date,
  picked_up_at: Date,
  delivered_at: Date,
  completed_at: Date,
  cancelled_at: Date,
  cancellation_reason: String,
  tracking_info: {
    picked_up_at: Date,
    delivered_at: Date,
    rider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider'
    }
  },
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user relationship
taxiRequestSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for request duration
taxiRequestSchema.virtual('request_duration').get(function() {
  if (this.completed_at && this.createdAt) {
    return Math.round((this.completed_at - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Ensure virtuals are serialized
taxiRequestSchema.set('toJSON', { virtuals: true });
taxiRequestSchema.set('toObject', { virtuals: true });

// Indexes for efficient queries
taxiRequestSchema.index({ user_id: 1, createdAt: -1 });
taxiRequestSchema.index({ status: 1 });
taxiRequestSchema.index({ payment_status: 1 });
taxiRequestSchema.index({ is_active: 1 });
taxiRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.models.TaxiRequest || mongoose.model('TaxiRequest', taxiRequestSchema);
