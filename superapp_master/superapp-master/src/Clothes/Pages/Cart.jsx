import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import EcommerceGroceryHeader from '../../Components/EcommerceGroceryHeader';
import Footer from '../../Utility/Footer';
import TopBannerSection from '../../Components/TopBannerSection.jsx';
import { FaTrash } from 'react-icons/fa';
import { useCart } from '../../Utility/CartContext'; // ✅ USE UNIFIED CART CONTEXT

function Cart() {
  // ✅ REPLACE: Remove local cart state, use global CartContext
  const { cart, loading, removeFromCart, updateCartItem } = useCart();
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const navigate = useNavigate();

  // Load saved delivery address
  useEffect(() => {
    const savedAddress = localStorage.getItem('delivery_address');
    if (savedAddress) {
      setDeliveryAddress(JSON.parse(savedAddress));
    }
  }, []);

  // ✅ TRANSFORM: Convert cart data to display format
  const cartItems = cart?.items?.map(item => {
    const product = item.product_id || item.product || {};
    
    // Handle product image with proper URL construction
    let productImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
    
    // Try multiple image sources in order of preference
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
    
    // Additional fallback: if the image URL is null or invalid, use placeholder
    if (!productImage || productImage === 'null' || productImage === 'undefined') {
      productImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
    }
    
    return {
      id: item.id || item._id,
      product_id: item.product_id,
      name: product?.name || 'Product',
      image: productImage,
      category: product?.category_id?.name || product?.category?.name || 'Category',
      originalPrice: parseFloat(product?.price || 0),
      discountedPrice: parseFloat(product?.sale_price || product?.price || 0),
      quantity: item.quantity,
      size: item.variation?.attributes?.size || 'N/A',
      price: parseFloat(item.price || 0),
      total_price: parseFloat(item.total_price || 0)
    };
  }) || [];

  // ✅ UNIFIED: Delete function using CartContext
  const handleDeleteItem = async (itemId) => {
    try {
      const result = await removeFromCart(itemId);
      if (result.success) {
        setError(null);
      } else {
        setError(result.message || 'Failed to delete item');
      }
    } catch (error) {
      setError('Failed to delete item: ' + error.message);
    }
  };

  // ✅ UNIFIED: Update quantity function using CartContext
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleDeleteItem(itemId);
      return;
    }
    try {
      const result = await updateCartItem(itemId, newQuantity);
      if (!result.success) {
        setError('Failed to update quantity');
      }
    } catch (error) {
      setError('Failed to update quantity');
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.discountedPrice;
    return sum + itemTotal;
  }, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="text-sm font-semibold">
        <EcommerceGroceryHeader />
        <div className="pt-24 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="text-sm font-semibold">
      <EcommerceGroceryHeader />
      <div className="pt-24 px-4 pb-20">
        <div className="mb-4">
          <TopBannerSection heightClass="h-40" roundedClass="rounded-xl" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">My Cart</h1>
          {cartItems.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add items from any category!</p>
            <button
              onClick={() => navigate('/home-clothes')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-xs">{item.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-black">
                        ₹{item.discountedPrice}
                      </span>
                      {item.originalPrice > item.discountedPrice && (
                        <span className="text-gray-500 line-through text-xs">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border rounded-full"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border rounded-full"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}

            {/* Delivery Address Section */}
            {deliveryAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-800 mb-2">Delivery Address</h3>
                    <p className="text-xs text-gray-700">
                      <strong>{deliveryAddress.fullName}</strong><br/>
                      {deliveryAddress.address_line1}<br/>
                      {deliveryAddress.landmark && `Near ${deliveryAddress.landmark}`}<br/>
                      {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}<br/>
                      📞 {deliveryAddress.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/home-clothes/address')}
                    className="text-blue-600 text-xs underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            {/* Cart Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => deliveryAddress ? navigate('/home-clothes/payment') : navigate('/home-clothes/address')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg mt-4 hover:bg-blue-700"
              >
                {deliveryAddress ? 'Continue to Payment' : 'Set Delivery Address'}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Cart;