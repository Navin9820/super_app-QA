const express = require('express');
const router = express.Router();
const {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  manageDishImages
} = require('../controllers/dish.controller');
const upload = require('../middlewares/upload.middleware');
const { validateImage } = require('../middlewares/imageValidation.middleware');
const { protect, authorize } = require('../middlewares/auth.middleware');

// List all dishes (optionally filter by restaurantId)
router.get('/', getAllDishes);
// Get dish by ID
router.get('/:id', getDishById);
// Create dish
router.post('/', protect, authorize('admin', 'restaurant_admin'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'multiple_images', maxCount: 10 }
]), validateImage, createDish);
// Update dish
router.put('/:id', protect, authorize('admin', 'restaurant_admin'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'multiple_images', maxCount: 10 }
]), updateDish);

// ✅ ADDED: Route for managing dish images
router.put('/:id/images', protect, authorize('admin', 'restaurant_admin'), upload.single('image'), manageDishImages);

// Delete dish
router.delete('/:id', deleteDish);

module.exports = router; 