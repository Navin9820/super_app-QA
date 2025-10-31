const PorterRequest = require('../models/porterrequest');
const OrderAssignment = require('../models/orderAssignment');
const asyncHandler = require('express-async-handler');

// @desc    Create new porter request
// @route   POST /api/porter-requests
// @access  Private
exports.createPorterRequest = asyncHandler(async (req, res, next) => {
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

  // Generate 6-digit OTP for porter request
  const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  console.log('🔍 porterRequest.controller.js - Generating OTP:', deliveryOtp);

  // Create porter request
  const porterRequest = await PorterRequest.create({
    user_id: req.user.id,
    pickup_location,
    dropoff_location,
    vehicle_type: vehicle_type || 'Auto',
    distance: distance || 0,
    duration: duration || 0,
    fare,
    payment_method: payment_method || 'cash',
    item_description: item_description || 'Porter service',
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

  console.log('✅ Porter request OTP generated and saved:', deliveryOtp);

  // Create order assignment for rider app
  const orderAssignment = await OrderAssignment.create({
    order_id: porterRequest._id,
    order_type: 'porter_request',
    pickup_address: pickup_location.address,
    dropoff_address: dropoff_location.address,
    pickup_coordinates: [pickup_location.latitude, pickup_location.longitude],
    dropoff_coordinates: [dropoff_location.latitude, dropoff_location.longitude],
    fare: fare,
    vehicle_type: vehicle_type || 'Auto',
    status: 'assigned'
  });
  
  console.log('✅ OrderAssignment created for porter request:', orderAssignment._id);

  // Include OTP in response
  const responseData = {
    ...porterRequest.toObject(),
    delivery_otp: porterRequest.delivery_otp?.code || null
  };

  console.log('🔍 porterRequest.controller.js - Response data being sent:', responseData);
  console.log('🔍 porterRequest.controller.js - OTP in response:', responseData.delivery_otp);

  res.status(201).json({
    success: true,
    data: responseData
  });
});

// @desc    Get all porter requests for user
// @route   GET /api/porter-requests
// @access  Private
exports.getUserPorterRequests = asyncHandler(async (req, res, next) => {
  const porterRequests = await PorterRequest.find({ user_id: req.user.id })
    .populate({
      path: 'driver_info.driver_id',
      select: 'name phone vehicle_type vehicle_number'
    }) // ✅ FIXED: Proper populate syntax
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: porterRequests.length,
    data: porterRequests
  });
});

// @desc    Get single porter request
// @route   GET /api/porter-requests/:id
// @access  Private
exports.getPorterRequest = asyncHandler(async (req, res, next) => {
  const porterRequest = await PorterRequest.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate({
      path: 'driver_info.driver_id',
      select: 'name phone vehicle_type vehicle_number'
    }); // ✅ FIXED: Proper populate syntax

  if (!porterRequest) {
    res.status(404);
    throw new Error(`Porter request not found with id of ${req.params.id}`);
  }

  // Make sure user owns porter request
  if (porterRequest.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to access this porter request`);
  }

  // Debug logging
  console.log('🔍 getPorterRequest: Driver info:', porterRequest.driver_info);
  console.log('🔍 getPorterRequest: Driver populated:', porterRequest.driver_info?.driver_id);

  res.status(200).json({
    success: true,
    data: porterRequest
  });
});

// @desc    Update porter request status
// @route   PUT /api/porter-requests/:id/status
// @access  Private
exports.updatePorterRequestStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const porterRequest = await PorterRequest.findById(req.params.id);

  if (!porterRequest) {
    res.status(404);
    throw new Error(`Porter request not found with id of ${req.params.id}`);
  }

  // Update status and related timestamps
  porterRequest.status = status;
  
  if (status === 'assigned') {
    porterRequest.assigned_at = new Date();
  } else if (status === 'picked_up') {
    porterRequest.picked_up_at = new Date();
  } else if (status === 'completed') {
    porterRequest.completed_at = new Date();
  } else if (status === 'cancelled') {
    porterRequest.cancelled_at = new Date();
  }

  await porterRequest.save();

  res.status(200).json({
    success: true,
    data: porterRequest
  });
});

// @desc    Cancel porter request
// @route   PUT /api/porter-requests/:id/cancel
// @access  Private
exports.cancelPorterRequest = asyncHandler(async (req, res, next) => {
  const { cancellation_reason } = req.body;

  const porterRequest = await PorterRequest.findById(req.params.id);

  if (!porterRequest) {
    res.status(404);
    throw new Error(`Porter request not found with id of ${req.params.id}`);
  }

  // Make sure user owns porter request
  if (porterRequest.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to cancel this porter request`);
  }

  // Check if can be cancelled
  if (['completed', 'cancelled', 'picked_up'].includes(porterRequest.status)) {
    res.status(400);
    throw new Error(`Cannot cancel porter request with status: ${porterRequest.status}`);
  }

  porterRequest.status = 'cancelled';
  porterRequest.cancelled_at = new Date();
  porterRequest.cancellation_reason = cancellation_reason || 'Cancelled by user';

  await porterRequest.save();

  res.status(200).json({
    success: true,
    data: porterRequest
  });
});

// @desc    Rate porter request
// @route   PUT /api/porter-requests/:id/rate
// @access  Private
exports.ratePorterRequest = asyncHandler(async (req, res, next) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const porterRequest = await PorterRequest.findById(req.params.id);

  if (!porterRequest) {
    res.status(404);
    throw new Error(`Porter request not found with id of ${req.params.id}`);
  }

  // Make sure user owns porter request
  if (porterRequest.user_id.toString() !== req.user.id) {
    res.status(401);
    throw new Error(`User ${req.user.id} is not authorized to rate this porter request`);
  }

  // Check if can be rated
  if (porterRequest.status !== 'completed') {
    res.status(400);
    throw new Error('Can only rate completed porter requests');
  }

  porterRequest.rating = rating;
  porterRequest.review = review;

  await porterRequest.save();

  res.status(200).json({
    success: true,
    data: porterRequest
  });
});

// @desc    Get all porter requests (Admin)
// @route   GET /api/porter-requests/admin
// @access  Private/Admin
exports.getAllPorterRequests = asyncHandler(async (req, res, next) => {
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

  const total = await PorterRequest.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const porterRequests = await PorterRequest.find(query)
    .populate('user_id', 'name email phone')
    .populate('driver_id', 'name phone rating')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({
    success: true,
    count: porterRequests.length,
    total,
    totalPages,
    currentPage: parseInt(page),
    data: porterRequests
  });
});
