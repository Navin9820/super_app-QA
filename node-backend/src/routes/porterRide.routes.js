const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const porterRideController = require('../controllers/porterRide.controller');

// Public routes (none for now)
// router.get('/', porterRideController.getPublicRides);

// Protected routes (require authentication)
router.use(protect);

// User routes
router.post('/', porterRideController.create);
router.get('/', porterRideController.getUserRides);
router.get('/my-ride/:id', porterRideController.getUserRideById);
router.put('/:id/status', porterRideController.updateStatus);
router.put('/:id/cancel', porterRideController.cancel);
router.put('/:id/rate', porterRideController.rate);

// Admin routes
router.get('/admin', authorize('admin'), porterRideController.getAllRides);

module.exports = router;
