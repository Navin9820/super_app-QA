const express = require('express');
const cors = require('cors');
const path = require('path');

// Import all models to ensure they are initialized
require('./models');

// Import comprehensive URL configuration
const urlConfig = require('./config/url.config');
const groceryOrderRoutes = require('./routes/groceryOrder.routes');
const hotelRoutes = require('./routes/hotel.routes');
const roomRoutes = require('./routes/room.routes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const brandRoutes = require('./routes/brand.routes');
const productRoutes = require('./routes/product.routes');
const sizeRoutes = require('./routes/size.routes');
const colorRoutes = require('./routes/color.routes');
const unitRoutes = require('./routes/unit.routes');
const gcartRoutes = require('./routes/gcart.routes');
const groceryRoutes = require('./routes/grocery.routes');
const taxiRideRoutes = require('./routes/taxiRide.routes');
const taxiDriverRoutes = require('./routes/taxiDriver.routes');
const taxiVehicleRoutes = require('./routes/taxiVehicle.routes');
const riderTaxiRoutes = require('./routes/riderTaxi.routes');
const riderPorterRoutes = require('./routes/riderPorter.routes');
const gwishlistRoutes = require('./routes/gwishlist.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const permissionRoutes = require('./routes/permission.routes');
const staffRoutes = require('./routes/staff.routes');
const productAttributeRoutes = require('./routes/productAttribute.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const dishRoutes = require('./routes/dish.routes');
const foodCartRoutes = require('./routes/foodCart.routes');
const foodOrderRoutes = require('./routes/foodOrder.routes');
const amenityRoutes = require('./routes/amenity.routes');
const policyRoutes = require('./routes/policy.routes');
const locationRoutes = require('./routes/location.routes');
const faqRoutes = require('./routes/faq.routes');
const wishlistRoutes = require('./routes/wishlist.routes')
const cartRoutes = require('./routes/cart.routes')
const orderRoutes = require('./routes/order.routes')
const adminOrderRoutes = require('./routes/adminOrder.routes')
const recentTaxiLocationRoutes = require('./routes/recentTaxiLocation.routes');
const warehouseRoutes = require('./routes/warehouse.routes');

// Payment module routes
const paymentRoutes = require('./routes/payment.routes');

// Porter module routes
const porterDriverRoutes = require('./routes/porterDriver.routes');
const porterVehicleRoutes = require('./routes/porterVehicle.routes');
const porterBookingRoutes = require('./routes/porterBooking.routes');
const porterRequestRoutes = require('./routes/porterRequest.routes');
const porterRideRoutes = require('./routes/porterRide.routes');

// ✅ NEW: Driver Registration routes
const driverRegistrationRoutes = require('./routes/driverRegistration.routes');

// Rider module routes
const riderRoutes = require('./routes/rider.routes');
const quickLinkRoutes = require('./routes/quickLink.routes');
const mapsRoutes = require('./routes/maps.routes');

// ✅ NEW: Geocoding and Distance Matrix routes
const geocodeRoutes = require('./routes/geocode.routes');
const distanceMatrixRoutes = require('./routes/distanceMatrix.routes');

// ✅ NEW: Taxi and Porter Request routes
const taxiRequestRoutes = require('./routes/taxiRequest.routes');

const app = express();

// ✅ Comprehensive CORS configuration using URL config system
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Explicitly allow the problematic Vercel domain
    const allowedOrigins = [
      'https://super-app-wheat-five.vercel.app',
      'https://super-app.vercel.app',
      'https://super-app-git-main-kavinilavans-projects.vercel.app',
      'https://super-app-git-qa-kavinilavans-projects.vercel.app',
      'https://super-app-lac.vercel.app',
      'https://super-app-cz4s.vercel.app',
      'https://super-dtqbebf0s-kavinilavans-projects.vercel.app',
      'https://secom-admin-frontend.vercel.app',
      'https://secomadmin-main.vercel.app',
      'https://secom-admin-git-main-kavinilavans-projects.vercel.app',
      'https://rider-app.vercel.app',
      'https://rider-app-git-main-kavinilavans-projects.vercel.app',
      'https://rider-app-git-qa-kavinilavans-projects.vercel.app',
      'https://super-app-rider.vercel.app',
      'https://rider-super-app.vercel.app',
      'https://super-app-gwui.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5000'
    ];

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Use the comprehensive URL configuration system as fallback
    if (urlConfig.isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      console.error(`CORS blocked origin: ${origin}`);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-user-id', // For user-specific demo token authentication
    'x-is-new-user', // For new user flag
    'x-razorpay-signature', // For Razorpay webhooks
    'x-razorpay-payment-id',
    'x-razorpay-order-id',
    'x-razorpay-entity',
    'x-razorpay-timestamp'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // Cache preflight requests for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Additional CORS middleware for OPTIONS requests
app.use((req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-user-id, x-is-new-user, x-razorpay-signature, x-razorpay-payment-id, x-razorpay-order-id, x-razorpay-entity, x-razorpay-timestamp');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  next();
});

// ✅ Body parsers with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// ✅ Serve uploaded files from the 'uploads' directory (not 'public/uploads')
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ✅ NEW: Image serving endpoint for Base64 images stored in database
app.get('/api/image/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Import models dynamically to avoid circular dependencies
    let Model;
    let imageField;
    
    switch (type) {
      case 'product':
        Model = require('./models/product');
        imageField = 'photo';
        break;
      case 'dish':
        Model = require('./models/dish');
        imageField = 'image';
        break;
      case 'category':
        Model = require('./models/category');
        imageField = 'image';
        break;
      case 'restaurant':
        Model = require('./models/restaurant');
        imageField = 'image';
        break;
      case 'restaurant-category':
        Model = require('./models/restaurantcategory');
        imageField = 'image';
        break;
      case 'hotel':
        Model = require('./models/hotel');
        imageField = 'main_image';
        break;
      case 'grocery':
        Model = require('./models/grocery');
        imageField = 'image';
        break;
      default:
        return res.status(400).json({ error: 'Invalid image type' });
    }
    
    const item = await Model.findById(id);
    if (!item || !item[imageField]) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    
    // If it's a Base64 data URL, extract the data and serve it
    if (item[imageField].startsWith('data:image/')) {
      const base64Data = item[imageField].split(',')[1];
      const mimeType = item[imageField].split(';')[0].split(':')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      
      res.set('Content-Type', mimeType);
      // ✅ FIXED: Reduced cache time and added ETag for better cache invalidation
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour instead of 1 year
      res.set('ETag', `"${item._id}-${item.updatedAt || item.createdAt}"`); // Add ETag for cache validation
      res.send(buffer);
    } else {
      // Fallback to file path (for backward compatibility)
      res.redirect(item[imageField]);
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ NEW: Rider porter operations - MOVED TO TOP to prevent ALL conflicts
app.use('/api/rider/porter', riderPorterRoutes);

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes); // Admin order routes
app.use('/api/admin', brandRoutes);     // /admin/brands
app.use('/api/products',productRoutes);
app.use('/api/wishlist',wishlistRoutes);
app.use('/api/cart',cartRoutes);
app.use('/api/orders', orderRoutes);    // User order routes
app.use('/api/admin', sizeRoutes);      // /admin/sizes
app.use('/api/admin', colorRoutes);     // /admin/colors
app.use('/api/admin', unitRoutes);      // /admin/units
app.use('/api/hotels', hotelRoutes);
// Add multer error handling for file uploads
const { handleMulterError } = require('./middlewares/upload.middleware');
app.use(handleMulterError);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/groceries', groceryRoutes);
app.use('/api/gcart', gcartRoutes);     // ✅ Grocery cart items
app.use('/api/gwishlist', gwishlistRoutes);
app.use('/api/gorders', groceryOrderRoutes); // ✅ Grocery wishlist
app.use('/api/taxi-rides', taxiRideRoutes);
app.use('/api/taxi-drivers', taxiDriverRoutes);
app.use('/api/taxi-vehicles', taxiVehicleRoutes);
app.use('/api/taxi/recent-locations', recentTaxiLocationRoutes);
app.use('/api/taxi-requests', taxiRequestRoutes); // ✅ NEW: Taxi requests
app.use('/api/rider/taxi', riderTaxiRoutes); // ✅ NEW: Rider taxi operations

// Payment module routes
app.use('/api/payments', paymentRoutes);

// Porter module routes
app.use('/api/porter-drivers', porterDriverRoutes);
app.use('/api/porter-vehicles', porterVehicleRoutes);
app.use('/api/porter-bookings', porterBookingRoutes);
app.use('/api/porter-requests', porterRequestRoutes); // ✅ NEW: Porter requests
app.use('/api/porter-deliveries', porterRideRoutes); // ✅ NEW: Porter deliveries (renamed to avoid conflict)

// ✅ NEW: Driver Registration routes
app.use('/api/driver-registrations', driverRegistrationRoutes);

// Rider module routes
app.use('/api/riders', riderRoutes);

// Quick Links module routes
app.use('/api/quick-links', quickLinkRoutes);
app.use('/api/maps', mapsRoutes);

// ✅ NEW: Geocoding and Distance Matrix routes
app.use('/api/geocode', geocodeRoutes);
app.use('/api/distance-matrix', distanceMatrixRoutes);

app.use('/api/users', userRoutes);      // ✅ User management
app.use('/api/roles', roleRoutes);      // ✅ Role management
app.use('/api/permissions', permissionRoutes); // ✅ Permission management
app.use('/api/staff', staffRoutes);     // ✅ Staff management
app.use('/api/grocery-orders', groceryOrderRoutes);
app.use('/api/product-attributes', productAttributeRoutes);
app.use('/api/restaurants', restaurantRoutes); // ✅ Restaurant management
app.use('/api/dishes', dishRoutes);
app.use('/api/food-cart', foodCartRoutes);
app.use('/api/food-orders', foodOrderRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/warehouses', warehouseRoutes);
// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: urlConfig.getEnvironmentConfig(),
    services: {
      database: 'connected',
      razorpay: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not_configured',
      cors: 'enabled',
      urlConfig: 'active'
    },
    urls: {
      base: urlConfig.getCurrentBaseUrl(),
      api: urlConfig.getApiBaseUrl(),
      webhook: urlConfig.getWebhookUrl(),
      uploads: urlConfig.getUploadUrl()
    },
    cors: {
      allowedOriginsCount: urlConfig.getAllowedOrigins().length,
      supportsMobileApps: true,
      supportsCustomDomains: true,
      supportsVercelDeployments: true
    }
  });
});

// ✅ URL configuration test endpoint
app.get('/urls', (req, res) => {
  res.json({
    success: true,
    message: 'Comprehensive URL Configuration System',
    timestamp: new Date().toISOString(),
    configuration: {
      environment: urlConfig.environment,
      isProduction: urlConfig.isProduction,
      isDevelopment: urlConfig.isDevelopment,
      isStaging: urlConfig.isStaging,
      isTest: urlConfig.isTest
    },
    urls: {
      current: {
        base: urlConfig.getCurrentBaseUrl(),
        api: urlConfig.getApiBaseUrl(),
        webhook: urlConfig.getWebhookUrl(),
        uploads: urlConfig.getUploadUrl()
      },
      development: urlConfig.baseUrls.development,
      staging: urlConfig.baseUrls.staging,
      production: urlConfig.baseUrls.production
    },
    supported: {
      localUrls: urlConfig.localUrls,
      vercelPatterns: urlConfig.vercelPatterns,
      customDomains: urlConfig.customDomains,
      thirdPartyDomains: urlConfig.thirdPartyDomains,
      mobileOrigins: urlConfig.mobileOrigins
    },
    cors: {
      allowedOrigins: urlConfig.getAllowedOrigins(),
      totalCount: urlConfig.getAllowedOrigins().length,
      supportsAllScenarios: true
    },
    environmentVariables: {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: process.env.BACKEND_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      ADMIN_URL: process.env.ADMIN_URL,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      CUSTOM_DOMAINS: process.env.CUSTOM_DOMAINS
    }
  });
});

// ✅ Default API welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Super App API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      // Core services
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      staff: '/api/staff',
      
      // E-commerce
      categories: '/api/categories',
      products: '/api/products',
      brands: '/api/admin/brands',
      cart: '/api/cart',
      orders: '/api/orders',
      wishlist: '/api/wishlist',
      quickLinks: '/api/quick-links',
      
      // Hotel & Booking
      hotels: '/api/hotels',
      rooms: '/api/rooms',
      bookings: '/api/bookings',
      
      // Grocery
      groceries: '/api/groceries',
      gcart: '/api/gcart',
      gwishlist: '/api/gwishlist',
      gorders: '/api/gorders',
      
      // Food Delivery
      restaurants: '/api/restaurants',
      dishes: '/api/dishes',
      foodCart: '/api/food-cart',
      foodOrders: '/api/food-orders',
      
      // Transportation
      taxiRides: '/api/taxi-rides',
      taxiDrivers: '/api/taxi-drivers',
      taxiVehicles: '/api/taxi-vehicles',
      ordertracking: '/api/taxi/recent-locations',
      
      // Porter Services
      porters: '/api/porter-drivers',
      porterVehicles: '/api/porter-vehicles',
      porterorders: '/api/porter-bookings',
      
      // Rider Services
      riders: '/api/riders',
      
      // Payment System
      payments: '/api/payments',
      paymentTest: '/api/payments/test',
      paymentWebhook: '/api/payments/webhook',
      
      // Admin & Management
      admin: '/api/admin',
      adminOrders: '/api/admin/orders',
      
      // Support
      amenities: '/api/amenities',
      policies: '/api/policies',
      locations: '/api/locations',
      faqs: '/api/faqs',
      
      // System
      health: '/health'
    },
    documentation: {
      payment: 'https://razorpay.com/docs/api/',
      api: '/api/docs' // Future API documentation endpoint
    }
  });
});

// ✅ Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
