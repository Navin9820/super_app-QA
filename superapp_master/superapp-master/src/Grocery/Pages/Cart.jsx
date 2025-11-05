import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Header from '../SubPages/Header';
import Footer from '../SubPages/Footer';
import { FaTrash, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { 
  fetchGroceryCart, 
  updateGroceryCartItem, 
  removeGroceryCartItem, 
  clearGroceryCart 
} from '../../services/groceryCartService';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const navigate = useNavigate(); 

  // Load cart and addresses
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchGroceryCart();
        if (response.success) {
          const cartData = response.data || [];
          const formatted = cartData.map(item => {
            const grocery = item.grocery || {};
            return {
              ...item,
              name: grocery.name || 'Unknown Product',
              category: grocery.category || 'Unknown Category',
              image: grocery.image
                ? grocery.image.startsWith('http')
                  ? grocery.image
                  : grocery.image.startsWith('image/')
                    ? grocery.image
                    : grocery.image.startsWith('/Uploads/')
                      ? API_CONFIG.getUrl(grocery.image)
                      : API_CONFIG.getUploadUrl(grocery.image)
                : '/placeholder-image.png',
              originalPrice: parseFloat(grocery.original_price || 0),
              discountedPrice: parseFloat(grocery.discounted_price || 0),
              size: 'N/A'
            };
          });
          setCartItems(formatted);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        setCartItems([]);
      } finally {
        setLoading(false);
      }

      // Load addresses
      const savedAddresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
      setAddresses(savedAddresses);

      // Restore selected address
      const savedDelivery = localStorage.getItem('delivery_address');
      if (savedDelivery && savedAddresses.length > 0) {
        try {
          const delivery = JSON.parse(savedDelivery);
          const matchIndex = savedAddresses.findIndex(addr => 
            addr.houseNo === delivery.address_line1 &&
            addr.pincode === delivery.pincode
          );
          setSelectedAddressId(matchIndex !== -1 ? matchIndex : 0);
        } catch (e) {
          setSelectedAddressId(0);
        }
      } else if (savedAddresses.length > 0) {
        setSelectedAddressId(0); // auto-select first
      }
    };

    loadData();
  }, []);

  // Cart handlers
  const handleDelete = async (cartItemId) => {
    try {
      const response = await removeGroceryCartItem(cartItemId);
      if (response.success) {
        setCartItems(prev => prev.filter(item => item._id !== cartItemId));
      } else throw new Error(response.message || 'Failed to delete');
    } catch (err) {
      alert('Could not delete item: ' + err.message);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      const response = await updateGroceryCartItem(itemId, newQuantity);
      if (response.success) {
        setCartItems(prev => prev.map(item =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        ));
      } else throw new Error(response.message || 'Failed to update');
    } catch (err) {
      alert('Could not update quantity: ' + err.message);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      const response = await clearGroceryCart();
      if (response.success) {
        setCartItems([]);
      } else throw new Error(response.message || 'Failed to clear');
    } catch (err) {
      alert('Could not clear cart: ' + err.message);
    }
  };

  // Handle address selection
  const handleAddressSelect = (index) => {
    const addr = addresses[index];
    setSelectedAddressId(index);

    const deliveryData = {
      address_line1: addr.houseNo,
      roadName: addr.roadName,
      landmark: addr.landmark,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      type: addr.selectedAddressType,
      fullName: addr.fullName,
      phone: addr.phoneNumber
    };
    localStorage.setItem('delivery_address', JSON.stringify(deliveryData));
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    if (addresses.length === 0) {
      navigate('/home-grocery/address');
      return;
    }
    if (selectedAddressId === null) {
      alert('Please select a delivery address.');
      return;
    }
    navigate('/home-grocery/payment-enhanced');
  };

  const formatAddress = (addr) => {
    return `${addr.houseNo}${addr.roadName ? ', ' + addr.roadName : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
  };

  const getSelectedAddress = () => {
    if (selectedAddressId === null || !addresses[selectedAddressId]) return null;
    const addr = addresses[selectedAddressId];
    return {
      name: addr.fullName,
      address: formatAddress(addr),
      phone: addr.phoneNumber,
      type: addr.selectedAddressType
    };
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.discountedPrice || item.originalPrice || item.price || 0;
    return sum + item.quantity * price;
  }, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="bg-[#F8F8F8] min-h-screen pb-24">
      <Header />
      <div className="px-4 pt-24">

        {/* My Cart Header */}
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-xl font-bold">My Cart</h1>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cart Items */}
        {loading ? (
          <div className="text-center py-10 text-gray-600">Loading...</div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-10 text-gray-600">Your cart is empty</div>
        ) : (
          cartItems.slice().reverse().map((item) => (
            <div
              key={`${item._id}-${item.grocery_id}`}
              className="bg-white border border-[#E1E1E1] rounded-lg mt-4 p-4 flex gap-4"
            >
              <div className="w-[80px] h-[80px]">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-[#484848]">{item.category}</p>
                    <div className="font-semibold text-base pt-1">{item.name}</div>
                    <p className="font-semibold text-sm mb-2">
                      ₹ {(item.discountedPrice || item.originalPrice || item.price).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Delete item"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center border rounded px-1 py-0.5 bg-white">
                  <button
                    onClick={() => handleQuantityChange(item._id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className="px-2 text-lg font-bold text-gray-700 disabled:text-gray-300"
                  >-</button>
                  <span className="mx-2 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item._id, Math.min(500, item.quantity + 1))}
                    disabled={item.quantity >= 500}
                    className="px-2 text-lg font-bold text-gray-700 disabled:text-gray-300"
                  >+</button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Delivery Address Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-base mb-3">Delivery Address</h3>
          {addresses.length === 0 ? (
            <div>
              <p className="text-gray-500 text-sm mb-3">No addresses saved.</p>
              <button
                onClick={() => navigate('/home-grocery/address')}
                className="text-blue-600 text-sm underline"
              >
                + Add or Manage Addresses
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer ${
                    selectedAddressId === index ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                  }`}
                  onClick={() => handleAddressSelect(index)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedAddressId === index}
                      onChange={() => handleAddressSelect(index)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">{addr.fullName}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {formatAddress(addr)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <FaPhone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{addr.phoneNumber}</span>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 text-xs rounded-full">
                        {addr.selectedAddressType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/home-grocery/edit-all-addresses')}
                className="text-blue-600 text-sm underline"
              >
                + Add or Manage Addresses
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between py-2">
            <span>Subtotal</span>
            <span>₹ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-300 font-semibold">
            <span>Total</span>
            <span>₹ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Continue to Payment Button */}
        <button
          onClick={handleProceedToPayment}
          className={`w-full py-3 mt-6 rounded-lg text-white font-semibold ${
            cartItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5C3FFF]'
          }`}
          disabled={cartItems.length === 0}
        >
          Continue to Payment
        </button>

      </div>

      {/* Bottom Navigation Bar */}
      <Footer />
    </div>
  );
}

export default Cart;