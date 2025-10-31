import React, { createContext, useContext, useState, useEffect } from 'react';
import { foodCartService } from '../services/foodDeliveryService';

const FoodCartContext = createContext();

export const FoodCartProvider = ({ children }) => {
  const [foodCart, setFoodCart] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch food cart on mount
  useEffect(() => {
    const loadFoodCart = async () => {
      setLoading(true);
      try {
        console.log('🔄 FoodCartContext: Loading food cart...');
        
        const cartRes = await foodCartService.getFoodCart();
        if (cartRes.success) {
          setFoodCart(cartRes.data);
          console.log('✅ FoodCartContext: Food cart loaded successfully');
        } else {
          console.log('ℹ️ FoodCartContext: No food cart data or error:', cartRes.message);
          setFoodCart(null);
        }
      } catch (e) {
        console.error('❌ FoodCartContext: Error loading food cart:', e);
        setFoodCart(null);
      } finally {
        setLoading(false);
      }
    };

    // Load with delay to prevent conflicts
    const timer = setTimeout(loadFoodCart, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Food cart actions with real API calls
  const isVendorConflict = (message) => {
    return typeof message === 'string' && /one restaurant/i.test(message);
  };

  const addToFoodCart = async (dishId, quantity = 1) => {
    try {
      console.log('➕ FoodCartContext: Adding to food cart:', { dishId, quantity });

      // If item already exists in cart, increment its quantity instead of relying on backend merge
      const existingItem = foodCart?.items?.find((item) => {
        const itemDishId = typeof item.dish_id === 'object' ? item.dish_id?._id : item.dish_id;
        return itemDishId === dishId;
      });

      if (existingItem) {
        const newQuantity = (existingItem.quantity || 0) + quantity;
        console.log('🔁 Item exists. Updating quantity:', { itemId: existingItem._id, newQuantity });
        const updateRes = await foodCartService.updateFoodCartItem(existingItem._id, newQuantity);
        if (updateRes.success) {
          setFoodCart(updateRes.data);
          console.log('✅ FoodCartContext: Quantity updated successfully');
          return updateRes;
        }
        console.warn('⚠️ Update failed, falling back to add:', updateRes.message);
        // Fall through to add below if update failed
      }

      // Default: add as new line item
      const res = await foodCartService.addToFoodCart({ dish_id: dishId, quantity });
      if (res.success) {
        setFoodCart(res.data);
        console.log('✅ FoodCartContext: Added to food cart successfully');
      } else if (isVendorConflict(res.message)) {
        return { ...res, code: 'VENDOR_CONFLICT' };
      }
      return res;
    } catch (error) {
      console.error('❌ FoodCartContext: Add to food cart failed:', error);
      return { success: false, message: error.message };
    }
  };

  // Force add by clearing cart first, then adding
  const forceAddToFoodCart = async (dishId, quantity = 1) => {
    try {
      console.log('⚠️ FoodCartContext: Force adding to cart after clearing:', { dishId, quantity });
      const clearRes = await foodCartService.clearFoodCart();
      if (!clearRes.success) {
        return { success: false, message: clearRes.message || 'Failed to clear cart' };
      }
      const addRes = await foodCartService.addToFoodCart({ dish_id: dishId, quantity });
      if (addRes.success) {
        setFoodCart(addRes.data);
      }
      return addRes;
    } catch (error) {
      console.error('❌ FoodCartContext: Force add failed:', error);
      return { success: false, message: error.message };
    }
  };

  const updateFoodCartItem = async (itemId, quantity) => {
    try {
      console.log('🔄 FoodCartContext: Updating food cart item:', itemId);
      const res = await foodCartService.updateFoodCartItem(itemId, quantity);
      if (res.success) {
        setFoodCart(res.data);
        console.log('✅ FoodCartContext: Food cart item updated successfully');
      }
      return res;
    } catch (error) {
      console.error('❌ FoodCartContext: Update food cart item failed:', error);
      return { success: false, message: error.message };
    }
  };

  const removeFromFoodCart = async (itemId) => {
    try {
      console.log('🗑️ FoodCartContext: Removing from food cart:', itemId);
      const res = await foodCartService.removeFoodCartItem(itemId);
      if (res.success) {
        setFoodCart(res.data);
        console.log('✅ FoodCartContext: Item removed from food cart successfully');
      }
      return res;
    } catch (error) {
      console.error('❌ FoodCartContext: Remove from food cart failed:', error);
      return { success: false, message: error.message };
    }
  };

  const clearFoodCart = async () => {
    try {
      console.log('🧹 FoodCartContext: Clearing food cart');
      const res = await foodCartService.clearFoodCart();
      if (res.success) {
        // Immediately fetch the latest cart from backend to ensure sync
        const cartRes = await foodCartService.getFoodCart();
        if (cartRes.success) {
          setFoodCart(cartRes.data);
        } else {
          setFoodCart(null);
        }
        console.log('✅ FoodCartContext: Food cart cleared and refreshed successfully');
      }
      return res;
    } catch (error) {
      console.error('❌ FoodCartContext: Clear food cart failed:', error);
      setFoodCart(null);
      return { success: false, message: error.message };
    }
  };

  // Calculate total quantity across all line items
  const cartItemCount = (foodCart?.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <FoodCartContext.Provider
      value={{
        foodCart,
        loading,
        cartItemCount,
        addToFoodCart,
        forceAddToFoodCart,
        updateFoodCartItem,
        removeFromFoodCart,
        clearFoodCart,
        setFoodCart,
      }}
    >
      {children}
    </FoodCartContext.Provider>
  );
};

export const useFoodCart = () => {
  const context = useContext(FoodCartContext);
  if (context === undefined) {
    throw new Error('useFoodCart must be used within a FoodCartProvider');
  }
  return context;
}; 