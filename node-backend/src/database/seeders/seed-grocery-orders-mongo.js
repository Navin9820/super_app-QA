const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://superapp_admin:superapp_admin%40740@cluster0.gtmzerf.mongodb.net/superapp_db?retrywrites=true&w=majority';

// Import models
const GroceryOrder = require('../../models/groceryorder');
const User = require('../../models/user');

const seedGroceryOrders = async () => {
  try {
    console.log('🌐 Connecting to MongoDB for grocery order seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Clear existing grocery orders
    await GroceryOrder.deleteMany({});
    console.log('🧹 Cleared existing grocery orders');
    
    // Get a user ID dynamically
    const user = await User.findOne({ email: 'admin@example.com' });
    
    if (!user) {
      console.log('❌ No admin user found. Please run admin user seeder first.');
      return;
    }
    
    // Create sample grocery orders
    const sampleOrders = [
      {
        user_id: user._id,
        order_number: `GORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total_amount: 1250.00,
        status: 'confirmed',
        payment_method: 'cod',
        payment_status: 'pending',
        address: 'Anna Nagar West, Anna Nagar, Chennai, Tamil Nadu 600040',
        delivery_address: {
          address_line1: 'Anna Nagar West, Anna Nagar',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600040',
          phone: '+91-9876543210'
        },
        delivery_instructions: 'Please deliver before 6 PM',
        notes: 'Customer prefers evening delivery'
      },
      {
        user_id: user._id,
        order_number: `GORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total_amount: 890.00,
        status: 'out_for_delivery',
        payment_method: 'razorpay',
        payment_status: 'paid',
        address: 'T Nagar, Chennai, Tamil Nadu 600017',
        delivery_address: {
          address_line1: 'T Nagar',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600017',
          phone: '+91-9876543211'
        },
        delivery_instructions: 'Ring doorbell twice',
        notes: 'Customer is working from home'
      },
      {
        user_id: user._id,
        order_number: `GORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total_amount: 2100.00,
        status: 'delivered',
        payment_method: 'cod',
        payment_status: 'paid',
        address: 'Mylapore, Chennai, Tamil Nadu 600004',
        delivery_address: {
          address_line1: 'Mylapore',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600004',
          phone: '+91-9876543212'
        },
        delivery_instructions: 'Leave with security guard',
        notes: 'Delivered successfully',
        delivered_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ];
    
    // Insert orders
    const createdOrders = await GroceryOrder.insertMany(sampleOrders);
    console.log(`✅ Created ${createdOrders.length} grocery orders`);
    
    // Display sample data
    console.log('\n📊 Sample Grocery Orders Created:');
    createdOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.order_number}: ₹${order.total_amount} - ${order.status}`);
    });
    
    console.log('\n🎉 Grocery order seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during grocery order seeding:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeder
seedGroceryOrders();
