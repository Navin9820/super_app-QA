const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Grocery = require('./src/models/grocery');

async function migrateGroceryImages() {
  try {
    console.log('🔄 Starting grocery images migration...');
    
    // Find all groceries that don't have an images array
    const groceries = await Grocery.find({ images: { $exists: false } });
    console.log(`📊 Found ${groceries.length} groceries without images array`);
    
    let migratedCount = 0;
    
    for (const grocery of groceries) {
      // Initialize images array with existing image if available
      const imagesArray = [];
      if (grocery.image) {
        imagesArray.push(grocery.image);
      }
      
      // Update the grocery with images array
      await Grocery.findByIdAndUpdate(grocery._id, {
        $set: { images: imagesArray }
      });
      
      migratedCount++;
      console.log(`✅ Migrated grocery: ${grocery.name} (${imagesArray.length} images)`);
    }
    
    console.log(`🎉 Migration complete! Migrated ${migratedCount} groceries`);
    
    // Verify migration
    const totalGroceries = await Grocery.countDocuments();
    const groceriesWithImages = await Grocery.countDocuments({ images: { $exists: true } });
    
    console.log(`📊 Verification:`);
    console.log(`  - Total groceries: ${totalGroceries}`);
    console.log(`  - Groceries with images array: ${groceriesWithImages}`);
    console.log(`  - Groceries without images array: ${totalGroceries - groceriesWithImages}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

migrateGroceryImages();
