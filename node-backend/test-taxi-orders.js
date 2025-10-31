const mongoose = require('mongoose');
const TaxiRide = require('./src/models/taxiride');
const User = require('./src/models/user');

// Test script to verify taxi orders are working
async function testTaxiOrders() {
  try {
    console.log('🧪 Testing taxi orders integration...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/superapp_db');
    console.log('✅ Connected to MongoDB');
    
    // Check if there are any existing taxi rides
    const existingRides = await TaxiRide.find({}).populate('user_id', 'name email');
    console.log(`📊 Found ${existingRides.length} existing taxi rides:`);
    
    if (existingRides.length > 0) {
      existingRides.forEach((ride, index) => {
        console.log(`  ${index + 1}. ID: ${ride._id}`);
        console.log(`     User: ${ride.user_id?.name || 'Unknown'} (${ride.user_id?.email || 'No email'})`);
        console.log(`     Status: ${ride.status}`);
        console.log(`     Fare: ₹${ride.fare}`);
        console.log(`     Pickup: ${ride.pickup_location?.address || 'No address'}`);
        console.log(`     Dropoff: ${ride.dropoff_location?.address || 'No address'}`);
        console.log(`     Created: ${ride.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No existing taxi rides found');
      
      // Get a user to create a test ride
      const user = await User.findOne({});
      if (user) {
        console.log(`✅ Found user: ${user.name} (${user.email})`);
        
        // Create a test taxi ride
        const testRide = new TaxiRide({
          user_id: user._id,
          pickup_location: {
            address: '123 Test Street, Test City',
            latitude: 12.9716,
            longitude: 77.5946
          },
          dropoff_location: {
            address: '456 Test Avenue, Test City',
            latitude: 12.9789,
            longitude: 77.5917
          },
          distance: 5.2,
          duration: 15,
          fare: 150.00,
          status: 'pending',
          payment_method: 'cash',
          payment_status: 'pending'
        });
        
        await testRide.save();
        console.log('✅ Created test taxi ride');
        console.log(`   ID: ${testRide._id}`);
        console.log(`   Status: ${testRide.status}`);
        console.log(`   Fare: ₹${testRide.fare}`);
      } else {
        console.log('❌ No users found to create test ride');
      }
    }
    
    // Test the available orders endpoint logic
    console.log('\n🔍 Testing available orders logic...');
    
    // Simulate what the backend does
    const pendingRides = await TaxiRide.find({ status: 'pending' })
      .populate('user_id', 'name phone');
    
    console.log(`📊 Found ${pendingRides.length} pending taxi rides for riders:`);
    
    if (pendingRides.length > 0) {
      pendingRides.forEach((ride, index) => {
        console.log(`  ${index + 1}. Ride ID: ${ride._id}`);
        console.log(`     Customer: ${ride.user_id?.name || 'Unknown'}`);
        console.log(`     Phone: ${ride.user_id?.phone || 'No phone'}`);
        console.log(`     Pickup: ${ride.pickup_location?.address || 'No address'}`);
        console.log(`     Dropoff: ${ride.dropoff_location?.address || 'No address'}`);
        console.log(`     Fare: ₹${ride.fare}`);
        console.log(`     Distance: ${ride.distance} km`);
        console.log('');
      });
    }
    
    console.log('✅ Taxi orders test completed successfully!');
    console.log('🎯 The backend should now recognize taxi orders correctly');
    
  } catch (error) {
    console.error('❌ Error testing taxi orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTaxiOrders();
