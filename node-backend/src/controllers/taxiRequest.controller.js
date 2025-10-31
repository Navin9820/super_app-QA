const TaxiRequest = require('../models/taxirequest');
const OrderAssignment = require('../models/orderAssignment');
const asyncHandler = require('express-async-handler');

// @desc    Create new taxi request
// @route   POST /api/taxi-requests
// @access  Private
exports.createTaxiRequest = asyncHandler(async (req, res, next) => {
  const {
    pickup_location,
    dropoff_location,
    vehicle_type,
    distance,
    duration,
    fare,
    payment_method,
    special_instructions,
    scheduled_time
  } = req.body;

  // Validate required fields
  if (!pickup_location || !dropoff_location || !fare) {
    res.status(400);
    throw new Error('Pickup location, dropoff location, and fare are required');
  }

  // Create taxi request
  const taxiRequest = await TaxiRequest.create({
    user_id: req.user.id,
    pickup_location,
    dropoff_location,
    vehicle_type: vehicle_type || 'Auto',
    distance: distance || 0,
    duration: duration || 0,
    fare,
    payment_method: payment_method || 'cash',
    special_instructions,
    scheduled_time: scheduled_time ? new Date(scheduled_time) : null
  });

  // ✅ Generate 6-digit OTP for taxi ride
  const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  taxiRequest.delivery_otp = {
    code: deliveryOtp,
    expiresAt,
    attempts_left: 5,
    resend_count: 0
  };
  await taxiRequest.save();
  console.log('✅ Taxi ride OTP generated:', deliveryOtp);

  // Create order assignment for rider app
  await OrderAssignment.create({
    order_id: taxiRequest._id,
    order_type: 'taxi',
    pickup_address: pickup_location.address,
    dropoff_address: dropoff_location.address,
    pickup_coordinates: [pickup_location.latitude, pickup_location.longitude],
    dropoff_coordinates: [dropoff_location.latitude, dropoff_location.longitude],
    fare: fare,
    status: 'assigned'
  });

  // ✅ Include OTP in response for frontend display
  const responseData = {
    ...taxiRequest.toObject(),
    delivery_otp: taxiRequest.delivery_otp?.code || null
  };

  res.status(201).json({
    success: true,
    data: responseData
  });
});

// @desc    Get all taxi requests for user
// @route   GET /api/taxi-requests
// @access  Private
exports.getUserTaxiRequests = asyncHandler(async (req, res, next) => {
  const taxiRequests = await TaxiRequest.find({ user_id: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: taxiRequests.length,
    data: taxiRequests
  });
});

// @desc    Get single taxi request
// @route   GET /api/taxi-requests/:id
// @access  Private
exports.getTaxiRequest = asyncHandler(async (req, res, next) => {
  const taxiRequest = await TaxiRequest.findById(req.params.id)
    .populate('user', 'name email phone');

  if (!taxiRequest) {
    res.status(404);
    throw new Error(`Taxi request not found with id of ${req.params.id}`);
  }

  // Make sure user owns taxi request
  if (taxiRequest.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to access this taxi request`);
  }

  res.status(200).json({
    success: true,
    data: taxiRequest
  });
});

// @desc    Update taxi request status
// @route   PUT /api/taxi-requests/:id/status
// @access  Private
exports.updateTaxiRequestStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const taxiRequest = await TaxiRequest.findById(req.params.id);

  if (!taxiRequest) {
    res.status(404);
    throw new Error(`Taxi request not found with id of ${req.params.id}`);
  }

  // Update status and related timestamps
  taxiRequest.status = status;
  
  if (status === 'assigned') {
    taxiRequest.assigned_at = new Date();
  } else if (status === 'picked_up') {
    taxiRequest.picked_up_at = new Date();
  } else if (status === 'completed') {
    taxiRequest.completed_at = new Date();
  } else if (status === 'cancelled') {
    taxiRequest.cancelled_at = new Date();
  }

  await taxiRequest.save();

  res.status(200).json({
    success: true,
    data: taxiRequest
  });
});

// @desc    Cancel taxi request
// @route   PUT /api/taxi-requests/:id/cancel
// @access  Private
exports.cancelTaxiRequest = asyncHandler(async (req, res, next) => {
  const { cancellation_reason } = req.body;

  const taxiRequest = await TaxiRequest.findById(req.params.id);

  if (!taxiRequest) {
    res.status(404);
    throw new Error(`Taxi request not found with id of ${req.params.id}`);
  }

  // Make sure user owns taxi request
  if (taxiRequest.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to cancel this taxi request`);
  }

  // Check if can be cancelled
  if (['completed', 'cancelled', 'picked_up'].includes(taxiRequest.status)) {
    res.status(400);
    throw new Error(`Cannot cancel taxi request with status: ${taxiRequest.status}`);
  }

  taxiRequest.status = 'cancelled';
  taxiRequest.cancelled_at = new Date();
  taxiRequest.cancellation_reason = cancellation_reason || 'Cancelled by user';

  await taxiRequest.save();

  res.status(200).json({
    success: true,
    data: taxiRequest
  });
});

// @desc    Rate taxi request
// @route   PUT /api/taxi-requests/:id/rate
// @access  Private
exports.rateTaxiRequest = asyncHandler(async (req, res, next) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const taxiRequest = await TaxiRequest.findById(req.params.id);

  if (!taxiRequest) {
    res.status(404);
    throw new Error(`Taxi request not found with id of ${req.params.id}`);
  }

  // Make sure user owns taxi request
  if (taxiRequest.user_id.toString() !== req.user.id) {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to rate this taxi request`);
  }

  // Check if can be rated
  if (taxiRequest.status !== 'completed') {
    res.status(400);
    throw new Error('Can only rate completed taxi requests');
  }

  taxiRequest.rating = rating;
  taxiRequest.review = review;

  await taxiRequest.save();

  res.status(200).json({
    success: true,
    data: taxiRequest
  });
});

// @desc    Get all taxi requests (Admin)
// @route   GET /api/taxi-requests/admin
// @access  Private/Admin
exports.getAllTaxiRequests = asyncHandler(async (req, res, next) => {
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

  const total = await TaxiRequest.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const taxiRequests = await TaxiRequest.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({
    success: true,
    count: taxiRequests.length,
    total,
    totalPages,
    currentPage: parseInt(page),
    data: taxiRequests
  });
});
