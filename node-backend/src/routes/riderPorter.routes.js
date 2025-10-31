const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const porterRideController = require('../controllers/porterRide.controller');

// Rider authentication middleware
function protectRider(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    
    if (decoded.type !== 'rider' && decoded.type !== 'taxi_driver' && decoded.type !== 'porter_driver') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    req.rider = { id: decoded.id, type: decoded.type };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
}

// Test route to verify registration
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Rider Porter Routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test specific route pattern
router.get('/:id/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Porter ride route pattern is working!',
    rideId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// Test PUT route without authentication
router.put('/:id/test-put', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Porter PUT route is working!',
    rideId: req.params.id,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Test route for accept endpoint
router.get('/test-accept', protectRider, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Porter accept route is accessible!',
    riderId: req.rider?.id,
    riderType: req.rider?.type,
    timestamp: new Date().toISOString()
  });
});

// Rider porter ride routes
router.put('/:id/accept', protectRider, (req, res, next) => {
  console.log('🔍 RIDER PORTER ROUTE HIT:', {
    method: req.method,
    url: req.url,
    params: req.params,
    riderId: req.rider?.id,
    riderType: req.rider?.type,
    headers: req.headers
  });
  next();
}, porterRideController.acceptRide);

module.exports = router;
