import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FooterFood from '../ComponentsF/FooterFood';
import { foodOrderService } from '../../services/foodDeliveryService';
import { useFoodCart } from '../../Utility/FoodCartContext';
import { useNotifications } from '../../Utility/NotificationContext';
import paymentService from '../../services/paymentService';
import API_CONFIG from '../../config/api.config.js';
// import location from "../Images/HomeScreen/location.svg";

// Import payment method icons
import step3 from "../../Clothes/Images/step3.svg";
import phonepay from "../../Clothes/Images/phonepay.svg";
import paytm from "../../Clothes/Images/paytm.svg";
import amazon from "../../Clothes/Images/amazonpay.svg";
import restricted from "../../Clothes/Images/mobikrestricted.svg";
import credit from "../../Clothes/Images/creditdebit.svg";
import hdfc from "../../Clothes/Images/hdfc.svg";
import icici from "../../Clothes/Images/icici.svg";
import sbi from "../../Clothes/Images/sbi.svg";
import axis from "../../Clothes/Images/axis.svg";
import kotak from "../../Clothes/Images/kotak.svg";
import cod from "../../Clothes/Images/COD.svg";

// EcommerceGroceryHeader Component
function EcommerceGroceryHeader() {
    const navigate = useNavigate();
    const [locationData, setLocationData] = useState({
        shortAddress: "",
        fullAddress: "",
        isLoading: false,
        error: null
    });
    const [showTooltip, setShowTooltip] = useState(false);

    // Load saved location on mount
    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const parsedLocation = JSON.parse(savedLocation);
                setLocationData(parsedLocation);
            } catch (error) {
                console.error('Error parsing saved location:', error);
                localStorage.removeItem('userLocation');
            }
        }
    }, []);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            const errorData = {
                shortAddress: "",
                fullAddress: "",
                isLoading: false,
                error: "Geolocation is not supported by this browser."
            };
            setLocationData(errorData);
            localStorage.setItem('userLocation', JSON.stringify(errorData));
            return;
        }

        const loadingData = {
            shortAddress: "Getting location...",
            fullAddress: "Getting location...",
            isLoading: true,
            error: null
        };
        setLocationData(loadingData);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Try backend proxy first
                    try {
                        const proxyUrl = API_CONFIG.getUrl(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                        const resp = await fetch(proxyUrl);
                        if (resp.ok) {
                            const json = await resp.json();
                            if (json?.success && json?.data) {
                                const d = json.data;
                                const shortAddress = d.area || d.city || 'Location found';
                                const fullAddress = d.fullAddress || `${d.area ? d.area + ', ' : ''}${d.city || ''}${d.state ? ', ' + d.state : ''}${d.pincode ? ' ' + d.pincode : ''}`.trim();
                                const successData = { shortAddress, fullAddress, isLoading: false, error: null };
                                setLocationData(successData);
                                localStorage.setItem('userLocation', JSON.stringify(successData));
                                console.log('✅ Ecommerce Header: Proxy geocoding successful:', successData);
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ Ecommerce Header: Proxy geocoding failed, falling back:', e.message);
                    }

                    // Fallback: use coordinates
                    const fallbackAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    const successData = {
                        shortAddress: fallbackAddress,
                        fullAddress: fallbackAddress,
                        isLoading: false,
                        error: null
                    };
                    setLocationData(successData);
                    localStorage.setItem('userLocation', JSON.stringify(successData));
                    console.log('📍 Ecommerce Header: Using coordinate fallback:', fallbackAddress);
                    
                } catch (error) {
                    console.warn('❌ Ecommerce Header: Geocoding failed:', error.message);
                    const { latitude, longitude } = position.coords;
                    const fallbackAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    const errorData = {
                        shortAddress: fallbackAddress,
                        fullAddress: fallbackAddress,
                        isLoading: false,
                        error: "Location details unavailable"
                    };
                    setLocationData(errorData);
                    localStorage.setItem('userLocation', JSON.stringify(errorData));
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = "Failed to get your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                    default:
                        errorMessage = "An unknown error occurred.";
                        break;
                }
                const errorData = {
                    shortAddress: "",
                    fullAddress: "",
                    isLoading: false,
                    error: errorMessage
                };
                setLocationData(errorData);
                localStorage.setItem('userLocation', JSON.stringify(errorData));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    };

    const handleTooltip = (show) => {
        setShowTooltip(show);
    };

    return (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex justify-between items-center pt-8 px-4 pb-2 z-50">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 border border-gray-200"
                    title="Go back"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-base font-extrabold tracking-wide text-[var(--city-bell-color)]">City Bell</h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end min-w-0 relative max-w-[60vw] justify-end">
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">Current Location</span>
                    <div className="flex items-center gap-1 min-w-0">
                        <span
                            className="text-sm font-semibold text-black truncate max-w-[180px] cursor-pointer"
                            onMouseEnter={() => handleTooltip(true)}
                            onMouseLeave={() => handleTooltip(false)}
                            onTouchStart={() => handleTooltip(!showTooltip)}
                        >
                            {locationData.isLoading ? "Getting location..." : locationData.shortAddress}
                        </span>
                        <img 
                            // src={location} 
                            alt="Location" 
                            className="w-6 h-6 cursor-pointer ml-1 flex-shrink-0"
                            onClick={getCurrentLocation}
                            title="Click to get current location"
                        />
                        {/* Tooltip for full address */}
                        {showTooltip && !locationData.isLoading && !locationData.error && (
                            <div className="absolute right-0 top-10 bg-black text-white text-xs rounded px-2 py-1 z-50 max-w-xs whitespace-normal shadow-lg">
                                {locationData.fullAddress}
                            </div>
                        )}
                    </div>
                    {locationData.error && (
                        <div className="text-xs text-red-500 mt-1 absolute left-1/2 -translate-x-1/2 top-full w-full text-center">{locationData.error}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// PaymentFood Component
function PaymentFood() {
    const location = useLocation();
    const navigate = useNavigate();
    const { foodCart, loading, refreshFoodCart, clearFoodCart } = useFoodCart();
    const { addOrderSuccessNotification, addPaymentSuccessNotification } = useNotifications();
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPlaceOrderView, setShowPlaceOrderView] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    
    // Helper function for API headers
    const getHeaders = () => {
        const token = localStorage.getItem('token') || 'demo-token';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };
    
    // Get cart data from FoodCartContext
    const cartData = foodCart || { items: [], total_amount: 0, restaurant: null };
    
    // Format cart data for payment component
    const cartItems = cartData?.items || [];
    const subtotal = cartData?.total_amount || 0;
    const deliveryFee = 0; // Free delivery for now
    const total = subtotal + deliveryFee;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get restaurant info from cart data
    const restaurant = cartData?.restaurant || cartItems[0]?.restaurant_id || null;

    // Memoize payment methods to prevent unnecessary re-renders
    const paymentMethods = useMemo(() => [
        {
            id: 'wallet',
            name: 'Wallet',
            options: [
                { id: 'phonepay', name: 'PhonePe', icon: phonepay, available: true },
                { id: 'paytm', name: 'Paytm', icon: paytm, available: true },
                { id: 'amazon', name: 'Amazon Pay', icon: amazon, available: true }
            ]
        },
        {
            id: 'cards',
            name: 'Cards',
            options: [
                { id: 'credit', name: 'Credit/Debit Card', icon: credit, available: true }
            ]
        },
        {
            id: 'netbanking',
            name: 'Net Banking',
            options: [
                { id: 'hdfc', name: 'HDFC Bank', icon: hdfc, available: true },
                { id: 'icici', name: 'ICICI Bank', icon: icici, available: true },
                { id: 'sbi', name: 'SBI Bank', icon: sbi, available: true },
                { id: 'axis', name: 'AXIS Bank', icon: axis, available: true },
                { id: 'kotak', name: 'Kotak Bank', icon: kotak, available: true }
            ]
        },
        {
            id: 'cod',
            name: 'Pay on Delivery',
            options: [
                { id: 'cash', name: 'Cash on Delivery', icon: cod, available: true }
            ]
        }
    ], []);

    // Validate order data
    const validateOrderData = (orderData) => {
        const errors = [];
        if (!orderData.restaurant_id || orderData.restaurant_id === 'default_restaurant') {
            errors.push('Invalid restaurant selection');
        }
        if (!orderData.items?.length) {
            errors.push('Cart is empty');
        }
        if (!orderData.delivery_address?.address_line1) {
            errors.push('Delivery address is incomplete');
        }
        return errors;
    };

    // Sanitize address data from localStorage
    const getSanitizedAddress = () => {
        const savedAddress = localStorage.getItem('delivery_address');
        try {
            const addressData = JSON.parse(savedAddress);
            return {
                address_line1: addressData.address_line1?.substring(0, 200) || 'Default Address',
                address_line2: addressData.address_line2?.substring(0, 200) || '',
                city: addressData.city?.substring(0, 100) || 'Chennai',
                state: addressData.state?.substring(0, 100) || 'Tamil Nadu',
                country: addressData.country?.substring(0, 100) || 'India',
                pincode: addressData.pincode?.substring(0, 20) || '600000',
                phone: addressData.phone?.substring(0, 20) || '+91 9876543210',
                fullName: addressData.fullName?.substring(0, 100) || 'Customer'
            };
        } catch (error) {
            console.error('Invalid address data in localStorage');
            return null;
        }
    };

    // Handle payment selection
    const handlePaymentSelection = (paymentId) => {
        console.log('🎯 Payment option selected:', paymentId);
        setSelectedPayment(paymentId);
        setShowPlaceOrderView(true);
        setErrorMessage(null);
    };

    // Process payment
    const processPayment = async () => {
        if (!selectedPayment) {
            setErrorMessage('Please select a payment method');
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            console.log('🔄 Processing food order payment...');
            const cartData = foodCart;
            console.log('🛒 Cart data:', cartData);
            
            if (!cartData || !cartData.items || cartData.items.length === 0) {
                setErrorMessage('Cart is empty');
                return;
            }

            const paymentMethod = getPaymentMethod(selectedPayment);
            console.log('🔍 Selected payment ID:', selectedPayment);
            console.log('🔍 Mapped payment method:', paymentMethod);
            
            const addressData = getSanitizedAddress();
            if (!addressData) {
                setErrorMessage('No delivery address found. Please add a delivery address.');
                    navigate('/home-food/add-address');
                    return;
                }

                let restaurantData = null;
                let pickupAddress = null;
                
                try {
                    const restaurantId = cartData.restaurant_id || cartData.restaurant?._id || cartItems[0]?.restaurant_id;
                    if (restaurantId && restaurantId !== 'default_restaurant') {
                        console.log('🏪 Fetching restaurant data for pickup address:', restaurantId);
                        const restaurantResponse = await fetch(API_CONFIG.getUrl(`/api/restaurants/${restaurantId}`), {
                            headers: getHeaders()
                        });
                        if (restaurantResponse.ok) {
                            const restaurantResult = await restaurantResponse.json();
                            if (restaurantResult.success && restaurantResult.data) {
                                restaurantData = restaurantResult.data;
                                pickupAddress = restaurantData.address;
                                console.log('✅ Restaurant pickup address fetched:', pickupAddress);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to fetch restaurant data, using fallback:', error);
                }

                const orderData = {
                    restaurant_id: cartData.restaurant_id || cartData.restaurant?._id || cartItems[0]?.restaurant_id || 'default_restaurant',
                    restaurant_name: restaurantData?.name || 'Restaurant',
                pickup_address: pickupAddress || 'Chennai, Tamil Nadu, India',
                    items: cartData.items.map(item => ({
                        dish_id: item.dish_id?._id || item.dish_id || item._id,
                        quantity: item.quantity || 1,
                        price: item.dish_id?.price || item.price || 0,
                        special_instructions: item.special_instructions || ''
                    })),
                    subtotal: cartData.subtotal || 0,
                    delivery_fee: cartData.delivery_fee || 0,
                    total_amount: cartData.total_amount || 0,
                payment_method: paymentMethod,
                delivery_address: addressData,
                    delivery_instructions: 'Please deliver at the main gate',
                    special_instructions: 'Handle with care'
                };

            const validationErrors = validateOrderData(orderData);
            if (validationErrors.length > 0) {
                setErrorMessage(validationErrors.join(', '));
                return;
            }

            if (paymentMethod === 'cod') {
                console.log('💵 Processing COD payment...');
                const response = await foodOrderService.createFoodOrder(orderData);
                
                if (response.success) {
                    console.log('✅ COD order created successfully:', response.data);
                    
                    // Add order success notification
                    addOrderSuccessNotification({
                        orderId: response.data.order_number || response.data._id,
                        totalAmount: `₹${response.data.total_amount}`,
                        restaurantName: response.data.restaurant?.name || 'Restaurant',
                        estimatedDelivery: '30-40 min'
                    });
                    
                    await clearFoodCart();
                    setOrderPlaced(true);
                    navigate('/order/success', {
                        state: {
                            orderNumber: response.data.order_number || response.data._id,
                            orderId: response.data._id,
                            totalAmount: response.data.total_amount,
                            itemCount: response.data.items?.length || 0,
                            estimatedDelivery: '30-40 min',
                            deliveryAddress: `${addressData.address_line1}, ${addressData.city}`,
                            customerName: addressData.fullName,
                            customerContact: addressData.phone,
                            orderDate: new Date().toLocaleString(),
                            paymentStatus: 'Pending (COD)',
                            restaurantContact: restaurant?.contact || '+91 9123456789',
                            deliveryOtp: response.data.delivery_otp // Pass OTP from backend response
                        } 
                    });
                } else {
                    throw new Error(response.message || 'Order creation failed');
                }
            } else {
                console.log('💳 Processing online payment via Razorpay...');
                const paymentData = {
                    amount: cartData.total_amount || 0,
                    currency: 'INR',
                    order_model: 'FoodOrder',
                    email: 'test@example.com', // TODO: Get from user profile
                    contact: addressData.phone,
                    order_data: orderData
                };
                
                const result = await paymentService.processPayment(paymentData, {
                    onSuccess: async (successData) => {
                        console.log('✅ Payment successful! Clearing cart and navigating...');
                        
                        // Add order success notification
                        addOrderSuccessNotification({
                            orderId: successData.dbOrder.order_number,
                            totalAmount: `₹${successData.dbOrder.total_amount}`,
                            restaurantName: successData.dbOrder.restaurant?.name || 'Restaurant',
                            estimatedDelivery: '30-40 min'
                        });
                        
                        // Add payment success notification
                        addPaymentSuccessNotification({
                            orderId: successData.dbOrder.order_number,
                            amount: `₹${successData.dbOrder.total_amount}`,
                            paymentMethod: 'Online Payment'
                        });
                        
                        await clearFoodCart();
                        setOrderPlaced(true);
                        navigate('/order/success', {
                            state: {
                                orderNumber: successData.dbOrder.order_number,
                                orderId: successData.dbOrder._id,
                                totalAmount: successData.dbOrder.total_amount,
                                itemCount: successData.dbOrder.items?.length || 0,
                                estimatedDelivery: '30-40 min',
                                deliveryAddress: `${addressData.address_line1}, ${addressData.city}`,
                                customerName: addressData.fullName,
                                customerContact: addressData.phone,
                                orderDate: new Date().toLocaleString(),
                                paymentStatus: 'Paid',
                                restaurantContact: restaurant?.contact || '+91 9123456789',
                                deliveryOtp: successData.dbOrder.delivery_otp // Pass OTP from backend response
                            } 
                        });
                    },
                    onError: (error) => {
                        console.error('❌ Payment failed:', error);
                        setErrorMessage('Payment failed. Please try again.');
                    },
                    onCancel: () => {
                        console.log('❌ Payment cancelled by user');
                        setErrorMessage('Payment was cancelled.');
                    }
                });
                
                if (!result.success) {
                    throw new Error(result.message || 'Online payment failed');
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
            setErrorMessage(errorMessage);
            console.error('Payment error:', errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    // Map payment method to backend enum
    const getPaymentMethod = (paymentId) => {
        switch (paymentId) {
            case 'cash':
                return 'cod';
            case 'phonepay':
            case 'paytm':
            case 'amazon':
            case 'credit':
            case 'hdfc':
            case 'icici':
            case 'sbi':
            case 'axis':
            case 'kotak':
                return 'razorpay';
            default:
                return 'cod';
        }
    };

    // PaymentOption component with memoization
    const PaymentOption = React.memo(({ option }) => (
        <div 
            className={`flex justify-between items-center w-full py-4 px-4 rounded-lg transition-colors
                ${option.available ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
            `}
            onClick={() => option.available && handlePaymentSelection(option.id)}
        >
            <div className="flex items-center gap-4">
                <img src={option.icon} alt={option.name} className="h-6 w-6 object-contain" />
                <span className="text-gray-800 font-medium">{option.name}</span>
            </div>
            {option.available ? (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selectedPayment === option.id ? 
                        'border-green-500 bg-green-500' : 
                        'border-gray-300'}
                `}>
                    {selectedPayment === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                </div>
            ) : (
                <img src={restricted} alt="Not available" className="h-4" />
            )}
        </div>
    ));

    // PaymentSection component
    const PaymentSection = ({ method }) => (
        <div className='bg-white rounded-xl shadow-sm overflow-hidden mb-4'>
            <div className='px-5 py-4 border-b border-gray-100'>
                <h3 className='font-semibold text-gray-800'>{method.name}</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {method.options.map(option => (
                    <PaymentOption key={option.id} option={option} />
                ))}
            </div>
        </div>
    );

    // Get payment method name
    const getPaymentMethodName = () => {
        for (const method of paymentMethods) {
            const option = method.options.find(opt => opt.id === selectedPayment);
            if (option) return option.name;
        }
        return '';
    };

    // Loading state
    if (loading) {
        return (
            <div className='bg-gray-50 min-h-screen pb-20'>
                <EcommerceGroceryHeader />
                <div className="pt-20 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading payment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty cart state
    if (!cartData || cartData.items.length === 0) {
        return (
            <div className='bg-gray-50 min-h-screen pb-20'>
                <EcommerceGroceryHeader />
                <div className="pt-20 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">No items in cart</p>
                        <button 
                            onClick={() => navigate('/home-food/cart')}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                        >
                            Go to Cart
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-gray-50 min-h-screen pb-20'>
            <EcommerceGroceryHeader />
            
            {/* Progress indicator - Adjusted for header height */}
            <div className='bg-white shadow-sm py-4 sticky top-16 z-40 mt-16'>
                {/* <div className='max-w-md mx-auto px-6'>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-full"></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">Step 3 of 3: Payment</p>
                </div> */}
            </div>
            
            <div className='px-5 max-w-md mx-auto pt-4'>
                {/* Error message display */}
                {errorMessage && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                        {errorMessage}
                    </div>
                )}

                {/* Order summary */}
                <div className="bg-white flex justify-between items-center w-full rounded-xl shadow-sm px-6 py-4 my-4">
                    <div>
                        <p className='font-medium text-gray-700'>Order Total</p>
                        <p className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-green-600">₹{total.toLocaleString()}</p>
                        {deliveryFee === 0 ? (
                            <p className="text-xs text-green-500">Free delivery</p>
                        ) : (
                            <p className="text-xs text-gray-500">Includes ₹{deliveryFee} delivery fee</p>
                        )}
                    </div>
                </div>
                
                {!showPlaceOrderView ? (
                    <>
                        <h2 className='text-xl font-bold text-gray-800 mb-4'>Select Payment Method</h2>
                        {paymentMethods.map(method => (
                            <PaymentSection key={method.id} method={method} />
                        ))}
                    </>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Payment Method</h2>
                            <button 
                                onClick={() => setShowPlaceOrderView(false)}
                                className="text-green-600 hover:text-green-800"
                            >
                                Change
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                            <img 
                                src={paymentMethods.flatMap(m => m.options).find(o => o.id === selectedPayment)?.icon} 
                                alt="Payment method" 
                                className="h-8 w-8 object-contain" 
                            />
                            <div>
                                <p className="font-medium text-gray-800">{getPaymentMethodName()}</p>
                                <p className="text-sm text-gray-500">Selected payment method</p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">Order Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span className="font-medium">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                                    <span className="font-medium">Total</span>
                                    <span className="font-bold text-green-600">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Place Order button */}
                <div className="mt-6 mb-20">
                    <button
                        onClick={() => {
                            processPayment();
                        }}
                        disabled={isProcessing || !selectedPayment}
                        className={`w-full py-4 text-white rounded-xl font-semibold transition-colors
                            ${isProcessing || !selectedPayment ? 
                                'bg-gray-400 cursor-not-allowed' : 
                                'bg-green-600 hover:bg-green-700'}
                        `}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : !selectedPayment ? (
                            'Please select a payment method'
                        ) : (
                            `Place Order - ₹${total.toLocaleString()}`
                        )}
                    </button>
                </div>
            </div>

            <FooterFood />
        </div>
    );
}

export default PaymentFood;