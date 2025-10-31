// Centralized API Configuration for Admin Panel
// This file manages all API URLs and endpoints dynamically

const API_CONFIG = {
  // Base URL - will be set from environment variable
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // Force HTTP for localhost to prevent SSL errors
  getBaseUrl: () => {
    const envUrl = process.env.REACT_APP_API_URL;
    if (envUrl && envUrl.includes('localhost')) {
      // Force HTTP for localhost
      return envUrl.replace('https://', 'http://');
    }
    return envUrl || 'http://localhost:5000';
  },
  
  // Frontend Routes
  ROUTES: {
    LOGIN: '/auth/sign-in',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PRODUCTS: '/admin/products',
    CATEGORIES: '/admin/categories',
    HOTELS: '/admin/hotels',
    RESTAURANTS: '/admin/restaurants',
    TAXI: '/admin/taxi',
    PORTER: '/admin/porter',
    GROCERIES: '/admin/groceries',
  },
  
  // Auth endpoints (for authService compatibility)
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  
  // Storage keys (for authService compatibility)
  STORAGE_KEYS: {
    AUTH_TOKEN: 'token',
    USER_DATA: 'userData',
    TOKEN_EXPIRATION: 'tokenExpiration',
  },
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: '/api/auth',
    LOGIN: '/api/auth/login',
    
    // Admin Management
    USERS: '/api/users',
    STAFF: '/api/staff',
    ROLES: '/api/roles',
    PERMISSIONS: '/api/permissions',
    
    // Product Management
    PRODUCTS: '/api/products',
    CATEGORIES: '/api/categories',
    BRANDS: '/api/brands',
    VARIATIONS: '/api/variations',
    
    // Category Management (for categoryService compatibility)
    CATEGORY: {
      LIST: '/api/categories',
      CREATE: '/api/categories',
      DETAIL: (id) => `/api/categories/${id}`,
      UPDATE: (id) => `/api/categories/${id}`,
      DELETE: (id) => `/api/categories/${id}`,
      TOGGLE_STATUS: (id) => `/api/categories/${id}/toggle-status`,
    },
    
    // Hotel Management
    HOTELS: '/api/hotels',
    HOTEL_BOOKINGS: '/api/bookings',
    ROOMS: '/api/rooms',
    AMENITIES: '/api/amenities',
    
    // Restaurant Management
    RESTAURANTS: '/api/restaurants',
    RESTAURANT_CATEGORIES: '/api/restaurant-categories',
    DISHES: '/api/dishes',
    RESTAURANT_ORDERS: '/api/restaurant-orders',
    
    // Taxi Management
    TAXI_DRIVERS: '/api/taxi-drivers',
    TAXI_RIDES: '/api/taxi-rides',
    TAXI_VEHICLES: '/api/taxi-vehicles',
    
    // Porter Management
    PORTER_DRIVERS: '/api/porter-drivers',
    PORTER_VEHICLES: '/api/porter-vehicles',
    PORTER_BOOKINGS: '/api/porter-bookings',
    
    // Grocery Management
    GROCERIES: '/api/groceries',
    GROCERY_ORDERS: '/api/gorders',
    
    // Orders
    ORDERS: '/api/orders',
    
    // Analytics
    ANALYTICS: '/api/analytics',
    DASHBOARD: '/api/dashboard',
  },
  
  // Helper functions
  getUrl: (endpoint) => {
    if (!endpoint) return API_CONFIG.getBaseUrl();
    if (endpoint.startsWith('http')) return endpoint;
    const baseUrl = API_CONFIG.getBaseUrl().endsWith('/') ? API_CONFIG.getBaseUrl() : `${API_CONFIG.getBaseUrl()}/`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseUrl}${cleanEndpoint}`;
  },
  
  // Auth headers helper
  getAuthHeaders: () => {
    const token = localStorage.getItem('token') || 'demo-token';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },
  
  // Image URL helpers
  getImageUrl: (imagePath) => {
    // ✅ FIXED: If backend already sends absolute URLs, return them as-is
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;
    
    // Only process relative paths
    if (imagePath.startsWith('/')) return `${API_CONFIG.getBaseUrl()}${imagePath}`;
    return `${API_CONFIG.getBaseUrl()}/uploads/${imagePath}`;
  },
  
  // Upload URL helper
  getUploadUrl: (imagePath) => {
    // ✅ FIXED: If backend already sends absolute URLs, return them as-is
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;
    
    // Only process relative paths
    return `${API_CONFIG.getBaseUrl()}/uploads/${imagePath}`;
  }
};

export default API_CONFIG; 