import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../SubPages/Header';
import step4 from "../../Clothes/Images/step4.svg";
import right from "../../Clothes/Images/successful.gif";
import shirt from "../Images/shirt.svg";
import { getOtpCode, hasOtp } from '../../utils/otpUtils';

function Invoice() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndPrepareData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get user ID for consistent order fetching
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userEmail = userData.email || localStorage.getItem('userEmail');
                const userPhone = userData.phone || localStorage.getItem('userPhone');
                
                // Generate a consistent user ID based on email/phone for demo purposes
                const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                              userPhone ? `user_${userPhone}` : 
                              'default_user';
                
                console.log('🔍 Invoice: Generated user ID for order fetch:', userId);
                
                const response = await fetch(API_CONFIG.getUrl(`/api/gorders/${orderId}`), {
                    headers: {
                        'Authorization': 'Bearer demo-token',
                        'Content-Type': 'application/json',
                        'x-user-id': userId
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch order details: ${response.statusText}`);
                }

                const result = await response.json();
                const order = result.data;

                if (!order || !order.items || !Array.isArray(order.items)) {
                    throw new Error('Invalid order data or no items found.');
                }

                const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                const storedAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
                const defaultAddress = Array.isArray(storedAddresses) && storedAddresses.length > 0
                    ? storedAddresses[0]
                    : null;

                setOrderData({
                    order,
                    profile: storedProfile,
                    address: defaultAddress
                });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchAndPrepareData();
        } else {
            setError('Invalid order ID.');
            setLoading(false);
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
                <Header />
                <div className="flex flex-col justify-center items-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C3FFF] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Invoice...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
                <Header />
                <div className="flex flex-col justify-center items-center min-h-[60vh]">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <button
                        onClick={() => navigate('/home-grocery/order-list')}
                        className="bg-[#5C3FFF] text-white px-6 py-2 rounded-lg hover:bg-[#4a32cc] transition-colors"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    if (!orderData || !orderData.order || !orderData.order.items) {
        return (
            <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
                <Header />
                <div className="flex flex-col justify-center items-center min-h-[60vh]">
                    <p className="text-gray-600 mb-4">No order data available.</p>
                    <button
                        onClick={() => navigate('/home-grocery/order-list')}
                        className="bg-[#5C3FFF] text-white px-6 py-2 rounded-lg hover:bg-[#4a32cc] transition-colors"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const { order, profile, address } = orderData;
    const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0), 0);
    const orderNumber = order.order_number || 'GORD-XXXX';
    const status = order.status || 'pending';

    // Helper for full address including pin code
    const getFullAddress = (address) => (
        [
            address.houseNo,
            address.apartment,
            address.street,
            address.area,
            address.landmark,
            address.city,
            address.state,
            address.country,
            address.zip,       // legacy field if needed
            address.pincode,   // most common pin code field
            address.pinCode,   // support alternative pin code field
            address.phone
        ].filter(Boolean).join(', ')
    );

    return (
        <div className='bg-[#F8F8F8] min-h-screen flex flex-col items-center'>
            <Header />
            <div className='border border-[#E1E1E1] py-4 w-full flex justify-center'>
                <img src={step4} alt="Order Progress" className='w-full max-w-md mt-20 px-6' />
            </div>
            <div className="flex flex-col justify-center items-center mt-2">
                <img src={right} alt="Success" />
                <div className='text-lg font-bold mt-0 text-center'>
                    Your order has been placed!
                </div>
            </div>
            <div className='px-4'>
                <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4'>
                    <div className="flex justify-between items-center w-full mb-4">
                        <p className="text-[#5C3FFF] font-medium text-base">{orderNumber}</p>
                        {/* <p className="font-medium text-base text-[#5C3FFF]">Invoice</p> */}
                    </div>
                    {order.items.map((item, index) => {
                        const product = item.product || {};
                        const productImage = product.image
                            ? product.image.startsWith('http')
                                ? product.image
                                : product.image.startsWith('data:image/')
                                    ? product.image
                                    : product.image.startsWith('/uploads/')
                                        ? API_CONFIG.getUrl(product.image)
                                        : API_CONFIG.getUploadUrl(product.image)
                            : shirt;
                        const productName = product.name || 'Unknown Product';
                        const price = item.price || 0;
                        return (
                            <div key={index} className='flex gap-4 mb-4'>
                                <div className='w-[120px] h-[140px]'>
                                    <img
                                        src={productImage}
                                        alt="product"
                                        className='w-full h-full p-4 object-contain'
                                        onError={(e) => { e.target.src = shirt; }}
                                    />
                                </div>
                                <div>
                                    <div className='font-semibold text-base text-[#242424]'>{productName}</div>
                                    <p className="font-medium text-sm text-[#242424] mb-2">₹ {price}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div className="text-[#18A20C] font-medium font-base">
                        Status: {status}
                    </div>
                    <div className="font-semibold text-base text-[#242424] mt-2">
                        Total: ₹ {totalPrice}
                    </div>
                </div>

                {hasOtp(order) && (
                    <div className='bg-yellow-50 border-2 border-yellow-200 rounded-[20px] mt-4 p-4'>
                        <div className="text-center">
                            <div className="text-2xl mb-2">🔐</div>
                            <div className="text-lg font-bold text-yellow-800 mb-2">
                                Delivery OTP
                            </div>
                            <div className="text-3xl font-mono font-bold text-yellow-900 mb-2 tracking-widest">
                                {getOtpCode(order)}
                            </div>
                            <div className="text-sm text-yellow-700">
                                Share this OTP with the delivery person
                            </div>
                        </div>
                    </div>
                )}

                {profile?.name && (
                    <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4'>
                        <h3 className="font-semibold text-base text-[#242424]">Customer Details</h3>
                        <p className="text-sm text-[#242424]">Name: {profile.name}</p>
                        {profile.email && <p className="text-sm text-[#242424]">Email: {profile.email}</p>}
                    </div>
                )}
                {address && (
                    <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-4 p-4'>
                        <h3 className="font-semibold text-base text-[#242424]">Shipping Address</h3>
                        <p className="text-sm text-[#242424]">{getFullAddress(address)}</p>
                    </div>
                )}
                <div className="mt-4 space-y-3">
                    <button
                        onClick={() => navigate(`/home-grocery/order-tracking/${orderId}`)}
                        className="w-full bg-[#5C3FFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#4A2FE8] transition-colors"
                    >
                        🗺️ Track Your Order
                    </button>
                    <button
                        onClick={() => navigate('/home-grocery/order-list')}
                        className="w-full text-base font-medium text-[#5C3FFF] underline py-2"
                    >
                        Check your order list
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Invoice;
