const Brand = require('../models/brand');
const { processImageForDatabase } = require('../utils/imageProcessor');
const { processImageUrl, getBaseUrl } = require('../utils/imageUrlHelper');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const mongoose = require('mongoose');

// Helper function to transform brand data for frontend
const transformBrandForFrontend = (brand, req) => {
  const baseUrl = getBaseUrl(req);
  return {
    id: brand._id,
    brand_name: brand.name,
    name: brand.name,
    photo: processImageUrl(brand.logo, baseUrl),
    logo: processImageUrl(brand.logo, baseUrl),
    description: brand.description,
    status: brand.status,
    meta_title: brand.meta_title,
    meta_description: brand.meta_description,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt
  };
};

// Get all brands (OPTIMIZED for admin dropdowns)
exports.getAllBrands = async (req, res) => {
  try {
    // Check if this is a dropdown request (query parameter)
    const isDropdownRequest = req.query.dropdown === 'true';
    
    if (isDropdownRequest) {
      // OPTIMIZED: Fetch only essential fields for dropdowns
      const brands = await Brand.find(
        {}, // Get all brands (don't filter by status for admin dropdown)
        'name status' // Only essential fields
      )
      .sort({ name: 1 }) // Sort by name for better UX
      .lean(); // Use lean() for faster queries
      
      // Transform to minimal format for dropdowns
      const minimalBrands = brands.map(brand => ({
        id: brand._id,
        brand_name: brand.name, // Keep brand_name for compatibility
        name: brand.name,
        status: brand.status
      }));
      
      // Add cache headers (5 minutes cache for dropdowns)
      res.set('Cache-Control', 'public, max-age=300');
      res.set('Expires', new Date(Date.now() + 300000).toUTCString());
      
      console.log(`✅ Fast brand dropdown response: ${minimalBrands.length} brands`);
      return res.json(minimalBrands);
    }
    
    // FULL RESPONSE: For admin table view (keep existing functionality)
    const brands = await Brand.find().sort({ createdAt: -1 });
    
    // Transform data to match frontend expectations
    const transformedBrands = brands.map(brand => transformBrandForFrontend(brand, req));
    
    // Add cache control headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      data: transformedBrands,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Brands API error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get brand by ID
exports.getBrandById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid brand ID' });
    }
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    // Transform the created brand to match frontend expectations
    const transformedBrand = transformBrandForFrontend(brand, req);
    
    res.json(transformedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create brand
exports.createBrand = async (req, res) => {
  try {
    // Map frontend field names to backend model field names
    const { brand_name, description, status, meta_title, meta_description } = req.body;
    const name = brand_name; // Map brand_name to name
    
    // Check if brand with same name already exists
    const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'This brand already exists',
        error: 'Brand with this name already exists'
      });
    }
    
    let imagePath = null;

    if (req.file) {
      // console.log('🔍 DEBUG: Creating brand with image data');
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
      // console.log('✅ DEBUG: Brand image processed successfully as Base64');
    }

    const brand = new Brand({
      name,
      description,
      slug: slugify(name, { lower: true }),
      logo: imagePath,
      status: typeof status !== 'undefined' ? (String(status) === 'true') : true,
      meta_title,
      meta_description
    });

    await brand.save();
    
    // Transform the created brand to match frontend expectations
    const transformedBrand = transformBrandForFrontend(brand, req);
    
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: transformedBrand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating brand',
      error: error.message
    });
  }
};

// Update brand
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Map frontend field names to backend model field names
    const { brand_name, description, status, meta_title, meta_description } = req.body;
    const name = brand_name; // Map brand_name to name
    
    // Check if brand with same name already exists (excluding current brand)
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: 'This brand already exists',
          error: 'Brand with this name already exists'
        });
      }
    }
    
    let imagePath = brand.logo;

    if (req.file) {
      // console.log('🔍 DEBUG: Updating brand with image data');
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
      // console.log('✅ DEBUG: Brand image updated successfully as Base64');
    }

    brand.name = name || brand.name;
    brand.description = description || brand.description;
    brand.slug = name ? slugify(name, { lower: true }) : brand.slug;
    brand.logo = imagePath;
    brand.status = typeof status !== 'undefined' ? (String(status) === 'true') : brand.status;
    brand.meta_title = meta_title || brand.meta_title;
    brand.meta_description = meta_description || brand.meta_description;

    await brand.save();
    
    // Transform the updated brand to match frontend expectations
    const transformedBrand = transformBrandForFrontend(brand, req);
    
    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: transformedBrand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating brand',
      error: error.message
    });
  }
};

// Delete brand
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: 'Brand not found' 
      });
    }

    // Check if brand has associated products
    const Product = require('../models/product');
    const productCount = await Product.countDocuments({ brand_id: req.params.id });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete brand with associated products. Please delete or reassign products first.'
      });
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting brand',
      error: error.message
    });
  }
};

// Search brands
exports.searchBrands = async (req, res) => {
  try {
    const { q } = req.query;
    const brands = await Brand.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });
    
    // Transform data to match frontend expectations
    const transformedBrands = brands.map(brand => transformBrandForFrontend(brand, req));
    
    res.json(transformedBrands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active brands only
exports.getActiveBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ status: true }).sort({ name: 1 });
    
    // Transform data to match frontend expectations
    const transformedBrands = brands.map(brand => transformBrandForFrontend(brand, req));
    
    res.json(transformedBrands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete brands
exports.bulkDeleteBrands = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of brand IDs to delete'
      });
    }

    // Check if any brands have associated products
    const Product = require('../models/product');
    const brandsWithProducts = await Product.find({ brand_id: { $in: ids } });
    
    if (brandsWithProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete brands with associated products. Please delete or reassign products first.'
      });
    }

    const result = await Brand.deleteMany({ _id: { $in: ids } });
    
    res.json({
      success: true,
      message: `${result.deletedCount} brands deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting brands',
      error: error.message
    });
  }
}; 