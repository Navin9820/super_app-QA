const PorterRide = require('../models/porterRide');
const PorterRequest = require('../models/porterrequest'); // Add this for actual requests
const Rider = require('../models/rider'); // ✅ NEW: Import Rider model for driver info
const TaxiDriver = require('../models/taxidriver'); // ✅ NEW: Import TaxiDriver model
const PorterDriver = require('../models/porterdriver'); // ✅ NEW: Import PorterDriver model
const asyncHandler = require('express-async-handler');

// @desc    Create new porter ride
// @route   POST /api/porter-rides
// @access  Private
exports.create = asyncHandler(async (req, res) => {
  const {
    pickup_location,
    dropoff_location,
    vehicle_type,
    distance,
    duration,
    fare,
    payment_method,
    item_description,
    item_weight,
    special_instructions,
    scheduled_time
  } = req.body;

  // Validate required fields
  if (!pickup_location || !dropoff_location || !fare) {
    res.status(400);
    throw new Error('Pickup location, dropoff location, and fare are required');
  }

  // Generate 6-digit OTP for porter ride
  const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  console.log('🔍 porterRide.controller.js - Generating OTP:', deliveryOtp);

  // Create porter ride
  const porterRide = await PorterRide.create({
    user_id: req.user.id,
    pickup_location,
    dropoff_location,
    vehicle_type: vehicle_type || 'Auto',
    distance: distance || 0,
    duration: duration || 0,
    fare,
    payment_method: payment_method || 'cash',
    item_description: item_description || 'Delivery service',
    item_weight: item_weight || 0,
    special_instructions,
    scheduled_time: scheduled_time ? new Date(scheduled_time) : null,
    delivery_otp: {
      code: deliveryOtp,
      expiresAt,
      attempts_left: 5,
      resend_count: 0
    }
  });

  console.log('✅ Porter ride OTP generated and saved:', deliveryOtp);

  // Include OTP in response
  const responseData = {
    ...porterRide.toObject(),
    delivery_otp: porterRide.delivery_otp?.code || null
  };

  console.log('🔍 porterRide.controller.js - Response data being sent:', responseData);
  console.log('🔍 porterRide.controller.js - OTP in response:', responseData.delivery_otp);

  res.status(201).json({
    success: true,
    data: responseData
  });
});

// @desc    Get all porter rides for user
// @route   GET /api/porter-rides
// @access  Private
exports.getUserRides = asyncHandler(async (req, res) => {
  const porterRides = await PorterRide.find({ user_id: req.user.id })
    .populate('driver', 'name phone')
    .populate('vehicle', 'model number')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: porterRides.length,
    data: porterRides
  });
});

// @desc    Get single porter ride by ID
// @route   GET /api/porter-rides/:id
// @access  Private
exports.getUserRideById = asyncHandler(async (req, res) => {
  const porterRide = await PorterRide.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('driver', 'name phone')
    .populate('vehicle', 'model number');

  if (!porterRide) {
    res.status(404);
    throw new Error(`Porter ride not found with id of ${req.params.id}`);
  }

  // Make sure user owns porter ride
  if (porterRide.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to access this porter ride`);
  }

  res.status(200).json({
    success: true,
    data: porterRide
  });
});

// @desc    Update porter ride status
// @route   PUT /api/porter-rides/:id/status
// @access  Private
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const porterRide = await PorterRide.findById(req.params.id);

  if (!porterRide) {
    res.status(404);
    throw new Error(`Porter ride not found with id of ${req.params.id}`);
  }

  // Update status and related timestamps
  porterRide.status = status;
  
  if (status === 'accepted') {
    porterRide.assigned_at = new Date();
  } else if (status === 'picked_up') {
    porterRide.picked_up_at = new Date();
  } else if (status === 'completed') {
    porterRide.completed_at = new Date();
  } else if (status === 'cancelled') {
    porterRide.cancelled_at = new Date();
  }

  await porterRide.save();

  res.status(200).json({
    success: true,
    data: porterRide
  });
});

// @desc    Cancel porter ride
// @route   PUT /api/porter-rides/:id/cancel
// @access  Private
exports.cancel = asyncHandler(async (req, res) => {
  const { cancellation_reason } = req.body;

  const porterRide = await PorterRide.findById(req.params.id);

  if (!porterRide) {
    res.status(404);
    throw new Error(`Porter ride not found with id of ${req.params.id}`);
  }

  // Make sure user owns porter ride
  if (porterRide.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to cancel this porter ride`);
  }

  // Check if can be cancelled
  if (['completed', 'cancelled', 'picked_up'].includes(porterRide.status)) {
    res.status(400);
    throw new Error(`Cannot cancel porter ride with status: ${porterRide.status}`);
  }

  porterRide.status = 'cancelled';
  porterRide.cancelled_at = new Date();
  porterRide.cancellation_reason = cancellation_reason || 'Cancelled by user';

  await porterRide.save();

  res.status(200).json({
    success: true,
    data: porterRide
  });
});

// @desc    Rate porter ride
// @route   PUT /api/porter-rides/:id/rate
// @access  Private
exports.rate = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const porterRide = await PorterRide.findById(req.params.id);

  if (!porterRide) {
    res.status(404);
    throw new Error(`Porter ride not found with id of ${req.params.id}`);
  }

  // Make sure user owns porter ride
  if (porterRide.user_id.toString() !== req.user.id) {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to rate this porter ride`);
  }

  // Check if can be rated
  if (porterRide.status !== 'completed') {
    res.status(400);
    throw new Error('Can only rate completed porter rides');
  }

  porterRide.rating = rating;
  porterRide.review = review;

  await porterRide.save();

  res.status(200).json({
    success: true,
    data: porterRide
  });
});

// @desc    Get all porter rides (Admin)
// @route   GET /api/porter-rides/admin
// @access  Private/Admin
exports.getAllRides = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search, date_from, date_to } = req.query;

  const query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by date range
  if (date_from || date_to) {
    query.createdAt = {};
    if (date_from) query.createdAt.$gte = new Date(date_from);
    if (date_to) query.createdAt.$lte = new Date(date_to);
  }

  // Search functionality
  if (search) {
    query.$or = [
      { 'pickup_location.address': { $regex: search, $options: 'i' } },
      { 'dropoff_location.address': { $regex: search, $options: 'i' } }
    ];
  }

  const total = await PorterRide.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const porterRides = await PorterRide.find(query)
    .populate('user', 'name email phone')
    .populate('driver', 'name phone')
    .populate('vehicle', 'model number')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({
    success: true,
    count: porterRides.length,
    total,
    totalPages,
    currentPage: parseInt(page),
    data: porterRides
  });
});

// @desc    Accept porter ride (Driver)
// @route   PUT /api/porter-rides/:id/accept
// @access  Private/Rider
exports.acceptRide = asyncHandler(async (req, res) => {
  console.log('🔍 CONTROLLER METHOD CALLED:', {
    rideId: req.params.id,
    driverId: req.rider?.id,
    riderType: req.rider?.type
  });
  
  try {
    const rideId = req.params.id;
    const driverId = req.rider.id; // From protectRider middleware

    console.log('🔍 Looking for porter ride with ID:', rideId);

    // Find the porter ride in PorterRequest collection (where Super App creates them)
    let porterRide = await PorterRequest.findById(rideId);
    
    if (!porterRide) {
      // Fallback: try PorterRide collection
      console.log('🔍 Not found in PorterRequest, trying PorterRide collection...');
      porterRide = await PorterRide.findById(rideId);
    }
    
    console.log('🔍 Porter ride found:', porterRide ? 'YES' : 'NO');
    
    if (!porterRide) {
      console.log('❌ Porter ride not found in any collection');
      return res.status(404).json({
        success: false,
        message: 'Porter ride not found'
      });
    }
    
    console.log('🔍 Found in collection:', porterRide.constructor.modelName);
    
    console.log('🔍 Porter ride status:', porterRide.status);
    console.log('🔍 Porter ride driver_id:', porterRide.driver_id);

    // Check if ride is available for acceptance
    // Allow acceptance if:
    // 1. Status is 'pending' (normal case)
    // 2. Status is 'assigned' but no driver_id (failed previous assignment)
    const isAvailableForAcceptance = porterRide.status === 'pending' || 
      (porterRide.status === 'assigned' && !porterRide.driver_id);
    
    if (!isAvailableForAcceptance) {
      let errorMessage = `Cannot accept ride with status: ${porterRide.status}`;
      if (porterRide.driver_id) {
        errorMessage += ' (already assigned to another driver)';
      }
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    // Check if driver is already assigned (only if driver_id exists)
    if (porterRide.driver_id) {
      return res.status(400).json({
        success: false,
        message: 'Ride is already assigned to another driver'
      });
    }

    // Get driver information for saving - check all driver models
    let driver = await Rider.findById(driverId);
    let driverModuleType = null;
    
    if (driver) {
      driverModuleType = driver.module_type;
      console.log('🔍 Found driver in Rider model');
    } else {
      // Check TaxiDriver model
      const taxiDriver = await TaxiDriver.findById(driverId);
      if (taxiDriver) {
        driver = taxiDriver;
        driverModuleType = taxiDriver.module_type;
        console.log('🔍 Found driver in TaxiDriver model');
      } else {
        // Check PorterDriver model
        const porterDriver = await PorterDriver.findById(driverId);
        if (porterDriver) {
          driver = porterDriver;
          driverModuleType = porterDriver.module_type;
          console.log('🔍 Found driver in PorterDriver model');
        }
      }
    }
    
    if (!driver) {
      console.log('❌ Driver not found in any model:', driverId);
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Prepare driver info object
    const driverInfo = {
      driver_id: driverId,
      driver_name: driver.name,
      driver_phone: driver.phone,
      vehicle_type: driver.vehicle_type,
      vehicle_number: driver.vehicle_number,
      assigned_at: new Date()
    };

    console.log('🔍 PorterRide Controller: Saving driver info:', driverInfo);

    // Update the ride with driver assignment
    let updatedRide;
    
    if (porterRide.constructor.modelName === 'PorterRequest') {
      // Update in PorterRequest collection
      updatedRide = await PorterRequest.findByIdAndUpdate(
        rideId,
        { 
          driver_id: driverId, 
          status: 'assigned', // PorterRequest uses 'assigned' status
          assigned_at: new Date(),
          driver_info: driverInfo, // ✅ NEW: Save complete driver information
          updatedAt: new Date()
        },
        { new: true }
      ).populate('user_id');
    } else {
      // Update in PorterRide collection
      updatedRide = await PorterRide.findByIdAndUpdate(
        rideId,
        { 
          driver_id: driverId, 
          status: 'accepted', 
          assigned_at: new Date(),
          driver_info: driverInfo, // ✅ NEW: Save complete driver information
          updatedAt: new Date()
        },
        { new: true }
      ).populate('user_id driver_id vehicle_id');
    }

    if (!updatedRide) {
      console.log('❌ Failed to update porter ride');
      return res.status(500).json({
        success: false,
        message: 'Failed to update porter ride'
      });
    }

    console.log('✅ Porter ride updated successfully:', updatedRide._id);
    
    res.status(200).json({
      success: true,
      message: 'Porter ride accepted successfully',
      data: updatedRide
    });

  } catch (err) {
    console.error('Error accepting porter ride:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to accept porter ride',
      error: err.message
    });
  }
});
