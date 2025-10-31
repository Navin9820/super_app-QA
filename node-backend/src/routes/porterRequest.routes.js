const express = require('express');
const {
  createPorterRequest,
  getUserPorterRequests,
  getPorterRequest,
  updatePorterRequestStatus,
  cancelPorterRequest,
  ratePorterRequest,
  getAllPorterRequests
} = require('../controllers/porterRequest.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router.route('/')
  .post(createPorterRequest)
  .get(getUserPorterRequests);

router.route('/:id')
  .get(getPorterRequest);

router.route('/:id/status')
  .put(updatePorterRequestStatus);

router.route('/:id/cancel')
  .put(cancelPorterRequest);

router.route('/:id/rate')
  .put(ratePorterRequest);

// Admin routes
router.route('/admin/all')
  .get(authorize('admin', 'porter_admin'), getAllPorterRequests);

module.exports = router;
