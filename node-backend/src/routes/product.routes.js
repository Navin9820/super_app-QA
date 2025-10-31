const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { validateImage } = require('../middlewares/imageValidation.middleware');

// Import product controller
const {
  testProducts,
  getProductsSimple,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getProductVariationById,
  getAllProductVariations,
  createProductVariation,
  updateProductVariation,
  deleteProductVariation,
  bulkDeleteProductVariations,
  updateProductVariationStock,
  getStockByProductVariation,
  deleteStockManagement,
  getApplianceProductsWithAttributes, // custom endpoint
  getProductsByCategory,
  getProductsByCategoryName,
  getProductsBySubcategory,  // ✅ ADDED: Import subcategory function
  manageProductImages // ✅ ADDED: Import image management function
} = require('../controllers/product.controller');

// Product routes
router.get('/test', testProducts); // Test endpoint
router.get('/simple', getProductsSimple); // Fallback endpoint without populate
router.get('/', getAllProducts); // Simple GET /api/products
router.get('/get_all_product', getAllProducts);
router.get('/appliances', getApplianceProductsWithAttributes); // custom appliances endpoint
router.get('/category/:categoryId', getProductsByCategory);
router.get('/category/name/:categorySlug', getProductsByCategoryName);
router.get('/subcategory/:subcategoryId', getProductsBySubcategory);  // ✅ ADDED: Subcategory route
router.get('/:id', getProductById);
router.post('/save_product', protect, authorize('admin', 'ecommerce_admin'), upload.fields([
  { name: 'product_image', maxCount: 1 },
  { name: 'multiple_images', maxCount: 10 }
]), validateImage, createProduct);

// ✅ ADDED: Fallback route for testing (NO AUTH REQUIRED)
router.post('/save_product_test', upload.fields([
  { name: 'product_image', maxCount: 1 },
  { name: 'multiple_images', maxCount: 10 }
]), createProduct);
router.put('/update_product_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), upload.single('product_image'), updateProduct);
// ✅ ADDED: Route for updating products with multiple images support
router.put('/update_product_with_images/:id', protect, authorize('admin', 'ecommerce_admin'), upload.fields([
  { name: 'product_image', maxCount: 1 },
  { name: 'multiple_images', maxCount: 10 }
]), updateProduct);
router.delete('/delete_product_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), deleteProduct);
router.delete('/delete_products', protect, authorize('admin', 'ecommerce_admin'), bulkDeleteProducts);
// ✅ ADDED: Simple DELETE route for frontend compatibility (must be last)
router.delete('/:id', protect, authorize('admin', 'ecommerce_admin'), deleteProduct);

// ✅ ADDED: Image management route
router.put('/:id/images', protect, authorize('admin', 'ecommerce_admin'), upload.single('image'), manageProductImages);

// Product variation routes
router.get('/get_product_variation_by_id/:id', getProductVariationById);
router.get('/get_all_product_variation', getAllProductVariations);
router.post('/save_product_variation', protect, authorize('admin', 'ecommerce_admin'), upload.array('images[]'), createProductVariation);
router.put('/update_product_variation_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), upload.array('images[]'), updateProductVariation);
router.delete('/delete_product_variation_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), deleteProductVariation);
router.delete('/delete_product_variations', protect, authorize('admin', 'ecommerce_admin'), bulkDeleteProductVariations);

// Additional variation routes
router.put('/update_product_variation_stock', protect, authorize('admin', 'ecommerce_admin'), updateProductVariationStock);
router.get('/get_stock_by_product_variation', protect, authorize('admin', 'ecommerce_admin'), getStockByProductVariation);
router.delete('/delete_stock_management/:id', protect, authorize('admin', 'ecommerce_admin'), deleteStockManagement);

module.exports = router;