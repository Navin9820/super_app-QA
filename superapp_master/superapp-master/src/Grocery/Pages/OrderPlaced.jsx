import React, { useState, useEffect } from 'react';
import step4 from "../Images/step4.svg";
import Header from "../SubPages/Header";
import right from "../Images/successful.gif";
import shirt from "../Images/shirt.svg";
import { useNavigate, useLocation } from 'react-router-dom';
import API_CONFIG from '../../config/api.config';

function OrderPlaced() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    
    // Function to fetch latest order data from API
    const fetchOrderData = async (orderId) => {
        if (!orderId) return;
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || localStorage.getItem('demoToken') || 'demo-token';
            
            // Get user ID for consistent order fetching
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userEmail = userData.email || localStorage.getItem('userEmail');
            const userPhone = userData.phone || localStorage.getItem('userPhone');
            
            // Generate a consistent user ID based on email/phone for demo purposes
            const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                          userPhone ? `user_${userPhone}` : 
                          'default_user';
            
            console.log('🔍 OrderPlaced: Generated user ID for order fetch:', userId);
            
            const response = await fetch(API_CONFIG.getUrl(`/api/gorders/${orderId}`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    console.log('🔍 OrderPlaced: Fetched order data:', data.data);
                    console.log('🔍 OrderPlaced: Driver info from API:', data.data.driver_info);
                    
                    setOrderData(prevData => ({
                        ...prevData,
                        status: data.data.status,
                        deliveryOtp: data.data.payment_details?.delivery_otp?.code || null,
                        driver_info: data.data.driver_info || null
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching order data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        // Get order data from location state or fallback to defaults
        const stateData = location.state;
        console.log('OrderPlaced: Received state data:', stateData);
        console.log('OrderPlaced: Driver info from state:', stateData?.order?.driver_info || stateData?.driver_info);
        
        if (stateData) {
            const initialOrderData = {
                orderId: stateData.order?.id || stateData.orderNumber || `GROCERY-${Date.now()}`,
                total: stateData.total || 0,
                paymentMethod: stateData.paymentMethod || 'Online Payment',
                status: stateData.order?.status || 'Processing',
                items: stateData.order?.items || stateData.items || [],
                deliveryOtp: stateData.order?.delivery_otp || stateData.delivery_otp || null,
                driver_info: stateData.order?.driver_info || stateData.driver_info || null
            };
            
            setOrderData(initialOrderData);
            
            // Fetch latest order data to get driver info if available
            const orderId = stateData.order?.id || stateData.orderNumber;
            if (orderId) {
                fetchOrderData(orderId);
            }
        } else {
            // Fallback data if no state is passed
            setOrderData({
                orderId: `GROCERY-${Date.now()}`,
                total: 1400,
                paymentMethod: 'Online Payment',
                status: 'Processing',
                items: []
            });
        }
    }, [location]);

    // Poll for driver assignment every 10 seconds
    useEffect(() => {
        if (!orderData?.orderId) return;
        
        const interval = setInterval(() => {
            fetchOrderData(orderData.orderId);
        }, 10000); // Poll every 10 seconds
        
        return () => clearInterval(interval);
    }, [orderData?.orderId]);

    const handleTrackOrder = () => {
        navigate(`/home-grocery/order-tracking/${orderData?.orderId}`);
    };

    if (!orderData) {
        return (
            <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
                <Header />
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center '>
           <Header />

            <div className='border border-[#E1E1E1] py-4 w-full flex justify-center'>
                <img src={step4} alt="" className='w-full max-w-md mt-20 px-6' />
            </div>
            
            {/* Centering the image and text */}
            <div className="flex flex-col justify-center items-center mt-2">
                <img src={right} alt="" className='' />
                <div className='text-lg font-bold mt-0 text-center'>
                    Your order has been placed!
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                    We'll notify you when your order is ready for pickup
                </p>
            </div>

            <div className='px-4 w-full max-w-md'>
                {/* Order Details Card */}
                <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4'>
                    <div className="flex justify-between items-center w-full mb-4">
                        <p className="text-[#5C3FFF] font-medium text-base">Order #{orderData.orderId}</p>
                        <p className="font-medium text-base text-[#5C3FFF]">Invoice</p>
                    </div>
                    
                    {/* Display all items with their images */}
                    {orderData.items && orderData.items.length > 0 ? (
                        orderData.items.map((item, index) => {
                            const productImage = item.product?.image || item.image || shirt;
                            const productName = item.product?.name || item.name || 'Grocery Item';
                            const price = item.price || 0;

                            return (
                                <div key={index} className='flex gap-4 mb-4'>
                                    <div className='w-[120px] h-[140px]'>
                                        <img 
                                            src={productImage} 
                                            alt="product" 
                                            className='w-full h-full p-4 object-contain' 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className='font-semibold text-base text-[#242424]'>{productName}</div>
                                        <p className="font-medium text-sm text-[#242424] mb-2">₹ {price}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className='flex gap-4 mb-4'>
                            <div className='w-[120px] h-[140px]'>
                                <img src={shirt} alt="product" className='w-full h-full p-4' />
                            </div>
                            <div className="flex-1">
                                <div className='font-semibold text-base text-[#242424] pt-2'>Grocery Items</div>
                                <p className="font-medium text-sm text-[#242424] mb-2">₹ {orderData.total} <span className="line-through text-[#C1C1C1]">₹ {Math.round(orderData.total * 1.07)}</span></p>
                            </div>
                        </div>
                    )}
                    
                    <div className="text-[#18A20C] font-medium font-base">
                        Status: {orderData.status}
                    </div>
                    <div className="font-semibold text-base text-[#242424] mt-2">
                        Total: ₹ {orderData.total}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Paid via {orderData.paymentMethod}
                    </div>
                </div>

                {/* Driver Information Display - Show when driver is assigned */}
                {orderData.driver_info && orderData.driver_info.driver_name && (
                    <div className='bg-blue-50 border-2 border-blue-200 rounded-[20px] mt-4 p-4'>
                        <div className="text-center">
                            <div className="text-2xl mb-2">🚚</div>
                            <div className="text-lg font-bold text-blue-800 mb-3">
                                Your Delivery Driver
                            </div>
                            <div className="bg-white rounded-lg p-3 mb-3">
                                <div className="text-lg font-semibold text-gray-800 mb-1">
                                    {orderData.driver_info.driver_name}
                                </div>
                                <div className="text-sm text-gray-600 mb-1">
                                    📞 {orderData.driver_info.driver_phone}
                                </div>
                                <div className="text-sm text-gray-600">
                                    🚗 {orderData.driver_info.vehicle_type} - {orderData.driver_info.vehicle_number}
                                </div>
                            </div>
                            <div className="text-sm text-blue-700">
                                Your driver will contact you when they're on the way
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery OTP Section */}
                {orderData.deliveryOtp && (
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
                                        {orderData.deliveryOtp}
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

                {/* Action Buttons */}
                <div className="mt-4 space-y-3">
                    {/* Track Order Button */}
                    <button 
                        onClick={handleTrackOrder}
                        className="w-full bg-[#5C3FFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#4A2FE8] transition-colors"
                    >
                        🗺️ Track Your Order
                    </button>
                    
                    {/* Check Order List */}
                    <button 
                        onClick={() => navigate('/home-grocery/order-list')}   
                        className="w-full text-base font-medium text-[#5C3FFF] underline py-2"
                    >
                        Check your order list
                    </button>
                </div>

                {/* Order Status Info */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                        <p>1. Order confirmed and processing</p>
                        <p>2. Items being prepared for pickup</p>
                        <p>3. Ready for pickup notification</p>
                        <p>4. Track delivery in real-time</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderPlaced;
