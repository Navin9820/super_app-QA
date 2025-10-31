import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import ClothesHeader from "../Header/ClothesHeader";
import Footer from '../../Utility/Footer';
import filter from "../Images/filterbutton.svg";
import filterColor from "../Images/filtertcolorButton.svg";
import { useNavigate } from 'react-router-dom';
import { clothesOrderStorage } from '../../services/clothesOrderStorageService';
import { getOtpCode, hasOtp } from '../../utils/otpUtils';

const OrderStatusTimeline = ({ status, orderDate }) => {
    const statusSteps = [
        { key: 'pending', label: 'Order Placed', icon: '📋', color: 'bg-blue-500' },
        // { key: 'confirmed', label: 'Confirmed', icon: '✅', color: 'bg-green-500' },
        { key: 'processing', label: 'Processing', icon: '⚙️', color: 'bg-yellow-500' },
        // { key: 'shipped', label: 'Shipped', icon: '🚚', color: 'bg-orange-500' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', color: 'bg-orange-600' },
        { key: 'delivered', label: 'Delivered', icon: '📦', color: 'bg-green-600' },
        // { key: 'cancelled', label: 'Cancelled', icon: '❌', color: 'bg-red-500' },
        // { key: 'refunded', label: 'Refunded', icon: '💸', color: 'bg-gray-500' }
    ];

    const getCurrentStepIndex = () => {
        const stepIndex = statusSteps.findIndex(step => step.key === status.toLowerCase());
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
                            {index < statusSteps.length - 1 && (
                                <div className={`absolute left-6 top-8 w-0.5 h-8 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                            )}
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                                isCompleted ? step.color : 'bg-gray-300'
                            }`}>
                                {step.icon}
                            </div>
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
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOpenFilter, setIsOpenFilter] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        status: [],
        date: ''
    });
    const [revealedOtps, setRevealedOtps] = useState(new Set());

    // Fetch orders from backend API
    const fetchOrders = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found, using localStorage fallback');
                const localOrders = clothesOrderStorage.getOrders();
                setOrders(localOrders);
                if (isInitialLoad) setLoading(false);
                return;
            }

            // Get user ID from localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userEmail = userData.email || localStorage.getItem('userEmail');
            const userPhone = userData.phone || localStorage.getItem('userPhone');
            
            // Generate a consistent user ID based on email/phone for demo purposes
            const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                          userPhone ? `user_${userPhone}` : 
                          'default_user';
            
            console.log('🔍 Myorders: User data from localStorage:', userData);
            console.log('🔍 Myorders: User email:', userEmail);
            console.log('🔍 Myorders: User phone:', userPhone);
            console.log('🔍 Myorders: Generated user ID:', userId);

            console.log('🔍 Myorders: Making API call with headers:', {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-user-id': userId || ''
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '' // Send user ID for proper order filtering
                }
            });

            if (response.status === 401) {
                navigate('/login');
                setError('Session expired. Please log in again.');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                
                // Only update state if orders have actually changed
                setOrders(prevOrders => {
                    const hasChanged = JSON.stringify(prevOrders) !== JSON.stringify(data.data || []);
                    if (hasChanged) {
                        console.log('🔄 Ecommerce orders updated automatically');
                        return data.data || [];
                    }
                    return prevOrders;
                });
                setError('');
            } else {
                console.log('API failed, using localStorage fallback');
                const localOrders = clothesOrderStorage.getOrders();
                setOrders(localOrders);
                setError('Failed to fetch orders from server. Showing cached data.');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            console.log('Using localStorage fallback due to error');
            const localOrders = clothesOrderStorage.getOrders();
            setOrders(localOrders);
            setError('Failed to fetch orders. Showing cached data.');
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchOrders(true); // Initial load with loading indicator
        const interval = setInterval(() => fetchOrders(false), 5000); // Poll every 5 seconds (fast like grocery orders)
        return () => clearInterval(interval);
    }, [navigate]);

    const handleFilterChange = (filterType, value) => {
        setSelectedFilters(prevFilters => {
            if (filterType === 'status') {
                const newStatus = prevFilters.status.includes(value)
                    ? prevFilters.status.filter(s => s !== value)
                    : [...prevFilters.status, value];
                return { ...prevFilters, status: newStatus };
            } else if (filterType === 'date') {
                return { ...prevFilters, date: prevFilters.date === value ? '' : value };
            }
            return prevFilters;
        });
    };

    const applyFilters = () => {
        setIsOpenFilter(false);
    };

    const clearFilters = () => {
        setSelectedFilters({ status: [], date: '' });
        setIsOpenFilter(false);
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

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'confirmed':
                return 'Confirmed';
            case 'out_for_delivery':
                return 'Out for Delivery';
            case 'delivered':
                return 'Delivered';
            case 'pending':
                return 'Pending';
            case 'processing':
                return 'Processing';
            case 'shipped':
                return 'Shipped';
            case 'cancelled':
                return 'Cancelled';
            case 'refunded':
                return 'Refunded';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'text-blue-600';
            case 'out_for_delivery':
                return 'text-orange-600';
            case 'delivered':
                return 'text-green-600';
            case 'pending':
                return 'text-yellow-600';
            case 'processing':
                return 'text-purple-600';
            case 'shipped':
                return 'text-indigo-600';
            case 'cancelled':
                return 'text-red-600';
            case 'refunded':
                return 'text-gray-600';
            default:
                return 'text-[#F3A91F]';
        }
    };

    const filteredOrders = orders.filter(order => {
        const isStatusMatch = selectedFilters.status.length === 0 || 
            selectedFilters.status.includes(order.status.toLowerCase());
        if (!isStatusMatch) return false;

        if (selectedFilters.date) {
            const orderDate = new Date(order.createdAt);
            const now = new Date();
            let isDateMatch = false;

            switch (selectedFilters.date) {
                case 'Last 7 days':
                    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
                    isDateMatch = orderDate >= sevenDaysAgo;
                    break;
                case 'Last 30 days':
                    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                    isDateMatch = orderDate >= thirtyDaysAgo;
                    break;
                case 'Last 6 months':
                    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
                    isDateMatch = orderDate >= sixMonthsAgo;
                    break;
                case 'Last year':
                    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                    isDateMatch = orderDate >= oneYearAgo;
                    break;
                default:
                    isDateMatch = true;
            }
            if (!isDateMatch) return false;
        }

        return true;
    });

    const isFilterApplied = selectedFilters.status.length > 0 || selectedFilters.date !== '';

    return (
        <div>
            <div className='bg-[#F8F8F8] min-h-screen'>
                <ClothesHeader />
                <div className='px-4 pt-24 pb-28 bg-[#F8F8F8]'>
                    <div className="flex justify-between items-center w-full bg-[#F8F8F8]">
                        <div className="flex items-center gap-3">
                            <p className='font-medium text-base text-[#484848]'>Your Orders</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsOpenFilter(true)}>
                                <img
                                    src={isFilterApplied ? filterColor : filter}
                                    alt="filter"
                                    className="w-[60px] h-[30px]"
                                />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-lg">
                            Loading orders...
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-[50vh] text-center text-red-500 text-lg">
                            <p>Error: {error}</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-lg">
                            No orders yet.
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-[50vh] text-center text-[#484848] text-lg">
                            No orders match your filter.
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const firstItem = order.items?.[0] || {};
                            const product = firstItem.product_id || {};
                            
                            // Use total_amount from order if available, otherwise calculate from items
                            const totalOrderAmount = order.total_amount || order.items?.reduce((total, item) => {
                                const itemPrice = item.price || item.product_id?.sale_price || item.product_id?.price || 0;
                                const itemQuantity = item.quantity || 1;
                                return total + (itemPrice * itemQuantity);
                            }, 0) || 0;

                            return (
                                <div 
                                    key={order._id || order.id} 
                                    className="bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4"
                                >
                                    <div 
                                        className="flex flex-col cursor-pointer" 
                                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <p className="text-[#5C3FFF] font-medium text-base">
                                                {order.order_number || order.id}
                                            </p>
                                            <p 
                                                className="font-medium text-base text-red-500 cursor-pointer" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
                                                }}
                                            >
                                                {expandedOrderId === order.id ? 'Hide Details' : 'Invoice'}
                                            </p>
                                        </div>
                                        <div className="font-semibold text-base text-[#242424] pt-2">
                                            {product.name || 'Product'} {order.items.length > 1 ? `+${order.items.length - 1} more` : ''}
                                        </div>
                                        <p className="font-medium text-sm text-[#242424] mb-2">
                                            ₹ {totalOrderAmount.toLocaleString('en-IN')}
                                        </p>
                                        <div className={`font-medium font-base ${getStatusColor(order.status)}`}>
                                            {getStatusDisplay(order.status)}
                                        </div>
                                        
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
                                    {expandedOrderId === order.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <OrderStatusTimeline status={order.status} orderDate={order.createdAt} />
                                            <div className="mb-2 font-semibold text-sm text-[#484848] mt-4">Order Items:</div>
                                            {order.items.map((item, idx) => {
                                                // Map the populated product data to the expected format
                                                const product = item.product_id || {};
                                                const variation = item.variation_id || {};
                                                
                                                // Get the correct price (use product price or item price)
                                                const itemPrice = item.price || product.price || 0;
                                                const itemTotal = itemPrice * (item.quantity || 1);
                                                
                                                // Get product name from populated product or snapshot
                                                const productName = product.name || item.product_snapshot?.name || 'Item';
                                                
                                                // Get size from variation or default
                                                const size = variation.size || variation.name || 'N/A';

                                                return (
                                                    <div key={idx} className="flex items-center gap-3 border-b py-2">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{productName}</div>
                                                            <div className="text-xs text-[#797979]">Size: {size}</div>
                                                            <div className="text-xs text-[#797979]">Qty: {item.quantity || 1}</div>
                                                        </div>
                                                        <div className="font-medium text-sm">₹ {itemTotal.toLocaleString('en-IN')}</div>
                                                    </div>
                                                );
                                            })}
                                            <div className="mt-2 text-xs text-[#797979]">
                                                Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                                            </div>
                                            
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
                        })
                    )}
                </div>
                <Footer />
            </div>

            {isOpenFilter && (
                <div
                    className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex justify-end items-center z-50"
                    onClick={() => setIsOpenFilter(false)}
                >
                    <div
                        className="bg-[#F8F8F8] w-[80%] h-full flex flex-col p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex">
                            <img src={filterColor} alt="filter" className='w-[70px] h-[40px] ml-auto' />
                        </div>

                        <div className="flex-1 pt-8 px-2 overflow-auto">
                            <div className="text-[#797979] text-sm font-medium mb-4">Filter by Status</div>
                            <div className="flex flex-col gap-2">
                                {[ 'processing',  'out_for_delivery', 'delivered'].map(status => (
                                    <div key={status} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedFilters.status.includes(status)}
                                            onChange={() => handleFilterChange('status', status)}
                                            className="w-4 h-4 border-2 border-[#5C3FFF] rounded-full appearance-none checked:bg-[#5C3FFF] checked:border-[#5C3FFF]"
                                        />
                                        <div className="text-sm font-semibold">{getStatusDisplay(status)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* <div className="text-[#797979] text-sm font-medium mt-8">Filter by Date</div>
                            <div className="flex flex-col gap-2">
                                {['Last 7 days', 'Last 30 days', 'Last 6 months', 'Last year'].map(dateRange => (
                                    <div key={dateRange} className="pt-2 flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="dateFilter"
                                            checked={selectedFilters.date === dateRange}
                                            onChange={() => handleFilterChange('date', dateRange)}
                                            className="w-4 h-4 border-2 border-[#5C3FFF] rounded-full appearance-none checked:bg-[#5C3FFF] checked:border-[#5C3FFF]"
                                        />
                                        <div className="text-sm font-semibold">{dateRange}</div>
                                    </div>
                                ))}
                            </div> */}
                        </div>

                        <div className="px-2 py-4">
                            <button className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px]" onClick={applyFilters}>
                                Apply
                            </button>
                            <button className="text-[#242424] w-full px-4 py-2 border rounded-[50px] bg-[#EEEAFF] mt-2" onClick={clearFilters}>
                                Clear Filters
                            </button>
                            <button className="text-[#242424] w-full px-4 py-2 border rounded-[50px] bg-[#EEEAFF] mt-2" onClick={() => setIsOpenFilter(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Myorders;