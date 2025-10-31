import API_CONFIG from "../../config/api.config.js";
import React, { useState } from 'react';
import step4 from "../Images/step4.svg";
import ClothesHeader from "../Header/ClothesHeader";
import right from "../Images/successful.gif";
import shirt from "../Images/shirt.svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../Utility/CartContext';
import { useEffect } from 'react';

function OrderPlaced() {
    const navigate = useNavigate(); 
    const location = useLocation();
    const { cart, setCart } = useCart();
    const [showOtp, setShowOtp] = useState(false);
    const order = location.state?.order;
    const paymentMethod = location.state?.paymentMethod;
    const total = location.state?.total;
    const deliveryOtp = order?.delivery_otp; // Get Delivery OTP from order data
    const driverInfo = order?.driver_info; // Get Driver information from order data
    
    // Debug logging
    console.log('🔍 OrderPlaced - Order data:', order);
    console.log('🔍 OrderPlaced - Payment method:', paymentMethod);
    console.log('🔍 OrderPlaced - Delivery OTP:', deliveryOtp);
    console.log('🔍 OrderPlaced - Driver Info:', driverInfo);

    useEffect(() => {
        if (cart && cart.items && cart.items.length > 0) {
            setCart(null); // Clear cart in background
        }
    }, [cart, setCart]);

    // Fallbacks for static display if no order data
    const firstItem = order?.items?.[0];
    const product = firstItem?.product_id || {};
    // Handle product image with proper URL construction (same logic as cart)
    let productImage = shirt; // Default fallback
    
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
    
    // Additional fallback: if the image URL is null or invalid, use default
    if (!productImage || productImage === 'null' || productImage === 'undefined') {
      productImage = shirt;
    }
    const orderNumber = order?.order_number || 'OD-XXXX';
    const productName = product?.name || 'Product';
    
    // Use total_amount from order if available, otherwise calculate from items
    const totalOrderAmount = order?.total_amount || order?.items?.reduce((total, item) => {
        const itemPrice = item.price || item.product_id?.sale_price || item.product_id?.price || 0;
        const itemQuantity = item.quantity || 1;
        return total + (itemPrice * itemQuantity);
    }, 0) || 0;
    
    const discountedPrice = firstItem?.price || 0;
    const originalPrice = product?.price || discountedPrice;
    const status = order?.status || 'Process';

    return (
        <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center '>
           <ClothesHeader />
            <div className='border border-[#E1E1E1] py-4 w-full flex justify-center'>
                <img src={step4} alt="" className='w-full max-w-md mt-20 px-6' />
            </div>
            {/* Centering the image and text */}
            {/* Back Arrow */}
            <div className="w-full px-4 mt-4">
                {/* <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Go back"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button> */}
            </div>
            
            <div className="flex flex-col justify-center items-center mt-2">
                <img src={right} alt="" className='' />
                <div className='text-lg font-bold mt-0 text-center'>
                    Your order has been placed!
                </div>
            </div>
            <div className='px-4'>
                <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 flex row gap-4 p-4'>
                    <div className='w-[120px] h-[140px]'>
                        <img 
                            src={productImage} 
                            alt="product" 
                            className='w-full h-full p-4 object-contain' 
                            onError={(e) => {
                                e.target.src = shirt;
                            }}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center  w-full">
                        <p className="text-[#5C3FFF] font-medium text-base">{orderNumber}</p>
                        {/* <p className="font-medium text-base text-[#5C3FFF]">Invoice</p> */}
                        </div>
                        <div className='font-semibold text-base text-[#242424] pt-2'>{productName}</div>
                        <p className="font-medium text-sm text-[#242424] mb-2">₹ {totalOrderAmount.toLocaleString('en-IN')}</p>
                        <div className="text-[#18A20C] font-medium font-base">
                            {status}
                        </div>
                    </div>
                </div>
                
                {/* Driver Information Display - Show when driver is assigned */}
                {driverInfo && driverInfo.driver_name && (
                    <div className='bg-blue-50 border-2 border-blue-200 rounded-[20px] mt-4 p-4'>
                        <div className="text-center">
                            <div className="text-2xl mb-2">🚚</div>
                            <div className="text-lg font-bold text-blue-800 mb-3">
                                Your Delivery Driver
                            </div>
                            <div className="bg-white rounded-lg p-3 mb-3">
                                <div className="text-lg font-semibold text-gray-800 mb-1">
                                    {driverInfo.driver_name}
                                </div>
                                <div className="text-sm text-gray-600 mb-1">
                                    📞 {driverInfo.driver_phone}
                                </div>
                                <div className="text-sm text-gray-600">
                                    🚗 {driverInfo.vehicle_type} - {driverInfo.vehicle_number}
                                </div>
                            </div>
                            <div className="text-sm text-blue-700">
                                Your driver will contact you when they're on the way
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery OTP Display - Show for ALL orders */}
                {deliveryOtp && (
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
                                        {deliveryOtp}
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
                {order?._id && (
                    <button 
                        onClick={() => navigate(`/order/${order._id}/track`)}
                        className="mt-4 w-full bg-[#5C3FFF] text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-[#4A31E6] transition-colors"
                    >
                        🚚 Track Your Order
                    </button>
                )}
                
                <div 
                onClick={() => navigate('/home-clothes/order-list')}   
                className="mt-2 text-base font-medium text-[#5C3FFF] underline text-center">
                    Check your order list
                </div>
            </div>
        </div>
    )
}

export default OrderPlaced;
