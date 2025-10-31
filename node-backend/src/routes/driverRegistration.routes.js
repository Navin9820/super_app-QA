/**
 * 🚗 Driver Registration Routes
 * 
 * Handles all driver registration related endpoints:
 * - Driver registration with license upload
 * - Admin approval workflow
 * - Dynamic domain support
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware'); // ✅ FIXED: Remove destructuring
const { validateImage } = require('../middlewares/imageValidation.middleware');

// Import controller
const {
  registerDriver,
  getPendingRequests,
  updateDriverStatus
} = require('../controllers/driverRegistration.controller');

// ✅ PUBLIC ROUTE: Driver registration (no authentication required)
router.post('/register', 
  upload.single('license_file'), // Handle single license file upload
  validateImage, // Validate image/file
  registerDriver
);

// ✅ ADMIN ROUTES: Require authentication and admin authorization

// Get pending driver requests
router.get('/pending-requests', 
  protect, 
  authorize('admin', 'taxi_admin'), // Allow both admin and taxi_admin
  getPendingRequests
);

// Update driver status (approve/reject)
router.put('/update-status', 
  protect, 
  authorize('admin', 'taxi_admin'), // Allow both admin and taxi_admin
  updateDriverStatus
);

// ✅ HEALTH CHECK ROUTE
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Driver Registration API is up',
    endpoints: {
      'POST /register': 'Register new driver (public)',
      'GET /pending-requests': 'Get pending requests (admin only)',
      'PUT /update-status': 'Update driver status (admin only)'
    }
  });
});

module.exports = router;
