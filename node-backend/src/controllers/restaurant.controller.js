const mongoose = require('mongoose');
const Restaurant = require('../models/restaurant');
const RestaurantCategory = require('../models/restaurantcategory');
const { processImageForDatabase } = require('../utils/imageProcessor');
const { processImageUrl, getBaseUrl } = require('../utils/imageUrlHelper');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('category_id', 'name')
      .sort({ createdAt: -1 });

    // Process images for frontend
    const baseUrl = getBaseUrl(req);
    const processedRestaurants = restaurants.map(restaurant => ({
      ...restaurant.toObject(),
      image: processImageUrl(restaurant.image, baseUrl, restaurant._id, 'restaurant')
    }));

    res.json({
      success: true,
      data: processedRestaurants,
      count: processedRestaurants.length
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format'
      });
    }

    const restaurant = await Restaurant.findById(req.params.id)
      .populate('category_id', 'name');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Process image for frontend
    const baseUrl = getBaseUrl(req);
    const processedRestaurant = {
      ...restaurant.toObject(),
      image: processImageUrl(restaurant.image, baseUrl, restaurant._id, 'restaurant')
    };

    res.json({
      success: true,
      data: processedRestaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: error.message
    });
  }
};

// Create restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      phone,
      email,
      category_id,
      cuisine_type,
      opening_hours,
      delivery_radius,
      minimum_order,
      delivery_fee,
      status
    } = req.body;

    // Validate category exists
    if (category_id) {
      const category = await RestaurantCategory.findById(category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant category not found'
        });
      }
    }

    let imagePath = null;
    if (req.file) {
      console.log('🔍 DEBUG: Creating restaurant with image data');
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
      console.log('✅ DEBUG: Restaurant image processed successfully as Base64');
    }

    const restaurant = new Restaurant({
      name,
      description,
      slug: slugify(name, { lower: true }),
      address,
      phone,
      email,
      category_id: category_id || null,
      cuisine_type,
      opening_hours,
      delivery_radius: parseFloat(delivery_radius) || 5,
      minimum_order: parseFloat(minimum_order) || 0,
      delivery_fee: parseFloat(delivery_fee) || 0,
      image: imagePath,
      status: status === 'true' || status === true
    });

    await restaurant.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating restaurant',
      error: error.message
    });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    console.log('=== RESTAURANT UPDATE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Restaurant ID:', req.params.id);

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('🔍 DEBUG: Current restaurant image length:', restaurant.image ? restaurant.image.length : 0);
    console.log('🔍 DEBUG: Current restaurant image preview:', restaurant.image ? restaurant.image.substring(0, 50) + '...' : 'No image');

    const {
      name,
      description,
      address,
      phone,
      email,
      category_id,
      cuisine_type,
      opening_hours,
      delivery_radius,
      minimum_order,
      delivery_fee,
      status
    } = req.body;

    let imagePath = restaurant.image;
    if (req.file) {
      console.log('🔍 DEBUG: Processing new image for restaurant update');
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      try {
        const processedImage = await processImageForDatabase(req.file, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'jpeg'
        });
        imagePath = processedImage.base64Data; // Store Base64 data instead of file path
        console.log('✅ DEBUG: Restaurant image processed successfully as Base64');
        console.log('✅ DEBUG: New Base64 data length:', imagePath ? imagePath.length : 0);
        console.log('✅ DEBUG: New Base64 data preview:', imagePath ? imagePath.substring(0, 50) + '...' : 'No data');
      } catch (imageError) {
        console.error('❌ DEBUG: Image processing failed:', imageError);
        return res.status(400).json({ 
          success: false, 
          message: 'Image processing failed', 
          error: imageError.message 
        });
      }
    } else {
      console.log('🔍 DEBUG: No new image provided, keeping existing image');
    }

    // Update restaurant fields
    restaurant.name = name || restaurant.name;
    restaurant.description = description || restaurant.description;
    restaurant.slug = name ? slugify(name, { lower: true }) : restaurant.slug;
    restaurant.address = address || restaurant.address;
    restaurant.phone = phone || restaurant.phone;
    restaurant.email = email || restaurant.email;
    restaurant.category_id = category_id || restaurant.category_id;
    restaurant.cuisine_type = cuisine_type || restaurant.cuisine_type;
    restaurant.opening_hours = opening_hours || restaurant.opening_hours;
    restaurant.delivery_radius = delivery_radius ? parseFloat(delivery_radius) : restaurant.delivery_radius;
    restaurant.minimum_order = minimum_order ? parseFloat(minimum_order) : restaurant.minimum_order;
    restaurant.delivery_fee = delivery_fee ? parseFloat(delivery_fee) : restaurant.delivery_fee;
    restaurant.image = imagePath;
    restaurant.status = status !== undefined ? (status === 'true' || status === true) : restaurant.status;

    console.log('🔍 DEBUG: About to save restaurant with image length:', restaurant.image ? restaurant.image.length : 0);
    
    await restaurant.save();

    console.log('✅ DEBUG: Restaurant saved successfully');
    console.log('✅ DEBUG: Final image length:', restaurant.image ? restaurant.image.length : 0);

    // Process image for response to ensure proper URL generation
    const baseUrl = getBaseUrl(req);
    const processedRestaurant = {
      ...restaurant.toObject(),
      image: processImageUrl(restaurant.image, baseUrl, restaurant._id, 'restaurant')
    };

    console.log('✅ DEBUG: Processed image URL for response:', processedRestaurant.image);

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: processedRestaurant
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant',
      error: error.message
    });
  }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if restaurant has associated dishes
    const Dish = require('../models/dish');
    const dishCount = await Dish.countDocuments({ restaurant_id: req.params.id });

    if (dishCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete restaurant with associated dishes. Please delete or reassign dishes first.'
      });
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant',
      error: error.message
    });
  }
};

// Search restaurants
exports.searchRestaurants = async (req, res) => {
  try {
    const { q, category_id, cuisine_type } = req.query;
    let query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { cuisine_type: { $regex: q, $options: 'i' } }
      ];
    }

    if (category_id) {
      query.category_id = category_id;
    }

    if (cuisine_type) {
      query.cuisine_type = cuisine_type;
    }

    const restaurants = await Restaurant.find(query)
      .populate('category_id', 'name')
      .sort({ createdAt: -1 });

    // Process images for frontend
    const baseUrl = getBaseUrl(req);
    const processedRestaurants = restaurants.map(restaurant => ({
      ...restaurant.toObject(),
      image: processImageUrl(restaurant.image, baseUrl, restaurant._id, 'restaurant')
    }));

    res.json({
      success: true,
      data: processedRestaurants,
      count: processedRestaurants.length
    });
  } catch (error) {
    console.error('Error searching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching restaurants',
      error: error.message
    });
  }
};

// Get active restaurants only
exports.getActiveRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ status: true })
      .populate('category_id', 'name')
      .sort({ name: 1 });

    // Process images for frontend
    const baseUrl = getBaseUrl(req);
    const processedRestaurants = restaurants.map(restaurant => ({
      ...restaurant.toObject(),
      image: processImageUrl(restaurant.image, baseUrl, restaurant._id, 'restaurant')
    }));

    res.json({
      success: true,
      data: processedRestaurants,
      count: processedRestaurants.length
    });
  } catch (error) {
    console.error('Error fetching active restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active restaurants',
      error: error.message
    });
  }
}; 