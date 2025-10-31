import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Header from '../SubPages/Header';
import Delete from '../Images/delete.svg';
import Footer from '../SubPages/Footer';
import { FaTrash } from 'react-icons/fa';
import { 
  fetchGroceryCart, 
  updateGroceryCartItem, 
  removeGroceryCartItem, 
  clearGroceryCart 
} from '../../services/groceryCartService';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  // Helper to check auth and redirect
  const handleAuthError = (err) => {
    if (err.message === 'Unauthorized' || err.status === 401) {
      alert('Session expired. Please log in again.');
      navigate('/login');
      return true;
    }
    return false;
  };

  // Fetch cart items from backend on mount
  useEffect(() => {
    const fetchCartItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchGroceryCart();
        
        if (response.success) {
          const cartData = response.data || [];
          
          // Map backend fields to frontend expectations
          const formatted = cartData.map(item => {
            // Get grocery data from populated field
            const grocery = item.grocery || {};
            
            return {
              ...item,
              // Use grocery data for display fields
              name: grocery.name || 'Unknown Product',
              category: grocery.category || 'Unknown Category',
              image: grocery.image
                ? grocery.image.startsWith('http')
                  ? grocery.image
                  : grocery.image.startsWith('data:image/')
                    ? grocery.image
                    : grocery.image.startsWith('/Uploads/')
                      ? API_CONFIG.getUrl(grocery.image)
                      : API_CONFIG.getUploadUrl(grocery.image)
                : '/placeholder-image.png',
              originalPrice: parseFloat(grocery.original_price || 0),
              discountedPrice: parseFloat(grocery.discounted_price || 0),
              size: 'N/A' // Grocery items don't have sizes
            };
          });

          setCartItems(formatted);
          console.log('Cart items loaded from database:', formatted);
        } else {
          setCartItems([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading cart from database:', err);
        setCartItems([]);
        setLoading(false);
      }
    };
    fetchCartItems();
  }, []);

  // Delete item from cart (backend)
  const handleDelete = async (cartItemId) => {
    try {
      const response = await removeGroceryCartItem(cartItemId);
      
      if (response.success) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        console.log('Item deleted from cart:', cartItemId);
      } else {
        throw new Error(response.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item from cart:', err);
      alert('Could not delete item: ' + err.message);
    }
  };

  // Update quantity in cart (backend)
  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      const response = await updateGroceryCartItem(itemId, newQuantity);
      
      if (response.success) {
        setCartItems(prev => prev.map(item =>
          item._id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        ));
        console.log('Quantity updated for item:', itemId, 'New quantity:', newQuantity);
      } else {
        throw new Error(response.message || 'Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('Could not update quantity: ' + err.message);
    }
  };

  // Clear cart (backend)
  const handleClearCart = async () => {
    try {
      const response = await clearGroceryCart();
      
      if (response.success) {
        setCartItems([]);
        alert('Your cart has been cleared!');
        console.log('Cart cleared successfully');
      } else {
        throw new Error(response.message || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      alert('Could not clear cart: ' + err.message);
    }
  };

  // Proceed to buy (navigate to payment)
  const handleProceedToBuy = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty! Please add items before proceeding.');
      return;
    }
    navigate('/home-grocery/payment-enhanced');
  };

  return (
    <div className="bg-[#F8F8F8] min-h-screen">
      <Header />
      <div className="px-4 pt-24 pb-40">
        <div className="flex justify-between items-center mb-4">
          <div className="font-medium text-base">My Carts</div>
          <button
            onClick={handleClearCart}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full text-sm"
          >
            Clear Cart
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-lg">Loading cart...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-[50vh] text-center text-red-500 text-lg">{error}</div>
        ) : cartItems.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-lg">Your cart is empty</div>
        ) : (
          cartItems.slice().reverse().map((item) => (
            <div
              key={`${item._id}-${item.grocery_id}`}
              className="bg-white border border-[#E1E1E1] rounded-[20px] mt-4 flex row gap-4 p-4"
            >
              <div className="w-[200px] h-[180px]">
                <img 
                  src={item.image} 
                  alt="product" 
                  className="w-full h-full p-4 object-cover" 
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center w-full">
                  <p className="font-medium text-base text-[#484848]">{item.category}</p>
                </div>
                <div className="font-semibold text-base text-[#242424] pt-2">{item.name}</div>
                <p className="font-semibold text-sm text-[#242424] mb-2">
                  {(() => {
                    const hasDiscount = item.discountedPrice && item.discountedPrice > 0 && item.discountedPrice < item.originalPrice;
                    const displayPrice = hasDiscount ? item.discountedPrice : item.originalPrice;
                    const totalPrice = parseFloat(displayPrice) * item.quantity;
                    const originalTotal = parseFloat(item.originalPrice) * item.quantity;
                    
                    return (
                      <>
                        ₹ {totalPrice.toFixed(2)}
                        {hasDiscount && (
                          <span className="line-through text-[#C1C1C1]"> ₹ {originalTotal.toFixed(2)}</span>
                        )}
                      </>
                    );
                  })()}
                </p>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center border rounded px-1 py-0.5 bg-white">
                    <button
                      type="button"
                      className="px-2 text-lg font-bold text-gray-700 disabled:text-gray-300"
                      onClick={() => handleQuantityChange(item._id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="mx-2 w-5 text-center select-none">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-2 text-lg font-bold text-gray-700 disabled:text-gray-300"
                      onClick={() => handleQuantityChange(item._id, Math.min(500, item.quantity + 1))}
                      disabled={item.quantity >= 500}
                    >+</button>
                  </div>
                  <button
                    className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                    onClick={() => handleDelete(item._id)}
                    aria-label="Delete item"
                  >
                    <FaTrash className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="fixed bottom-24 left-0 w-full px-4 py-4">
        <button
          onClick={handleProceedToBuy}
          className={`w-full px-4 py-2 rounded-[50px] text-white ${
            cartItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5C3FFF]'
          }`}
          disabled={cartItems.length === 0}
        >
          Proceed to Buy
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default Cart;