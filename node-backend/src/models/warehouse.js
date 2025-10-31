const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true
  },
  full_address: {
    type: String,
    required: [true, 'Full address is required'],
    trim: true
  },
  address_line1: {
    type: String,
    trim: true
  },
  address_line2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  phone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Useful indexes
warehouseSchema.index({ isActive: 1 });
warehouseSchema.index({ isDefault: 1 });
warehouseSchema.index({ city: 1, pincode: 1 });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;


