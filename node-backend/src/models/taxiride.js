const mongoose = require('mongoose');

const taxiRideSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxiDriver',
    required: false // Optional for new requests, will be assigned when driver accepts
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxiVehicle',
    required: false // Optional for new requests, will be assigned when driver accepts
  },
  pickup_location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  dropoff_location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  vehicle_type: {
    type: String,
    enum: ['Bike', 'Auto', 'Car', 'Mini', 'Sedan', 'SUV'],
    default: 'Auto'
  },
  distance: {
    type: Number,
    min: 0
  },
  duration: {
    type: Number,
    min: 0
  },
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  payment_id: {
    type: String
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'razorpay', 'phonepay', 'paytm', 'amazonpay', 'credit_card', 'debit_card', 'net_banking'],
    default: 'cash'
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
  scheduled_time: {
    type: Date
  },
  started_at: {
    type: Date
  },
  picked_up_at: {
    type: Date
  },
  delivered_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  tracking_info: {
    picked_up_at: Date,
    delivered_at: Date,
    rider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider'
    }
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
  // ✅ NEW: Customer information for rider app
  customer_name: {
    type: String,
    trim: true
  },
  customer_phone: {
    type: String,
    trim: true
  },
  customer_email: {
    type: String,
    trim: true
  },
  // ✅ NEW: Driver information for taxi rides
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

taxiRideSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

taxiRideSchema.virtual('driver', {
  ref: 'TaxiDriver',
  localField: 'driver_id',
  foreignField: '_id',
  justOne: true
});

taxiRideSchema.virtual('vehicle', {
  ref: 'TaxiVehicle',
  localField: 'vehicle_id',
  foreignField: '_id',
  justOne: true
});

taxiRideSchema.index({ user_id: 1 });
taxiRideSchema.index({ driver_id: 1 });
taxiRideSchema.index({ vehicle_id: 1 });
taxiRideSchema.index({ status: 1 });
taxiRideSchema.index({ payment_status: 1 });
taxiRideSchema.index({ createdAt: -1 });

const TaxiRide = mongoose.model('TaxiRide', taxiRideSchema);

module.exports = TaxiRide;