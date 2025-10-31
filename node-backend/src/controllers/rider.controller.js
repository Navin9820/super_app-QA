const Rider = require('../models/rider');
const OrderAssignment = require('../models/orderAssignment');
const PorterBooking = require('../models/porterbooking');
const PorterRequest = require('../models/porterrequest');
const PorterRide = require('../models/porterRide');
const TaxiRide = require('../models/taxiride');
const TaxiRequest = require('../models/taxirequest');
const GroceryOrder = require('../models/groceryorder');
const FoodOrder = require('../models/foodorder');
const Order = require('../models/order');
const Warehouse = require('../models/warehouse');
const TaxiDriver = require('../models/taxidriver');
const PorterDriver = require('../models/porterdriver');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');


// @desc    Register rider
// @route   POST /api/riders/register
// @access  Public
exports.registerRider = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    vehicle_type,
    license_number,
    vehicle_number,
    vehicle_model,
    vehicle_color
  } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password || !vehicle_type || !license_number || !vehicle_number || !vehicle_model || !vehicle_color) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      error: 'MISSING_FIELDS',
      details: 'Please fill in all required fields including vehicle information'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      error: 'INVALID_EMAIL',
      details: 'Please enter a valid email address'
    });
  }

  // Validate phone format (basic check)
  if (phone.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number',
      error: 'INVALID_PHONE',
      details: 'Please enter a valid phone number'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password too short',
      error: 'WEAK_PASSWORD',
      details: 'Password must be at least 6 characters long'
    });
  }

  // Check if rider already exists
  const existingRider = await Rider.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingRider) {
    return res.status(409).json({
      success: false,
      message: 'Account already exists',
      error: 'DUPLICATE_ACCOUNT',
      details: existingRider.email === email ? 'This email is already registered' : 'This phone number is already registered'
    });
  }

  try {
    // Create rider
    const rider = await Rider.create({
      name,
      email,
      phone,
      password,
      vehicle_type,
      license_number,
      vehicle_number,
      vehicle_model,
      vehicle_color
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: rider._id, type: 'rider' },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Rider registered successfully',
      token,
      data: rider
    });
  } catch (error) {
    // Handle database validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.join(', ')
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: 'Account already exists',
        error: 'DUPLICATE_ACCOUNT',
        details: `This ${field} is already registered`
      });
    }
    
    // Handle other errors
    console.error('Rider registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: 'SERVER_ERROR',
      details: 'Please try again later'
    });
  }
});

// @desc    Login rider
// @route   POST /api/riders/login
// @access  Public
exports.loginRider = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;

  // Validate email/phone and password
  if (!password) {
    res.status(400);
    throw new Error('Please provide password');
  }

  if (!email && !phone) {
    res.status(400);
    throw new Error('Please provide email or phone');
  }

  // First, check for regular rider
  let rider = await Rider.findOne({
    $or: [{ email }, { phone }]
  }).select('+password');

  let userType = 'rider';
  let driverData = null;

  // If no regular rider found, check for approved taxi/porter drivers
  if (!rider) {

    // Check for taxi driver (active or pending approval)
    let taxiDriver = await TaxiDriver.findOne({
      $or: [{ email }, { phone }],
      status: { $in: ['active', 'pending_approval'] }
    });

    if (taxiDriver) {
      // Get the associated user record for password verification
      const user = await User.findById(taxiDriver.user_id).select('+password');
      if (user && await user.comparePassword(password)) {
        userType = 'taxi_driver';
        driverData = taxiDriver;
        // Create a rider-like object for compatibility
        rider = {
          _id: taxiDriver._id,
          name: taxiDriver.name,
          email: taxiDriver.email,
          phone: taxiDriver.phone,
          status: taxiDriver.status,
          module_type: taxiDriver.module_type,
          license_number: taxiDriver.license_number,
          vehicle_type: 'taxi',
          last_active: new Date()
        };
      }
    } else {
      // Check for porter driver (active or pending approval)
      let porterDriver = await PorterDriver.findOne({
        $or: [{ email }, { phone }],
        status: { $in: ['active', 'pending_approval'] }
      });

      if (porterDriver) {
        // Get the associated user record for password verification
        const user = await User.findById(porterDriver.user_id).select('+password');
        if (user && await user.comparePassword(password)) {
          userType = 'porter_driver';
          driverData = porterDriver;
          // Create a rider-like object for compatibility
          rider = {
            _id: porterDriver._id,
            name: porterDriver.name,
            email: porterDriver.email,
            phone: porterDriver.phone,
            status: porterDriver.status,
            module_type: porterDriver.module_type,
            license_number: porterDriver.license_number,
            vehicle_type: 'porter',
            last_active: new Date()
          };
        }
      }
    }

    // If still no valid user found
    if (!rider) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } else {
    // Regular rider found, verify password
    const isMatch = await rider.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if rider is active or pending verification
    if (rider.status !== 'active' && rider.status !== 'pending_verification') {
      res.status(401);
      throw new Error('Account is not active. Please contact support.');
    }
  }

  // Update last active for all user types
  if (userType === 'rider') {
    rider.last_active = new Date();
    await rider.save();
  }

  // Generate JWT token with user type
  const token = jwt.sign(
    { 
      id: rider._id, 
      type: userType,
      driverData: driverData ? {
        module_type: driverData.module_type,
        license_number: driverData.license_number,
        status: driverData.status
      } : null
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Return appropriate data structure
  const responseData = {
    success: true,
    token,
    data: {
      ...rider.toObject ? rider.toObject() : rider,
      user_type: userType,
      driver_data: driverData
    }
  };

  res.json(responseData);
});

// @desc    Get rider profile
// @route   GET /api/riders/profile
// @access  Private
exports.getRiderProfile = asyncHandler(async (req, res, next) => {
  let profileData = null;
  let userType = 'rider';

  // Check user type from JWT token
  if (req.rider.type === 'taxi_driver') {
    const taxiDriver = await TaxiDriver.findById(req.rider.id);
    if (taxiDriver) {
      profileData = taxiDriver;
      userType = 'taxi_driver';
    }
  } else if (req.rider.type === 'porter_driver') {
    const porterDriver = await PorterDriver.findById(req.rider.id);
    if (porterDriver) {
      profileData = porterDriver;
      userType = 'porter_driver';
    }
  } else {
    // Regular rider
    profileData = await Rider.findById(req.rider.id);
  }

  if (!profileData) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json({
    success: true,
    data: {
      ...profileData.toObject(),
      user_type: userType
    }
  });
});

// @desc    Update rider profile
// @route   PUT /api/riders/profile
// @access  Private
exports.updateRiderProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    vehicle_model: req.body.vehicle_model,
    vehicle_color: req.body.vehicle_color,
    documents: req.body.documents,
    bank_details: req.body.bank_details,
    preferences: req.body.preferences
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  let updatedProfile = null;
  let userType = 'rider';

  // Update based on user type
  if (req.rider.type === 'taxi_driver') {
    updatedProfile = await TaxiDriver.findByIdAndUpdate(
      req.rider.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    userType = 'taxi_driver';
  } else if (req.rider.type === 'porter_driver') {
    updatedProfile = await PorterDriver.findByIdAndUpdate(
      req.rider.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    userType = 'porter_driver';
  } else {
    // Regular rider
    updatedProfile = await Rider.findByIdAndUpdate(
      req.rider.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
  }

  if (!updatedProfile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json({
    success: true,
    data: {
      ...updatedProfile.toObject(),
      user_type: userType
    }
  });
});

// @desc    Update rider location
// @route   POST /api/riders/location
// @access  Private
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const rider = await Rider.findByIdAndUpdate(
    req.rider.id,
    {
      current_location: {
        latitude,
        longitude,
        updated_at: new Date()
      },
      last_active: new Date()
    },
    { new: true }
  );

  res.json({
    success: true,
    data: rider
  });
});

// @desc    Toggle online status
// @route   PUT /api/riders/online-status
// @access  Private
exports.toggleOnlineStatus = asyncHandler(async (req, res, next) => {
  let rider = null;
  let userType = req.rider.type || 'rider';

  // Find rider based on user type
  if (userType === 'taxi_driver') {
    rider = await TaxiDriver.findById(req.rider.id);
  } else if (userType === 'porter_driver') {
    rider = await PorterDriver.findById(req.rider.id);
  } else {
    rider = await Rider.findById(req.rider.id);
  }

  if (!rider) {
    return res.status(404).json({
      success: false,
      message: 'Rider not found'
    });
  }

  // Toggle online status
  rider.is_online = !rider.is_online;
  rider.last_active = new Date();
  
  await rider.save();

  res.json({
    success: true,
    data: {
      is_online: rider.is_online,
      message: rider.is_online ? 'You are now online' : 'You are now offline'
    }
  });
});

// @desc    Get available orders
// @route   GET /api/riders/orders/available
// @access  Private
exports.getAvailableOrders = asyncHandler(async (req, res, next) => {
  const { order_type, vehicle_type } = req.query;
  
  console.log('🎯 SUCCESS: getAvailableOrders endpoint called!');
  console.log('🔍 Request headers received:', Object.keys(req.headers));
  console.log('🔍 x-user-id header value:', req.headers['x-user-id']);
  console.log('🔍 req.rider.id:', req.rider.id);
  
  // Get rider preferences  
  console.log('🔍 Searching for rider with ID:', req.rider.id, 'Type:', typeof req.rider.id);
  
  let rider;
  let riderType = 'rider';
  
  try {
    // First try to find in regular Rider collection
    rider = await Rider.findById(req.rider.id);
    if (rider) {
      console.log('🔍 Found in Rider collection:', { id: rider._id, module_type: rider.module_type });
      riderType = 'rider';
    }
  } catch (error) {
    console.log('🔍 Rider lookup ERROR:', error.message);
  }
  
  // If not found in Rider collection, try TaxiDriver collection first
  if (!rider) {
    try {
      const TaxiDriver = require('../models/taxidriver');
      const taxiDriver = await TaxiDriver.findById(req.rider.id);
      if (taxiDriver) {
        rider = {
          _id: taxiDriver._id,
          name: taxiDriver.name,
          email: taxiDriver.email,
          phone: taxiDriver.phone,
          module_type: 'taxi', // Taxi drivers are always taxi type
          status: taxiDriver.status
        };
        console.log('🔍 Found in TaxiDriver collection:', { id: rider._id, name: rider.name, status: rider.status });
        riderType = 'taxi_driver';
      }
    } catch (error) {
      console.log('🔍 TaxiDriver lookup ERROR:', error.message);
    }
  }

  // If still not found, try PorterDriver collection
  if (!rider) {
    try {
      const PorterDriver = require('../models/porterdriver');
      const porterDriver = await PorterDriver.findById(req.rider.id);
      if (porterDriver) {
        rider = {
          _id: porterDriver._id,
          name: porterDriver.name,
          email: porterDriver.email,
          phone: porterDriver.phone,
          module_type: 'porter', // Porter drivers are always porter type
          status: porterDriver.status
        };
        console.log('🔍 Found in PorterDriver collection:', { id: rider._id, name: rider.name, status: rider.status });
        riderType = 'porter_driver';
      }
    } catch (error) {
      console.log('🔍 PorterDriver lookup ERROR:', error.message);
    }
  }
  
  // Final fallback - if still not found, try to find any approved driver (porter or taxi)
  if (!rider) {
    try {
      // Check if there are any taxi drivers first
      const TaxiDriver = require('../models/taxidriver');
      const taxiDriverCount = await TaxiDriver.countDocuments({ status: 'active' });
      console.log(`🔍 Available taxi drivers: ${taxiDriverCount}`);
      
      if (taxiDriverCount > 0) {
        // Use any active taxi driver
        const approvedTaxiDriver = await TaxiDriver.findOne({ status: 'active' }).sort({ createdAt: -1 });
        if (approvedTaxiDriver) {
          rider = {
            _id: approvedTaxiDriver._id,
            name: approvedTaxiDriver.name,
            email: approvedTaxiDriver.email,
            phone: approvedTaxiDriver.phone,
            module_type: 'taxi',
            status: approvedTaxiDriver.status
          };
          console.log('🔍 Fallback SUCCESS - Using latest approved taxi driver:', { id: rider._id, name: rider.name });
          riderType = 'taxi_driver';
        }
      } else {
        // If no taxi drivers found, try porter driver
        const PorterDriver = require('../models/porterdriver');
        const approvedPorterDriver = await PorterDriver.findOne({ status: 'active' }).sort({ createdAt: -1 });
        if (approvedPorterDriver) {
          rider = {
            _id: approvedPorterDriver._id,
            name: approvedPorterDriver.name,
            email: approvedPorterDriver.email,
            phone: approvedPorterDriver.phone,
            module_type: 'porter',
            status: approvedPorterDriver.status
          };
          console.log('🔍 Fallback SUCCESS - Using latest approved porter driver:', { id: rider._id, name: rider.name });
          riderType = 'porter_driver';
        } else {
          console.log('🔍 No approved drivers found');
        }
      }
    } catch (error) {
      console.log('🔍 Fallback driver lookup error:', error.message);
    }
  }
  
  if (!rider) {
    console.log('🔍 FINAL RESULT: No rider found in any collection');
  } else {
    console.log('🔍 FINAL RESULT: Using rider:', { id: rider._id, name: rider.name, module_type: rider.module_type, type: riderType });
  }
  
  // Build query for available orders
  let query = {};
  
  if (order_type) {
    query.order_type = order_type;
  }
  
  if (vehicle_type) {
    query.vehicle_type = vehicle_type;
  }

  // 🚀 DYNAMIC MODULE REGISTRY SYSTEM
  // This system automatically handles any order type without hardcoding
  
  const moduleRegistry = {
    // Porter Bookings
    porter: {
      model: PorterBooking,
      statusFilter: 'pending',
      paymentStatusFilter: 'completed',
      populateFields: ['user', 'name phone'],
      pickupField: 'pickup_location.address',
      dropoffField: 'dropoff_location.address',
      fareField: 'fare',
      distanceField: 'distance',
      vehicleTypeField: 'vehicle_type',
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: 'item_description',
      specialInstructionsField: 'special_instructions',
      defaultVehicleType: null, // Use field value
      defaultItemDescription: 'Porter service'
    },
    
    // Taxi Rides
    taxi: {
      model: TaxiRide,
      statusFilter: 'pending',
      paymentStatusFilter: null, // ✅ Allow any payment status
      populateFields: [
        { path: 'user', select: 'name phone' }
      ],
      pickupField: 'pickup_location.address',
      dropoffField: 'dropoff_location.address',
      fareField: 'fare',
      distanceField: 'distance',
      vehicleTypeField: 'vehicle_type', // ✅ Use customer's requested vehicle type
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: null, // Use default
      specialInstructionsField: null, // Use default
      defaultVehicleType: 'Auto', // ✅ Use Auto as default (matches model default)
      defaultItemDescription: 'Taxi ride'
    },
    
    // Grocery Orders
    grocery: {
      model: GroceryOrder,
      statusFilter: ['pending'],  // ✅ FIXED: Only show pending orders (like food orders)
      paymentStatusFilter: null,  // ✅ FIXED: Allow any payment status
      populateFields: [
        { path: 'user', select: 'name phone' }
      ],
      pickupField: null, // Use warehouse
      // Prefer detailed delivery_address; fallback to simple address string
      dropoffField: 'delivery_address',
      fareField: 'total_amount',
      distanceField: null, // Use default
      vehicleTypeField: null, // Use default
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: null, // Use default
      specialInstructionsField: null, // Use default
      defaultVehicleType: 'Bike',
      defaultItemDescription: 'Grocery items',
      useWarehouse: true,
      // ✅ FIXED: Add COD support for grocery orders
      complexPaymentFilter: {
        $or: [
          { payment_status: 'paid' },
          { payment_method: 'cod', payment_status: 'pending' }
        ]
      }
    },
    
    // Ecommerce Orders
    ecommerce: {
      model: Order,
      statusFilter: 'confirmed',
      paymentStatusFilter: null, // Complex filter
      populateFields: ['user', 'name phone'],
      pickupField: null, // Use warehouse
      dropoffField: 'shipping_address',
      fareField: 'total_amount',
      distanceField: null, // Use default
      vehicleTypeField: null, // Use default
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: null, // Use default
      specialInstructionsField: null, // Use default
      defaultVehicleType: 'Bike',
      defaultItemDescription: 'Ecommerce order',
      useWarehouse: true,
      complexPaymentFilter: {
        $or: [
          { payment_status: 'paid' },
          { payment_method: 'cod', payment_status: 'pending' }
        ]
      }
    },
    
    // Food Orders
    food: {
      model: FoodOrder,
      statusFilter: 'pending',
      paymentStatusFilter: null, // Complex filter
      populateFields: ['user', 'name phone', 'restaurant_id', 'name address phone'],
      pickupField: null, // Use warehouse
      dropoffField: 'delivery_address',
      fareField: 'total_amount',
      distanceField: null, // Use default
      vehicleTypeField: null, // Use default
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: null, // Use default
      specialInstructionsField: null, // Use default
      defaultVehicleType: 'Bike',
      defaultItemDescription: 'Food order',
      useWarehouse: true,
      complexPaymentFilter: {
        $or: [
          { payment_status: 'paid' },
          { payment_method: 'cod', payment_status: 'pending' }
        ]
      }
    },


    // Taxi Requests (legacy - keeping for backward compatibility)
    taxi_request: {
      model: TaxiRequest,
      statusFilter: 'pending',
      paymentStatusFilter: null,
      populateFields: ['user', 'name phone'],
      pickupField: 'pickup_location.address',
      dropoffField: 'dropoff_location.address',
      fareField: 'fare',
      distanceField: 'distance',
      vehicleTypeField: 'vehicle_type', // ✅ Use customer's requested vehicle type
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: null,
      specialInstructionsField: 'special_instructions', // ✅ Include special instructions
      defaultVehicleType: 'Auto', // ✅ Use Auto as default (matches model default)
      defaultItemDescription: 'Taxi request'
    },

    // Porter Requests
    porter_request: {
      model: PorterRequest,
      statusFilter: 'pending',
      paymentStatusFilter: null,
      populateFields: [
        { path: 'user', select: 'name phone' }
      ],
      pickupField: 'pickup_location.address',
      dropoffField: 'dropoff_location.address',
      fareField: 'fare',
      distanceField: 'distance',
      vehicleTypeField: 'vehicle_type',
      customerNameField: 'user.name',
      customerPhoneField: 'user.phone',
      itemDescriptionField: 'item_description',
      specialInstructionsField: 'special_instructions',
      defaultVehicleType: 'Auto',
      defaultItemDescription: 'Porter request'
    }
  };

  // Get orders that haven't been assigned yet
  const availableOrders = [];
  
  // Find default active warehouse once (for modules that need it)
  const defaultWarehouse = await Warehouse.findOne({ isActive: true, isDefault: true });
  const warehouseAddress = defaultWarehouse ? (defaultWarehouse.full_address || 'Default Warehouse') : 'Default Warehouse';

  // 🎯 DYNAMIC ORDER PROCESSING - Works with ANY module
  for (const [moduleKey, moduleConfig] of Object.entries(moduleRegistry)) {
    // Skip if specific order type requested and this isn't it
    if (order_type && order_type !== moduleKey) {
      continue;
    }

    try {
      // Build dynamic query based on module configuration
      let moduleQuery = {};
      
      // Handle status filter (can be string or array)
      if (Array.isArray(moduleConfig.statusFilter)) {
        moduleQuery.status = { $in: moduleConfig.statusFilter };
      } else {
        moduleQuery.status = moduleConfig.statusFilter;
      }
      
      // Handle complex payment filters
      if (moduleConfig.complexPaymentFilter) {
        Object.assign(moduleQuery, moduleConfig.complexPaymentFilter);
      } else if (moduleConfig.paymentStatusFilter) {
        moduleQuery.payment_status = moduleConfig.paymentStatusFilter;
      }

      // Execute dynamic query
      const moduleOrders = await moduleConfig.model.find(moduleQuery)
        .populate(...moduleConfig.populateFields);




      // Process each order dynamically
      for (const order of moduleOrders) {

        // Check if already assigned (dynamic status check)
        const existingAssignment = await OrderAssignment.findOne({
          order_id: order._id,
          order_type: moduleKey,
          status: { $in: ['delivered', 'cancelled'] }  // ✅ Only exclude completed orders
        });

        if (!existingAssignment) {
          // 🎯 DYNAMIC FIELD EXTRACTION - No hardcoded field names
          const pickup = moduleConfig.useWarehouse ? warehouseAddress : 
                        (moduleConfig.pickupField ? getNestedValue(order, moduleConfig.pickupField) : 'Pickup Location');
          
          const dropoff = moduleConfig.dropoffField ? 
                          (moduleKey === 'taxi' || moduleKey === 'taxi_request' ? 
                            getNestedValue(order, moduleConfig.dropoffField) : 
                            formatAddress(order, moduleConfig.dropoffField)) : 'Delivery Location';
          
          const fare = moduleConfig.fareField ? 
                      Math.round(Number(getNestedValue(order, moduleConfig.fareField)) || 0) : 0;
          
          const distance = moduleConfig.distanceField ? 
                          getNestedValue(order, moduleConfig.distanceField) : 0;
          
          const vehicleType = moduleConfig.vehicleTypeField ? 
                             getNestedValue(order, moduleConfig.vehicleTypeField) : 
                             moduleConfig.defaultVehicleType;
          
          
          // ✅ PRIORITY: Use new customer fields first (for new orders)
          let customerName = order.customer_name || 
                            (moduleConfig.customerNameField ? getNestedValue(order, moduleConfig.customerNameField) : 'Customer');
          
          let customerPhone = order.customer_phone || 
                             (moduleConfig.customerPhoneField ? getNestedValue(order, moduleConfig.customerPhoneField) : '');
          
          // If no phone from order, use current session phone as fallback
          if (!customerPhone && global.currentUserSession && global.currentUserSession.phone) {
            customerPhone = global.currentUserSession.phone;
          }
          
          const itemDescription = moduleConfig.itemDescriptionField ? 
                                 getNestedValue(order, moduleConfig.itemDescriptionField) : 
                                 moduleConfig.defaultItemDescription;
          
          const specialInstructions = moduleConfig.specialInstructionsField ? 
                                     getNestedValue(order, moduleConfig.specialInstructionsField) : '';


          // 🎯 DYNAMIC ORDER OBJECT CREATION
          const orderObject = {
            id: order._id,
            type: moduleKey,
            pickup,
            dropoff,
            fare,
            distance,
            vehicle_type: vehicleType,
            customer: customerName,
            customer_phone: customerPhone,
            created_at: order.createdAt,
            item_description: itemDescription
          };


          // Only add special instructions if they exist
          if (specialInstructions) {
            orderObject.special_instructions = specialInstructions;
          }

          // Add customer vehicle information for taxi rides and taxi requests
          if (moduleKey === 'taxi' || moduleKey === 'taxi_request') {
            // Customer's requested vehicle type - this should be the actual customer choice
            const customerVehicleType = order.vehicle_type || 'Auto';
            orderObject.customer_vehicle_type = customerVehicleType;
            orderObject.vehicle_type = customerVehicleType; // Set the main vehicle_type to customer's choice
            orderObject.special_instructions = order.special_instructions || '';
            
          }

          // Add customer vehicle information for porter requests
          if (moduleKey === 'porter_request') {
            // Customer's requested vehicle type - this should be the actual customer choice
            const customerVehicleType = order.vehicle_type || 'Auto';
            orderObject.customer_vehicle_type = customerVehicleType;
            orderObject.vehicle_type = customerVehicleType; // Set the main vehicle_type to customer's choice
            orderObject.special_instructions = order.special_instructions || '';
            
          }

          availableOrders.push(orderObject);
        } else {
          // Order already completed - skipping
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${moduleKey} module:`, error);
      // Continue with other modules instead of failing completely
    }
  }

  // Final available orders processed

  // 🎯 SERVICE-BASED FILTERING: Filter orders based on rider's service type
  let filteredOrders = availableOrders;
  
  if (rider && rider.module_type) {
    console.log(`🔍 Backend - Filtering orders for rider service type: ${rider.module_type}`);
    console.log(`🔍 Backend - Total orders before filtering: ${availableOrders.length}`);
    
    switch (rider.module_type) {
      case 'taxi':
        // Taxi drivers only see taxi ride requests
        filteredOrders = availableOrders.filter(order => 
          order.type === 'taxi' || order.type === 'taxi_request' || order.order_type === 'taxi'
        );
        console.log(`🚕 Backend - Taxi driver filtered orders: ${filteredOrders.length}`);
        break;
        
      case 'porter':
        // Porter drivers only see porter delivery requests
        filteredOrders = availableOrders.filter(order => 
          order.type === 'porter' || order.type === 'porter_request'
        );
        console.log(`📦 Backend - Porter driver filtered orders: ${filteredOrders.length}`);
        break;
        
      case 'rider':
      default:
        // General delivery riders see ecommerce, food (restaurant), and grocery orders
        filteredOrders = availableOrders.filter(order => 
          order.type === 'ecommerce' || order.type === 'food' || order.type === 'grocery'
        );
        console.log(`🚚 Backend - General rider filtered orders: ${filteredOrders.length}`);
        break;
    }
  } else {
    console.log('🔍 Backend - No rider module_type found, showing all orders');
  }

  // Sort by creation time (newest first)
  filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    success: true,
    data: filteredOrders
  });
});

// @desc    Accept order assignment
// @route   POST /api/riders/orders/:orderId/accept
// @access  Private
exports.acceptOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { order_type } = req.body;

  if (!order_type) {
    res.status(400);
    throw new Error('Order type is required');
  }

  // 🚀 DYNAMIC ORDER ACCEPTANCE - Handle both new and existing assignments
  
  // Check if order is already assigned to THIS rider
  let myExistingAssignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: order_type,
    rider_id: req.rider.id
  });

  if (myExistingAssignment) {
    // Rider already has this order - check if they can accept it
    if (myExistingAssignment.status === 'accepted') {
      res.status(400);
      throw new Error('You have already accepted this order');
    }
    
    // Update existing assignment to accepted
    myExistingAssignment.status = 'accepted';
    myExistingAssignment.accepted_at = new Date();
    await myExistingAssignment.save();
    
    
    // Update rider stats
    await Rider.findByIdAndUpdate(req.rider.id, {
      $inc: { total_orders: 1 },
      last_active: new Date()
    });

    res.json({
      success: true,
      data: myExistingAssignment,
      message: 'Order accepted successfully'
    });
    return;
  }

  // Check if order is already assigned to ANOTHER rider (exclude null rider_id assignments)
  const otherRiderAssignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: order_type,
    status: { $in: ['assigned', 'accepted'] },
    rider_id: { $ne: req.rider.id, $ne: null }  // ✅ FIXED: Exclude null rider_id assignments
  });

  if (otherRiderAssignment) {
    res.status(400);
    throw new Error('Order is already assigned to another rider');
  }

  // Check if there's an unassigned assignment (created when order was made)
  const unassignedAssignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: order_type,
    status: 'assigned',
    rider_id: null  // No rider assigned yet
  });

  if (unassignedAssignment) {
    // Update the unassigned assignment to assign it to this rider
    unassignedAssignment.rider_id = req.rider.id;
    unassignedAssignment.status = 'accepted';
    unassignedAssignment.accepted_at = new Date();
    await unassignedAssignment.save();
    
    // Update the actual order status based on order type
    let orderModel;
    switch (order_type) {
      case 'porter':
        orderModel = PorterRequest;
        break;
      case 'taxi':
        orderModel = TaxiRide;
        break;
      case 'food':
        orderModel = FoodOrder;
        break;
      case 'grocery':
        orderModel = GroceryOrder;
        break;
      case 'ecommerce':
        orderModel = Order;
        break;
    }
    
  if (orderModel) {
    const orderUpdateData = { status: 'accepted' };
    
    console.log('🔍 Rider Controller (2nd part): Order type received:', order_type);
    console.log('🔍 Rider Controller (2nd part): Order ID:', orderId);
    
    // Special handling for food and grocery orders
    if (order_type === 'food') {
        orderUpdateData.status = 'confirmed'; // Food orders use 'confirmed' instead of 'accepted'
        orderUpdateData.tracking_info = {
          order_confirmed_at: new Date()
        };
        // ✅ NEW: Add driver information for food orders
        const rider = await Rider.findById(req.rider.id);
        if (rider) {
          orderUpdateData.driver_info = {
            driver_id: req.rider.id,
            driver_name: rider.name,
            driver_phone: rider.phone,
            vehicle_type: rider.vehicle_type,
            vehicle_number: rider.vehicle_number,
            assigned_at: new Date()
          };
        }
      } else if (order_type === 'grocery') {
        orderUpdateData.status = 'confirmed'; // Grocery orders use 'confirmed' instead of 'accepted'
        orderUpdateData.tracking_info = {
          order_confirmed_at: new Date()
        };
        // ✅ NEW: Add driver information for grocery orders
        const rider = await Rider.findById(req.rider.id);
        if (rider) {
          orderUpdateData.driver_info = {
            driver_id: req.rider.id,
            driver_name: rider.name,
            driver_phone: rider.phone,
            vehicle_type: rider.vehicle_type,
            vehicle_number: rider.vehicle_number,
            assigned_at: new Date()
          };
        }
      } else if (order_type === 'porter') {
        // ✅ NEW: Add driver information for porter orders
        const rider = await Rider.findById(req.rider.id);
        if (rider) {
          orderUpdateData.driver_info = {
            driver_id: req.rider.id,
            driver_name: rider.name,
            driver_phone: rider.phone,
            vehicle_type: rider.vehicle_type,
            vehicle_number: rider.vehicle_number,
            assigned_at: new Date()
          };
          console.log('🔍 Rider Controller: Saving porter driver info:', orderUpdateData.driver_info);
        }
      }
      
      // ✅ NEW: Add driver information for ecommerce orders (home clothes)
      if (order_type === 'ecommerce') {
        // Get rider details
        const rider = await Rider.findById(req.rider.id);
        if (rider) {
          orderUpdateData.driver_info = {
            driver_id: req.rider.id,
            driver_name: rider.name,
            driver_phone: rider.phone,
            vehicle_type: rider.vehicle_type,
            vehicle_number: rider.vehicle_number,
            assigned_at: new Date()
          };
        }
      }
      
      console.log('🔍 Rider Controller: Final orderUpdateData:', orderUpdateData);
      console.log('🔍 Rider Controller: Updating order with ID:', orderId);
      const updatedOrder = await orderModel.findByIdAndUpdate(orderId, orderUpdateData, { new: true });
      console.log('🔍 Rider Controller: Updated order result:', updatedOrder);
    }
    
    // Update rider stats
    await Rider.findByIdAndUpdate(req.rider.id, {
      $inc: { total_orders: 1 },
      last_active: new Date()
    });

    res.json({
      success: true,
      data: unassignedAssignment,
      message: 'Order accepted successfully'
    });
    return;
  }

  // Create new assignment if none exists
  const newAssignment = await OrderAssignment.create({
    order_id: orderId,
    order_type: order_type,
    rider_id: req.rider.id,
    status: 'accepted',
    accepted_at: new Date()
  });
  
  // Update the actual order status based on order type
  let orderModel;
  switch (order_type) {
    case 'porter':
      orderModel = PorterRequest;
      break;
    case 'taxi':
      orderModel = TaxiRide;
      break;
    case 'food':
      orderModel = FoodOrder;
      break;
    case 'grocery':
      orderModel = GroceryOrder;
      break;
    case 'ecommerce':
      orderModel = Order;
      break;
  }
  
  if (orderModel) {
    const orderUpdateData = { status: 'accepted' };
    
    console.log('🔍 Rider Controller: Order type received:', order_type);
    console.log('🔍 Rider Controller: Order ID:', orderId);
    
    // Special handling for food and grocery orders
    if (order_type === 'food') {
      orderUpdateData.status = 'confirmed'; // Food orders use 'confirmed' instead of 'accepted'
      orderUpdateData.tracking_info = {
        order_confirmed_at: new Date()
      };
      // ✅ NEW: Add driver information for food orders
      const rider = await Rider.findById(req.rider.id);
      if (rider) {
        orderUpdateData.driver_info = {
          driver_id: req.rider.id,
          driver_name: rider.name,
          driver_phone: rider.phone,
          vehicle_type: rider.vehicle_type,
          vehicle_number: rider.vehicle_number,
          assigned_at: new Date()
        };
      }
    } else if (order_type === 'grocery') {
      orderUpdateData.status = 'confirmed'; // Grocery orders use 'confirmed' instead of 'accepted'
      orderUpdateData.tracking_info = {
        order_confirmed_at: new Date()
      };
      // ✅ NEW: Add driver information for grocery orders
      const rider = await Rider.findById(req.rider.id);
      if (rider) {
        orderUpdateData.driver_info = {
          driver_id: req.rider.id,
          driver_name: rider.name,
          driver_phone: rider.phone,
          vehicle_type: rider.vehicle_type,
          vehicle_number: rider.vehicle_number,
          assigned_at: new Date()
        };
      }
    } else if (order_type === 'porter') {
      // ✅ NEW: Add driver information for porter orders
      const rider = await Rider.findById(req.rider.id);
      if (rider) {
        orderUpdateData.driver_info = {
          driver_id: req.rider.id,
          driver_name: rider.name,
          driver_phone: rider.phone,
          vehicle_type: rider.vehicle_type,
          vehicle_number: rider.vehicle_number,
          assigned_at: new Date()
        };
        console.log('🔍 Rider Controller (2nd part): Saving porter driver info:', orderUpdateData.driver_info);
      }
    }
    
    // ✅ NEW: Add driver information for ecommerce orders (home clothes)
    if (order_type === 'ecommerce') {
      // Get rider details
      const rider = await Rider.findById(req.rider.id);
      if (rider) {
        orderUpdateData.driver_info = {
          driver_id: req.rider.id,
          driver_name: rider.name,
          driver_phone: rider.phone,
          vehicle_type: rider.vehicle_type,
          vehicle_number: rider.vehicle_number,
          assigned_at: new Date()
        };
      }
    }
    
    console.log('🔍 Rider Controller (2nd part): Final orderUpdateData:', orderUpdateData);
    console.log('🔍 Rider Controller (2nd part): Updating order with ID:', orderId);
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, orderUpdateData, { new: true });
    console.log('🔍 Rider Controller (2nd part): Updated order result:', updatedOrder);
  }

  // Update rider stats
  await Rider.findByIdAndUpdate(req.rider.id, {
    $inc: { total_orders: 1 },
    last_active: new Date()
  });

  res.json({
    success: true,
    data: newAssignment,
    message: 'Order accepted successfully'
  });
});

// @desc    Get order status
// @route   GET /api/riders/orders/:orderId/status
// @access  Private
exports.getOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { order_type } = req.query;

  if (!order_type) {
    res.status(400);
    throw new Error('Order type is required');
  }

  // Map frontend order types to backend order types
  let backendOrderType = order_type;
  if (order_type === 'porter') {
    backendOrderType = 'porter_request';
  } else if (order_type === 'taxi') {
    backendOrderType = 'taxi';
  } else if (order_type === 'food') {
    backendOrderType = 'food';
  }

  // Find assignment
  const assignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: backendOrderType
  });

  if (!assignment) {
    res.status(404);
    throw new Error('Order assignment not found');
  }

  // Get order details based on type
  let orderDetails = null;
  let orderModel;
  
  switch (backendOrderType) {
    case 'porter_request':
      orderModel = PorterRequest;
      break;
    case 'taxi':
      orderModel = TaxiRide;
      break;
    case 'taxi_request':
      orderModel = TaxiRequest;
      break;
    case 'food':
      orderModel = FoodOrder;
      break;
    case 'grocery':
      orderModel = GroceryOrder;
      break;
    case 'ecommerce':
      orderModel = Order;
      break;
    default:
      res.status(400);
      throw new Error('Invalid order type');
  }

  orderDetails = await orderModel.findById(orderId);

  // Add OTP number to order details if available
  if (orderDetails && orderDetails.payment_details?.delivery_otp?.code) {
    orderDetails = orderDetails.toObject();
    orderDetails.otp_number = orderDetails.payment_details.delivery_otp.code;
  }

  res.json({
    success: true,
    data: {
      order_id: orderId,
      order_type: backendOrderType,
      status: assignment.status,
      order_status: orderDetails?.status,
      assignment: assignment,
      order_details: orderDetails
    }
  });
});

// @desc    Update order status
// @route   PUT /api/riders/orders/:orderId/status
// @access  Private
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { status, order_type } = req.body;

  if (!status || !order_type) {
    res.status(400);
    throw new Error('Status and order type are required');
  }

  // Map frontend order types to backend order types
  let backendOrderType = order_type;
  if (order_type === 'porter') {
    backendOrderType = 'porter_request'; // Map 'porter' to 'porter_request'
  } else if (order_type === 'taxi') {
    backendOrderType = 'taxi'; // Keep 'taxi' as 'taxi' for TaxiRide model
  }

  // Find assignment - be more flexible with status
  let assignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: backendOrderType,
    rider_id: req.rider.id,
    status: { $in: ['accepted', 'picked_up', 'out_for_delivery'] }  // ✅ FIXED: Allow multiple valid statuses
  });

  if (!assignment) {
    // Try to find any assignment for this order (fallback)
    const anyAssignment = await OrderAssignment.findOne({
      order_id: orderId,
      order_type: backendOrderType,
      rider_id: req.rider.id
    });
    
    if (anyAssignment) {
      // Found assignment with unexpected status
      // Update the assignment status to accepted if it's in a weird state
      anyAssignment.status = 'accepted';
      await anyAssignment.save();
      assignment = anyAssignment;
    } else {
      // Try to find assignment without rider_id (unassigned)
      const unassignedAssignment = await OrderAssignment.findOne({
        order_id: orderId,
        order_type: backendOrderType,
        $or: [
          { rider_id: { $exists: false } },
          { rider_id: null }
        ]
      });
      
      if (unassignedAssignment) {
        // Found unassigned assignment, assigning to rider
        unassignedAssignment.rider_id = req.rider.id;
        unassignedAssignment.status = 'accepted';
        unassignedAssignment.accepted_at = new Date();
        await unassignedAssignment.save();
        assignment = unassignedAssignment;
      } else {
        res.status(404);
        throw new Error('Order assignment not found');
      }
    }
  }

  // Update assignment status - map frontend status to valid backend status
  let backendStatus = status;
  
  // Map frontend status to valid backend status
  if (status === 'out_for_delivery') {
    backendStatus = 'picked_up';  // ✅ Map 'out_for_delivery' to 'picked_up'
  } else if (status === 'customer_picked_up') {
    backendStatus = 'picked_up';  // ✅ Map 'customer_picked_up' to 'picked_up'
  } else if (status === 'trip_completed') {
    backendStatus = 'completed';  // ✅ Map 'trip_completed' to 'completed'
  } else if (status === 'destination_arrived') {
    backendStatus = 'delivered';  // ✅ Map 'destination_arrived' to 'delivered'
  }
  
  // Log status mapping for debugging
  if (status !== backendStatus) {
  }
  
  // Updating assignment status
  assignment.status = backendStatus;
  
  // Set timestamps based on status
  switch (backendStatus) {  // ✅ Use backendStatus instead of status
    case 'picked_up':
      assignment.picked_up_at = new Date();
      break;
    case 'delivered':
      assignment.delivered_at = new Date();
      break;
    case 'completed':
      assignment.completed_at = new Date();
      // Update rider earnings
      await Rider.findByIdAndUpdate(req.rider.id, {
        $inc: { 
          total_earnings: assignment.earnings,
          completed_orders: 1
        }
      });
      break;
    case 'cancelled':
      assignment.cancelled_at = new Date();
      assignment.cancellation_reason = req.body.cancellation_reason;
      // Update rider stats
      await Rider.findByIdAndUpdate(req.rider.id, {
        $inc: { cancelled_orders: 1 }
      });
      break;
    default:
      // Unknown status - no timestamp set
  }

  await assignment.save();

  // NEW: Sync status to main order collection
  try {
    // Syncing order status to main collection
    
    // Manually fetch order details based on backendOrderType
    let orderDetails = null;
    let orderModel;
    
    switch (backendOrderType) {
      case 'ecommerce':
        orderModel = Order; // Use imported model
        break;
      case 'food':
        orderModel = FoodOrder; // Use imported model
        break;
      case 'grocery':
        orderModel = GroceryOrder; // Use imported model
        break;
      case 'porter_request':
        orderModel = PorterRequest; // Use imported model
        break;
      case 'porter':
        orderModel = PorterRide; // Use imported model
        break;
      case 'taxi':
        orderModel = TaxiRide; // Use imported model
        break;
      case 'taxi_request':
        orderModel = TaxiRequest; // Use imported model
        break;
      default:
        break;
    }
    
    // Debug model loading
    
    if (orderModel) {
      orderDetails = await orderModel.findById(orderId);
      // Order details fetched
    }
    
    let orderUpdateData = {};
    
    switch (backendStatus) {
      case 'picked_up':
        // Different status mapping based on order type
        if (backendOrderType === 'porter_request') {
          orderUpdateData = { 
            status: 'in_transit', // Use 'in_transit' for PorterRequest model
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else if (backendOrderType === 'taxi_request' || backendOrderType === 'taxi') {
          orderUpdateData = { 
            status: 'picked_up', // Use 'picked_up' for Taxi models
            picked_up_at: new Date(),
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else if (backendOrderType === 'food') {
          orderUpdateData = { 
            status: 'out_for_delivery', // Use 'out_for_delivery' for FoodOrder model
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              pickup_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else if (backendOrderType === 'grocery') {
          orderUpdateData = { 
            status: 'out_for_delivery', // Use 'out_for_delivery' for GroceryOrder model
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else {
          // Default for other order types (ecommerce, etc.)
          orderUpdateData = { 
            status: 'processing', // Use valid ecommerce status instead of 'picked_up'
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        }
        break;
        
      case 'out_for_delivery':
        // Handle frontend 'out_for_delivery' status
        if (backendOrderType === 'porter_request') {
          orderUpdateData = { 
            status: 'in_transit', // Map to 'in_transit' for PorterRequest model
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else if (backendOrderType === 'taxi_request' || backendOrderType === 'taxi') {
          orderUpdateData = { 
            status: 'in_transit', // Map to 'in_transit' for Taxi models
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else if (backendOrderType === 'food') {
          orderUpdateData = { 
            status: 'out_for_delivery', // Keep 'out_for_delivery' for FoodOrder model
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              pickup_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else if (backendOrderType === 'grocery') {
          orderUpdateData = { 
            status: 'out_for_delivery', // Keep 'out_for_delivery' for GroceryOrder model
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        } else {
          // Default for other order types
          orderUpdateData = { 
            status: 'out_for_delivery',
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              picked_up_at: new Date(),
              rider_id: req.rider.id
            }
          };
        }
        break;
        
      case 'delivered':
        // Different status mapping based on order type
        if (backendOrderType === 'porter_request') {
          orderUpdateData = { 
            status: 'delivered',
            delivered_at: new Date(),
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              delivery_completed: true
            }
          };
          
          // For COD orders, mark as paid when delivered
          if (orderDetails?.payment_method === 'cod') {
            orderUpdateData.payment_status = 'paid';
          }
        } else if (backendOrderType === 'taxi_request' || backendOrderType === 'taxi') {
          orderUpdateData = { 
            status: 'delivered', // Taxi rides use 'delivered' for "Destination Arrived"
            delivered_at: new Date(),
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              destination_arrived: true
            }
          };
        } else if (backendOrderType === 'food') {
          orderUpdateData = { 
            status: 'delivered', // Food orders use 'delivered' status
            delivered_at: new Date(),
            actual_delivery_time: new Date(),
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              delivery_completed: true
            }
          };
          
          // For COD orders, mark as paid when delivered
          if (orderDetails?.payment_method === 'cod') {
            orderUpdateData.payment_status = 'paid';
          }
        } else if (backendOrderType === 'grocery') {
          orderUpdateData = { 
            status: 'delivered', // Grocery orders use 'delivered' status
            delivered_at: new Date(),
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              delivery_completed: true
            }
          };
          
          // For COD orders, mark as paid when delivered
          if (orderDetails?.payment_method === 'cod') {
            orderUpdateData.payment_status = 'paid';
          }
        } else {
          // Default for other order types
          orderUpdateData = { 
            status: 'delivered',
            delivered_at: new Date(),
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              delivery_completed: true
            }
          };
        }
        break;
        
      case 'completed':
        // Different status mapping based on order type
        if (backendOrderType === 'porter_request') {
          orderUpdateData = { 
            status: 'completed',
            delivered_at: new Date(),
            completed_at: new Date(),
            payment_status: 'paid', // Mark as paid when completed
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              completed_at: new Date(),
              delivery_completed: true
            }
          };
        } else if (backendOrderType === 'taxi_request' || backendOrderType === 'taxi') {
          orderUpdateData = { 
            status: 'completed',
            completed_at: new Date(),
            payment_status: 'paid', // Mark as paid when completed
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              completed_at: new Date()
            }
          };
        } else if (backendOrderType === 'food') {
          orderUpdateData = { 
            status: 'delivered', // Food orders use 'delivered' as final status
            delivered_at: new Date(),
            actual_delivery_time: new Date(),
            payment_status: 'paid', // Mark as paid when completed
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              delivery_completed: true
            }
          };
        } else if (backendOrderType === 'grocery') {
          orderUpdateData = { 
            status: 'delivered', // Grocery orders use 'delivered' as final status
            delivered_at: new Date(),
            payment_status: 'paid', // Mark as paid when completed
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              delivered_at: new Date(),
              delivery_completed: true
            }
          };
        } else {
          // Default for other order types
          orderUpdateData = { 
            status: 'completed',
            completed_at: new Date(),
            payment_status: 'paid',
            tracking_info: {
              ...(orderDetails?.tracking_info || {}),
              completed_at: new Date()
            }
          };
        }
        break;
        
      case 'cancelled':
        orderUpdateData = { 
          status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: req.body.cancellation_reason
        };
        break;
    }

    // Update the main order using the already fetched orderModel
    if (Object.keys(orderUpdateData).length > 0 && orderModel) {
      try {
        // Updating order with data
        
        const updatedOrder = await orderModel.findByIdAndUpdate(
          orderId,
          orderUpdateData,
          { new: true, runValidators: true }
        );
        
        if (updatedOrder) {
          // Order status synced to main collection
        } else {
        }
      } catch (updateError) {
        console.error(`Error updating order ${orderId} in main collection:`, updateError);
        console.error(`Error details:`, updateError.message);
        console.error(`Error stack:`, updateError.stack);
      }
    } else if (!orderModel) {
    } else {
    }
  } catch (syncError) {
    console.error('Error syncing order status to main collection:', syncError);
    // Don't fail the rider update if sync fails
  }

  res.json({
    success: true,
    data: assignment,
    message: `Order status updated to ${status} and synced to main collection`
  });
});

// @desc    Get rider earnings
// @route   GET /api/riders/earnings
// @access  Private
exports.getRiderEarnings = asyncHandler(async (req, res, next) => {
  const { period = 'all' } = req.query;
  
  const rider = await Rider.findById(req.rider.id);
  
  // Get assignments for the period
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'today':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
      break;
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { createdAt: { $gte: monthAgo } };
      break;
  }

  const assignments = await OrderAssignment.find({
    rider_id: req.rider.id,
    status: 'completed',
    ...dateFilter
  });

  const totalEarnings = assignments.reduce((sum, assignment) => sum + assignment.earnings, 0);
  const totalOrders = assignments.length;

  res.json({
    success: true,
    data: {
      total_earnings: totalEarnings,
      total_orders: totalOrders,
      period: period,
      assignments: assignments
    }
  });
});

// @desc    Get rider order history
// @route   GET /api/riders/orders
// @access  Private
exports.getRiderOrders = asyncHandler(async (req, res, next) => {
  const { status, order_type, limit = 50, page = 1 } = req.query;
  
  const query = { rider_id: req.rider.id };
  
  if (status) query.status = status;
  if (order_type) query.order_type = order_type;

  const assignments = await OrderAssignment.find(query)
    .populate('rider', 'name phone vehicle_type')
    .sort({ assigned_at: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  // Manually populate order details for each assignment
  const populatedAssignments = await Promise.all(
    assignments.map(async (assignment) => {
      let orderDetails = null;
      
      
      try {
        // Fetch order details based on order_type
        switch (assignment.order_type) {
          case 'ecommerce':
            orderDetails = await Order.findById(assignment.order_id)
              .populate('user', 'name phone');
            if (orderDetails) {
              // Get warehouse information for pickup address
              const defaultWarehouse = await Warehouse.findOne({ isActive: true, isDefault: true });
              
              const pickupAddress = defaultWarehouse ? (defaultWarehouse.full_address || 'Default Warehouse') : 'Default Warehouse';
              
              // Add warehouse info to order details
              orderDetails = orderDetails.toObject();
              orderDetails.warehouse_address = pickupAddress;
              
              // Add OTP number to order details
              orderDetails.otp_number = orderDetails.payment_details?.delivery_otp?.code || null;
              
            }
            break;
          case 'grocery':
            orderDetails = await GroceryOrder.findById(assignment.order_id)
              .populate('user', 'name phone');
            if (orderDetails) {
              // 🔧 FIXED: Grocery orders should ALSO use warehouse address (same as ecommerce)
              const defaultWarehouse = await Warehouse.findOne({ isActive: true, isDefault: true });
              
              const warehouseAddress = defaultWarehouse ? (defaultWarehouse.full_address || 'Default Warehouse') : 'Default Warehouse';
              
              // Add warehouse info to order details (same as ecommerce)
              orderDetails = orderDetails.toObject();
              orderDetails.warehouse_address = warehouseAddress;
              
              // Add OTP number to order details
              orderDetails.otp_number = orderDetails.payment_details?.delivery_otp?.code || null;
              
              // Grocery order structure processed
            }
            break;
          case 'food':
            orderDetails = await FoodOrder.findById(assignment.order_id)
              .populate('user', 'name phone')
              .populate('restaurant_id', 'name address phone');
            if (orderDetails) {
              // 🔧 FIXED: Food orders should ALSO use warehouse address (same as ecommerce)
              const defaultWarehouse = await Warehouse.findOne({ isActive: true, isDefault: true });
              
              const warehouseAddress = defaultWarehouse ? (defaultWarehouse.full_address || 'Default Warehouse') : 'Default Warehouse';
              
              // Add warehouse info to order details (same as ecommerce)
              orderDetails = orderDetails.toObject();
              orderDetails.warehouse_address = warehouseAddress;
              
              // Keep restaurant info for reference
              orderDetails.restaurant_address = orderDetails.restaurant_id?.address || 'Restaurant Location';
              
              // Add OTP number to order details
              orderDetails.otp_number = orderDetails.payment_details?.delivery_otp?.code || null;
              
              // Food order structure processed
            }
            break;
          case 'taxi':
            orderDetails = await TaxiRide.findById(assignment.order_id)
              .populate('user', 'name phone');
            if (orderDetails) {
              // Convert to object to ensure all fields are accessible
              orderDetails = orderDetails.toObject();
              orderDetails.customer_vehicle_type = orderDetails.vehicle_type || 'Car';
              orderDetails.otp_number = orderDetails.delivery_otp?.code || null;
            }
            break;
          case 'taxi_request':
            orderDetails = await TaxiRequest.findById(assignment.order_id)
              .populate('user', 'name phone');
            if (orderDetails) {
              // Add customer vehicle information to order details
              orderDetails = orderDetails.toObject();
              orderDetails.customer_vehicle_type = orderDetails.vehicle_type || 'Auto';
              orderDetails.otp_number = orderDetails.delivery_otp?.code || null;
            }
            break;
          case 'porter':
            orderDetails = await PorterBooking.findById(assignment.order_id)
              .populate('user', 'name phone');
            break;
          default:
        }
        
        // Convert to plain object and add order details
        const assignmentObj = assignment.toObject();
        assignmentObj.order = orderDetails;
        
        
        return assignmentObj;
      } catch (error) {
        console.error(`Error populating order details for ${assignment.order_type}:`, error);
        // Return assignment without order details if population fails
        const assignmentObj = assignment.toObject();
        assignmentObj.order = null;
        return assignmentObj;
      }
    })
  );

  const total = await OrderAssignment.countDocuments(query);

  res.json({
    success: true,
    data: populatedAssignments,
    pagination: {
      current_page: parseInt(page),
      total_pages: Math.ceil(total / parseInt(limit)),
      total_items: total,
      items_per_page: parseInt(limit)
    }
  });
});

// ==================== ECOMMERCE COD FLOWS ====================

// @desc    Mark ecommerce order as picked up (generate COD OTP if applicable)
// @route   POST /api/riders/orders/:orderId/pickup
// @access  Private (rider)
exports.pickupEcommerceOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const assignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: 'ecommerce',
    rider_id: req.rider.id
  });
  if (!assignment) {
    res.status(404);
    throw new Error('Order assignment not found');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update assignment status/time
  assignment.status = 'picked_up';
  assignment.picked_up_at = new Date();
  await assignment.save();

  // If COD, generate OTP stored in payment_details
  if (order.payment_method === 'cod') {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const details = order.payment_details || {};
    details.cod_otp = {
      code,
      expiresAt,
      attempts_left: 5,
      resend_count: details.cod_otp?.resend_count || 0
    };
    order.payment_details = details;
  }

  // Mark order out for delivery (shipped)
  order.status = 'shipped';
  await order.save();

  res.json({ success: true, message: 'Order picked up. COD OTP generated if required.' });
});

// @desc    Collect COD at delivery (verify OTP + amount)
// @route   POST /api/riders/orders/:orderId/cod-collect
// @access  Private (rider)
exports.collectEcommerceCOD = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { amount, otp } = req.body;

  // Try to find assignment, but don't require it
  const assignment = await OrderAssignment.findOne({
    order_id: orderId,
    order_type: 'ecommerce',
    rider_id: req.rider.id
  });
  
  // If no assignment found, that's okay - we'll proceed without it
  if (!assignment) {
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.payment_method !== 'cod') {
    res.status(400);
    throw new Error('Order is not COD');
  }

  if (Number(amount) !== Number(order.total_amount)) {
    res.status(400);
    throw new Error('Amount mismatch');
  }

  const details = order.payment_details || {};
  const otpInfo = details.delivery_otp || details.cod_otp; // Support both field names
  if (!otpInfo) {
    res.status(400);
    throw new Error('Delivery OTP not generated');
  }
  if (new Date(otpInfo.expiresAt).getTime() < Date.now()) {
    res.status(400);
    throw new Error('OTP expired');
  }
  if ((otpInfo.attempts_left || 0) <= 0) {
    res.status(400);
    throw new Error('OTP verification attempts exceeded');
  }
  if (String(otp) !== String(otpInfo.code)) {
    // Decrease attempts for the correct OTP field
    if (details.delivery_otp) {
      details.delivery_otp.attempts_left = Math.max(0, (details.delivery_otp.attempts_left || 0) - 1);
    } else if (details.cod_otp) {
      details.cod_otp.attempts_left = Math.max(0, (details.cod_otp.attempts_left || 0) - 1);
    }
    order.payment_details = details;
    await order.save();
    res.status(400);
    throw new Error('Incorrect OTP');
  }

  // Success → mark paid & delivered, record audit, clear OTP
  order.payment_status = 'paid';
  order.status = 'delivered';
  details.cod_collected_by = req.rider.id;
  details.cod_collected_at = new Date();
  details.cod_amount = Number(amount);
  // Clear the OTP field that was used
  if (details.delivery_otp) {
    delete details.delivery_otp;
  } else if (details.cod_otp) {
    delete details.cod_otp;
  }
  order.payment_details = details;
  await order.save();

  // Update assignment if it exists
  if (assignment) {
    assignment.status = 'completed';
    assignment.completed_at = new Date();
    await assignment.save();
  }

  res.json({ success: true, message: 'COD collected and order delivered.' });
});

// ==================== ADMIN CONTROLLERS ====================

// @desc    Get all riders (admin)
// @route   GET /api/riders
// @access  Admin
exports.getAllRiders = asyncHandler(async (req, res, next) => {
  const { status, vehicle_type, limit = 50, page = 1 } = req.query;
  
  const query = {};
  
  if (status) query.status = status;
  if (vehicle_type) query.vehicle_type = vehicle_type;

  const riders = await Rider.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Rider.countDocuments(query);

  res.json({
    success: true,
    data: riders,
    pagination: {
      current_page: parseInt(page),
      total_pages: Math.ceil(total / parseInt(limit)),
      total_items: total,
      items_per_page: parseInt(limit)
    }
  });
});

// @desc    Get rider by ID (admin)
// @route   GET /api/riders/:id
// @access  Admin
exports.getRiderById = asyncHandler(async (req, res, next) => {
  const rider = await Rider.findById(req.params.id).select('-password');
  
  if (!rider) {
    return res.status(404).json({
      success: false,
      message: 'Rider not found'
    });
  }

  // Get rider's order assignments
  const assignments = await OrderAssignment.find({ rider_id: req.params.id })
    .populate('order_id')
    .sort({ assigned_at: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      ...rider.toObject(),
      recent_assignments: assignments
    }
  });
});

// @desc    Update rider status (admin)
// @route   PUT /api/riders/:id/status
// @access  Admin
exports.updateRiderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['pending_verification', 'active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const rider = await Rider.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).select('-password');

  if (!rider) {
    return res.status(404).json({
      success: false,
      message: 'Rider not found'
    });
  }

  res.json({
    success: true,
    data: rider,
    message: `Rider status updated to ${status}`
  });
});

// 🛠 HELPER FUNCTIONS FOR DYNAMIC SYSTEM

/**
 * Get nested object value using dot notation (e.g., "user.name")
 * @param {Object} obj - The object to search in
 * @param {string} path - Dot notation path (e.g., "user.name")
 * @returns {*} The value at the path or null if not found
 */
function getNestedValue(obj, path) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Format address from order object using field path
 * @param {Object} order - The order object
 * @param {string} fieldPath - Path to address field (e.g., "shipping_address")
 * @returns {string} Formatted address string
 */
function formatAddress(order, fieldPath) {
  try {
    const addressObj = getNestedValue(order, fieldPath);
    if (!addressObj) return 'Address not available';
    
    // Handle different address formats dynamically
    if (typeof addressObj === 'string') {
      return addressObj;
    }
    
    // Handle object format (e.g., {address_line1, city, state, pincode})
    const addressParts = [
      addressObj.address_line1,
      addressObj.city,
      addressObj.state,
      addressObj.pincode
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
  } catch (error) {
    console.error(`Error formatting address for field ${fieldPath}:`, error);
    return 'Address not available';
  }
}

// @desc    Verify delivery OTP
// @route   POST /api/riders/orders/:orderId/verify-otp
// @access  Private
exports.verifyDeliveryOtp = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { otp, order_type } = req.body;

  if (!otp || !order_type) {
    res.status(400);
    throw new Error('OTP and order type are required');
  }

  try {
    let order = null;
    let orderModel = null;

    // Determine which model to use based on order type
    switch (order_type) {
      case 'ecommerce':
        orderModel = require('../models/order');
        order = await orderModel.findById(orderId);
        break;
      case 'grocery':
        orderModel = require('../models/groceryorder');
        order = await orderModel.findById(orderId);
        break;
      case 'food':
        orderModel = require('../models/foodorder');
        order = await orderModel.findById(orderId);
        break;
      case 'taxi':
      case 'taxi_request':
        orderModel = require('../models/taxiride');
        order = await orderModel.findById(orderId);
        break;
      case 'porter':
      case 'porter_request':
        orderModel = require('../models/porterrequest');
        order = await orderModel.findById(orderId);
        break;
      default:
        res.status(400);
        throw new Error('Invalid order type');
    }

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Check if OTP exists and is valid
    // For taxi and porter orders, OTP is stored directly in delivery_otp field
    // For other orders, OTP is stored in payment_details.delivery_otp
    const otpInfo = order_type === 'taxi' || order_type === 'taxi_request' || order_type === 'porter' || order_type === 'porter_request'
      ? order.delivery_otp 
      : order.payment_details?.delivery_otp;
    
    if (!otpInfo || !otpInfo.code) {
      res.status(400);
      throw new Error('No delivery OTP found for this order');
    }

    // Check if OTP has expired
    if (otpInfo.expiresAt && new Date() > new Date(otpInfo.expiresAt)) {
      res.status(400);
      throw new Error('OTP has expired');
    }

    // Check remaining attempts
    if (otpInfo.attempts_left <= 0) {
      res.status(400);
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Verify OTP
    if (otp !== otpInfo.code) {
      // Decrease attempts
      otpInfo.attempts_left -= 1;
      await order.save();
      
      res.status(400);
      throw new Error(`Invalid OTP. ${otpInfo.attempts_left} attempts remaining`);
    }

    // OTP is valid - reset attempts and mark as verified
    otpInfo.attempts_left = 5; // Reset for future use
    otpInfo.verified_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        orderId: order._id,
        orderType: order_type,
        verified: true
      }
    });

  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
});

// @desc    Collect COD payment
// @route   POST /api/rider/orders/:orderId/collect-cod
// @access  Private/Rider
exports.collectCod = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { amount, otp } = req.body;

  try {
    // Find the order (try different models)
    let order = null;
    let orderModel = null;

    // Try to find order in different collections
    const models = [
      { model: Order, type: 'ecommerce' },
      { model: GroceryOrder, type: 'grocery' },
      { model: FoodOrder, type: 'food' },
      { model: TaxiRide, type: 'taxi' },
      { model: PorterRequest, type: 'porter' }
    ];

    for (const { model, type } of models) {
      order = await model.findById(orderId);
      if (order) {
        orderModel = model;
        break;
      }
    }

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Verify the OTP (use the same OTP verification logic)
    let otpInfo = null;
    if (order.payment_details?.delivery_otp) {
      otpInfo = order.payment_details.delivery_otp;
    } else if (order.delivery_otp) {
      otpInfo = order.delivery_otp;
    }

    if (!otpInfo || !otpInfo.code) {
      res.status(400);
      throw new Error('No delivery OTP found for this order');
    }

    // Check if OTP is correct
    if (otpInfo.code !== otp) {
      res.status(400);
      throw new Error('Invalid OTP');
    }

    // Check if OTP has expired
    if (otpInfo.expiresAt && new Date() > new Date(otpInfo.expiresAt)) {
      res.status(400);
      throw new Error('OTP has expired');
    }

    // Check remaining attempts
    if (otpInfo.attempts_left <= 0) {
      res.status(400);
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Update order status to delivered
    order.status = 'delivered';
    order.completed_at = new Date();
    
    // Set payment_status based on order type and model
    if (orderModel === PorterBooking || orderModel === PorterRequest) {
      // Porter models support 'completed' for payment_status
      order.payment_status = 'completed';
    } else {
      // Other models (Order, FoodOrder, GroceryOrder, TaxiRide) use 'paid'
      order.payment_status = 'paid';
    }
    
    // Add COD collection details
    order.cod_collection = {
      amount: Number(amount),
      collected_at: new Date(),
      rider_id: req.rider.id
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'COD collected successfully',
      data: {
        orderId: order._id,
        amount: Number(amount),
        collectedAt: order.cod_collection.collected_at
      }
    });

  } catch (error) {
    console.error('Error collecting COD:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to collect COD'
    });
  }
});