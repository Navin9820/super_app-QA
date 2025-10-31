const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  removeWishlistItem
} = require('../controllers/wishlist.controller');

// All wishlist routes are protected (require authentication)
router.use(protect);

// Get user's wishlist
router.get('/', getWishlist);

// Add item to wishlist
router.post('/', addToWishlist);

// POST - Remove single item from wishlist (NEW ENDPOINT)
router.post('/remove', removeWishlistItem);

// Remove item from wishlist by ID (existing functionality)
router.delete('/:itemId', removeFromWishlist);

// Clear wishlist
router.delete('/', clearWishlist);

module.exports = router; 