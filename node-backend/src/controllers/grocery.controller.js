const Grocery = require('../models/grocery');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { processImage, processImageForDatabase } = require('../utils/imageProcessor');

// Get all groceries
exports.getAllGroceries = async (req, res) => {
  try {
    const groceries = await Grocery.find().sort({ createdAt: -1 });
    res.json({ success: true, data: groceries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching groceries', error: error.message });
  }
};

// Get grocery by ID
exports.getGroceryById = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);
    if (!grocery) return res.status(404).json({ success: false, message: 'Grocery not found' });
    res.json({ success: true, data: grocery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching grocery', error: error.message });
  }
};

// Create grocery (with image upload)
exports.createGrocery = async (req, res) => {
  try {
    const { name, description, original_price, discounted_price, rating, is_best_seller, quantity, category, status } = req.body;
    
    // Debug logging for price fields
    console.log('🔍 DEBUG: Grocery creation - Price fields received:', {
      original_price,
      discounted_price,
      original_price_type: typeof original_price,
      discounted_price_type: typeof discounted_price
    });
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

    const grocery = new Grocery({
      name,
      description,
      original_price,
      discounted_price: discounted_price && discounted_price !== '' ? discounted_price : null,
      rating,
      is_best_seller: is_best_seller === 'true' || is_best_seller === true,
      quantity,
      category,
      status: status === 'true' || status === true,
      image: imagePath,
      // ✅ ADDED: Include images array
      images: imagesArray
    });
    
    await grocery.save();
    res.status(201).json({ success: true, message: 'Grocery created successfully', data: grocery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating grocery', error: error.message });
  }
};

// Update grocery (with image upload and old image cleanup)
exports.updateGrocery = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery not found' });
    }

    const { 
      name, 
      description, 
      original_price, 
      discounted_price, 
      rating, 
      is_best_seller, 
      quantity, 
      category, 
      status 
    } = req.body;
    
    let imagePath = grocery.image;
    let imagesArray = grocery.images || [];

    // ✅ FIXED: Handle main image from req.files.image
    if (req.files && req.files.image && req.files.image[0]) {
      // Delete the old image if it exists
      if (grocery.image) {
        const oldImagePath = path.join(__dirname, '..', '..', 'uploads', grocery.image.replace('/uploads/', ''));
        try {
          if (fs.existsSync(oldImagePath)) {
            await fsPromises.unlink(oldImagePath);
          }
        } catch (e) {
          console.error("Error deleting old image:", e);
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

    grocery.name = name || grocery.name;
    grocery.description = description || grocery.description;
    grocery.original_price = (original_price === '' || original_price === null) ? null : original_price;
    grocery.discounted_price = (discounted_price === '' || discounted_price === null) ? null : discounted_price;
    grocery.rating = (rating === '' || rating === null) ? null : rating;
    grocery.is_best_seller = is_best_seller === 'true' || is_best_seller === true;
    grocery.quantity = (quantity === '' || quantity === null) ? null : quantity;
    grocery.category = category || grocery.category;
    grocery.status = status === 'true' || status === true;
    grocery.image = imagePath;
    // ✅ ADDED: Update images array
    grocery.images = imagesArray;

    await grocery.save();
    res.json({ success: true, message: 'Grocery updated successfully', data: grocery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating grocery', error: error.message });
  }
};

// ✅ ADDED: Manage grocery images (add, remove, reorder)
exports.manageGroceryImages = async (req, res) => {
  try {
    const { action, imageIndex, newOrder } = req.body;
    const grocery = await Grocery.findById(req.params.id);
    
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery not found' });
    }

    if (!grocery.images) {
      grocery.images = [];
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
          grocery.images.unshift(processedImage.base64Data); // Store Base64 data instead of file path
        }
        break;
        
      case 'remove':
        if (imageIndex !== undefined && grocery.images[imageIndex]) {
          const imageToRemove = grocery.images[imageIndex];
          // Delete file from filesystem
          const imagePath = path.join(__dirname, '..', '..', 'uploads', imageToRemove.replace('/uploads/', ''));
          try {
            if (fs.existsSync(imagePath)) {
              await fsPromises.unlink(imagePath);
            }
          } catch (e) {
            console.error("Error deleting image:", e);
          }
          grocery.images.splice(imageIndex, 1);
        }
        break;
        
      case 'reorder':
        if (newOrder && Array.isArray(newOrder)) {
          grocery.images = newOrder;
        }
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await grocery.save();
    res.json({ success: true, message: 'Grocery images updated successfully', data: grocery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error managing grocery images', error: error.message });
  }
};

// Delete grocery (with image deletion)
exports.deleteGrocery = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);
    if (!grocery) return res.status(404).json({ success: false, message: 'Grocery not found' });
    if (grocery.image) {
      const imagePath = path.join(__dirname, '..', '..', 'uploads', grocery.image.replace('/uploads/', ''));
      try { 
        if (fs.existsSync(imagePath)) {
          await fsPromises.unlink(imagePath); 
        }
      } catch (e) {
        console.error("Error deleting image on grocery deletion:", e)
      }
    }
    await Grocery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Grocery deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting grocery', error: error.message });
  }
}; 