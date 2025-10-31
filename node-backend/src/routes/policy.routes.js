const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  togglePolicyStatus,
  deletePolicy
} = require('../controllers/policy.controller');

// Apply auth middleware to all routes
router.use(protect);

// Custom authorization for admin and hotel_admin
const authorizeAdminOrHotelAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'hotel_admin') {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Not authorized to access this route'
  });
};

router.use(authorizeAdminOrHotelAdmin);

// Get all policies with pagination and search
router.get('/', getAllPolicies);

// Get policy by ID
router.get('/:id', getPolicyById);

// Create new policy
router.post('/', createPolicy);

// Update policy
router.put('/:id', updatePolicy);

// Toggle policy status
router.patch('/:id/toggle-status', togglePolicyStatus);

// Delete policy
router.delete('/:id', deletePolicy);

module.exports = router; 