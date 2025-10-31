// Super App Backend API Configuration
export const SUPER_APP_API_CONFIG = {
  // Super App Backend Base URL
  BASE_URL: (() => {
    const envUrl = process.env.REACT_APP_SUPER_APP_API_URL;
    const defaultUrl = process.env.NODE_ENV === 'development' 
      ? (process.env.REACT_APP_SUPER_APP_API_URL || 'http://localhost:5000/api') 
      : (process.env.REACT_APP_SUPER_APP_API_URL || 'https://super-app-0ofo.onrender.com/api');
    
    let finalUrl = envUrl || defaultUrl;
    
    // Clean up the URL to prevent double /api
    finalUrl = finalUrl.replace(/\/api\/api/g, '/api'); // Remove double /api
    finalUrl = finalUrl.replace(/\/api\/\/api/g, '/api'); // Remove /api//api
    
    // Ensure exactly one /api prefix is included
    if (!finalUrl.includes('/api')) {
      finalUrl = finalUrl.endsWith('/') ? `${finalUrl}api` : `${finalUrl}/api`;
    }
    
    // Ensure it ends with /api (not /api/)
    finalUrl = finalUrl.replace(/\/api\/$/, '/api');
    
    return finalUrl;
  })(),
  
  // Rider-specific endpoints
  RIDER: {
    REGISTER: '/riders/register',
    LOGIN: '/riders/login',
    PROFILE: '/riders/profile',
    UPDATE_PROFILE: '/riders/profile',
    LOCATION: '/riders/location',
    ONLINE_STATUS: '/riders/online-status',
    ORDERS: {
      AVAILABLE: '/riders/orders/available',
      ALL: '/riders/orders',
      ACCEPT: (orderId) => `/riders/orders/${orderId}/accept`,
      UPDATE_STATUS: (orderId) => `/riders/orders/${orderId}/status`,
      PICKUP: (orderId) => `/riders/orders/${orderId}/pickup`,
      COD_COLLECT: (orderId) => `/riders/orders/${orderId}/collect-cod`,
      VERIFY_OTP: (orderId) => `/riders/orders/${orderId}/verify-otp`
    },
    EARNINGS: '/riders/earnings'
  },
  
  // Payment endpoints
  PAYMENT: {
    RAZORPAY_KEY: '/payments/razorpay-key',
    CREATE_ORDER: '/payments/create-order',
    VERIFY: '/payments/verify'
  },
  
  // Order endpoints (for different modules)
  ORDERS: {
    ECOMMERCE: '/orders',
    ASSIGNMENT: (orderId) => `/orders/${orderId}/assignment`,
    COD_OTP: (orderId) => `/orders/${orderId}/cod-otp`,
    COD_OTP_RESEND: (orderId) => `/orders/${orderId}/cod-otp/resend`,
    FOOD: '/food-orders',
    GROCERY: '/grocery-orders',
    HOTEL: '/bookings',
    TAXI: '/taxi-rides',
    PORTER: '/porter-bookings'
  },
  
  // Taxi-specific endpoints for riders
  TAXI: {
    ACCEPT_RIDE: (rideId) => `/rider/taxi/${rideId}/accept`
  },
  
  // Porter-specific endpoints for riders
  PORTER: {
    ACCEPT_RIDE: (rideId) => `/rider/porter/${rideId}/accept`
  },
  
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp'
  }
};

// API Helper Functions
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${SUPER_APP_API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add authentication token if available
  const token = localStorage.getItem('rider-token') || localStorage.getItem('demo-token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  // 🎯 SERVICE-BASED FILTERING: Add user ID header for service-based order filtering
  let userId = localStorage.getItem('rider-user-id') || localStorage.getItem('userId');
  
  // If not found, try to extract from rider-user data
  if (!userId) {
    try {
      const riderUser = localStorage.getItem('rider-user');
      if (riderUser) {
        const userData = JSON.parse(riderUser);
        userId = userData._id || userData.id; // Try both _id and id
      }
    } catch (error) {
      console.warn('Could not parse rider-user data:', error);
    }
  }
  
  // Also try to get from authService
  if (!userId) {
    try {
      const authService = require('../services/auth.jsx').default;
      const currentUser = authService.getCurrentUser();
      if (currentUser && (currentUser._id || currentUser.id)) {
        userId = currentUser._id || currentUser.id;
      }
    } catch (error) {
      console.warn('Could not get user from authService:', error);
    }
  }
  
  if (userId) {
    defaultOptions.headers['x-user-id'] = userId;
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('rider-token');
        localStorage.removeItem('rider-user');
        localStorage.removeItem('rider-session');
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        throw new Error('Authentication failed. Please login again.');
      }
      
      // Try to parse error response for professional error messages
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          // Create a more detailed error message
          errorMessage = errorData.details 
            ? `${errorData.message} - ${errorData.details}`
            : errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, use generic message
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Rider-specific API functions
export const riderAPI = {
  // Authentication
  register: (riderData) => apiRequest(SUPER_APP_API_CONFIG.RIDER.REGISTER, {
    method: 'POST',
    body: JSON.stringify(riderData)
  }),
  
  login: (credentials) => apiRequest(SUPER_APP_API_CONFIG.RIDER.LOGIN, {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  // Profile management
  getProfile: () => apiRequest(SUPER_APP_API_CONFIG.RIDER.PROFILE),
  
  updateProfile: (profileData) => apiRequest(SUPER_APP_API_CONFIG.RIDER.UPDATE_PROFILE, {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }),
  
  // Location and status
  updateLocation: (locationData) => apiRequest(SUPER_APP_API_CONFIG.RIDER.LOCATION, {
    method: 'POST',
    body: JSON.stringify(locationData)
  }),
  
  toggleOnlineStatus: (isOnline) => apiRequest(SUPER_APP_API_CONFIG.RIDER.ONLINE_STATUS, {
    method: 'PUT',
    body: JSON.stringify({ is_online: isOnline })
  }),
  
  // Orders
  getAvailableOrders: () => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.AVAILABLE),
  
  getRiderOrders: () => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.ALL),
  
  acceptOrder: (orderId, payload) => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.ACCEPT(orderId), {
    method: 'POST',
    body: JSON.stringify(payload || {})
  }),
  
  updateOrderStatus: (orderId, status, order_type) => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.UPDATE_STATUS(orderId), {
    method: 'PUT',
    body: JSON.stringify({ status, order_type })
  }),
  pickupOrder: (orderId) => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.PICKUP(orderId), {
    method: 'POST'
  }),
  collectCod: (orderId, amount, otp) => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.COD_COLLECT(orderId), {
    method: 'POST',
    body: JSON.stringify({ amount, otp })
  }),
  
  // Verify delivery OTP
  verifyDeliveryOtp: (orderId, otp, orderType) => apiRequest(SUPER_APP_API_CONFIG.RIDER.ORDERS.VERIFY_OTP(orderId), {
    method: 'POST',
    body: JSON.stringify({ otp, order_type: orderType })
  }),
  
  // Earnings
  getEarnings: () => apiRequest(SUPER_APP_API_CONFIG.RIDER.EARNINGS),
  
  // Taxi-specific functions
  acceptTaxiRide: (rideId) => apiRequest(SUPER_APP_API_CONFIG.TAXI.ACCEPT_RIDE(rideId), {
    method: 'PUT'
  }),
  
  // Porter-specific functions
  acceptPorterRide: (rideId) => apiRequest(SUPER_APP_API_CONFIG.PORTER.ACCEPT_RIDE(rideId), {
    method: 'PUT'
  })
};

// Payment API functions
export const paymentAPI = {
  getRazorpayKey: () => apiRequest(SUPER_APP_API_CONFIG.PAYMENT.RAZORPAY_KEY),
  
  createPaymentOrder: (paymentData) => apiRequest(SUPER_APP_API_CONFIG.PAYMENT.CREATE_ORDER, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  }),
  
  verifyPayment: (verificationData) => apiRequest(SUPER_APP_API_CONFIG.PAYMENT.VERIFY, {
    method: 'POST',
    body: JSON.stringify(verificationData)
  })
};

export default SUPER_APP_API_CONFIG;
