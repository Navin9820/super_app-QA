// Verify the import results
const mongoose = require('mongoose');
const Product = require('./src/models/product');
const Category = require('./src/models/category');
const Brand = require('./src/models/brand');
require('dotenv').config();

async function verifyImport() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count all collections
    const [productCount, categoryCount, brandCount] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Brand.countDocuments()
    ]);

    console.log('\n📊 IMPORT VERIFICATION:');
    console.log('======================');
    console.log(`Products: ${productCount}`);
    console.log(`Categories: ${categoryCount}`);
    console.log(`Brands: ${brandCount}`);

    // Show sample products
    if (productCount > 0) {
      console.log('\n📋 SAMPLE PRODUCTS:');
      const sampleProducts = await Product.find({})
        .populate('category_id', 'name')
        .populate('brand_id', 'name')
        .limit(5);
      
      sampleProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price} - ${product.category_id?.name} - ${product.brand_id?.name}`);
      });
    }

    // Show category hierarchy
    if (categoryCount > 0) {
      console.log('\n📂 CATEGORY HIERARCHY:');
      const mainCategories = await Category.find({ parent_id: null });
      for (const mainCat of mainCategories) {
        console.log(`\n${mainCat.name}:`);
        const subcategories = await Category.find({ parent_id: mainCat._id });
        subcategories.forEach(sub => {
          console.log(`  └── ${sub.name}`);
        });
      }
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyImport();
