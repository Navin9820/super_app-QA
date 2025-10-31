const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const taxiRideController = require('../controllers/taxiRide.controller');

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

// Rider taxi ride routes
router.put('/:id/accept', protectRider, taxiRideController.acceptRide);

module.exports = router;
