const express = require('express');
const router = express.Router();
const {
  getUserOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getOrderStatus,
  confirmForDispatch,
  getOrderAssignment,
  getCodOtp,
  resendCodOtp
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');

// Create order
router.post('/', protect, createOrder);

// Get user's orders
router.get('/', protect, getUserOrders);

// Get specific order
router.get('/:id', protect, getOrderById);

// Get order by order number
router.get('/number/:orderNumber', protect, getOrderById);

// Cancel order
router.put('/:id/cancel', protect, cancelOrder);

// Confirm order for dispatch (v1: owner or admin)
router.put('/:id/confirm-dispatch', protect, confirmForDispatch);

// Get assignment for order (for live tracking info)
router.get('/:id/assignment', protect, getOrderAssignment);

// COD OTP (customer view)
router.get('/:id/cod-otp', protect, getCodOtp);
router.post('/:id/cod-otp/resend', protect, resendCodOtp);

module.exports = router; 