import API_CONFIG from '../config/api.config.js';



const getHeaders = () => {
  // Fix: Only check 'token' since that's what OTP.jsx sets
  const token = localStorage.getItem('token');
  
  // Get user ID for consistent cart operations
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userEmail = userData.email || localStorage.getItem('userEmail');
  const userPhone = userData.phone || localStorage.getItem('userPhone');
  
  // Generate a consistent user ID based on email/phone for demo purposes
  const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                userPhone ? `user_${userPhone}` : 
                'default_user';
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'x-user-id': userId // Send user ID for consistent cart operations
  };
};

// --- CART ---
export const fetchCart = async () => {
  const res = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CART), { 
    headers: getHeaders(), 
    credentials: 'include' 
  });
  const result = await res.json();
  return result;
};

export const addToCart = async (productData) => {
  try {
    // Handle both object and direct product_id parameter
    let product_id;
    let quantity = 1;
    
    if (typeof productData === 'object' && productData !== null) {
      // If productData is an object, extract product_id and quantity
      product_id = productData.product_id || productData.productId || productData.id || productData._id;
      quantity = productData.quantity || 1;
    } else {
      // If productData is a direct value (string/number), treat it as product_id
      product_id = productData;
    }
    
    if (!product_id) {
      throw new Error('Product ID is required');
    }
    
    const payload = {
      product_id: product_id,
      quantity: quantity
    };
    

    
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CART_ITEMS), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();

    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add to cart');
    }
    
    return result;
  } catch (error) {

    throw error;
  }
};

export const updateCartItem = async (itemId, quantity) => {
  const res = await fetch(API_CONFIG.getUrl(`/api/cart/items/${itemId}`), {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ quantity })
  });
  const result = await res.json();
  return result;
};

export const removeCartItem = async (itemId) => {
  try {
    console.log('🗑️ API: Removing cart item:', itemId);
    console.log('🗑️ API: URL:', API_CONFIG.getUrl(`/api/cart/items/${itemId}`));
    console.log('🗑️ API: Headers:', getHeaders());
    
    const res = await fetch(API_CONFIG.getUrl(`/api/cart/items/${itemId}`), {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    console.log('🗑️ API: Response status:', res.status);
    console.log('🗑️ API: Response ok:', res.ok);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API: HTTP error:', res.status, errorText);
      return { success: false, message: `HTTP ${res.status}: ${errorText}` };
    }
    
    const result = await res.json();
    console.log('🗑️ API: Response data:', result);
    return result;
  } catch (error) {
    console.error('❌ API: Network error:', error);
    return { success: false, message: error.message };
  }
};

export const clearCart = async () => {
  const res = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CART), {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include'
  });
  const result = await res.json();
  return result;
};

// --- WISHLIST ---
export const fetchWishlist = async () => {
  try {
    const res = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.WISHLIST), { 
      headers: getHeaders(), 
      credentials: 'include' 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch wishlist: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    
    // Handle different response formats
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        message: 'Wishlist fetched successfully'
      };
    } else if (result && typeof result === 'object') {
      return result;
    } else {
      throw new Error('Invalid wishlist response format');
    }
  } catch (error) {
    throw error;
  }
};

export const addToWishlist = async (productData) => {
  try {
    // Handle both object and direct product_id parameter
    let product_id;
    let quantity = 1;
    
    if (typeof productData === 'object' && productData !== null) {
      // If productData is an object, extract product_id and quantity
      product_id = productData.product_id || productData.productId || productData.id || productData._id;
      quantity = productData.quantity || 1;
    } else {
      // If productData is a direct value (string/number), treat it as product_id
      product_id = productData;
    }
    
    if (!product_id) {
      throw new Error('Product ID is required');
    }
    
    const payload = {
      product_id: product_id,
      quantity: quantity
    };
    
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.WISHLIST), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // Handle "already exists" as a special case - not an error
      if (result.message && result.message.includes('already exists')) {
        return {
          success: true,
          message: result.message,
          data: null,
          alreadyExists: true
        };
      }
      
      throw new Error(result.message || 'Failed to add to wishlist');
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

export const removeFromWishlist = async (itemId) => {
  try {

    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.WISHLIST_REMOVE), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ item_id: itemId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Failed to remove from wishlist: ${errorJson.message || errorJson.error || 'Unknown error'}`);
      } catch (parseError) {
        throw new Error(`Failed to remove from wishlist: ${response.status} ${response.statusText}`);
      }
    }
    
    const result = await response.json();

    return result;
    
  } catch (error) {

    throw error;
  }
};

// Alias for compatibility
export const removeWishlistItem = removeFromWishlist; 