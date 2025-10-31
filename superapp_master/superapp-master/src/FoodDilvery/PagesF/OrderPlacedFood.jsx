import React, { useEffect, useState } from 'react';
import step4 from "../../Clothes/Images/step4.svg";
import right from "../../Clothes/Images/successful.gif";
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderInsideFood from '../ComponentsF/HeaderInsideFood';
import { foodOrderService, formatImageUrl, formatCurrency } from '../../services/foodDeliveryService';
import { getOtpCode, hasOtp } from '../../utils/otpUtils';

function OrderPlacedFood() {
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showOtp, setShowOtp] = useState(false);

    // Try to get order data from navigation state
    useEffect(() => {
        const state = location.state;
        console.log('🔍 OrderPlacedFood - Received state data:', state);
        console.log('🔍 OrderPlacedFood - Delivery OTP:', state?.deliveryOtp);
        console.log('🔍 OrderPlacedFood - Order items:', state?.items);
        
        if (state && state.deliveryOtp) {
            // If we have OTP in state, use it directly
            setOrder(state);
            
            // If items are missing, try to fetch order details from API
            if (!state.items || state.items.length === 0) {
                console.log('🔄 Items missing, fetching order details from API...');
                fetchOrderDetails(state.orderId || state.orderNumber);
            }
        } else if (state && state.orderNumber) {
            // If we have all details in state (legacy), use them
            setOrder(state);
            
            // If items are missing, try to fetch order details from API
            if (!state.items || state.items.length === 0) {
                console.log('🔄 Items missing, fetching order details from API...');
                fetchOrderDetails(state.orderId || state.orderNumber);
            }
        } else {
            setError('No order details available.');
        }
    }, [location.state]);

    // Function to fetch order details from API
    const fetchOrderDetails = async (orderId) => {
        if (!orderId) return;
        
        try {
            setLoading(true);
            console.log('🔍 Fetching order details for ID:', orderId);
            
            // Try to fetch order details from the API
            const response = await foodOrderService.getFoodOrderById(orderId);
            
            if (response.success && response.data) {
                console.log('✅ Order details fetched successfully:', response.data);
                
                // Update order with fetched details
                setOrder(prevOrder => ({
                    ...prevOrder,
                    items: response.data.items || [],
                    status: response.data.status || 'Preparing',
                    createdAt: response.data.createdAt || new Date().toISOString()
                }));
            } else {
                console.log('⚠️ Could not fetch order details, using available data');
            }
        } catch (error) {
            console.error('❌ Error fetching order details:', error);
            // Don't set error state, just use available data
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
                <HeaderInsideFood />
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
                <HeaderInsideFood />
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={() => navigate('/home-food')} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">Go Home</button>
                </div>
            </div>
        );
    }

    // Render order details
    return (
        <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center '>
            <HeaderInsideFood />
            <div className='border border-[#E1E1E1] py-4 w-full flex justify-center'>
                <img src={step4} alt="" className='w-full max-w-md mt-20 px-6' />
            </div>
            {/* Centering the image and text */}
            <div className="flex flex-col justify-center items-center mt-2">
                <img src={right} alt="" className='' />
                <div className='text-lg font-bold mt-0 text-center'>
                    Your order has been placed!
                </div>
                {order && (order.order_number || order.orderNumber) && (
                    <div className="text-sm text-gray-500 mt-1">Order #{order.order_number || order.orderNumber}</div>
                )}
            </div>
            <div className='px-4 w-full max-w-xl'>
                {/* Order Items */}
                {order && order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                        <div key={item._id || idx} className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 flex row gap-4 p-4'>
                            <div className='w-[120px] h-[140px] flex items-center justify-center bg-gray-50 rounded-lg'>
                                {item.dish_id?.image ? (
                                    <img 
                                        src={formatImageUrl(item.dish_id.image)} 
                                        alt={item.dish_id.name || 'Dish'} 
                                        className='w-full h-full object-cover rounded-lg'
                                        onError={(e) => {
                                            console.log('❌ Image failed to load:', item.dish_id.image, 'Formatted URL:', formatImageUrl(item.dish_id.image));
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                        onLoad={() => {
                                            console.log('✅ Image loaded successfully:', item.dish_id.image, 'Formatted URL:', formatImageUrl(item.dish_id.image));
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full items-center justify-center bg-gray-100 rounded-lg flex">
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">🍽️</div>
                                            <div className="text-xs text-gray-500">No Image</div>
                                        </div>
                                    </div>
                                )}
                                <div className="hidden w-full h-full items-center justify-center bg-gray-100 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🍽️</div>
                                        <div className="text-xs text-gray-500">No Image</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className='font-semibold text-base text-[#242424] pt-4'>{item.dish_id?.name || 'Dish'}</div>
                                <p className="font-medium text-sm text-[#242424] mb-2">{formatCurrency(item.price)} x {item.quantity}</p>
                                <div className="text-[#18A20C] font-medium font-base">
                                    {item.status || order.status || 'Preparing'}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 flex row gap-4 p-4'>
                        <div className='w-[120px] h-[140px] flex items-center justify-center bg-gray-50 rounded-lg'>
                            <div className="text-center">
                                <div className="text-4xl mb-2">📦</div>
                                <div className="text-xs text-gray-500">No items</div>
                            </div>
                        </div>
                        <div>
                            <div className='font-semibold text-base text-[#242424] pt-4'>No items in this order</div>
                        </div>
                    </div>
                )}
                {/* Driver Information Display - Show when driver is assigned */}
                {order && order.driver_info && order.driver_info.driver_name && (
                    <div className='bg-blue-50 border-2 border-blue-200 rounded-[20px] mt-4 p-4'>
                        <div className="text-center">
                            <div className="text-2xl mb-2">🚚</div>
                            <div className="text-lg font-bold text-blue-800 mb-3">
                                Your Delivery Driver
                            </div>
                            <div className="bg-white rounded-lg p-3 mb-3">
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

                {/* Order Summary */}
                {order && (
                    <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4'>
                        <div className='flex justify-between mb-2'>
                            <span className='font-medium'>Total Amount:</span>
                            <span>{formatCurrency(order.total_amount || order.totalAmount)}</span>
                        </div>
                        <div className='flex justify-between mb-2'>
                            <span className='font-medium'>Order Status:</span>
                            <span>{order.status || 'Preparing'}</span>
                        </div>
                        <div className='flex justify-between mb-2'>
                            <span className='font-medium'>Order Date:</span>
                            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : order.orderDate || '-'}</span>
                        </div>
                    </div>
                )}
                
                {/* Delivery OTP Display */}
                {order && hasOtp(order) && (
                    <div className='bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-[20px] mt-4 p-4 shadow-sm'>
                        <div className="text-center">
                            <div className="text-2xl mb-3">🔐</div>
                            <div className="text-lg font-bold text-yellow-800 mb-3">
                                Delivery OTP
                            </div>
                            <div 
                                className="cursor-pointer hover:bg-yellow-100 rounded-lg p-3 transition-colors duration-200"
                                onClick={() => setShowOtp(!showOtp)}
                            >
                                {showOtp ? (
                                    <div className="text-3xl font-mono font-bold text-yellow-900 mb-2 tracking-widest">
                                        {getOtpCode(order)}
                                    </div>
                                ) : (
                                    <div className="text-3xl font-mono font-bold text-yellow-600 mb-2 tracking-widest">
                                        ••••••
                                    </div>
                                )}
                                <div className="text-sm text-yellow-600 mb-2">
                                    {showOtp ? '👁️ Tap to hide' : '👁️‍🗨️ Tap to reveal'}
                                </div>
                            </div>
                            {showOtp && (
                                <div className="text-sm text-yellow-700 mt-2 pt-2 border-t border-yellow-200">
                                    Share this OTP with the delivery person
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Track Order Button */}
                <button 
                    onClick={() => navigate(`/home-food/order-tracking/${order?._id || order?.orderId || 'demo-order-123'}`)}
                    className="w-full bg-[#5C3FFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#4A2FE8] transition-colors mt-4"
                >
                    🗺️ Track Your Order
                </button>
                
                <div
                    onClick={() => navigate('/account/orders')}
                    className="mt-4 text-base font-medium text-[#5C3FFF] underline text-center cursor-pointer">
                    Check your order list
                </div>
            </div>
        </div>
    );
}

export default OrderPlacedFood;

