const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Warehouse = require('./src/models/warehouse');

async function addWarehouse() {
  try {
    // Check if warehouse already exists
    const existingWarehouse = await Warehouse.findOne({ isDefault: true });
    
    if (existingWarehouse) {
      console.log('✅ Default warehouse already exists:', existingWarehouse.name);
      console.log('Address:', existingWarehouse.full_address);
      return existingWarehouse;
    }

    // Create default warehouse
    const warehouse = await Warehouse.create({
      name: 'Main Warehouse',
      full_address: '123 Industrial Area, Chennai, Tamil Nadu, 600001',
      address_line1: '123 Industrial Area',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India',
      phone: '+91-9876543210',
      notes: 'Main distribution center for ecommerce orders',
      isActive: true,
      isDefault: true,
      latitude: 13.0827,
      longitude: 80.2707
    });

    console.log('✅ Default warehouse created:', warehouse.name);
    console.log('Address:', warehouse.full_address);
    return warehouse;
  } catch (error) {
    console.error('❌ Error creating warehouse:', error);
  } finally {
    mongoose.connection.close();
  }
}

addWarehouse();
