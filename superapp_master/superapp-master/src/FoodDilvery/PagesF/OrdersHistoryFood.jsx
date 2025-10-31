import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, MapPin, Search, RefreshCw } from 'lucide-react';
import FooterFood from '../ComponentsF/FooterFood';
import EcommerceGroceryHeader from '../../Components/EcommerceGroceryHeader';
import { foodOrderService, formatImageUrl, formatCurrency } from '../../services/foodDeliveryService';
import { getOtpCode, hasOtp } from '../../utils/otpUtils';

const OrderStatusTimeline = ({ status, orderDate }) => {
    console.log('Order status:', status); // Debug log to inspect status

    const statusSteps = [
        { key: 'pending', label: 'Pending', icon: '📋', color: 'bg-yellow-500' },
        //  { key: 'confirmed', label: 'Confirmed', icon: '📬', color: 'bg-blue-500' },
        { key: 'accepted', label: 'Accepted', icon: '👍', color: 'bg-green-500' },
        // { key: 'preparing', label: 'Preparing', icon: '🍳', color: 'bg-orange-500' },
         { key: 'ready', label: 'Ready', icon: '✅', color: 'bg-purple-500' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', color: 'bg-indigo-500' },
        // { key: 'delivered', label: 'Delivered', icon: '📦', color: 'bg-green-500' },
        // { key: 'cancelled', label: 'Cancelled', icon: '❌', color: 'bg-red-500' },
        // { key: 'completed', label: 'Completed', icon: '🏁', color: 'bg-green-500' },
    ];

    const getCurrentStepIndex = () => {
        const normalizedStatus = status?.toLowerCase() || 'pending';
        const stepIndex = statusSteps.findIndex(step => step.key === normalizedStatus);
        return stepIndex >= 0 ? stepIndex : 0;
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Order Status</h3>
            {status ? (
                <div className="relative">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.key} className="flex items-center mb-4">
                                {index < statusSteps.length - 1 && (
                                    <div
                                        className={`absolute left-6 top-8 w-0.5 h-8 ${
                                            isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    ></div>
                                )}
                                <div
                                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${
                                        isCompleted ? step.color : 'bg-gray-300'
                                    }`}
                                >
                                    {step.icon}
                                </div>
                                <div className="ml-4 flex-1">
                                    <div
                                        className={`font-medium ${
                                            isCompleted ? 'text-gray-900' : 'text-gray-500'
                                        }`}
                                    >
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
            ) : (
                <div className="text-red-600 text-sm">Status not available</div>
            )}
        </div>
    );
};

function OrdersHistoryFood() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(null);
    const [isOpenFilter, setIsOpenFilter] = useState(false);
    const [locationAddress, setLocationAddress] = useState('Set your location');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [revealedOtps, setRevealedOtps] = useState(new Set());
    const [filters, setFilters] = useState({
        status: [],
        date: [],
    });

    const handleSetLocation = () => {
        const newAddress = prompt('Enter your delivery address:');
        if (newAddress && newAddress.trim()) {
            localStorage.setItem('userAddress', newAddress.trim());
            setLocationAddress(newAddress.trim());
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

    useEffect(() => {
        const address = localStorage.getItem('userAddress');
        if (address) {
            setLocationAddress(address);
        }
    }, []);

    const fetchOrders = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            }

            const res = await foodOrderService.getUserFoodOrders();
            console.log('API Response:', res); // Debug log to inspect response

            if (res.success && Array.isArray(res.data)) {
                const normalizedOrders = res.data.map(order => ({
                    ...order,
                    status: order.status?.toLowerCase() || 'pending',
                }));
                setOrders(normalizedOrders);
                setError(null);
            } else {
                setError(res.message || 'Could not fetch orders.');
            }
        } catch (err) {
            setError(err.message || 'Could not fetch orders.');
            console.error('Fetch orders error:', err);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchOrders();
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchOrders(true); // Initial load
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchOrders(false); // Polling
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: {
                text: 'Pending',
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-700',
            },
            confirmed: {
                text: 'Confirmed',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-700',
            },
            accepted: {
                text: 'Accepted',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
            },
            preparing: {
                text: 'Preparing',
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-700',
            },
            ready: {
                text: 'Ready',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-700',
            },
            out_for_delivery: {
                text: 'Out for Delivery',
                bgColor: 'bg-indigo-100',
                textColor: 'text-indigo-700',
            },
            delivered: {
                text: 'Delivered',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
            },
            cancelled: {
                text: 'Cancelled',
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
            },
            completed: {
                text: 'Completed',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
            },
        };

        return (
            statusMap[status?.toLowerCase()] || {
                text: status || 'Unknown',
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-700',
            }
        );
    };

    const applyFilters = (orders) => {
        let filteredOrders = [...orders];

        // Filter by status
        if (filters.status.length > 0) {
            filteredOrders = filteredOrders.filter(order =>
                filters.status.includes(getStatusInfo(order.status).text)
            );
        }

        // Filter by date
        if (filters.date.length > 0) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                const now = new Date();
                if (filters.date.includes('Last 30 days')) {
                    return orderDate >= new Date(now.setDate(now.getDate() - 30));
                }
                if (filters.date.includes('Last 3 months')) {
                    return orderDate >= new Date(now.setMonth(now.getMonth() - 3));
                }
                if (filters.date.includes('2023')) {
                    return orderDate.getFullYear() === 2023;
                }
                if (filters.date.includes('2022')) {
                    return orderDate.getFullYear() === 2022;
                }
                return true;
            });
        }

        return filteredOrders;
    };

    const handleFilterChange = (type, value) => {
        setFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(value)
                ? prev[type].filter(item => item !== value)
                : [...prev[type], value],
        }));
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <EcommerceGroceryHeader
                locationAddress={locationAddress}
                onSetLocation={handleSetLocation}
                onNavigateHome={() => navigate('/')}
                onSignIn={() => navigate('/signin')}
            />
            <div className="px-4 pt-20 pb-28 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">Your Orders</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            aria-label={isRefreshing ? 'Refreshing orders' : 'Refresh orders'}
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                            <span className="text-sm">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <button
                            onClick={() => setIsOpenFilter(true)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                            aria-label="Open filter menu"
                        >
                            <span className="text-sm">Filter</span>
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        <span className="ml-4 text-gray-500">Loading your orders...</span>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-600 py-8">{error}</div>
                ) : applyFilters(orders).length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No orders found.</div>
                ) : (
                    applyFilters(orders).map((order, idx) => {
                        console.log(`Order ${order._id || idx} status:`, order.status); // Debug log
                        return (
                            <div
                                key={order._id || `order-${idx}`}
                                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                    <div className="w-full sm:w-24 h-24 flex-shrink-0">
                                        <div className="w-full h-full bg-orange-50 rounded-lg flex items-center justify-center">
                                            <img
                                                src={formatImageUrl(order.items?.[0]?.dish_id?.image)}
                                                alt={order.items?.[0]?.dish_id?.name || 'Dish'}
                                                className="w-16 h-16 object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row justify-between items-start">
                                            <span className="text-green-600 font-medium">
                                                {order.order_number || order._id}
                                            </span>
                                            <span className="text-gray-500 text-xs mt-2 sm:mt-0">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-800 mt-1">
                                            {order.items?.map(item => item.dish_id?.name).join(', ')}
                                        </h3>
                                        <p className="text-gray-700 font-medium mt-1">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                        <span
                                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                                getStatusInfo(order.status).bgColor
                                            } ${getStatusInfo(order.status).textColor}`}
                                        >
                                            {getStatusInfo(order.status).text}
                                        </span>

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
                                                    onClick={() => toggleOtpVisibility(order._id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-yellow-800">🔐 Delivery OTP</span>
                                                        <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">
                                                            {revealedOtps.has(order._id) ? 'Hide' : 'Click to reveal'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {revealedOtps.has(order._id) ? (
                                                            <div className="text-lg font-bold text-yellow-900 font-mono tracking-wider">
                                                                {getOtpCode(order)}
                                                            </div>
                                                        ) : (
                                                            <div className="text-lg font-bold text-yellow-600 font-mono tracking-wider">
                                                                ••••••
                                                            </div>
                                                        )}
                                                        <div className="text-yellow-600">
                                                            {revealedOtps.has(order._id) ? '👁️' : '👁️‍🗨️'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {revealedOtps.has(order._id) && (
                                                    <div className="text-xs text-yellow-700 mt-2 pt-2 border-t border-yellow-200">
                                                        Share this OTP with delivery person
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setIsOpen(isOpen === idx ? null : idx)}
                                            className="text-green-600 font-medium mt-2 hover:text-green-700 block"
                                            aria-label={isOpen === idx ? 'Hide order details' : 'View order details'}
                                        >
                                            {isOpen === idx ? 'Hide details' : 'View items'}
                                        </button>
                                    </div>
                                </div>
                                {isOpen === idx && (
                                    <div className="mt-4 border-t pt-4">
                                        <OrderStatusTimeline status={order.status} orderDate={order.createdAt} />
                                        <h4 className="font-semibold mb-2 text-gray-700 mt-4">Items</h4>
                                        <ul>
                                            {order.items?.map((item, i) => (
                                                <li key={item._id || i} className="flex items-center gap-3 mb-2">
                                                    <img
                                                        src={formatImageUrl(item.dish_id?.image)}
                                                        alt={item.dish_id?.name || 'Dish'}
                                                        className="w-10 h-10 object-contain rounded"
                                                    />
                                                    <span className="flex-1">{item.dish_id?.name}</span>
                                                    <span>x{item.quantity}</span>
                                                    <span>{formatCurrency(item.price)}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Driver Information in expanded view */}
                                        {order.driver_info && order.driver_info.driver_name && (
                                            <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
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
                                            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg shadow-sm">
                                                <div className="text-center">
                                                    <div className="text-2xl mb-3">🔐</div>
                                                    <div className="text-lg font-bold text-yellow-800 mb-3">
                                                        Delivery OTP
                                                    </div>
                                                    <div 
                                                        className="cursor-pointer hover:bg-yellow-100 rounded-lg p-3 transition-colors duration-200"
                                                        onClick={() => toggleOtpVisibility(order._id)}
                                                    >
                                                        {revealedOtps.has(order._id) ? (
                                                            <div className="text-3xl font-mono font-bold text-yellow-900 mb-2 tracking-widest">
                                                                {getOtpCode(order)}
                                                            </div>
                                                        ) : (
                                                            <div className="text-3xl font-mono font-bold text-yellow-600 mb-2 tracking-widest">
                                                                ••••••
                                                            </div>
                                                        )}
                                                        <div className="text-sm text-yellow-600 mb-2">
                                                            {revealedOtps.has(order._id) ? '👁️ Tap to hide' : '👁️‍🗨️ Tap to reveal'}
                                                        </div>
                                                    </div>
                                                    {revealedOtps.has(order._id) && (
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
            <FooterFood />
            {isOpenFilter && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
                    <div
                        className="bg-white w-full max-w-sm h-full p-6 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                            <button
                                onClick={() => setIsOpenFilter(false)}
                                aria-label="Close filter menu"
                            >
                                <X className="text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Order Status</h4>
                                <div className="space-y-2">
                                    {['Delivered', 'Not yet shipped', 'Cancelled'].map((status) => (
                                        <label key={status} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={filters.status.includes(status)}
                                                onChange={() => handleFilterChange('status', status)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="text-gray-700">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Filter by date</h4>
                                <div className="space-y-2">
                                    {['Last 30 days', 'Last 3 months', '2023', '2022'].map((date) => (
                                        <label key={date} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={filters.date.includes(date)}
                                                onChange={() => handleFilterChange('date', date)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="text-gray-700">{date}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 space-y-3">
                            <button
                                onClick={() => setIsOpenFilter(false)}
                                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={() => setIsOpenFilter(false)}
                                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrdersHistoryFood;