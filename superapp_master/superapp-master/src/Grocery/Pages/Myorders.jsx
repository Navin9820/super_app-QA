import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import Header from "../SubPages/Header";
import Footer from '../SubPages/Footer';
import { useNavigate } from 'react-router-dom';
import { getOtpCode, hasOtp } from '../../utils/otpUtils';

// Order Status Timeline Component
const OrderStatusTimeline = ({ status, orderDate }) => {
    const statusSteps = [
        { key: 'pending', label: 'Order Placed', icon: '📋', color: 'bg-blue-500' },
        { key: 'processing', label: 'Processing', icon: '⚙️', color: 'bg-yellow-500' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', color: 'bg-orange-500' },
        { key: 'delivered', label: 'Delivered', icon: '✅', color: 'bg-green-500' }
    ];

    const getCurrentStepIndex = () => {
        const stepIndex = statusSteps.findIndex(step => step.key === status);
        return stepIndex >= 0 ? stepIndex : 0;
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Order Status</h3>
            <div className="relative">
                {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                        <div key={step.key} className="flex items-center mb-4">
                            {/* Timeline Line */}
                            {index < statusSteps.length - 1 && (
                                <div className={`absolute left-6 top-8 w-0.5 h-8 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                            )}
                            
                            {/* Status Icon */}
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                                isCompleted ? step.color : 'bg-gray-300'
                            }`}>
                                {step.icon}
                            </div>
                            
                            {/* Status Details */}
                            <div className="ml-4 flex-1">
                                <div className={`font-medium ${
                                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                    {step.label}
                                </div>
                                {isCurrent && (
                                    <div className="text-sm text-blue-600 font-medium">
                                        Current Status
                                    </div>
                                )}
                                {index === 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {orderDate ? new Date(orderDate).toLocaleString() : 'N/A'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

function Myorders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [revealedOtps, setRevealedOtps] = useState(new Set());

    // Helper to check auth and redirect
    const handleAuthError = (err) => {
        if (err.message === 'Unauthorized' || err.status === 401) {
            alert('Session expired. Please log in again.');
            navigate('/login');
            return true;
        }
        return false;
    };

    // Function to fetch orders
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('demoToken') || 'demo-token';
            
            // Get user ID for consistent order fetching
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userEmail = userData.email || localStorage.getItem('userEmail');
            const userPhone = userData.phone || localStorage.getItem('userPhone');
            
            // Generate a consistent user ID based on email/phone for demo purposes
            const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                          userPhone ? `user_${userPhone}` : 
                          'default_user';
            
            console.log('🔍 Grocery Myorders: User data from localStorage:', userData);
            console.log('🔍 Grocery Myorders: Extracted user ID:', userId);
            console.log('🔍 Myorders: Starting API call to fetch orders...');
            console.log('🔍 Myorders: Using token:', token);
            console.log('🔍 Myorders: API URL:', API_CONFIG.getUrl('/api/gorders/'));
            
            console.log('🔍 Grocery Myorders: Making API call with headers:', {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-user-id': userId || ''
            });
            
            const response = await fetch(API_CONFIG.getUrl('/api/gorders/'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '' // Send user ID for proper order filtering
                }
            });
            
            console.log('🔍 Myorders: Response status:', response.status);
            console.log('🔍 Myorders: Response ok:', response.ok);
            
            if (response.status === 401) throw { message: 'Unauthorized', status: 401 };
            if (!response.ok) throw new Error('Failed to fetch orders');
            
            const data = await response.json();
            console.log('🔍 Myorders: Raw API response:', data);
            console.log('🔍 Myorders: Data type:', typeof data);
            console.log('🔍 Myorders: Data.data type:', typeof data.data);
            console.log('🔍 Myorders: Data.data length:', data.data ? data.data.length : 'undefined');
            
            // Debug driver info
            if (data.data && data.data.length > 0) {
                console.log('🔍 Myorders: First order driver_info:', data.data[0].driver_info);
            }

            // Fix: Use data.data (array) from backend response
            const ordersArray = Array.isArray(data.data) ? data.data : [];

            // Transform backend data to match frontend expectations
            const transformedOrders = ordersArray.map(order => {
                return {
                    id: order._id, // Use _id from MongoDB
                    orderId: order._id, // Use _id from MongoDB
                    date: order.createdAt, // Use createdAt from MongoDB
                    status: order.status,
                    total_amount: parseFloat(order.total_amount || 0), // Ensure valid number
                    totalDiscountedPrice: parseFloat(order.total_amount || 0),
                    delivery_otp: order.delivery_otp, // Preserve delivery_otp
                    payment_details: order.payment_details, // Preserve payment_details
                    driver_info: order.driver_info, // ✅ NEW: Include driver information
                    items: order.items ? order.items.map(item => ({
                        id: item._id, // Use _id from MongoDB
                        product_id: item.product_id,
                        grocery_id: item.product_id, // Use product_id as grocery_id
                        name: item.product ? item.product.name : 'Unknown Product',
                        image: item.product && item.product.image
                            ? item.product.image.startsWith('http')
                                ? item.product.image
                                : item.product.image.startsWith('data:image/')
                                    ? item.product.image
                                    : item.product.image.startsWith('/uploads/')
                                        ? API_CONFIG.getUrl(item.product.image)
                                        : API_CONFIG.getUploadUrl(item.product.image)
                            : '/placeholder-image.png',
                        category: item.product ? item.product.category : 'Unknown',
                        quantity: item.quantity,
                        price: parseFloat(item.price || 0)
                    })) : []
                };
            });

            console.log('🔍 Myorders: Transformed orders:', transformedOrders);
            console.log('🔍 Myorders: Final orders count:', transformedOrders.length);

            setOrders(transformedOrders);
            console.log('🔍 Myorders: Orders state set to:', transformedOrders);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                setError(err.message);
                setLoading(false);
            }
        }
    };

    const toggleOtpVisibility = (orderId) => {
        setRevealedOtps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    // Fetch orders from backend on mount
    useEffect(() => {
        fetchOrders();
    }, [navigate]);

    // Poll for order updates every 5 seconds for automatic status updates (optimized)
    useEffect(() => {
        const pollOrders = async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('demoToken') || 'demo-token';
                
                // Get user ID for consistent order fetching
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userEmail = userData.email || localStorage.getItem('userEmail');
                const userPhone = userData.phone || localStorage.getItem('userPhone');
                
                // Generate a consistent user ID based on email/phone for demo purposes
                const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                              userPhone ? `user_${userPhone}` : 
                              'default_user';

                const response = await fetch(API_CONFIG.getUrl('/api/gorders/'), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'x-user-id': userId || '' // Send user ID for proper order filtering
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const ordersArray = Array.isArray(data.data) ? data.data : [];
                    
                    // Transform backend data to match frontend expectations
                    const transformedOrders = ordersArray.map(order => ({
                        id: order._id,
                        orderId: order._id,
                        date: order.createdAt,
                        status: order.status,
                        total_amount: parseFloat(order.total_amount || 0),
                        totalDiscountedPrice: parseFloat(order.total_amount || 0),
                        delivery_otp: order.delivery_otp, // Preserve delivery_otp
                        payment_details: order.payment_details, // Preserve payment_details
                        items: order.items ? order.items.map(item => ({
                            id: item._id,
                            product_id: item.product_id,
                            grocery_id: item.product_id,
                            name: item.product ? item.product.name : 'Unknown Product',
                            image: item.product && item.product.image
                                ? item.product.image.startsWith('http')
                                    ? item.product.image
                                    : item.product.image.startsWith('data:image/')
                                        ? item.product.image
                                        : item.product.image.startsWith('/uploads/')
                                            ? API_CONFIG.getUrl(item.product.image)
                                            : API_CONFIG.getUploadUrl(item.product.image)
                                : '/placeholder-image.png',
                            category: item.product ? item.product.category : 'Unknown',
                            quantity: item.quantity,
                            price: parseFloat(item.price || 0)
                        })) : []
                    }));

                    // Only update state if orders have actually changed
                    setOrders(prevOrders => {
                        const hasChanged = JSON.stringify(prevOrders) !== JSON.stringify(transformedOrders);
                        if (hasChanged) {
                            console.log('🔄 Grocery orders updated automatically');
                            return transformedOrders;
                        }
                        return prevOrders;
                    });
                }
            } catch (err) {
                console.error('❌ Error polling grocery orders:', err);
            }
        };

        const interval = setInterval(pollOrders, 30000); // Poll every 30 seconds (same as ecommerce)

        return () => clearInterval(interval);
    }, []);

    // Buy Again handler (backend)
    const handleBuyAgain = async (item) => {
        try {
            if (!item.product_id) {
                alert('Product ID is missing for this item.');
                return;
            }
            const token = localStorage.getItem('token') || localStorage.getItem('demoToken') || 'demo-token';

            // Fetch product details using product_id
            const productRes = await fetch(API_CONFIG.getUrl(`/api/groceries/${item.product_id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!productRes.ok) throw new Error('Failed to fetch product details');
            const product = await productRes.json();

            // Build the cart payload with real product info
            const cartPayload = {
                grocery_id: item.product_id,
                name: product.name,
                image: product.image,
                category: product.category,
                price: item.price,
                quantity: 1
            };
            const response = await fetch(API_CONFIG.getUrl('/api/gcart'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(cartPayload)
            });
            if (response.status === 401) throw { message: 'Unauthorized', status: 401 };
            if (!response.ok) throw new Error('Failed to add to cart');
            alert('Item added to cart!');
        } catch (err) {
            if (!handleAuthError(err)) {
                alert('Could not add to cart: ' + err.message);
            }
        }
    };

    // Update Order Status (for testing - can be removed later)
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('demoToken') || 'demo-token';
            
            const response = await fetch(API_CONFIG.getUrl(`/api/gorders/${orderId}/status`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.status === 401) throw { message: 'Unauthorized', status: 401 };
            if (!response.ok) throw new Error('Failed to update order status');
            
            // Refresh orders to show updated status
            window.location.reload();
        } catch (err) {
            if (!handleAuthError(err)) {
                alert('Could not update order status: ' + err.message);
            }
        }
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <Header />
            <div className='px-4 pt-24 pb-28 bg-[#F8F8F8]'>
                <h2 className='font-bold text-2xl mb-4'>Your Orders</h2>
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading orders...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No orders placed yet.</div>
                ) : (
                    (() => {
                        return orders.map(order => {
                            return (
                                <div key={order.orderId || order.id} className="bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4">
                                    <div className="flex justify-between items-start">
                                        {/* Left Side: Order Info */}
                                        <div>
                                            <p className="text-sm text-gray-500">Order Placed:</p>
                                            <p className="text-sm text-gray-800 font-medium mb-1">{order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</p>
                                            <p className="text-sm text-gray-500">Order ID: <span className="font-mono">OD-{(order.orderId || order.id).slice(-6)}</span></p>
                                            <p className="text-sm text-gray-500">Status: <span className="font-semibold text-blue-600">{order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}</span>
                                                <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-800' :
                                                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {order.status.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </p>
                                            
                                            {/* Driver Information Display */}
                                            {order.driver_info && order.driver_info.driver_name && (
                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-blue-800">🚚 Driver:</span>
                                                            <span className="text-sm font-semibold text-blue-900">
                                                                {order.driver_info.driver_name}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-blue-700">
                                                            {order.driver_info.driver_phone}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-blue-600 mt-1">
                                                        {order.driver_info.vehicle_type} - {order.driver_info.vehicle_number}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery OTP Display */}
                                            {hasOtp(order) && (
                                                <div className="mt-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
                                                    <div 
                                                        className="flex items-center justify-between cursor-pointer hover:bg-yellow-100 rounded-md p-2 -m-2 transition-colors duration-200"
                                                        onClick={() => toggleOtpVisibility(order.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-yellow-800">🔐 Delivery OTP</span>
                                                            <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">
                                                                {revealedOtps.has(order.id) ? 'Hide' : 'Click to reveal'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {revealedOtps.has(order.id) ? (
                                                                <div className="text-lg font-bold text-yellow-900 font-mono tracking-wider">
                                                                    {getOtpCode(order)}
                                                                </div>
                                                            ) : (
                                                                <div className="text-lg font-bold text-yellow-600 font-mono tracking-wider">
                                                                    ••••••
                                                                </div>
                                                            )}
                                                            <div className="text-yellow-600">
                                                                {revealedOtps.has(order.id) ? '👁️' : '👁️‍🗨️'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {revealedOtps.has(order.id) && (
                                                        <div className="text-xs text-yellow-700 mt-2 pt-2 border-t border-yellow-200">
                                                            Share this OTP with delivery person
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Price and Actions */}
                                        <div className="text-right">
                                            {/* Fix: Removed +50 to match invoice amount */}
                                            <p className="text-xl font-bold text-purple-600 mb-2">₹ {order.total_amount ? order.total_amount.toFixed(2) : 'N/A'}</p>
                                            {/* Optional: If +50 is for shipping, display it separately like this:
                                            <p className="text-xl font-bold text-purple-600 mb-2">₹ {order.total_amount ? order.total_amount.toFixed(2) : 'N/A'} + ₹50 Shipping</p>
                                            <p className="text-sm text-gray-500">Total: ₹ {order.total_amount ? (order.total_amount + 50).toFixed(2) : 'N/A'}</p>
                                            */}
                                            <button onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)} className="text-sm font-medium text-purple-600 hover:underline">Invoice</button>
                                            <br />
                                            {/* <button onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)} className="text-sm font-medium text-gray-600 hover:underline mt-1">
                                                {expandedOrder === order.orderId ? 'Hide Details' : 'View Details'}
                                            </button> */}
                                        </div>
                                    </div>

                                    {/* Collapsible Details Section */}
                                    {expandedOrder === order.orderId && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <OrderStatusTimeline status={order.status} orderDate={order.date} />
                                            
                                            <h4 className='font-bold text-md mt-4 mb-2'>Items in this order:</h4>
                                            {order.items && order.items.length === 0 && (
                                                <div className="text-gray-500 text-sm mb-2">No items in this order.</div>
                                            )}
                                            {order.items && order.items.map(item => (
                                                <div key={item.id} className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4"/>
                                                        <div>
                                                            <p className="font-semibold">{item.name}</p>
                                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                            <p className="text-sm text-gray-600">Price: ₹{item.price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleBuyAgain(item)} className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full hover:bg-purple-200 transition">
                                                        Buy Again
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            {/* Driver Information in expanded view */}
                                            {order.driver_info && order.driver_info.driver_name && (
                                                <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                                    <div className="text-center">
                                                        <div className="text-2xl mb-2">🚚</div>
                                                        <div className="text-lg font-bold text-blue-800 mb-2">
                                                            Your Delivery Driver
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3 mb-2">
                                                            <div className="text-lg font-semibold text-gray-800 mb-1">
                                                                {order.driver_info.driver_name}
                                                            </div>
                                                            <div className="text-sm text-gray-600 mb-1">
                                                                📞 {order.driver_info.driver_phone}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                🚗 {order.driver_info.vehicle_type} - {order.driver_info.vehicle_number}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-blue-700">
                                                            Your driver will contact you when they're on the way
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery OTP in expanded view */}
                                            {hasOtp(order) && (
                                                <div className="mt-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg shadow-sm">
                                                    <div className="text-center">
                                                        <div className="text-2xl mb-3">🔐</div>
                                                        <div className="text-lg font-bold text-yellow-800 mb-3">
                                                            Delivery OTP
                                                        </div>
                                                        <div 
                                                            className="cursor-pointer hover:bg-yellow-100 rounded-lg p-3 transition-colors duration-200"
                                                            onClick={() => toggleOtpVisibility(order.id)}
                                                        >
                                                            {revealedOtps.has(order.id) ? (
                                                                <div className="text-3xl font-mono font-bold text-yellow-900 mb-2 tracking-widest">
                                                                    {getOtpCode(order)}
                                                                </div>
                                                            ) : (
                                                                <div className="text-3xl font-mono font-bold text-yellow-600 mb-2 tracking-widest">
                                                                    ••••••
                                                                </div>
                                                            )}
                                                            <div className="text-sm text-yellow-600 mb-2">
                                                                {revealedOtps.has(order.id) ? '👁️ Tap to hide' : '👁️‍🗨️ Tap to reveal'}
                                                            </div>
                                                        </div>
                                                        {revealedOtps.has(order.id) && (
                                                            <div className="text-sm text-yellow-700 mt-2 pt-2 border-t border-yellow-200">
                                                                Share this OTP with the delivery person
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Myorders;