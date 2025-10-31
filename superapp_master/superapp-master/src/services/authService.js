import API_CONFIG from '../config/api.config.js';
import { taxiRideStorage } from './taxiRideStorageService';
import { clothesOrderStorage } from './clothesOrderStorageService';
import { profileService } from './profileService';
import notificationService from './notificationService';



// Storage keys for authentication
const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'userData',
  TOKEN_EXPIRATION: 'tokenExpiration'
};

// Helper function to get headers with authentication
const getHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Helper function to set authentication data
const setAuthData = (data) => {
  if (data.data && data.data.token) {
    // ✅ PRESERVE: Profile data during login (only clear for truly new users during OTP)
    // Profile data should persist across login/logout sessions
    
    // ✅ PRESERVE: Notifications during login (should persist across login/logout)
    // Notifications are only cleared for truly new users during OTP verification
    
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.data.token);
    
    // Set token expiration (default to 24 hours if not provided)
    const expiresIn = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    localStorage.setItem(
      STORAGE_KEYS.TOKEN_EXPIRATION, 
      String(Date.now() + expiresIn)
    );

    // Store user data if available
    if (data.data.user) {
      localStorage.setItem(
        STORAGE_KEYS.USER_DATA, 
        JSON.stringify(data.data.user)
      );
    }
  }
  return data;
};

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.token) {
        // Store authentication data
        setAuthData(data);
        
        return {
          success: true,
          message: 'Login successful',
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.'
      };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.token) {
        // Store authentication data
        setAuthData(data);
        
        return {
          success: true,
          message: 'Registration successful',
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.'
      };
    }
  },

  // Logout user - Professional behavior like Amazon, Uber, Netflix
  logout: async () => {
    console.log('🔍 authService.logout() - Starting logout process');
    
    try {
      // First, make API call to backend to clear temporary data only
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('🔍 authService.logout() - Token exists:', !!token);
      
      if (token) {
        try {
          console.log('🔍 authService.logout() - Making API call to:', API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGOUT));
          const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🔍 authService.logout() - API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Professional logout successful:', data);
          } else {
            console.warn('Backend logout failed, but continuing with local cleanup');
          }
        } catch (error) {
          console.warn('Backend logout error, but continuing with local cleanup:', error);
        }
      }
    } catch (error) {
      console.warn('Error during backend logout, but continuing with local cleanup:', error);
    }

    // Clear authentication data (always cleared on logout)
    console.log('🔍 authService.logout() - Clearing localStorage data');
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRATION);
    console.log('🔍 authService.logout() - Auth data cleared');
    
    // Clear temporary/session data (like Amazon, Uber, Netflix)
    // ✅ CLEAR: Wishlists (user preferences)
    const wishlistKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('wishlist')) {
        wishlistKeys.push(key);
      }
    }
    wishlistKeys.forEach(key => localStorage.removeItem(key));
    
    // ✅ CLEAR: Shopping carts (temporary shopping data)
    const cartKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('cart')) {
        cartKeys.push(key);
      }
    }
    cartKeys.forEach(key => localStorage.removeItem(key));
    
    // ✅ CLEAR: Session data (recent locations, temporary preferences)
    localStorage.removeItem('taxiSavedLocations');
    localStorage.removeItem('recentTaxiLocations');
    localStorage.removeItem('delivery_address');
    
    // ✅ CLEAR: Pending authentication data
    localStorage.removeItem('pendingEmail');
    localStorage.removeItem('pendingPhone');
    localStorage.removeItem('generated_otp');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('token');
    
    // ✅ PRESERVE: Profile data (should persist across login/logout)
    // Profile data is preserved so users see their details when they login again
    // Only temporary/session data is cleared above
    
    // ✅ PRESERVE: Notifications (should persist across login/logout)
    // Notifications are only cleared for truly new users during OTP verification
    
    // ✅ PRESERVE: Important business data (like Amazon, Uber, Netflix)
    // - Orders (for receipts, returns, tax records)
    // - Bookings (for receipts, reviews, business records)  
    // - Taxi rides (for receipts, business expenses)
    // - User profile (for personalization)
    // - Hotel favorites (user preferences)
    
    console.log('✅ Professional logout: Temporary data cleared, important data preserved');
    console.log('📋 Preserved: Orders, Bookings, Taxi Rides, User Profile, Hotel Favorites, Profile Images, Notifications');
    console.log('🗑️ Cleared: Wishlists, Carts, Session Data, Auth Tokens');
    console.log('🔍 authService.logout() - Logout process completed successfully');
  },

  // Get current user
  getCurrentUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return false;

    const expiration = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRATION);
    if (expiration && Date.now() > parseInt(expiration)) {
      // Token has expired, clear auth data
      authService.logout();
      return false;
    }

    return true;
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROFILE), {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Get token
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // Get user data
  getUserData: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  // Helper function to make authenticated API requests
  apiRequest: async (url, options = {}) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token is invalid or expired
      authService.logout();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  }
};

export { getHeaders, STORAGE_KEYS }; 