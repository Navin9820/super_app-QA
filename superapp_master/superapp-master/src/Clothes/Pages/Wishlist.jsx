import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClothesHeader from '../Header/ClothesHeader';
import Footer from '../../Utility/Footer';
import { FaTrash } from 'react-icons/fa';
import { fetchWishlist as fetchWishlistService, removeFromWishlist as removeFromWishlistService } from '../../services/cartWishlistService';
import { useCart } from '../../Utility/CartContext';

function WishList() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qtyMap, setQtyMap] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  
  // Use CartContext to properly update cart state
  const { addToCart, removeFromWishlist } = useCart();

  // Custom toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Fetch wishlist from backend using the same service as CartContext
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const result = await fetchWishlistService();
      
      let wishlistData = [];
      
      if (result && result.success && Array.isArray(result.data)) {
        wishlistData = result.data;
      } else if (result && Array.isArray(result)) {
        wishlistData = result;
      } else if (result && result.data && Array.isArray(result.data)) {
        wishlistData = result.data;
      } else {
        wishlistData = [];
      }
      
      setWishlistItems(wishlistData);
      
      // Initialize qtyMap for each item
      const newQtyMap = {};
      wishlistData.forEach(item => {
        const itemId = item._id || item.id;
        newQtyMap[itemId] = item.quantity || 1;
      });
      setQtyMap(newQtyMap);
      
    } catch (e) {
      setWishlistItems([]);
      setQtyMap({});
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWishlist();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = async (wishlistItemId) => {
    try {
      const result = await removeFromWishlist(wishlistItemId);
      
      if (result.success) {
        await fetchWishlist();
        showToast('Item removed from wishlist successfully!', 'success');
      } else {
        throw new Error(result.message || 'Failed to remove item');
      }
    } catch (e) {
      showToast('Failed to remove item from wishlist', 'error');
    }
  };

  const handleClearWishlist = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.WISHLIST), {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ clear_all: true })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Clear error response:', errorText);
        throw new Error(`Failed to clear wishlist: ${response.status}`);
      }
      
      const result = await response.json();
      
      setWishlistItems([]);
      setQtyMap({});
      
      await fetchWishlist();
      
      showToast('Your wishlist has been cleared!', 'success');
    } catch (e) {
      console.error('❌ Error clearing wishlist:', e);
      showToast('Failed to clear wishlist', 'error');
    }
  };

  const handleQtyChange = (id, delta) => {
    setQtyMap(prev => {
      const newQty = Math.max(1, (prev[id] || 1) + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const handleAddToCart = async (item) => {
    const itemId = item._id || item.id;
    const quantity = qtyMap[itemId] || 1;
    
    let productId;
    if (item.product_id && typeof item.product_id === 'object' && item.product_id._id) {
      productId = item.product_id._id;
    } else if (item.product_id && typeof item.product_id === 'string') {
      productId = item.product_id;
    } else {
      productId = item.product_id;
    }
    
    try {
      const result = await addToCart(productId, quantity);
      
      if (result.success) {
        showToast('Added to cart successfully!', 'success');
      } else {
        throw new Error(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast(error.message || 'Failed to add to cart', 'error');
    }
  };

  return (
    <div className="bg-[#F8F8F8] min-h-screen">
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <ClothesHeader />
      <div className="px-4 pt-24 pb-40">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-[#484848]">My Wishlist ({wishlistItems.length} items)</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearWishlist}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded"
            >
              Clear Wishlist
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-sm font-semibold">
            Loading...
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-sm font-semibold">
            Your wishlist is empty
          </div>
        ) : (
          wishlistItems.map((item) => {
            const product = item.product_id || item.product || {};
            const itemId = item._id || item.id;
            
            return (
              <div
                key={itemId}
                className="bg-white border border-[#E1E1E1] rounded-[20px] mt-4 flex flex-row gap-4 p-4"
              >
                <div className="w-[200px] h-[180px]">
                  {(() => {
                    let productImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    
                    if (product?.photo) {
                      productImage = API_CONFIG.getImageUrl(product.photo);
                    } else if (product?.featured_image) {
                      productImage = API_CONFIG.getImageUrl(product.featured_image);
                    } else if (product?.image) {
                      productImage = API_CONFIG.getImageUrl(product.image);
                    } else if (product?.photo_path) {
                      productImage = API_CONFIG.getImageUrl(product.photo_path);
                    } else if (product?.images && product.images.length > 0) {
                      productImage = API_CONFIG.getImageUrl(product.images[0]);
                    }
                    
                    if (!productImage || productImage === 'null' || productImage === 'undefined') {
                      productImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }
                    
                    return (
                      <img 
                        src={productImage} 
                        alt={product.name || 'Product'} 
                        className="w-full h-full p-4 object-contain" 
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                        }}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-sm font-semibold text-[#484848]">
                      {product.category_id?.name || product.category?.name || 'Unknown Category'}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-[#242424] pt-2">
                    {product.name || 'Unknown Product'}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-[#484848]">Qty:</span>
                    <button className="border px-2 rounded text-sm font-semibold" onClick={() => handleQtyChange(itemId, -1)}>-</button>
                    <span className="text-sm font-semibold w-4 text-center">{qtyMap[itemId] || 1}</span>
                    <button className="border px-2 rounded text-sm font-semibold" onClick={() => handleQtyChange(itemId, 1)}>+</button>
                  </div>
                  <p className="text-sm font-semibold text-[#242424] mb-2">
                    ₹ {parseFloat(product.sale_price || product.price || 0)}{' '}
                    {product.sale_price && product.price && product.sale_price < product.price && (
                      <span className="line-through text-[#C1C1C1] text-sm font-semibold">₹ {parseFloat(product.price)}</span>
                    )}
                  </p>
                  <div className="flex justify-between items-center w-full">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-2 py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                    <button
                      className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                      onClick={() => handleRemove(itemId)}
                      aria-label="Remove from wishlist"
                    >
                      <FaTrash className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Footer />
    </div>
  );
}

export default WishList;