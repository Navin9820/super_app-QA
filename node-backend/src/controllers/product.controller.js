const Product = require('../models/product');
const ProductVariation = require('../models/productvariation');
const Brand = require('../models/brand');
const Category = require('../models/category');
const Size = require('../models/size');
const Color = require('../models/color');
const Unit = require('../models/unit');
const { processImage, processImageForDatabase, processImageForHybrid } = require('../utils/imageProcessor');
const { processImageUrl, getBaseUrl } = require('../utils/imageUrlHelper');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const ProductAttribute = require('../models/productattribute');

// Helper to make absolute image URLs or return Base64 data
function makeAbsoluteUrl(req, path) {
  const baseUrl = getBaseUrl(req);
  return processImageUrl(path, baseUrl);
}

// Test endpoint - super simple
exports.testProducts = async (req, res) => {
  try {
    const products = await Product.find().limit(1).lean();
    res.json({
      success: true,
      count: products.length,
      message: 'Test successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Fallback endpoint - no populate, just basic data
exports.getProductsSimple = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Simple query without populate to avoid timeouts
    const products = await Product.find({}, {
      _id: 1,
      name: 1,
      price: 1,
      stock: 1,
      status: 1,
      createdAt: 1,
      photo: 1,
      photo_path: 1,
      images_paths: 1
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    const totalProducts = await Product.countDocuments();
    
    // Transform with basic data only
    const transformedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      status: product.status,
      createdAt: product.createdAt,
      photo: product.photo_path || (product.photo && product.photo.startsWith('/uploads/') ? product.photo : '/uploads/products/placeholder.jpg'),
      category: 'N/A', // Will be populated by frontend if needed
      brand: 'N/A',    // Will be populated by frontend if needed
      images_count: 0,
      has_images: !!(product.photo_path || (product.photo && product.photo.startsWith('/uploads/')))
    }));
    
    res.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products (simple)',
      error: error.message
    });
  }
};

// Get all products - PROPER FIX with data but optimized
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Increased from 20 to 50
    const skip = (page - 1) * limit;
    
    // Add timeout and error handling for MongoDB Atlas
    const queryOptions = {
      maxTimeMS: 5000, // 5 second timeout - more aggressive
      readPreference: 'secondaryPreferred' // Use secondary if available
    };
    
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
    
    // Get products with basic populate - much faster
    const products = await Product.find(filter, null, queryOptions)
      .populate('category_id', 'name slug')
      .populate('sub_category_id', 'name slug')
      .populate('brand_id', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination with timeout
    const totalProducts = await Product.countDocuments(filter, queryOptions);
    
    // Transform with proper data - PERFORMANCE OPTIMIZED
    const transformedProducts = products.map(product => {
      // Debug logging for brand data
      console.log('🔍 DEBUG: Product brand data:', {
        productName: product.name,
        brand_id: product.brand_id,
        brandName: product.brand_id?.name
      });
      
      return {
      _id: product._id,
      name: product.name,
      description: product.description,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      sale_price: product.sale_price,
      stock: product.stock,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category_id?.name || 'N/A',
      brand: product.brand_id?.name || 'N/A',
      // Include full category, subcategory, and brand objects for frontend filtering
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      brand_id: product.brand_id, // Keep the populated brand object
      // HYBRID APPROACH: Prioritize Base64 data from photo, then images array, then file paths
      photo: (product.photo && product.photo.startsWith('data:image/') ? product.photo : 
              (product.images && product.images.length > 0 && product.images[0].startsWith('data:image/') ? product.images[0] : 
               product.photo_path)) || (product.photo && product.photo.startsWith('/uploads/') ? product.photo : '/uploads/products/placeholder.jpg'),
      featured_image: (product.featured_image && product.featured_image.startsWith('data:image/') ? product.featured_image : product.photo_path) || (product.featured_image && product.featured_image.startsWith('/uploads/') ? product.featured_image : '/uploads/products/placeholder.jpg'),
      // New fields for frontend
      photo_path: product.photo_path,
      images_paths: product.images_paths || [],
      // Include Base64 images for admin panel display
      images: product.images || [],
      images_count: product.images?.length || 0,
      has_images: (product.images && product.images.length > 0) || (product.images_paths && product.images_paths.length > 0)
      };
    });
    
    res.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page
    });
  } catch (error) {
    // Handle specific MongoDB errors - redirect to simple endpoint
    if (error.name === 'MongoNetworkTimeoutError' || error.name === 'MongoServerError') {
      
      // Try simple endpoint as fallback
      try {
        const simpleProducts = await Product.find({}, {
          _id: 1,
          name: 1,
          price: 1,
          stock: 1,
          status: 1,
          createdAt: 1,
          photo: 1,
          photo_path: 1,
          images_paths: 1
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        const totalProducts = await Product.countDocuments();
        
        const transformedProducts = simpleProducts.map(product => ({
          _id: product._id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          status: product.status,
          createdAt: product.createdAt,
          photo: product.photo_path || (product.photo && product.photo.startsWith('/uploads/') ? product.photo : '/uploads/products/placeholder.jpg'),
          category: 'N/A',
          brand: 'N/A',
          images_count: 0,
          has_images: !!(product.photo_path || (product.photo && product.photo.startsWith('/uploads/')))
        }));
        
        return res.json({
          success: true,
          data: transformedProducts,
          count: transformedProducts.length,
          totalProducts: totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
          currentPage: page,
          fallback: true // Indicate this is a fallback response
        });
      } catch (fallbackError) {
        return res.status(503).json({
          success: false,
          message: 'Database connection timeout. Please try again.',
          error: 'MongoDB Atlas connection timed out'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category_id: categoryId })
      .populate({
        path: 'category',
        populate: { path: 'parent_id' }
      })
      .populate('brand')
      .populate('sub_category_id')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};

exports.getProductsByCategoryName = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    const products = await Product.find({ category_id: category._id })
      .populate({
        path: 'category',
        populate: { path: 'parent_id' }
      })
      .populate('brand')
      .populate('sub_category_id')
      .sort({ createdAt: -1 });
    // Map image URLs
    const mapped = products.map(prod => ({
      ...prod.toObject(),
      photo: makeAbsoluteUrl(req, prod.photo),
      featured_image: makeAbsoluteUrl(req, prod.featured_image),
      // ✅ ADDED: Include images array with absolute URLs
      images: prod.images && prod.images.length > 0 
        ? prod.images.map(img => makeAbsoluteUrl(req, img))
        : []
    }));
    res.json({
      success: true,
      data: mapped,
      count: mapped.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category name',
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'category_id',
        select: 'name slug'
      })
      .populate({
        path: 'brand_id',
        select: 'name slug'
      })
      .populate({
        path: 'sub_category_id',
        select: 'name slug'
      });
      
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Debug logging removed for performance
    
    // ✅ FIXED: Convert populated objects to plain string IDs for form compatibility
    const productForForm = {
      ...product.toObject(),
      category_id: product.category_id ? product.category_id._id.toString() : null,
      sub_category_id: product.sub_category_id ? product.sub_category_id._id.toString() : null,
      brand_id: product.brand_id ? product.brand_id._id.toString() : null,
      // ✅ ADDED: Ensure images array is included for admin panel
      images: product.images || []
    };
    
    // Debug logging removed for performance
    
    res.json(productForForm);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, brand_id, category_id, sub_category_id, slug, sku, sale_price, stock, status, meta_title, meta_description } = req.body;
    
    // Validate required fields
    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    if (!brand_id) {
      return res.status(400).json({
        success: false,
        message: 'Brand is required'
      });
    }
    
    let imagePath = null;
    let imagesArray = [];
    let imagesPathsArray = [];
    
    // Handle single image (main photo) - HYBRID: Store both file path and Base64
    if (req.files && req.files.product_image && req.files.product_image[0]) {
      const processedImage = await processImageForHybrid(req.files.product_image[0], {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg',
        subfolder: 'products'
      });
      imagePath = processedImage.filePath; // Store file path for new approach
      imagesArray.push(processedImage.base64Data); // Keep base64 for backward compatibility
      imagesPathsArray.push(processedImage.filePath); // Store file path for new approach
    }
    
    // Handle multiple images if they exist - HYBRID: Store both file path and Base64
    if (req.files && req.files.multiple_images && req.files.multiple_images.length > 0) {
      for (const file of req.files.multiple_images) {
        const processedImage = await processImageForHybrid(file, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'jpeg',
          subfolder: 'products'
        });
        imagesArray.push(processedImage.base64Data); // Keep base64 for backward compatibility
        imagesPathsArray.push(processedImage.filePath); // Store file path for new approach
      }
    }
    
    // ✅ FIXED: Handle legacy req.file for backward compatibility - Store in database as Base64
    if (!imagePath && req.file) {
      const processedImage = await processImageForDatabase(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      });
      imagePath = processedImage.base64Data; // Store Base64 data instead of file path
      imagesArray.push(imagePath);
    }
    
    // Debug logging removed for performance
    

    const product = await Product.create({
      name,
      description,
      slug,
      sku,
      price,
      sale_price,
      stock,
      category_id,
      sub_category_id: sub_category_id || null,  // ✅ FIXED: Add subcategory support
      brand_id,
      // New hybrid approach: Store both file paths and base64
      photo: imagePath, // File path for new approach
      photo_path: imagePath, // Explicit file path field
      featured_image: imagePath,
      images: imagesArray, // Base64 array for backward compatibility
      images_paths: imagesPathsArray, // File paths array for new approach
      status: status === 'true' || status === true,
      meta_title,
      meta_description,
    });
    
    // Debug logging removed for performance
    
    // Return product with populated relationships
    const populatedProduct = await Product.findById(product._id)
      .populate('category_id', 'name')
      .populate('sub_category_id', 'name')
      .populate('brand_id', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Debug logging removed for performance
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      // Debug logging removed for performance
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const { name, description, price, brand_id, category_id, sub_category_id, slug, sku, sale_price, stock, status, meta_title, meta_description } = req.body;
    
    // Debug logging for brand_id
    console.log('🔍 DEBUG: Product update - brand_id received:', brand_id, 'type:', typeof brand_id);
    
    // Update product fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = price;
    if (sale_price !== undefined) product.sale_price = sale_price;
    if (stock !== undefined) product.stock = stock;
    if (sku) product.sku = sku;
    if (slug) product.slug = slug;
    // FIXED: Allow brand_id to be updated even if it's empty string or null
    if (brand_id !== undefined) {
      product.brand_id = brand_id || null;
      console.log('🔍 DEBUG: Brand ID updated to:', product.brand_id);
    }
    if (category_id) product.category_id = category_id;
    if (sub_category_id !== undefined) product.sub_category_id = sub_category_id || null;
    if (status !== undefined) product.status = status === 'true' || status === true;
    if (meta_title !== undefined) product.meta_title = meta_title;
    if (meta_description !== undefined) product.meta_description = meta_description;
    
    // Debug logging removed for performance
    
    // Handle image upload - FIXED: Use same pattern as working grocery controller
    let imagePath = product.photo;
    let imagesArray = product.images || [];
    
    if (req.file) {
      console.log('🔍 DEBUG: Image file received:', req.file.filename);
      console.log('🔍 DEBUG: Current product.photo:', product.photo);
      
      // Delete old image if exists
      if (product.photo) {
        const oldImagePath = path.join(__dirname, '..', '..', 'uploads', product.photo.replace('/uploads/', ''));
        try {
          if (fs.existsSync(oldImagePath)) {
            await fsPromises.unlink(oldImagePath);
          }
        } catch (error) {
          // Error deleting old image - continue with update
        }
      }
      
      // Process and save new image - Store in database as Base64
      try {
        const processedImage = await processImageForDatabase(req.file, {
          width: 800,
          height: 800,
          quality: 85,
          format: 'jpeg'
        });
        imagePath = processedImage.base64Data; // Store Base64 data instead of file path
        
        // Update images array - add new image at the beginning
        imagesArray.unshift(imagePath);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing image',
          error: error.message
        });
      }
    }
    
    // ✅ ADDED: Handle multiple images from req.files
    if (req.files && req.files.multiple_images && req.files.multiple_images.length > 0) {
      
      for (const file of req.files.multiple_images) {
        try {
          const processedImage = await processImageForDatabase(file, {
            width: 800,
            height: 800,
            quality: 85,
            format: 'jpeg'
          });
          imagesArray.push(processedImage.base64Data); // Store Base64 data instead of file path
        } catch (error) {
        }
      }
    }
    
    // Set the image path
    product.photo = imagePath;
    product.featured_image = imagePath;
    product.images = imagesArray; // Update images array
    
    // Save the updated product
    await product.save();
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    if (product.photo) {
      const oldImagePath = path.join(__dirname, '..', '..', 'uploads', product.photo);
      try {
        if (fs.existsSync(oldImagePath)) {
          await fsPromises.unlink(oldImagePath);
        }
      } catch (error) {
        // Error deleting image file - continue
      }
    }
    await product.deleteOne();
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Bulk delete products
exports.bulkDeleteProducts = async (req, res) => {
  console.log('🔍 DEBUG: bulkDeleteProducts function called!');
  try {
    console.log('🔍 DEBUG: Bulk delete request body:', req.body);
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      console.log('🔍 DEBUG: Invalid productIds:', productIds);
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }
    
    console.log('🔍 DEBUG: Deleting products:', productIds);
    
    // Delete products and their images
    const deletedProducts = [];
    const errors = [];
    
    for (const productId of productIds) {
      try {
        console.log('🔍 DEBUG: Processing product ID:', productId);
        const product = await Product.findById(productId);
        
        if (!product) {
          console.log('🔍 DEBUG: Product not found:', productId);
          errors.push(`Product ${productId} not found`);
          continue;
        }
        
        console.log('🔍 DEBUG: Found product:', product.name);
        
        // Delete product image if exists
        if (product.photo) {
          const oldImagePath = path.join(__dirname, '..', '..', 'uploads', product.photo);
          try {
            if (fs.existsSync(oldImagePath)) {
              await fsPromises.unlink(oldImagePath);
              console.log('🔍 DEBUG: Deleted main image for product:', product.name);
            }
          } catch (error) {
            console.log('🔍 DEBUG: Error deleting main image:', error.message);
          }
        }
        
        // Delete additional images if they exist
        if (product.images && Array.isArray(product.images)) {
          for (const imagePath of product.images) {
            const fullImagePath = path.join(__dirname, '..', '..', 'uploads', imagePath.replace('/uploads/', ''));
            try {
              if (fs.existsSync(fullImagePath)) {
                await fsPromises.unlink(fullImagePath);
                console.log('🔍 DEBUG: Deleted additional image:', imagePath);
              }
            } catch (error) {
              console.log('🔍 DEBUG: Error deleting additional image:', error.message);
            }
          }
        }
        
        await product.deleteOne();
        deletedProducts.push(productId);
        console.log('🔍 DEBUG: Successfully deleted product:', product.name);
        
      } catch (error) {
        console.error('🔍 DEBUG: Error processing product', productId, ':', error.message);
        errors.push(`Error deleting product ${productId}: ${error.message}`);
      }
    }
    
    console.log('🔍 DEBUG: Bulk delete completed. Deleted:', deletedProducts.length, 'Errors:', errors.length);
    
    if (errors.length > 0) {
      return res.json({
        success: true,
        message: `Successfully deleted ${deletedProducts.length} products, ${errors.length} errors occurred`,
        deletedCount: deletedProducts.length,
        deletedIds: deletedProducts,
        errors: errors
      });
    }
    
    res.json({
      success: true,
      message: `Successfully deleted ${deletedProducts.length} products`,
      deletedCount: deletedProducts.length,
      deletedIds: deletedProducts
    });
  } catch (error) {
    console.error('🔍 DEBUG: Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk deleting products',
      error: error.message
    });
  }
};

exports.getProductVariationById = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get product variation by ID - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.getAllProductVariations = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get all product variations - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.createProductVariation = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create product variation - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.updateProductVariation = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update product variation - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.deleteProductVariation = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Delete product variation - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.bulkDeleteProductVariations = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Bulk delete product variations - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.updateProductVariationStock = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update product variation stock - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.getStockByProductVariation = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get stock by product variation - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.deleteStockManagement = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Delete stock management - Not implemented yet (MongoDB migration in progress)'
  });
};

exports.getApplianceProductsWithAttributes = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get appliance products with attributes - Not implemented yet (MongoDB migration in progress)'
  });
};

// Get products by subcategory (NEW FUNCTION - CRITICAL FOR SUBCATEGORY NAVIGATION)
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    
    // Validate subcategory exists
    const subcategory = await Category.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    
    // Find products by subcategory
    const products = await Product.find({ sub_category_id: subcategoryId })
      .populate({
        path: 'category_id',
        select: 'name slug'
      })
      .populate({
        path: 'sub_category_id', 
        select: 'name slug'
      })
      .populate({
        path: 'brand_id',
        select: 'name slug'
      })
      .sort({ createdAt: -1 });
    
    // Map image URLs to absolute paths
    const mapped = products.map(prod => ({
      ...prod.toObject(),
      photo: makeAbsoluteUrl(req, prod.photo),
      featured_image: makeAbsoluteUrl(req, prod.featured_image)
    }));
    
    res.json({
      success: true,
      data: mapped,
      subcategory: {
        id: subcategory._id,
        name: subcategory.name,
        slug: subcategory.slug
      },
      count: mapped.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by subcategory',
      error: error.message
    });
  }
};

// Manage product images (add, remove, reorder)
exports.manageProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, imageIndex, imagePath } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let imagesArray = product.images || [];
    
    switch (action) {
      case 'add':
        if (req.file) {
          const processedImage = await processImageForDatabase(req.file, {
            width: 800,
            height: 800,
            quality: 85,
            format: 'jpeg'
          });
          imagesArray.push(processedImage.base64Data); // Store Base64 data instead of file path
        }
        break;
        
      case 'remove':
        if (imageIndex !== undefined && imageIndex >= 0 && imageIndex < imagesArray.length) {
          const removedImage = imagesArray[imageIndex];
          // Delete the image file
          const imagePathToDelete = path.join(__dirname, '..', '..', 'uploads', removedImage.replace('/uploads/', ''));
          try {
            if (fs.existsSync(imagePathToDelete)) {
              await fsPromises.unlink(imagePathToDelete);
            }
          } catch (error) {
            // Error deleting image file - continue
          }
          // Remove from array
          imagesArray.splice(imageIndex, 1);
        }
        break;
        
      case 'reorder':
        if (req.body.newOrder && Array.isArray(req.body.newOrder)) {
          imagesArray = req.body.newOrder;
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: add, remove, or reorder'
        });
    }
    
    // Update the product
    product.images = imagesArray;
    await product.save();
    
    res.json({
      success: true,
      message: 'Product images updated successfully',
      data: {
        images: imagesArray,
        count: imagesArray.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error managing product images',
      error: error.message
    });
  }
};