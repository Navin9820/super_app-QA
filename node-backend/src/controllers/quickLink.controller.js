const asyncHandler = require('express-async-handler');
const QuickLink = require('../models/quickLink');
const Product = require('../models/product');
const Category = require('../models/category');
const { processImageUrl, getBaseUrl } = require('../utils/imageUrlHelper');

// @desc    Get all quick links (for frontend)
// @route   GET /api/quick-links
// @access  Public
exports.getQuickLinks = asyncHandler(async (req, res, next) => {
  try {
    const quickLinks = await QuickLink.find({ is_active: true })
      .populate({
        path: 'product_id',
        select: 'name photo featured_image image price category_id',
        populate: {
          path: 'category_id',
          select: 'name'
        }
      })
      .sort({ display_order: 1, created_at: -1 });

    // Get the base URL dynamically
    const baseUrl = getBaseUrl(req);

    // Transform data for frontend (be resilient to orphaned refs)
    const transformedQuickLinks = quickLinks
      .filter(link => !!link.product_id) // skip orphans safely
      .map(link => {
        const imagePath = link.product_id?.photo || link.product_id?.featured_image || link.product_id?.image;
        const fullImageUrl = processImageUrl(imagePath, baseUrl);

        return {
          id: link._id,
          product_id: link.product_id?._id || null,
          name: link.product_id?.name || 'Unknown',
          image: fullImageUrl,
          price: link.product_id?.price ?? null,
          category: link.product_id?.category_id?.name || 'Unknown',
          display_order: link.display_order
        };
      });

    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      data: transformedQuickLinks,
      message: 'Quick links fetched successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching quick links:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quick links'
    });
  }
});

// @desc    Get all quick links (admin)
// @route   GET /api/quick-links/admin
// @access  Admin
exports.getQuickLinksAdmin = asyncHandler(async (req, res, next) => {
  try {
    const quickLinks = await QuickLink.find()
      .populate({
        path: 'product_id',
        select: 'name photo featured_image image price category_id',
        populate: {
          path: 'category_id',
          select: 'name'
        }
      })
      .sort({ display_order: 1, created_at: -1 });

    // Get the base URL dynamically
    const baseUrl = getBaseUrl(req);

    // Transform data for admin with proper image URLs (skip orphans)
    const transformedQuickLinks = quickLinks
      .filter(link => !!link.product_id)
      .map(link => {
        const imagePath = link.product_id?.photo || link.product_id?.featured_image || link.product_id?.image;
        const fullImageUrl = processImageUrl(imagePath, baseUrl);

        return {
          ...link.toObject(),
          product_id: {
            ...(link.product_id ? link.product_id.toObject() : {}),
            photo: fullImageUrl,
            featured_image: fullImageUrl,
            image: fullImageUrl
          }
        };
      });

    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      data: transformedQuickLinks,
      message: 'Quick links fetched successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching quick links:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quick links'
    });
  }
});

// @desc    Create quick link
// @route   POST /api/quick-links
// @access  Admin
exports.createQuickLink = asyncHandler(async (req, res, next) => {
  try {
    const { product_id, display_order } = req.body;

    // Validate product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is already in quick links
    const existingLink = await QuickLink.findOne({ product_id });
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in quick links'
      });
    }

    const quickLink = new QuickLink({
      product_id,
      display_order: display_order || 0
    });

    await quickLink.save();

    // Populate product details for response
    await quickLink.populate({
      path: 'product_id',
      select: 'name image price category_id',
      populate: {
        path: 'category_id',
        select: 'name'
      }
    });

    res.status(201).json({
      success: true,
      data: quickLink,
      message: 'Quick link created successfully'
    });
  } catch (error) {
    console.error('Error creating quick link:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating quick link'
    });
  }
});

// @desc    Update quick link
// @route   PUT /api/quick-links/:id
// @access  Admin
exports.updateQuickLink = asyncHandler(async (req, res, next) => {
  try {
    const { display_order, is_active } = req.body;
    const quickLinkId = req.params.id;

    const quickLink = await QuickLink.findById(quickLinkId);
    if (!quickLink) {
      return res.status(404).json({
        success: false,
        message: 'Quick link not found'
      });
    }

    // Update fields
    if (display_order !== undefined) quickLink.display_order = display_order;
    if (is_active !== undefined) quickLink.is_active = is_active;

    await quickLink.save();

    // Populate product details for response
    await quickLink.populate({
      path: 'product_id',
      select: 'name image price category_id',
      populate: {
        path: 'category_id',
        select: 'name'
      }
    });

    res.json({
      success: true,
      data: quickLink,
      message: 'Quick link updated successfully'
    });
  } catch (error) {
    console.error('Error updating quick link:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating quick link'
    });
  }
});

// @desc    Delete quick link
// @route   DELETE /api/quick-links/:id
// @access  Admin
exports.deleteQuickLink = asyncHandler(async (req, res, next) => {
  try {
    const quickLinkId = req.params.id;

    const quickLink = await QuickLink.findById(quickLinkId);
    if (!quickLink) {
      return res.status(404).json({
        success: false,
        message: 'Quick link not found'
      });
    }

    await QuickLink.findByIdAndDelete(quickLinkId);

    res.json({
      success: true,
      message: 'Quick link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quick link:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting quick link'
    });
  }
});

// @desc    Bulk create quick links
// @route   POST /api/quick-links/bulk
// @access  Admin
exports.bulkCreateQuickLinks = asyncHandler(async (req, res, next) => {
  try {
    const { product_ids } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    // Validate all products exist
    const products = await Product.find({ _id: { $in: product_ids } });
    if (products.length !== product_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some products not found'
      });
    }

    // Check for existing quick links
    const existingLinks = await QuickLink.find({ product_id: { $in: product_ids } });
    const existingProductIds = existingLinks.map(link => link.product_id.toString());
    const newProductIds = product_ids.filter(id => !existingProductIds.includes(id));

    if (newProductIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All products are already in quick links'
      });
    }

    // Create quick links for new products
    const quickLinks = newProductIds.map((product_id, index) => ({
      product_id,
      display_order: existingLinks.length + index + 1
    }));

    const createdQuickLinks = await QuickLink.insertMany(quickLinks);

    res.status(201).json({
      success: true,
      data: createdQuickLinks,
      message: `${createdQuickLinks.length} quick links created successfully`
    });
  } catch (error) {
    console.error('Error bulk creating quick links:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating quick links'
    });
  }
});

// @desc    Get products by category and subcategory (for admin selection)
// @route   GET /api/quick-links/products/:categoryId/:subcategoryId?
// @access  Admin
exports.getProductsForSelection = asyncHandler(async (req, res, next) => {
  try {
    console.log('getProductsForSelection called');
    const { categoryId, subcategoryId } = req.params;
    console.log('getProductsForSelection called with:', { categoryId, subcategoryId });

    let query = { category_id: categoryId };
    if (subcategoryId && subcategoryId !== 'null' && subcategoryId !== 'undefined') {
      query.sub_category_id = subcategoryId;
    }

    console.log('Query:', query);

    const products = await Product.find(query)
      .select('name photo featured_image image price category_id sub_category_id')
      .sort({ name: 1 });

    console.log('Found products:', products.length);

    // Get the base URL dynamically
    const baseUrl = getBaseUrl(req);

    // Transform products to include proper image URLs
    const transformedProducts = products.map(product => {
      const imagePath = product.photo || product.featured_image || product.image;
      let fullImageUrl = null;
      
      if (imagePath && imagePath.trim() !== '') {
        // If it's already a Base64 data URL, return it as is
        if (imagePath.startsWith('data:image/')) {
          fullImageUrl = imagePath;
        } else if (imagePath.startsWith('http')) {
          // If it's already a full URL, return it as is
          fullImageUrl = imagePath;
        } else {
          // Ensure the path starts with a slash if it doesn't already
          const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
          fullImageUrl = `${baseUrl}${normalizedPath}`;
        }
      }
      
      return {
        ...product.toObject(),
        photo: fullImageUrl,
        featured_image: fullImageUrl,
        image: fullImageUrl
      };
    });

    res.json({
      success: true,
      data: transformedProducts,
      message: 'Products fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching products for selection:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});
