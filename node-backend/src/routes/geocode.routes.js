const express = require('express');
const router = express.Router();
const { geocodeAddress } = require('../controllers/geocode.controller');

// GET /api/geocode?address=...
router.get('/', geocodeAddress);

module.exports = router;
