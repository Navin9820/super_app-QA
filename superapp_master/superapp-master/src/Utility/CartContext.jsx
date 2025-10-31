import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  fetchWishlist,
  addToWishlist as apiAddToWishlist,
  removeWishlistItem as apiRemoveWishlistItem
} from '../services/cartWishlistService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load function - moved outside useEffect so it can be called by refreshCart
  const load = async () => {
    setLoading(true);
    // Only fetch if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setCart(null);
      setWishlist([]);
      setLoading(false);
      return;
    }
         try {
       const cartRes = await fetchCart();
       if (cartRes.success) {
         setCart(cartRes.data);
       } else {
         setCart(null);
       }
       
       const wishlistRes = await fetchWishlist();
       if (wishlistRes.success) {
         setWishlist(wishlistRes.data);
       } else {
         setWishlist([]);
       }
    } catch (e) {
      console.error('❌ CartContext: Error loading data:', e);
      setCart(null);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart and wishlist on mount
  useEffect(() => {
    // Load with delay to prevent conflicts
    const timer = setTimeout(load, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Cart actions with real API calls
           const addToCart = async (product_id, quantity = 1) => {
      try {
        const productData = { productId: product_id, quantity: quantity };
        const res = await apiAddToCart(productData);
        if (res.success) {
          // Update cart state immediately with the response data
          setCart(res.data);
        }
        return res;
      } catch (error) {
        console.error('❌ CartContext: Add to cart failed:', error);
        return { success: false, message: error.message };
      }
    };

           const updateCartItem = async (itemId, quantity) => {
      try {
        const res = await apiUpdateCartItem(itemId, quantity);
        if (res.success) {
          // Update cart state immediately with the response data
          setCart(res.data);
        }
        return res;
      } catch (error) {
        console.error('❌ CartContext: Update cart item failed:', error);
        return { success: false, message: error.message };
      }
    };

           const removeFromCart = async (itemId) => {
      try {
        console.log('🗑️ CartContext: Removing item:', itemId);
        const res = await apiRemoveCartItem(itemId);
        console.log('🗑️ CartContext: API response:', res);
        if (res.success) {
          // Update cart state immediately with the response data
          setCart(res.data);
          console.log('✅ CartContext: Item removed successfully');
        } else {
          console.error('❌ CartContext: API returned failure:', res.message);
        }
        return res;
      } catch (error) {
        console.error('❌ CartContext: Remove from cart failed:', error);
        return { success: false, message: error.message };
      }
    };

  // Wishlist actions with real API calls
     const addToWishlist = async (product_id, quantity = 1) => {
     try {
       // Create the product data object that the service expects
       const productData = { productId: product_id, quantity: quantity };
       
       const res = await apiAddToWishlist(productData);
       
       // Handle the response based on what we get back
       if (res.success) {
         if (res.alreadyExists) {
           // Refresh wishlist to ensure state is in sync
           await refreshWishlist();
         } else if (res.data) {
           // Refresh wishlist to ensure state is in sync
           await refreshWishlist();
         }
       }
       return res;
     } catch (error) {
       console.error('❌ CartContext: Add to wishlist failed:', error);
       return { success: false, message: error.message };
     }
   };

     const removeFromWishlist = async (itemId) => {
     try {
       const res = await apiRemoveWishlistItem(itemId);
       
       if (res.success) {
         await refreshWishlist();
       } else {
         throw new Error(res.message || 'Failed to remove from wishlist');
       }
       return res;
     } catch (error) {
       return { success: false, message: error.message };
     }
   };

     // Refresh cart data from server
   const refreshCart = async () => {
     try {
       await load();
     } catch (error) {
       console.error('❌ CartContext: Failed to refresh cart data:', error);
     }
   };

  // Refresh wishlist data from server
  const refreshWishlist = async () => {
    try {
      const wishlistRes = await fetchWishlist();
      
      let wishlistData = [];
      
      if (wishlistRes.success && wishlistRes.data) {
        wishlistData = wishlistRes.data;
      } else if (wishlistRes.success && Array.isArray(wishlistRes)) {
        wishlistData = wishlistRes;
      } else if (Array.isArray(wishlistRes)) {
        wishlistData = wishlistRes;
      } else {
        wishlistData = [];
      }
      
      // Force immediate state update
      setWishlist(wishlistData);
      
      // Return the data for immediate use
      return wishlistData;
    } catch (error) {
      console.error('❌ CartContext: Failed to refresh wishlist data:', error);
      setWishlist([]);
      return [];
    }
  };

  // Debug: Log cart state changes
  useEffect(() => {
  }, [cart]);

  // Debug: Log wishlist state changes
  useEffect(() => {
  }, [wishlist]);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        refreshCart,
        refreshWishlist,
        setCart,
        setWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
