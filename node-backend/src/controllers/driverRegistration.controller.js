/**
 * 🚗 Driver Registration Controller
 * 
 * Handles taxi and porter driver registration with:
 * - License document upload
 * - Approval workflow
 * - Dynamic domain support
 * - No hardcoded URLs
 */

const TaxiDriver = require('../models/taxidriver');
const PorterDriver = require('../models/porterdriver');
const Rider = require('../models/rider');
const User = require('../models/user');
const { processImageForDatabase } = require('../utils/imageProcessor');

// Helper function to get dynamic base URL
const getDynamicBaseUrl = (req) => {
  // ✅ DYNAMIC: No hardcoded URLs - everything from environment or request
  let baseUrl = process.env.BACKEND_URL || process.env.BASE_URL;
  
  if (!baseUrl) {
    // ✅ DYNAMIC: Auto-detect based on environment
    if (req.get('host') && req.get('host').includes('localhost')) {
      baseUrl = `http://${req.get('host')}`;
    } else if (process.env.NODE_ENV === 'production' || req.get('x-forwarded-proto') === 'https') {
      baseUrl = `https://${req.get('host')}`;
    } else {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
  }
  
  return baseUrl;
};

// Helper function to validate file
const validateLicenseFile = (file) => {
  if (!file) {
    throw new Error('License file is required');
  }
  
  // ✅ DYNAMIC: File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('License file must be JPG, PNG, or PDF');
  }
  
  // ✅ DYNAMIC: File size validation (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('License file size must be less than 5MB');
  }
  
  return true;
};

// Main registration function
exports.registerDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      module_type, // 'taxi' or 'porter'
      license_number,
      vehicle_type,
      vehicle_number,
      vehicle_model,
      vehicle_color
    } = req.body;

    // ✅ VALIDATION: Required fields
    if (!name || !email || !phone || !password || !module_type || !license_number) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, phone, password, module_type, license_number'
      });
    }

    // ✅ VALIDATION: Vehicle information for drivers
    if (!vehicle_type || !vehicle_number || !vehicle_model || !vehicle_color) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle information is required: vehicle_type, vehicle_number, vehicle_model, vehicle_color'
      });
    }

    // ✅ VALIDATION: Module type
    if (!['taxi', 'porter', 'rider'].includes(module_type)) {
      return res.status(400).json({
        success: false,
        message: 'module_type must be either "taxi", "porter", or "rider"'
      });
    }

    // ✅ VALIDATION: License file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'License file is required'
      });
    }

    // Validate license file
    try {
      validateLicenseFile(req.file);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // ✅ CHECK: User already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // ✅ CHECK: Driver already exists
    let existingDriver = null;
    if (module_type === 'taxi') {
      existingDriver = await TaxiDriver.findOne({
        $or: [{ email }, { phone }, { license_number }]
      });
    } else if (module_type === 'porter') {
      existingDriver = await PorterDriver.findOne({
        $or: [{ email }, { phone }, { license_number }]
      });
    } else if (module_type === 'rider') {
      existingDriver = await Rider.findOne({
        $or: [{ email }, { phone }, { license_number }]
      });
    }

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this email, phone, or license number already exists'
      });
    }

    // ✅ PROCESS: License file upload
    let licenseFilePath = null;
    try {
      // console.log('🔍 DEBUG: Processing driver license file');
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      licenseFilePath = processedImage.base64Data; // Store Base64 data instead of file path
      // console.log('✅ DEBUG: Driver license file processed successfully as Base64');
    } catch (error) {
      console.error('License file processing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing license file'
      });
    }

    // ✅ CREATE: User account
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'user' // Default role, can be updated by admin later
    });

    // ✅ CREATE: Driver record with pending approval
    let driver;
    if (module_type === 'rider') {
      // For General Delivery Rider, create in Rider model with pending_verification status
      const riderData = {
        name,
        phone,
        email,
        password,
        license_number,
        vehicle_type,
        vehicle_number,
        vehicle_model,
        vehicle_color,
        module_type, // ✅ FIXED: Save module_type for riders
        status: 'pending_verification', // Use pending_verification for riders
        documents: {
          license_image: licenseFilePath
        }
      };
      driver = await Rider.create(riderData);
    } else {
      // For Taxi and Porter drivers, use their respective models
      const driverData = {
        user_id: user._id,
        name,
        phone,
        email,
        license_number,
        module_type,
        license_file_path: licenseFilePath,
        vehicle_type,
        vehicle_number,
        vehicle_model,
        vehicle_color,
        status: 'pending_approval',
        request_date: new Date()
      };

      if (module_type === 'taxi') {
        driver = await TaxiDriver.create(driverData);
      } else {
        driver = await PorterDriver.create(driverData);
      }
    }

    // ✅ RESPONSE: Success with pending status
    const responseData = {
      driver_id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      vehicle_type: driver.vehicle_type,
      vehicle_number: driver.vehicle_number,
      vehicle_model: driver.vehicle_model,
      vehicle_color: driver.vehicle_color
    };

    // Add module-specific fields
    if (module_type === 'rider') {
      responseData.license_file_path = driver.documents?.license_image;
      responseData.module_type = driver.module_type; // ✅ FIXED: Include module_type for riders
    } else {
      responseData.user_id = user._id;
      responseData.module_type = driver.module_type;
      responseData.request_date = driver.request_date;
      responseData.license_file_path = driver.license_file_path;
    }

    const statusMessage = module_type === 'rider' 
      ? 'General Delivery Rider registration submitted successfully. Your account is pending verification.'
      : `${module_type.charAt(0).toUpperCase() + module_type.slice(1)} driver registration submitted successfully. Your request is pending admin approval.`;

    res.status(201).json({
      success: true,
      message: statusMessage,
      data: responseData
    });

    // ✅ LOG: Registration successful
    console.log(`🚗 New ${module_type} driver registration: ${name} (${email}) - Status: Pending Approval`);

  } catch (error) {
    console.error('Driver registration error:', error);
    
    // ✅ ERROR HANDLING: Specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this information already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error in driver registration',
      error: error.message
    });
  }
};

// Get pending driver requests (for admin)
exports.getPendingRequests = async (req, res) => {
  try {
    const { module_type, status } = req.query;
    
    // ✅ DYNAMIC: Build query based on parameters
    let query = { status: 'pending_approval' };
    
    if (module_type && ['taxi', 'porter'].includes(module_type)) {
      query.module_type = module_type;
    }
    
    if (status && ['pending_approval', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Get taxi drivers
    const taxiDrivers = await TaxiDriver.find(query)
      .populate('user_id', 'name email phone')
      .sort({ request_date: -1 });
    
    // Get porter drivers
    const porterDrivers = await PorterDriver.find(query)
      .populate('user_id', 'name email phone')
      .sort({ request_date: -1 });
    
    // Get general delivery riders (pending verification)
    const riderQuery = { status: 'pending_verification' };
    if (module_type === 'rider') {
      riderQuery.module_type = 'rider';
    }
    const generalRiders = await Rider.find(riderQuery)
      .sort({ createdAt: -1 });
    
    // ✅ DYNAMIC: Build response with Base64 data (no URL needed)
    const formatDriver = (driver) => ({
      ...driver.toObject(),
      license_file_data: driver.license_file_path // Base64 data is already in the field
    });
    
    const formatRider = (rider) => ({
      ...rider.toObject(),
      license_file_data: rider.documents?.license_image // Base64 data from documents
    });
    
    const formattedTaxiDrivers = taxiDrivers.map(formatDriver);
    const formattedPorterDrivers = porterDrivers.map(formatDriver);
    const formattedGeneralRiders = generalRiders.map(formatRider);
    
    res.json({
      success: true,
      data: {
        taxi_drivers: formattedTaxiDrivers,
        porter_drivers: formattedPorterDrivers,
        general_riders: formattedGeneralRiders,
        total_pending: taxiDrivers.length + porterDrivers.length + generalRiders.length
      }
    });
    
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message
    });
  }
};

// Approve/reject driver request (for admin)
exports.updateDriverStatus = async (req, res) => {
  try {
    const { driver_id, module_type, action, rejection_reason } = req.body;
    
    // ✅ VALIDATION: Required fields
    if (!driver_id || !module_type || !action) {
      return res.status(400).json({
        success: false,
        message: 'driver_id, module_type, and action are required'
      });
    }
    
    // ✅ VALIDATION: Action type
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action must be either "approve" or "reject"'
      });
    }
    
    // ✅ VALIDATION: Module type
    if (!['taxi', 'porter', 'rider'].includes(module_type)) {
      return res.status(400).json({
        success: false,
        message: 'module_type must be either "taxi", "porter", or "rider"'
      });
    }
    
    // ✅ VALIDATION: Rejection reason for reject action
    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'rejection_reason is required when rejecting a request'
      });
    }
    
    // Get the appropriate model and update data
    let driver;
    let updateData;
    
    if (module_type === 'rider') {
      // For General Delivery Rider, update Rider model
      updateData = {
        status: action === 'approve' ? 'active' : 'inactive'
      };
      
      driver = await Rider.findByIdAndUpdate(
        driver_id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      // For Taxi and Porter drivers
      const DriverModel = module_type === 'taxi' ? TaxiDriver : PorterDriver;
      
      updateData = {
        status: action === 'approve' ? 'active' : 'rejected',
        approval_date: new Date(),
        approved_by: req.user.id
      };
      
      if (action === 'reject') {
        updateData.rejection_reason = rejection_reason;
      }
      
      driver = await DriverModel.findByIdAndUpdate(
        driver_id,
        updateData,
        { new: true, runValidators: true }
      ).populate('user_id', 'name email phone');
    }
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // ✅ RESPONSE: Success
    const responseData = {
      driver_id: driver._id,
      name: driver.name,
      email: driver.email,
      status: driver.status,
      action: action
    };

    // Add module-specific fields
    if (module_type !== 'rider') {
      responseData.approval_date = driver.approval_date;
      responseData.approved_by = driver.approved_by;
    }

    res.json({
      success: true,
      message: `Driver request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: responseData
    });
    
    // ✅ LOG: Status update
    console.log(`✅ Driver ${action}: ${driver.name} (${driver.email}) - ${module_type} module`);
    
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver status',
      error: error.message
    });
  }
};
