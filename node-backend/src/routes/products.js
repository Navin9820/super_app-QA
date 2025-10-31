const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const validateImage = require('../middlewares/imageValidation.middleware');

// Import product controller
const {
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
  getApplianceProductsWithAttributes // ✅ newly added
} = require('../controllers/product.controller');

// Product routes
router.get('/get_all_product', getAllProducts);
router.get('/appliances', getApplianceProductsWithAttributes); // ✅ added route
router.get('/:id', getProductById);
router.post('/save_product', protect, authorize('admin', 'ecommerce_admin'), upload.single('product_image'), validateImage, createProduct);
router.put('/update_product_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), upload.single('product_image'), validateImage, updateProduct);
router.delete('/delete_product_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), deleteProduct);
router.delete('/delete_products', protect, authorize('admin', 'ecommerce_admin'), bulkDeleteProducts);

// Product variation routes
router.get('/get_product_variation_by_id/:id', getProductVariationById);
router.get('/get_all_product_variation', getAllProductVariations);
router.post('/save_product_variation', protect, authorize('admin', 'ecommerce_admin'), createProductVariation);
router.put('/update_product_variation_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), updateProductVariation);
router.delete('/delete_product_variation_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), deleteProductVariation);
router.delete('/delete_product_variations', protect, authorize('admin', 'ecommerce_admin'), bulkDeleteProductVariations);

// Stock management routes
router.put('/update_product_variation_stock_by_id/:id', protect, authorize('admin', 'ecommerce_admin'), updateProductVariationStock);
router.get('/getStockByProductVariation/:id', getStockByProductVariation);
router.delete('/delete_stock_management/:id', protect, authorize('admin', 'ecommerce_admin'), deleteStockManagement);

module.exports = router;
