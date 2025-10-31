const express = require('express');
const router = express.Router();
const { calculateRoute } = require('../controllers/distanceMatrix.controller');

// POST /api/distance-matrix
router.post('/', calculateRoute);

module.exports = router;
