const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const controller = require('../controllers/warehouse.controller');

// 🛡️ SECURE PUBLIC ENDPOINT: Warehouse address for order tracking (rate limited, data filtered)
router.get('/:id/public', controller.getPublicById);
// Admin-only routes
router.get('/', protect, authorize('admin', 'ecommerce_admin'), controller.list);
router.get('/:id', protect, authorize('admin', 'ecommerce_admin'), controller.getById);
router.post('/', protect, authorize('admin', 'ecommerce_admin'), controller.create);
router.put('/:id', protect, authorize('admin', 'ecommerce_admin'), controller.update);
router.patch('/:id/toggle-status', protect, authorize('admin', 'ecommerce_admin'), controller.toggleStatus);
router.patch('/:id/set-default', protect, authorize('admin', 'ecommerce_admin'), controller.setDefault);

module.exports = router;


