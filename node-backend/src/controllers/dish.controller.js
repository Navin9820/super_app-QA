const Dish = require('../models/dish');
const Restaurant = require('../models/restaurant');
const { processImage, processImageForDatabase } = require('../utils/imageProcessor');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Get all dishes
exports.getAllDishes = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    let query = {};

    if (restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found'
        });
      }
      query.restaurant_id = restaurantId;
    }

    const dishes = await Dish.find(query)
      .populate('restaurant_id', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: dishes,
      count: dishes.length
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dishes',
      error: error.message
    });
  }
};

// Get dish by ID
exports.getDishById = async (req, res) => {
  try {
    // ✅ ADD: Validate ObjectId format
    const { id } = req.params;
    
    // Check if id is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dish ID format'
      });
    }

    const dish = await Dish.findById(id)
      .populate('restaurant_id', 'name');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    res.json({
      success: true,
      data: dish
    });
  } catch (error) {
    console.error('Error fetching dish:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dish',
      error: error.message
    });
  }
};

// Create dish
exports.createDish = async (req, res) => {
  try {
    console.log('=== DISH CREATE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const {
      name,
      slug,
      description,
      price,
      category,
      restaurant_id,
      is_vegetarian,
      is_spicy,
      preparation_time,
      status
    } = req.body;

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    let imagePath = null;
    let imagesArray = [];
    
    // ✅ FIXED: Handle main image from req.files.image - Store in database as Base64
    if (req.files && req.files.image && req.files.image[0]) {
      const processedImage = await processImageForDatabase(req.files.image[0], {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
    }

    // ✅ ADDED: Handle multiple images
    if (req.files && req.files.multiple_images) {
      const multipleImages = Array.isArray(req.files.multiple_images) 
        ? req.files.multiple_images 
        : [req.files.multiple_images];
      
      for (const file of multipleImages) {
        const processedImage = await processImageForDatabase(file, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'jpeg'
        });
        imagesArray.push(processedImage.base64Data); // Store Base64 data instead of file path
      }
    }

    const dish = new Dish({
      name,
      slug,
      description,
      price: parseFloat(price),
      category,
      restaurant_id,
      image: imagePath,
      // ✅ ADDED: Include images array
      images: imagesArray,
      is_vegetarian: is_vegetarian === 'true' || is_vegetarian === true,
      is_spicy: is_spicy === 'true' || is_spicy === true,
      preparation_time: parseInt(preparation_time) || 30,
      status: status === 'true' || status === true
    });

    await dish.save();

    console.log('Created dish:=====================================>', dish.toJSON());
    console.log('=== END DISH CREATE DEBUG ===');

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      data: dish
    });
  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(400).json({ error: 'Failed to create dish', details: error.message });
  }
};

// Update dish
exports.updateDish = async (req, res) => {
  try {
    console.log('=== DISH UPDATE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    const {
      name,
      slug,
      description,
      price,
      category,
      restaurant_id,
      is_vegetarian,
      is_spicy,
      preparation_time,
      status
    } = req.body;

    let imagePath = dish.image;
    let imagesArray = dish.images || [];
    
    // ✅ FIXED: Handle main image from req.files.image
    if (req.files && req.files.image && req.files.image[0]) {
      // Delete old image if exists
      if (dish.image) {
        const oldImagePath = path.join(__dirname, '..', '..', 'uploads', dish.image.replace('/uploads/', ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const processedImage = await processImageForDatabase(req.files.image[0], {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
    }

    // ✅ ADDED: Handle multiple images in update
    if (req.files && req.files.multiple_images) {
      const multipleImages = Array.isArray(req.files.multiple_images) 
        ? req.files.multiple_images 
        : [req.files.multiple_images];
      
      for (const file of multipleImages) {
        const processedImage = await processImageForDatabase(file, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'jpeg'
        });
        imagesArray.unshift(processedImage.base64Data); // Store Base64 data instead of file path
      }
    }

    dish.name = name || dish.name;
    dish.slug = slug || dish.slug;
    dish.description = description || dish.description;
    dish.price = price ? parseFloat(price) : dish.price;
    dish.category = category || dish.category;
    dish.restaurant_id = restaurant_id || dish.restaurant_id;
    dish.image = imagePath;
    // ✅ ADDED: Update images array
    dish.images = imagesArray;
    dish.is_vegetarian = is_vegetarian !== undefined ? (is_vegetarian === 'true' || is_vegetarian === true) : dish.is_vegetarian;
    dish.is_spicy = is_spicy !== undefined ? (is_spicy === 'true' || is_spicy === true) : dish.is_spicy;
    dish.preparation_time = preparation_time ? parseInt(preparation_time) : dish.preparation_time;
    dish.status = status !== undefined ? (status === 'true' || status === true) : dish.status;

    await dish.save();

    // Fetch the updated dish to ensure the latest data is returned
    const updatedDish = await Dish.findById(req.params.id);
    res.json({ success: true, message: 'Dish updated successfully', data: updatedDish });
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(400).json({ error: 'Failed to update dish', details: error.message });
  }
};

// Delete dish
exports.deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    await Dish.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting dish',
      error: error.message
    });
  }
}; 

// ✅ ADDED: Manage dish images (add, remove, reorder)
exports.manageDishImages = async (req, res) => {
  try {
    const { action, imageIndex, newOrder } = req.body;
    const dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    if (!dish.images) {
      dish.images = [];
    }

    switch (action) {
      case 'add':
        if (req.file) {
          const processedImage = await processImageForDatabase(req.file, {
            width: 800,
            height: 800,
            quality: 85,
            format: 'jpeg'
          });
          dish.images.unshift(processedImage.base64Data); // Store Base64 data instead of file path
        }
        break;
        
      case 'remove':
        if (imageIndex !== undefined && dish.images[imageIndex]) {
          const imageToRemove = dish.images[imageIndex];
          // Delete file from filesystem
          const imagePath = path.join(__dirname, '..', '..', 'uploads', imageToRemove.replace('/uploads/', ''));
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {
            console.error("Error deleting image:", e);
          }
          dish.images.splice(imageIndex, 1);
        }
        break;
        
      case 'reorder':
        if (newOrder && Array.isArray(newOrder)) {
          dish.images = newOrder;
        }
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await dish.save();
    res.json({ success: true, message: 'Dish images updated successfully', data: dish });
  } catch (error) {
    console.error('Error managing dish images:', error);
    res.status(500).json({
      success: false,
      message: 'Error managing dish images',
      error: error.message
    });
  }
}; 