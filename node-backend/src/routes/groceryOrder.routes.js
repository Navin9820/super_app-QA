const express = require('express');
const router = express.Router();
const {
  getUserGroceryOrders,
  getGroceryOrderById,
  createGroceryOrder,
  cancelGroceryOrder,
  getGroceryOrderStatus,
  updateGroceryOrderStatus,
  updateDeliveryAddress,
  addDeliveryInstructions,
  rateGroceryOrder,
  getGroceryOrdersByStatus,
  adminGetAllGroceryOrders,
  adminUpdateGroceryOrderStatus
} = require('../controllers/groceryOrder.controller');

console.log('DEBUG: adminGetAllGroceryOrders:', typeof adminGetAllGroceryOrders);
console.log('DEBUG: adminUpdateGroceryOrderStatus:', typeof adminUpdateGroceryOrderStatus);

const { protect, authorize } = require('../middlewares/auth.middleware');
const isAdmin = authorize('admin');

// Custom authorization for admin and grocery_admin
const authorizeAdminOrGroceryAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'grocery_admin') {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Not authorized to access this route'
  });
};

// Admin routes (admin and grocery_admin)
router.get('/admin/all', protect, authorizeAdminOrGroceryAdmin, adminGetAllGroceryOrders);
router.put('/admin/:id/status', protect, authorizeAdminOrGroceryAdmin, adminUpdateGroceryOrderStatus);

// User routes (authenticated users)
router.get('/', protect, getUserGroceryOrders);
router.post('/', protect, createGroceryOrder);
router.get('/by-status', protect, getGroceryOrdersByStatus);
router.get('/:id', protect, getGroceryOrderById);
router.get('/:id/status', protect, getGroceryOrderStatus);

// 🚀 ENHANCED: Order management routes
router.put('/:id/status', protect, updateGroceryOrderStatus); // 🚀 NEW: Update order status
router.put('/:id/delivery-address', protect, updateDeliveryAddress); // 🚀 NEW: Update delivery address
router.put('/:id/delivery-instructions', protect, addDeliveryInstructions); // 🚀 NEW: Add delivery instructions
router.put('/:id/rate', protect, rateGroceryOrder); // 🚀 NEW: Rate and review order
router.put('/:id/cancel', protect, cancelGroceryOrder);

module.exports = router;
