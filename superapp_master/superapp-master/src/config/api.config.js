// Centralized API Configuration
// This file manages all API URLs and endpoints dynamically

const API_CONFIG = {
  // Base URL - will be set from environment variable
  BASE_URL: (() => {
    // Check if we're in production (Vercel)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      return process.env.REACT_APP_API_URL || 'https://super-app-0ofo.onrender.com';
    }
    
    // Development fallback
    const devUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    return devUrl;
  })().replace(/\/$/, ''), // Ensure no trailing slash
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    OTP_GENERATE: '/api/auth/otp/generate',
    OTP_VERIFY: '/api/auth/otp/verify',
    
    // User Profile
    USER_PROFILE: '/api/userProfile',
    PROFILE: '/api/profile',
    
    // Categories
    CATEGORIES: '/api/categories',
    PARENT_CATEGORIES: '/api/categories/parents',
    CHILDREN_CATEGORIES: '/api/categories/parent',
    
    // Products
    PRODUCTS: '/api/products',
    
    // Cart & Wishlist
    CART: '/api/cart',
    CART_ITEMS: '/api/cart/items',
    WISHLIST: '/api/wishlist',
    WISHLIST_REMOVE: '/api/wishlist/remove',
    WISHLIST_UPDATE: '/api/wishlist/update',
    WISHLIST_REMOVE: '/api/wishlist/remove',
    WISHLIST_ITEMS: '/api/wishlist-items',
    GROCERY_CART: '/api/gcart',
    GROCERY_WISHLIST: '/api/gwishlist',
    
    // Orders
    ORDERS: '/api/orders',
    GROCERY_ORDERS: '/api/gorders',
    FOOD_ORDERS: '/api/food-orders',
    
    // Payments
    PAYMENTS: '/api/payments',
    PAYMENT_CREATE_ORDER: '/api/payments/create-order',
    PAYMENT_VERIFY: '/api/payments/verify',
    PAYMENT_RAZORPAY_KEY: '/api/payments/razorpay-key',
    
    // Hotels
    HOTELS: '/api/hotels',
    BOOKINGS: '/api/bookings',
    MY_BOOKINGS: '/api/bookings/my-bookings',
    
    // Restaurants
    RESTAURANTS: '/api/restaurants',
    RESTAURANT_CATEGORIES: '/api/restaurants/categories',
    DISHES: '/api/dishes',
    
    // Taxi
    TAXI_VEHICLES: '/api/taxi-vehicles',
    TAXI_RIDES: '/api/taxi-rides',
    TAXI_DRIVERS: '/api/taxi-drivers',
    TAXI_RECENT_LOCATIONS: '/api/taxi/recent-locations',
    MY_RIDES: '/api/taxi-rides/my-rides',
    
    // Porter
    PORTER_BOOKINGS: '/api/porter-bookings',
    PORTER_REQUESTS: '/api/porter-requests',
    
    // Groceries
    GROCERIES: '/api/groceries',
  },
  
  // Helper functions
  getUrl: (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
    const finalUrl = `${baseUrl}${cleanEndpoint}`;
    return finalUrl;
  },
  
  // Image URL helpers
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    // Handle Base64 data URLs (e.g., data:image/jpeg;base64,...)
    if (imagePath.startsWith('data:')) return imagePath;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return API_CONFIG.getUrl(imagePath);
    return API_CONFIG.getUploadUrl(imagePath);
  },
  
  // Auth headers helper
  getAuthHeaders: () => {
    const token = localStorage.getItem('token') || 'demo-token';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },
  
  // Upload URL helper
  getUploadUrl: (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    // If the path already starts with /uploads/, don't add it again
    if (imagePath.startsWith('/uploads/')) {
      const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
      return `${baseUrl}${imagePath}`;
    }
    
    // Otherwise, add /uploads/ prefix
    const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
    return `${baseUrl}/uploads/${imagePath}`;
  }
};

export default API_CONFIG; 