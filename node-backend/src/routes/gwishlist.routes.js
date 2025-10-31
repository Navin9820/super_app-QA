// src/routes/gwishlist.routes.js
const express = require('express');
const router  = express.Router();

const Gwhishlist = require('../models/gwhishlist');            // Mongoose model
const { protect }   = require('../middlewares/auth.middleware'); // JWT‑auth middleware
const { processImageUrl, getBaseUrl } = require('../utils/imageUrlHelper');

// ---------------------------------------------------------------------------
// ➕ POST /api/gwishlist       – Add an item to the wishlist
// ---------------------------------------------------------------------------
// ➕ Add to wishlist
// ➕ Add to wishlist
router.post('/', protect, async (req, res) => {
  const { grocery_id } = req.body;
  const user_id = req.user.id;

  try {
    // Validate grocery_id
    if (!grocery_id) {
      return res.status(400).json({ error: 'grocery_id is required' });
    }

    // Check if item already exists in wishlist
    const existing = await Gwhishlist.findOne({
      user_id, grocery_id
    });

    if (existing) {
      // Populate and process the existing item
      const populatedExisting = await Gwhishlist.findById(existing._id).populate('grocery');
      const baseUrl = getBaseUrl(req);
      const processedExisting = {
        ...populatedExisting.toObject(),
        grocery: populatedExisting.grocery ? {
          ...populatedExisting.grocery.toObject(),
          image: processImageUrl(populatedExisting.grocery.image, baseUrl, populatedExisting.grocery._id, 'grocery'),
          images: populatedExisting.grocery.images && populatedExisting.grocery.images.length > 0 
            ? populatedExisting.grocery.images.map(img => processImageUrl(img, baseUrl, populatedExisting.grocery._id, 'grocery'))
            : []
        } : null
      };
      return res.status(200).json(processedExisting); // 🟩 Return the existing row with processed images
    }

    // Create new wishlist item
    const newItem = await Gwhishlist.create({
      user_id,
      grocery_id
    });

    // Populate the grocery data before returning
    const populatedItem = await Gwhishlist.findById(newItem._id).populate('grocery');
    
    // Process images for frontend
    const baseUrl = getBaseUrl(req);
    const processedItem = {
      ...populatedItem.toObject(),
      grocery: populatedItem.grocery ? {
        ...populatedItem.grocery.toObject(),
        image: processImageUrl(populatedItem.grocery.image, baseUrl, populatedItem.grocery._id, 'grocery'),
        images: populatedItem.grocery.images && populatedItem.grocery.images.length > 0 
          ? populatedItem.grocery.images.map(img => processImageUrl(img, baseUrl, populatedItem.grocery._id, 'grocery'))
          : []
      } : null
    };
    
    res.status(201).json(processedItem); // ✅ Return populated row with processed images
  } catch (error) {
    console.error('Add wishlist error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Item already exists in wishlist' });
    }
    
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});



// ---------------------------------------------------------------------------
// 🔁 GET /api/gwishlist        – Fetch all wishlist items for logged‑in user
// ---------------------------------------------------------------------------
router.get('/', protect, async (req, res) => {
  try {
    const items = await Gwhishlist.find({
      user_id: req.user.id
    }).populate('grocery').sort({ createdAt: -1 });
    
    // Process images for frontend
    const baseUrl = getBaseUrl(req);
    const processedItems = items.map(item => {
      if (item.grocery) {
        return {
          ...item.toObject(),
          grocery: {
            ...item.grocery.toObject(),
            image: processImageUrl(item.grocery.image, baseUrl, item.grocery._id, 'grocery'),
            images: item.grocery.images && item.grocery.images.length > 0 
              ? item.grocery.images.map(img => processImageUrl(img, baseUrl, item.grocery._id, 'grocery'))
              : []
          }
        };
      }
      return item;
    });
    
    res.json(processedItems);
  } catch (err) {
    console.error('Fetch‑wishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// ---------------------------------------------------------------------------
// ❌ DELETE /api/gwishlist/:id – Remove a single item from the wishlist
// ---------------------------------------------------------------------------
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Gwhishlist.findOneAndDelete({
      _id: req.params.id, user_id: req.user.id
    });

    if (deleted) {
      return res.json({ message: 'Removed from wishlist' });
    }
    res.status(404).json({ error: 'Item not found' });
  } catch (err) {
    console.error('Delete‑wishlist error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ---------------------------------------------------------------------------
// 🧹 DELETE /api/gwishlist/clear – Clear entire grocery wishlist
// ---------------------------------------------------------------------------
router.delete('/clear', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('=== CLEAR GROCERY WISHLIST DEBUG ===');
    console.log('User ID:', userId);

    // Clear all wishlist items for the user
    const result = await Gwhishlist.deleteMany({ user_id: userId });
    
    console.log('Cleared grocery wishlist items:', result.deletedCount);
    console.log('=== END CLEAR GROCERY WISHLIST DEBUG ===');

    res.json({
      success: true,
      message: 'Grocery wishlist cleared successfully',
      data: {
        cleared_items: result.deletedCount
      }
    });
  } catch (err) {
    console.error('Clear grocery wishlist error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear grocery wishlist' 
    });
  }
});

module.exports = router;
