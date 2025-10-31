// Script to update existing riders with module_type field
const mongoose = require('mongoose');
const Rider = require('./src/models/rider');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateRiderModuleTypes() {
  try {
    console.log('🔍 Checking existing riders...');
    
    // Find all riders without module_type
    const ridersWithoutModuleType = await Rider.find({ module_type: { $exists: false } });
    console.log(`Found ${ridersWithoutModuleType.length} riders without module_type`);
    
    if (ridersWithoutModuleType.length > 0) {
      console.log('Updating riders with default module_type...');
      
      // Update all riders without module_type to have 'rider' as default
      const result = await Rider.updateMany(
        { module_type: { $exists: false } },
        { $set: { module_type: 'rider' } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} riders with module_type: 'rider'`);
    }
    
    // Show all riders and their module_types
    const allRiders = await Rider.find({}, 'name email module_type status');
    console.log('\n📋 All riders:');
    allRiders.forEach(rider => {
      console.log(`- ${rider.name} (${rider.email}) - module_type: ${rider.module_type || 'undefined'} - status: ${rider.status}`);
    });
    
    // Check for porter requests
    const PorterRequest = require('./src/models/porterrequest');
    const porterRequests = await PorterRequest.find({}, 'user_id status fare pickup_location dropoff_location');
    console.log(`\n📦 Found ${porterRequests.length} porter requests`);
    
    if (porterRequests.length > 0) {
      console.log('Porter requests:');
      porterRequests.forEach(req => {
        console.log(`- ID: ${req._id}, Status: ${req.status}, Fare: ₹${req.fare}`);
        console.log(`  From: ${req.pickup_location?.address}`);
        console.log(`  To: ${req.dropoff_location?.address}`);
      });
    }
    
    // Check for order assignments
    const OrderAssignment = require('./src/models/orderAssignment');
    const orderAssignments = await OrderAssignment.find({}, 'order_id order_type status fare');
    console.log(`\n📋 Found ${orderAssignments.length} order assignments`);
    
    if (orderAssignments.length > 0) {
      console.log('Order assignments:');
      orderAssignments.forEach(assignment => {
        console.log(`- Order ID: ${assignment.order_id}, Type: ${assignment.order_type}, Status: ${assignment.status}, Fare: ₹${assignment.fare}`);
      });
    }
    
  } catch (error) {
    console.error('Error updating riders:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateRiderModuleTypes();
