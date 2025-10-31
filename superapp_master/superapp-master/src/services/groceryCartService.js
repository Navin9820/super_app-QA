import API_CONFIG from '../config/api.config.js';

const getHeaders = () => {
  const token = localStorage.getItem('token') || 'demo-token';
  
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
    'Authorization': `Bearer ${token}`,
    'x-user-id': userId // Send user ID for consistent cart operations
  };
};

// --- GROCERY CART ---
export const fetchGroceryCart = async () => {
  const res = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_CART), { 
    headers: getHeaders(), 
    credentials: 'include' 
  });
  const result = await res.json();
  return result;
};

export const addToGroceryCart = async (groceryData) => {
  try {
    // Handle both object and direct grocery_id parameter
    let grocery_id;
    let quantity = 1;
    
    if (typeof groceryData === 'object' && groceryData !== null) {
      // If groceryData is an object, extract grocery_id and quantity
      grocery_id = groceryData.grocery_id || groceryData.groceryId || groceryData.id || groceryData._id;
      quantity = groceryData.quantity || 1;
    } else {
      // If groceryData is a direct value (string/number), treat it as grocery_id
      grocery_id = groceryData;
    }
    
    if (!grocery_id) {
      throw new Error('Grocery ID is required');
    }
    
    const payload = {
      grocery_id: grocery_id,
      quantity: quantity
    };
    
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_CART), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding to grocery cart:', error);
    return { success: false, message: error.message };
  }
};

export const updateGroceryCartItem = async (itemId, quantity) => {
  try {
    const response = await fetch(API_CONFIG.getUrl(`/api/gcart/${itemId}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ quantity })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating grocery cart item:', error);
    return { success: false, message: error.message };
  }
};

export const removeGroceryCartItem = async (itemId) => {
  try {
    const response = await fetch(API_CONFIG.getUrl(`/api/gcart/${itemId}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing grocery cart item:', error);
    return { success: false, message: error.message };
  }
};

export const clearGroceryCart = async () => {
  try {
    const response = await fetch(API_CONFIG.getUrl('/api/gcart/clear'), {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error clearing grocery cart:', error);
    return { success: false, message: error.message };
  }
};

// --- GROCERY WISHLIST ---
export const fetchGroceryWishlist = async () => {
  const res = await fetch(API_CONFIG.getUrl('/api/gwishlist'), { 
    headers: getHeaders(), 
    credentials: 'include' 
  });
  const result = await res.json();
  return result;
};

export const addToGroceryWishlist = async (groceryData) => {
  try {
    let grocery_id;
    let quantity = 1;
    
    if (typeof groceryData === 'object' && groceryData !== null) {
      grocery_id = groceryData.grocery_id || groceryData.groceryId || groceryData.id || groceryData._id;
      quantity = groceryData.quantity || 1;
    } else {
      grocery_id = groceryData;
    }
    
    if (!grocery_id) {
      throw new Error('Grocery ID is required');
    }
    
    const payload = {
      grocery_id: grocery_id,
      quantity: quantity
    };
    
    const response = await fetch(API_CONFIG.getUrl('/api/gwishlist'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding to grocery wishlist:', error);
    return { success: false, message: error.message };
  }
};

export const removeGroceryWishlistItem = async (itemId) => {
  try {
    const response = await fetch(API_CONFIG.getUrl(`/api/gwishlist/${itemId}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error removing grocery wishlist item:', error);
    return { success: false, message: error.message };
  }
};
