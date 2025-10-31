const express = require('express');
const {
  createTaxiRequest,
  getUserTaxiRequests,
  getTaxiRequest,
  updateTaxiRequestStatus,
  cancelTaxiRequest,
  rateTaxiRequest,
  getAllTaxiRequests
} = require('../controllers/taxiRequest.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router.route('/')
  .post(createTaxiRequest)
  .get(getUserTaxiRequests);

router.route('/:id')
  .get(getTaxiRequest);

router.route('/:id/status')
  .put(updateTaxiRequestStatus);

router.route('/:id/cancel')
  .put(cancelTaxiRequest);

router.route('/:id/rate')
  .put(rateTaxiRequest);

// Admin routes
router.route('/admin/all')
  .get(authorize('admin', 'taxi_admin'), getAllTaxiRequests);

module.exports = router;
