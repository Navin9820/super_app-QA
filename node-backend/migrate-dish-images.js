const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Dish = require('./src/models/dish');

async function migrateDishImages() {
  try {
    console.log('🔄 Starting dish images migration...');
    
    // Find all dishes that don't have an images array
    const dishes = await Dish.find({ images: { $exists: false } });
    console.log(`📊 Found ${dishes.length} dishes without images array`);
    
    let migratedCount = 0;
    
    for (const dish of dishes) {
      // Initialize images array with existing image if available
      const imagesArray = [];
      if (dish.image) {
        imagesArray.push(dish.image);
      }
      
      // Update the dish with images array
      await Dish.findByIdAndUpdate(dish._id, {
        $set: { images: imagesArray }
      });
      
      migratedCount++;
      console.log(`✅ Migrated dish: ${dish.name} (${imagesArray.length} images)`);
    }
    
    console.log(`🎉 Migration complete! Migrated ${migratedCount} dishes`);
    
    // Verify migration
    const totalDishes = await Dish.countDocuments();
    const dishesWithImages = await Dish.countDocuments({ images: { $exists: true } });
    
    console.log(`📊 Verification:`);
    console.log(`  - Total dishes: ${totalDishes}`);
    console.log(`  - Dishes with images array: ${dishesWithImages}`);
    console.log(`  - Dishes without images array: ${totalDishes - dishesWithImages}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

migrateDishImages();
