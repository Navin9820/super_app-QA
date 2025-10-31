import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EcommerceGroceryHeader from '../../Components/EcommerceGroceryHeader';
import Footer from '../../Utility/Footer';
import { useCart } from '../../Utility/CartContext';
import { useNotifications } from '../../Utility/NotificationContext';
import PaymentButton from '../../Components/PaymentButton';
import { clothesOrderStorage } from '../../services/clothesOrderStorageService';

// Payment method icons
import phonepay from '../Images/phonepay.svg';
import paytm from '../Images/paytm.svg';
import amazonpay from '../Images/amazonpay.svg';
import cod from '../Images/COD.svg';
import credit from '../Images/creditdebit.svg';
import hdfc from '../Images/hdfc.svg';
import icici from '../Images/icici.svg';
import sbi from '../Images/sbi.svg';
import axis from '../Images/axis.svg';
import kotak from '../Images/kotak.svg';

function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, setCart, refreshCart } = useCart();
    const { addOrderSuccessNotification, addPaymentSuccessNotification } = useNotifications();
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    
    // Order data - use backend cart or fallback to localStorage cart
    const backendCartItems = cart?.items || [];
    const localCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItems = backendCartItems.length > 0 ? backendCartItems : localCartItems;
    
    const subtotal = cartItems.reduce((sum, item) => {
        // Handle both backend cart format and localStorage format
        const price = item.product_id?.sale_price || item.product_id?.price || item.sale_price || item.price || 0;
        const quantity = item.quantity || 1;
        return sum + (quantity * price);
    }, 0);
    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    // Sync localStorage cart with backend cart
    const syncLocalStorageCart = async () => {
        try {
            const localCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            if (localCartItems.length > 0 && (!cart || !cart.items || cart.items.length === 0)) {
                console.log('🔄 Syncing localStorage cart to backend cart...', localCartItems);
                
                // Add each localStorage item to backend cart
                for (const item of localCartItems) {
                    try {
                        const productId = item.product_id?._id || item.product_id || item.id || item._id;
                        if (productId) {
                            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CART_ITEMS), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
                                    'x-user-id': `user_${JSON.parse(localStorage.getItem('userData') || '{}').email?.replace('@', '_').replace('.', '_') || 'default_user'}`
                                },
                                body: JSON.stringify({
                                    product_id: productId,
                                    quantity: item.quantity || 1
                                })
                            });
                            
                            if (response.ok) {
                                console.log('✅ Synced item to backend cart:', productId);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Failed to sync item:', item, error);
                    }
                }
                
                // Refresh cart after syncing
                await refreshCart();
                console.log('✅ Cart sync completed');
            }
        } catch (error) {
            console.error('❌ Cart sync failed:', error);
        }
    };

    // Sync cart on component mount
    useEffect(() => {
        syncLocalStorageCart();
    }, []);

    // Payment methods - UPDATED to use Razorpay
    const paymentMethods = [
        { id: 'cod', name: 'Cash on Delivery', icon: cod, type: 'cod' },
        { id: 'phonepay', name: 'PhonePe', icon: phonepay, type: 'razorpay' },
        { id: 'paytm', name: 'Paytm', icon: paytm, type: 'razorpay' },
        { id: 'amazonpay', name: 'Amazon Pay', icon: amazonpay, type: 'razorpay' },
        { id: 'credit', name: 'Credit/Debit Card', icon: credit, type: 'razorpay' },
        { id: 'hdfc', name: 'HDFC Bank', icon: hdfc, type: 'razorpay' },
        { id: 'icici', name: 'ICICI Bank', icon: icici, type: 'razorpay' },
        { id: 'sbi', name: 'SBI Bank', icon: sbi, type: 'razorpay' },
        { id: 'axis', name: 'AXIS Bank', icon: axis, type: 'razorpay' },
        { id: 'kotak', name: 'Kotak Bank', icon: kotak, type: 'razorpay' }
    ];

    // Check if cart is empty
    useEffect(() => {
        if (cartItems.length === 0 && location.pathname !== '/home-clothes/order') {
            navigate('/home-clothes/cart');
        }
    }, [cartItems, navigate, location.pathname]);

    // Handle payment success
    const handlePaymentSuccess = async (data) => {
        setError(null);
        
        try {
            console.log('🎉 Payment successful, data:', data);
            
            // Create order object for localStorage
            const orderToSave = {
                id: data.order?.id || data.order_id || `PAY_${Date.now()}`,
                order_number: data.order?.order_number || `PAY_${Date.now()}`,
                items: cartItems.map(item => ({
                    ...item,
                    product_id: {
                        ...item.product_id,
                        // Ensure image data is properly formatted
                        photo: item.product_id?.photo,
                        featured_image: item.product_id?.featured_image,
                        image: item.product_id?.image,
                        photo_path: item.product_id?.photo_path,
                        images: item.product_id?.images,
                        images_paths: item.product_id?.images_paths,
                        name: item.product_id?.name || 'Product',
                        price: item.product_id?.price || 0,
                        sale_price: item.product_id?.sale_price,
                        category_id: item.product_id?.category_id,
                        brand_id: item.product_id?.brand_id
                    },
                    name: item.product_id?.name || 'Product',
                    price: item.product_id?.sale_price || item.product_id?.price || 0,
                    quantity: item.quantity,
                    size: item.size || 'Standard'
                })),
                total: total,
                payment_method: selectedPayment?.name || 'Razorpay',
                status: 'completed',
                date: new Date().toISOString()
            };
            
            // Add order success notification
            addOrderSuccessNotification({
                orderId: orderToSave.order_number,
                totalAmount: `₹${total}`,
                restaurantName: 'Ecommerce Store',
                estimatedDelivery: '3-5 business days'
            });
            
            // Add payment success notification
            addPaymentSuccessNotification({
                orderId: orderToSave.order_number,
                amount: `₹${total}`,
                paymentMethod: selectedPayment?.name || 'Online Payment'
            });
            
            console.log('💾 Saving payment order to localStorage:', orderToSave);
            clothesOrderStorage.addOrder(orderToSave);
            
            // Refresh cart data from server after successful payment
            await refreshCart();
            
            // Navigate to order confirmation with complete order data
            setTimeout(() => {
                navigate('/home-clothes/order', {
                    state: {
                        order: orderToSave,
                        paymentMethod: selectedPayment?.name || 'Razorpay',
                        total: total,
                        paymentData: data.payment,
                        orderNumber: orderToSave.order_number
                    }
                });
            }, 2000);
        } catch (error) {
            console.error('❌ Error handling payment success:', error);
            setError('Payment successful but error processing order details');
        }
    };

    // Handle payment error
    const handlePaymentError = (error) => {
        setError(error.message);
    };

    // Handle payment cancel
    const handlePaymentCancel = () => {
        setError('Payment was cancelled');
    };

    // Create order data for Razorpay
    const createRazorpayOrderData = () => {
        // Get user data from localStorage or use defaults
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token') || localStorage.getItem('demoToken');
        
        if (!token) {
            throw new Error('Please login to proceed with payment');
        }

        return {
            amount: total, // Send amount in rupees, backend will convert to paise
            currency: 'INR',
            order_id: `ORDER_${Date.now()}`,
            order_model: 'Order',
            description: `E-commerce order - ${cartItems.length} items`,
            email: user.email || 'customer@example.com',
            contact: user.phone || '+91 9876543210',
            customerName: user.name || 'Customer Name',
            payment_method: selectedPayment?.id || 'razorpay',
            payment_notes: `Payment via ${selectedPayment?.name || 'Razorpay'}`
        };
    };

    // Create order function for COD
    const createOrder = async () => {
        if (!selectedPayment) {
            setError('Please select a payment method');
            return;
        }

        // Check if we have items in cart
        if (cartItems.length === 0) {
            setError('Your cart is empty. Please add items to cart before placing order.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // Get token
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to place order');
            }

            // Get saved delivery address
            const savedAddress = localStorage.getItem('delivery_address');
            let shippingAddress;
            
            if (savedAddress) {
                const addressData = JSON.parse(savedAddress);
                shippingAddress = {
                    address_line1: addressData.address_line1,
                    city: addressData.city,
                    state: addressData.state,
                    country: addressData.country || 'India',
                    pincode: addressData.pincode,
                    phone: addressData.phone
                };
                console.log('✅ Using saved delivery address:', shippingAddress);
            } else {
                // ✅ FIXED: No hardcoded fallback - require user to add address
                throw new Error('No delivery address found. Please add a delivery address first.');
            }

            // Create order from cart
            const orderData = {
                shipping_address: shippingAddress,
                payment_method: selectedPayment.type,
                notes: `Payment via ${selectedPayment.name}`
            };

            console.log('🛒 Creating order with data:', orderData);

            // Get user ID for consistent order creation
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userEmail = userData.email || localStorage.getItem('userEmail');
            const userPhone = userData.phone || localStorage.getItem('userPhone');
            
            // Generate a consistent user ID based on email/phone for demo purposes
            const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                          userPhone ? `user_${userPhone}` : 
                          'default_user';
            
            console.log('🔍 Payment: Generated user ID for order creation:', userId);

            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ORDERS), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId // Send user ID for consistent order creation
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();
            console.log('📦 Order creation result:', result);
            console.log('🔐 Delivery OTP from API:', result.data?.delivery_otp);

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create order');
            }

            if (result.success) {
                // Save order to localStorage for user-specific storage
                const orderToSave = {
                    ...result.data,
                    items: cartItems.map(item => ({
                        ...item,
                        product_id: {
                            ...item.product_id,
                            // Ensure image data is properly formatted
                            photo: item.product_id?.photo,
                            featured_image: item.product_id?.featured_image,
                            image: item.product_id?.image,
                            photo_path: item.product_id?.photo_path,
                            images: item.product_id?.images,
                            images_paths: item.product_id?.images_paths,
                            name: item.product_id?.name || 'Product',
                            price: item.product_id?.price || 0,
                            sale_price: item.product_id?.sale_price,
                            category_id: item.product_id?.category_id,
                            brand_id: item.product_id?.brand_id
                        },
                        name: item.product_id?.name || 'Product',
                        price: item.product_id?.sale_price || item.product_id?.price || 0,
                        quantity: item.quantity,
                        size: item.size || 'Standard'
                    })),
                    order_number: result.data.order_number || `ORD-${Date.now()}`,
                    status: 'confirmed',
                    date: new Date().toISOString(),
                    total: total,
                    payment_method: selectedPayment.name,
                    // ✅ IMPORTANT: Preserve Delivery OTP from API response
                    delivery_otp: result.data.delivery_otp || null
                };
                
                // Add order success notification
                addOrderSuccessNotification({
                    orderId: orderToSave.order_number,
                    totalAmount: `₹${total}`,
                    restaurantName: 'Ecommerce Store',
                    estimatedDelivery: '3-5 business days'
                });
                
                console.log('💾 Saving order to localStorage:', orderToSave);
                clothesOrderStorage.addOrder(orderToSave);
                
                // Refresh cart data from server after successful order
                await refreshCart();
                
                // Navigate to order confirmation with order details
                navigate('/home-clothes/order', {
                    state: {
                        order: result.data,
                        paymentMethod: selectedPayment.name,
                        total: total
                    }
                });
            } else {
                throw new Error(result.message || 'Order creation failed');
            }

        } catch (error) {
            console.error('❌ Order creation error:', error);
            setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div>
                <EcommerceGroceryHeader />
                <div className="pt-24 px-4 text-center">
                    <p>Your cart is empty. Redirecting...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <EcommerceGroceryHeader />
            <div className="pt-24 px-4 pb-20">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-2xl font-bold text-gray-800">Payment</h1>
                    </div>
                    <p className="text-gray-600">Choose your payment method</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Order Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Items ({cartItems.length})</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="text-green-600">Free</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Select Payment Method</h3>
                    
                    {paymentMethods.map((method) => (
                        <div key={method.id} 
                             className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${
                                 selectedPayment?.id === method.id 
                                 ? 'border-blue-500 bg-blue-50' 
                                 : 'border-gray-200 hover:border-gray-300'
                             }`}
                             onClick={() => setSelectedPayment(method)}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <img src={method.icon} alt={method.name} className="w-8 h-8" />
                                    <span className="font-medium">{method.name}</span>
                                </div>
                                <input
                                    type="radio"
                                    checked={selectedPayment?.id === method.id}
                                    onChange={() => setSelectedPayment(method)}
                                    className="w-4 h-4 text-blue-600"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Payment Button */}
                {selectedPayment?.type === 'razorpay' && (
                    <div className="mt-6">
                        <PaymentButton
                            orderData={createRazorpayOrderData()}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            onCancel={handlePaymentCancel}
                            className="w-full"
                            theme="primary"
                        >
                            Pay ₹{total.toFixed(2)} via {selectedPayment.name}
                        </PaymentButton>
                    </div>
                )}

                {/* COD Button */}
                {selectedPayment?.type === 'cod' && (
                    <button
                        onClick={createOrder}
                        disabled={isProcessing || cartItems.length === 0}
                        className={`w-full py-4 text-white rounded-lg mt-6 font-semibold text-lg ${
                            isProcessing || cartItems.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}>
                        {isProcessing ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing Order...
                            </span>
                        ) : (
                            `Place Order - Cash on Delivery - ₹${total.toFixed(2)}`
                        )}
                    </button>
                )}

                {/* Place Order Button (when no payment method selected) */}
                {!selectedPayment && (
                    <button
                        disabled={true}
                        className="w-full py-4 text-white rounded-lg mt-6 font-semibold text-lg bg-gray-400 cursor-not-allowed"
                    >
                        Select Payment Method
                    </button>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Payment;