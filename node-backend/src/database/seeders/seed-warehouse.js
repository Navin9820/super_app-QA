const mongoose = require('mongoose');
const Warehouse = require('../../models/warehouse');

const seedWarehouse = async () => {
  try {
    // Check if warehouse already exists
    const existingWarehouse = await Warehouse.findOne({ isDefault: true });
    
    if (existingWarehouse) {
      console.log('✅ Default warehouse already exists:', existingWarehouse.name);
      return;
    }

    // Create default warehouse with REAL Chennai address
    const warehouse = await Warehouse.create({
      name: 'Main Warehouse',
      full_address: 'Yube1 Meadows, Ramapuram, Parthasarathy Nagar, Manapakkam, Ramapuram, Chennai, Tamil Nadu 600089',
      address_line1: 'Yube1 Meadows, Ramapuram',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600089',
      country: 'India',
      phone: '+91-9876543210',
      notes: 'Main distribution center for ecommerce orders - Real Chennai location',
      isActive: true,
      isDefault: true,
      latitude: 13.0827,
      longitude: 80.2707
    });

    console.log('✅ Default warehouse created with REAL address:', warehouse.name);
    console.log('📍 Address:', warehouse.full_address);
  } catch (error) {
    console.error('❌ Error seeding warehouse:', error);
  }
};

module.exports = seedWarehouse;
