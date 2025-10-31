const mongoose = require('mongoose');

const porterDriverSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  license_number: {
    type: String,
    required: [true, 'License number is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'offline', 'pending_approval', 'rejected'],
    default: 'pending_approval' // ✅ NEW: Default to pending approval for new registrations
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  total_deliveries: {
    type: Number,
    default: 0
  },
  current_location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  // ✅ NEW FIELDS FOR APPROVAL WORKFLOW
  module_type: {
    type: String,
    enum: ['taxi', 'porter'],
    default: 'porter'
  },
  license_file_path: {
    type: String,
    trim: true
  },
  request_date: {
    type: Date,
    default: Date.now
  },
  approval_date: {
    type: Date
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejection_reason: {
    type: String,
    trim: true
  },
  // ✅ NEW: Vehicle information fields
  vehicle_type: {
    type: String,
    trim: true
  },
  vehicle_number: {
    type: String,
    trim: true
  },
  vehicle_model: {
    type: String,
    trim: true
  },
  vehicle_color: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user relationship
porterDriverSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for vehicles relationship (one-to-many)
porterDriverSchema.virtual('vehicles', {
  ref: 'PorterVehicle',
  localField: '_id',
  foreignField: 'driver_id'
});

// ✅ NEW: Virtual for admin who approved/rejected
porterDriverSchema.virtual('approver', {
  ref: 'User',
  localField: 'approved_by',
  foreignField: '_id',
  justOne: true
});

// Indexes for efficient queries
porterDriverSchema.index({ user_id: 1 });
porterDriverSchema.index({ phone: 1 });
porterDriverSchema.index({ license_number: 1 });
// ✅ NEW: Index for approval workflow
porterDriverSchema.index({ status: 1 });
porterDriverSchema.index({ module_type: 1 });
porterDriverSchema.index({ request_date: -1 });

module.exports = mongoose.models.PorterDriver || mongoose.model('PorterDriver', porterDriverSchema); 