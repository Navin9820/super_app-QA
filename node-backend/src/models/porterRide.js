const mongoose = require('mongoose');

const porterRideSchema = new mongoose.Schema({
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
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PorterVehicle',
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
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'upi'],
    default: 'cash'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  item_description: {
    type: String,
    trim: true,
    default: 'Delivery service'
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
porterRideSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for driver relationship
porterRideSchema.virtual('driver', {
  ref: 'PorterDriver',
  localField: 'driver_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for vehicle relationship
porterRideSchema.virtual('vehicle', {
  ref: 'PorterVehicle',
  localField: 'vehicle_id',
  foreignField: '_id',
  justOne: true
});

// Indexes for efficient queries
porterRideSchema.index({ user_id: 1, createdAt: -1 });
porterRideSchema.index({ driver_id: 1 });
porterRideSchema.index({ status: 1 });
porterRideSchema.index({ payment_status: 1 });
porterRideSchema.index({ createdAt: -1 });

module.exports = mongoose.models.PorterRide || mongoose.model('PorterRide', porterRideSchema);
