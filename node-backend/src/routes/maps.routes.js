const express = require('express');
const router = express.Router();

const { reverseGeocode, geocode, directions, getPlaceAutocomplete, getPlaceDetails } = require('../controllers/maps.controller');

// Public endpoints (read-only)
router.get('/reverse-geocode', reverseGeocode);
router.get('/geocode', geocode);
router.get('/directions', directions);

// ✅ NEW: Google Places API endpoints via backend proxy
router.get('/places/autocomplete', getPlaceAutocomplete);
router.get('/places/details', getPlaceDetails);

module.exports = router;


