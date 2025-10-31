const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrder.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication and admin authorization
router.use(protect);
router.use(authorize('admin', 'ecommerce_admin'));

// Get all orders with advanced filtering
router.get('/', adminOrderController.getAllOrders);

// Get order statistics for dashboard
router.get('/stats', adminOrderController.getOrderStats);

// Get single order by ID
router.get('/:id', adminOrderController.getOrderById);

// Update order status
router.put('/:id/status', adminOrderController.updateOrderStatus);

// Bulk update orders
router.put('/bulk-update', adminOrderController.bulkUpdateOrders);

// Export orders
router.get('/export/data', adminOrderController.exportOrders);

module.exports = router; 