const Category = require('../models/category');
const Product = require('../models/product');
const { processImage, processImageForDatabase } = require('../utils/imageProcessor');
const { processImageUrl, getBaseUrl } = require('../utils/imageUrlHelper');
const path = require('path');
const slugify = require('slugify');
const fs = require('fs');
const mongoose = require('mongoose');

// Ensure database connection
const ensureConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
  }
};

// Generate a unique slug
const generateUniqueSlug = async (baseName, currentId = null) => {
  let baseSlug = slugify(baseName, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (currentId) query._id = { $ne: currentId }; // Exclude current ID on update

    const existing = await Category.findOne(query);
    if (!existing) break;

    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

// Helper function to transform category data for frontend
const transformCategoryForFrontend = (category, req) => {
  const baseUrl = getBaseUrl(req);
  return {
    id: category._id,
    name: category.name,
    description: category.description,
    slug: category.slug,
    image: processImageUrl(category.image, baseUrl, category._id, 'category'), // Process image URL/Base64 with ID and type
    parent_id: category.parent_id,
    status: category.status,
    meta_title: category.meta_title,
    meta_description: category.meta_description,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
};

// Get all categories (OPTIMIZED for admin dropdowns)
exports.getAllCategories = async (req, res) => {
  try {
    await ensureConnection();
    
    // Check if this is a dropdown request (query parameter)
    const isDropdownRequest = req.query.dropdown === 'true';
    
    if (isDropdownRequest) {
      // OPTIMIZED: Fetch only essential fields for dropdowns
      const categories = await Category.find(
        { status: true }, // Only active categories
        'name parent_id status' // Only essential fields
      )
      .sort({ name: 1 }) // Sort by name for better UX
      .lean(); // Use lean() for faster queries
      
      // Transform to minimal format
      const minimalCategories = categories.map(category => ({
        id: category._id,
        name: category.name,
        parent_id: category.parent_id,
        status: category.status
      }));
      
      // Add cache headers (5 minutes cache for dropdowns)
      res.set('Cache-Control', 'public, max-age=300');
      res.set('Expires', new Date(Date.now() + 300000).toUTCString());
      
      return res.json(minimalCategories);
    }
    
    // FULL RESPONSE: For admin table view (keep existing functionality)
    // Support status filtering via query parameter
    let filter = {};
    if (req.query.status) {
      if (req.query.status === 'active') {
        filter.status = true;
      } else if (req.query.status === 'inactive') {
        filter.status = false;
      }
      // If status is 'all' or any other value, don't add status filter
    }
    
    const categories = await Category.find(filter)
      .populate('parentCategory')
      .sort({ createdAt: -1 });

    const transformedCategories = categories.map(category => ({
      ...transformCategoryForFrontend(category, req),
      parentCategory: category.parentCategory ? {
        id: category.parentCategory._id,
        name: category.parentCategory.name
      } : null
    }));

    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(transformedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active parent categories only (for home page)
exports.getParentCategories = async (req, res) => {
  try {
    await ensureConnection();
    const parentCategories = await Category.find({ 
      parent_id: null,  // Only parent categories
      status: true      // Only active categories
    }).sort({ createdAt: -1 });

    const transformedCategories = parentCategories.map(category => ({
      ...transformCategoryForFrontend(category, req)
    }));

    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(transformedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get children categories by parent ID
exports.getChildrenByParentId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const childrenCategories = await Category.find({ 
      parent_id: id,
      status: true  // Only active subcategories
    }).sort({ createdAt: -1 });

    const transformedCategories = childrenCategories.map(category => ({
      ...transformCategoryForFrontend(category, req)
    }));

    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json(transformedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    await ensureConnection();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
        error: 'INVALID_ID'
      });
    }
    
    const category = await Category.findById(req.params.id)
      .populate({ path: 'childCategories', populate: { path: 'childCategories' } })
      .populate('parentCategory');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const transformedCategory = {
      ...transformCategoryForFrontend(category, req),
      parentCategory: category.parentCategory ? {
        id: category.parentCategory._id,
        name: category.parentCategory.name
      } : null,
      childCategories: category.childCategories ? category.childCategories.map(child => transformCategoryForFrontend(child, req)) : []
    };

    res.json(transformedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    // console.log('🔍 DEBUG: CREATE CATEGORY called');
    // console.log('🔍 DEBUG: Request method:', req.method);
    // console.log('🔍 DEBUG: Request body:', req.body);
    const { name, description, parent_id, status, meta_title, meta_description } = req.body;
    let imagePath = null;

    if (req.file) {
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
    }

    let validParentId = null;
    if (parent_id && mongoose.Types.ObjectId.isValid(parent_id)) {
      validParentId = parent_id;
    }

    const uniqueSlug = await generateUniqueSlug(name);

    // console.log('🔍 DEBUG: Creating category with image data:');
    // console.log('  - imagePath type:', typeof imagePath);
    // console.log('  - imagePath is Base64:', imagePath ? imagePath.startsWith('data:image/') : false);
    
    const category = new Category({
      name,
      description,
      slug: uniqueSlug,
      image: imagePath,
      status: status !== undefined ? String(status) === 'true' : true,
      parent_id: validParentId,
      meta_title,
      meta_description
    });

    await category.save();
    // console.log('✅ DEBUG: Category created successfully with ID:', category._id);
    // console.log('  - Saved image type:', typeof category.image);
    // console.log('  - Saved image is Base64:', category.image ? category.image.startsWith('data:image/') : false);
    
    res.status(201).json(transformCategoryForFrontend(category, req));
  } catch (error) {
    res.status(500).json({
      message: 'An unexpected error occurred while creating the category.',
      error: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    // console.log('🔍 DEBUG: UPDATE CATEGORY called');
    // console.log('🔍 DEBUG: Request method:', req.method);
    // console.log('🔍 DEBUG: Request params:', req.params);
    // console.log('🔍 DEBUG: Request body:', req.body);
    
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, description, parent_id, status, meta_title, meta_description } = req.body;
    let imagePath = category.image;

    if (req.file) {
      // No need to delete old files since we're using Base64 storage
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });

      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
    }

    // Validate parent_id if provided
    let validParentId = category.parent_id;
    if (parent_id === 'null' || parent_id === '' || parent_id === null) {
      validParentId = null;
    } else if (parent_id && parent_id !== 'null' && parent_id !== '') {
      // console.log('🔍 DEBUG: Updating category with parent_id:', parent_id);
      // console.log('🔍 DEBUG: Current category ID:', req.params.id);
      
      if (!mongoose.Types.ObjectId.isValid(parent_id)) {
        console.log('❌ DEBUG: Invalid parent_id format');
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID',
          error: 'INVALID_PARENT_ID'
        });
      }

      // Check if parent category exists and is active
      const parentCategory = await Category.findById(parent_id);
      if (!parentCategory) {
        // console.log('❌ DEBUG: Parent category not found for ID:', parent_id);
        return res.status(400).json({
          success: false,
          message: 'Parent category not found',
          error: 'PARENT_NOT_FOUND'
        });
      }

      // console.log('✅ DEBUG: Parent category found:', parentCategory.name, 'ID:', parentCategory._id);

      if (!parentCategory.status) {
        // console.log('❌ DEBUG: Parent category is inactive');
        return res.status(400).json({
          success: false,
          message: 'Cannot assign to inactive parent category',
          error: 'PARENT_INACTIVE'
        });
      }

      // Prevent circular reference (category cannot be its own parent)
      if (parent_id === req.params.id) {
        // console.log('❌ DEBUG: Circular reference detected - category cannot be its own parent');
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent',
          error: 'CIRCULAR_REFERENCE'
        });
      }

      // Prevent creating subcategory of a subcategory (max 2 levels)
      if (parentCategory.parent_id !== null) {
        // console.log('❌ DEBUG: Cannot assign to subcategory - max hierarchy level is 2');
        return res.status(400).json({
          success: false,
          message: 'Cannot assign to subcategory. Maximum hierarchy level is 2.',
          error: 'MAX_HIERARCHY_EXCEEDED'
        });
      }

      validParentId = parent_id;
      // console.log('✅ DEBUG: Parent validation passed, validParentId:', validParentId);
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.slug = name ? await generateUniqueSlug(name, category._id) : category.slug;
    category.image = imagePath;
    category.status = typeof status !== 'undefined' ? (String(status) === 'true') : category.status;
    category.parent_id = validParentId;
    category.meta_title = meta_title || category.meta_title;
    category.meta_description = meta_description || category.meta_description;

    await category.save();
    res.json(transformCategoryForFrontend(category, req));
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while updating the category.',
      error: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('childCategories');
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check for products in this category
    const productCount = await Product.countDocuments({ category_id: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with associated products. Please delete or reassign products first.'
      });
    }

    // If category has subcategories, delete them first
    if (category.childCategories && category.childCategories.length > 0) {
      console.log(`Deleting ${category.childCategories.length} subcategories for category: ${category.name}`);
      
      // Delete all subcategories
      for (const subcategory of category.childCategories) {
        // Check for products in subcategory
        const subcategoryProductCount = await Product.countDocuments({ category_id: subcategory._id });
        if (subcategoryProductCount > 0) {
          return res.status(400).json({
            message: `Cannot delete category. Subcategory "${subcategory.name}" has ${subcategoryProductCount} associated products. Please delete or reassign products first.`
          });
        }
        
        // Delete subcategory
        await Category.findByIdAndDelete(subcategory._id);
        console.log(`Deleted subcategory: ${subcategory.name}`);
      }
    }

    // Now delete the parent category
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category and all subcategories deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while deleting the category.',
      error: error.message
    });
  }
};

// Get categories by parent ID
exports.getCategoriesByParent = async (req, res) => {
  try {
    const { parent_id } = req.params;
    const categories = await Category.find({ parent_id }).populate('childCategories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search categories
exports.searchCategories = async (req, res) => {
  try {
    const { q } = req.query;
    const categories = await Category.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active categories only
exports.getActiveCategories = async (req, res) => {
  try {
    await ensureConnection();
    const categories = await Category.find({ status: true })
      .populate({
        path: 'childCategories',
        match: { status: true },
        populate: {
          path: 'childCategories',
          match: { status: true }
        }
      });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check category integrity (admin utility)
exports.checkCategoryIntegrity = async (req, res) => {
  try {
    await ensureConnection();
    
    // Find orphaned categories (categories with parent_id but parent doesn't exist)
    const orphanedCategories = await Category.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'parent_id',
          foreignField: '_id',
          as: 'parent'
        }
      },
      {
        $match: {
          parent_id: { $ne: null },
          parent: { $size: 0 }
        }
      }
    ]);

    // Find categories with invalid parent_id format
    const invalidParentCategories = await Category.find({
      parent_id: { $ne: null, $not: { $regex: /^[0-9a-fA-F]{24}$/ } }
    });

    res.json({
      success: true,
      orphanedCategories: orphanedCategories.length,
      invalidParentCategories: invalidParentCategories.length,
      orphaned: orphanedCategories,
      invalid: invalidParentCategories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fix orphaned categories (admin utility)
exports.fixOrphanedCategories = async (req, res) => {
  try {
    await ensureConnection();
    
    // Find and fix orphaned categories by setting parent_id to null
    const result = await Category.updateMany(
      {
        parent_id: { $ne: null },
        parent_id: { $not: { $regex: /^[0-9a-fA-F]{24}$/ } }
      },
      { $set: { parent_id: null } }
    );

    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} orphaned categories`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
