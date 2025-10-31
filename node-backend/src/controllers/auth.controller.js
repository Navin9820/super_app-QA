const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Gwhishlist = require('../models/gwhishlist');
const Wishlist = require('../models/wishlist');
const Cart = require('../models/cart');
const CartItem = require('../models/cartitem');
const Order = require('../models/order');
const OrderItem = require('../models/orderitem');
const FoodCart = require('../models/foodcart');
const FoodCartItem = require('../models/foodcartitem');
const FoodOrder = require('../models/foodorder');
const FoodOrderItem = require('../models/foodorderitem');
const GroceryOrder = require('../models/groceryorder');
const GroceryOrderItem = require('../models/groceryorderitem');
const Booking = require('../models/booking');
const TaxiRide = require('../models/taxiride');
const PorterBooking = require('../models/porterbooking');
const RecentTaxiLocation = require('../models/recenttaxilocation');
const GCartItem = require('../models/gcart_items');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user' // Allow role to be set if provided, default to 'user'
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in user registration',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', user.email);
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last_login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    user.name = name || user.name;
    user.phone = phone || user.phone;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('=== PROFESSIONAL LOGOUT DEBUG ===');
    console.log('User ID:', userId);

    // Clear only temporary/session data (like real professional apps)
    const clearResults = {};

    // 1. Clear wishlists (temporary user preferences)
    clearResults.grocery_wishlist = await Gwhishlist.deleteMany({ user_id: userId });
    clearResults.product_wishlist = await Wishlist.deleteMany({ user_id: userId });

    // 2. Clear all carts and cart items (temporary shopping data)
    const userCarts = await Cart.find({ user_id: userId });
    for (const cart of userCarts) {
      await CartItem.deleteMany({ cart_id: cart._id });
    }
    clearResults.carts = await Cart.deleteMany({ user_id: userId });
    clearResults.cart_items = await CartItem.deleteMany({ user_id: userId });

    // 3. Clear food carts and food cart items (temporary data)
    const userFoodCarts = await FoodCart.find({ user_id: userId });
    for (const foodCart of userFoodCarts) {
      await FoodCartItem.deleteMany({ cart_id: foodCart._id });
    }
    clearResults.food_carts = await FoodCart.deleteMany({ user_id: userId });
    clearResults.food_cart_items = await FoodCartItem.deleteMany({ user_id: userId });

    // 4. Clear grocery cart items (temporary data)
    clearResults.grocery_cart_items = await GCartItem.deleteMany({ user_id: userId });

    // 5. Clear recent taxi locations (privacy/session data)
    clearResults.recent_taxi_locations = await RecentTaxiLocation.deleteMany({ user_id: userId });

    // KEEP IMPORTANT DATA (like real professional apps):
    // - Orders (for receipts, returns, business records)
    // - Bookings (for receipts, reviews, business records)  
    // - Taxi rides (for receipts, business expenses)
    // - User profiles and preferences

    // Calculate total cleared items
    const totalCleared = Object.values(clearResults).reduce((total, result) => {
      return total + (result.deletedCount || 0);
    }, 0);

    console.log('=== CLEARED TEMPORARY DATA ===');
    Object.entries(clearResults).forEach(([key, result]) => {
      console.log(`${key}: ${result.deletedCount || 0} items`);
    });
    console.log(`Total cleared: ${totalCleared} items`);
    console.log('=== KEPT IMPORTANT DATA ===');
    console.log('✅ Orders kept (for receipts, returns)');
    console.log('✅ Bookings kept (for receipts, reviews)');
    console.log('✅ Taxi rides kept (for receipts, business expenses)');
    console.log('✅ User profile kept');
    console.log('=== END PROFESSIONAL LOGOUT DEBUG ===');

    res.json({
      success: true,
      message: 'Logout successful. Temporary data cleared, important data preserved.',
      data: {
        total_cleared_items: totalCleared,
        cleared_data: {
          temporary_data: {
            wishlists: {
              grocery_wishlist: clearResults.grocery_wishlist.deletedCount,
              product_wishlist: clearResults.product_wishlist.deletedCount
            },
            carts: {
              regular_carts: clearResults.carts.deletedCount,
              cart_items: clearResults.cart_items.deletedCount,
              food_carts: clearResults.food_carts.deletedCount,
              food_cart_items: clearResults.food_cart_items.deletedCount,
              grocery_cart_items: clearResults.grocery_cart_items.deletedCount
            },
            session_data: {
              recent_taxi_locations: clearResults.recent_taxi_locations.deletedCount
            }
          },
          preserved_data: {
            orders: 'Kept for receipts, returns, and business records',
            bookings: 'Kept for receipts, reviews, and business records',
            taxi_rides: 'Kept for receipts and business expenses',
            user_profile: 'Kept for user preferences and settings'
          }
        }
      }
    });
  } catch (error) {
    console.error('Professional logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during professional logout',
      error: error.message
    });
  }
}; 