import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../SubPages/Header";
import step3 from "../Images/step3.svg";
import cod from "../Images/COD.svg";
import credit from "../Images/creditdebit.svg";
import API_CONFIG from '../../config/api.config';
import PaymentButton from '../../Components/PaymentButton';
import { useNotifications } from '../../Utility/NotificationContext';

function PaymentEnhanced() {
    const navigate = useNavigate();
    const { addOrderSuccessNotification, addPaymentSuccessNotification } = useNotifications();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [warehouseId, setWarehouseId] = useState(null);
    const [offers, setOffers] = useState([]);
    const [appliedOffer, setAppliedOffer] = useState(null);
    const [discount, setDiscount] = useState(0);

    // Fetch cart items, warehouse, and offers on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch cart items
                // Get user ID for consistent cart fetching
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userEmail = userData.email || localStorage.getItem('userEmail');
                const userPhone = userData.phone || localStorage.getItem('userPhone');
                
                // Generate a consistent user ID based on email/phone for demo purposes
                const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                              userPhone ? `user_${userPhone}` : 
                              'default_user';
                
                console.log('🔍 PaymentEnhanced: Generated user ID for cart fetch:', userId);
                
                const cartResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_CART), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-token',
                        'x-user-id': userId
                    }
                });
                if (cartResponse.ok) {
                    const responseData = await cartResponse.json();
                    setCartItems(responseData.data || []);
                } else {
                    setCartItems([]);
                }

                // Fetch warehouse ID
                const warehouseResponse = await fetch(API_CONFIG.getUrl('/api/warehouses'), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-token'
                    }
                });
                if (warehouseResponse.ok) {
                    const warehouseData = await warehouseResponse.json();
                    if (warehouseData.success && warehouseData.data && warehouseData.data.length > 0) {
                        const defaultWarehouse = warehouseData.data.find(w => w.isDefault) || warehouseData.data[0];
                        setWarehouseId(defaultWarehouse._id);
                        console.log('✅ Default warehouse ID fetched:', defaultWarehouse._id);
                    }
                }

                // Fetch offers (optional - endpoint may not exist)
                try {
                    const offersResponse = await fetch(API_CONFIG.getUrl('/api/offers'), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer demo-token'
                        }
                    });
                    if (offersResponse.ok) {
                        const offersData = await offersResponse.json();
                        setOffers(offersData.data || []);
                        console.log('✅ Offers fetched:', offersData.data);
                    } else {
                        console.log('ℹ️ Offers endpoint not available, continuing without offers');
                        setOffers([]);
                    }
                } catch (offersError) {
                    console.log('ℹ️ Offers fetch failed, continuing without offers:', offersError.message);
                    setOffers([]);
                }
            } catch (err) {
                console.warn('⚠️ Failed to fetch data:', err);
                setCartItems([]);
                setOffers([]);
            }
            setLoading(false);
        };
        fetchData();

        // Load saved delivery address
        const savedAddress = localStorage.getItem('delivery_address');
        if (savedAddress) {
            try {
                const addressData = JSON.parse(savedAddress);
                // Format address more readably
                const addressParts = [
                    addressData.address_line1,
                    addressData.landmark,
                    addressData.city,
                    addressData.state,
                    addressData.pincode
                ].filter(part => part && part.trim());
                
                const formattedAddress = addressParts.join(', ');
                setDeliveryAddress(formattedAddress);
                console.log('✅ Delivery address loaded from localStorage:', formattedAddress);
            } catch (error) {
                console.warn('⚠️ Failed to parse saved address, using raw value');
                setDeliveryAddress(savedAddress);
            }
        }
    }, []);

    // Debug selectedPayment state changes
    useEffect(() => {
        console.log('🔍 selectedPayment state changed:', selectedPayment);
        console.log('🔍 selectedPayment?.type:', selectedPayment?.type);
        console.log('🔍 selectedPayment?.id:', selectedPayment?.id);
    }, [selectedPayment]);

    // Apply offer when cart or offers change
    useEffect(() => {
        if (cartItems.length === 0 || offers.length === 0) {
            setAppliedOffer(null);
            setDiscount(0);
            return;
        }

        // Calculate subtotal for offer eligibility
        const subtotal = cartItems.reduce((sum, item) => {
            const itemPrice = item.discountedPrice || item.originalPrice || item.price || 0;
            return sum + item.quantity * itemPrice;
        }, 0);

        // Find applicable offer
        const validOffer = offers.find(offer => {
            return subtotal >= (offer.minimum_order_value || 0);
        });

        if (validOffer) {
            let discountAmount = 0;
            if (validOffer.discount_type === 'percentage') {
                discountAmount = (subtotal * validOffer.discount_value) / 100;
            } else if (validOffer.discount_type === 'fixed') {
                discountAmount = validOffer.discount_value;
            }
            setAppliedOffer(validOffer);
            setDiscount(discountAmount);
            console.log('✅ Applied offer:', validOffer, 'Discount:', discountAmount);
        } else {
            setAppliedOffer(null);
            setDiscount(0);
            console.log('ℹ️ No applicable offers found');
        }
    }, [cartItems, offers]);

    // Payment methods
    const paymentMethods = [
        { 
            id: 'cod', 
            name: 'Cash on Delivery', 
            icon: cod, 
            type: 'cod',
            description: 'Pay when you receive your order'
        },
        { 
            id: 'razorpay', 
            name: 'Pay Online', 
            icon: credit, 
            type: 'razorpay',
            description: 'Credit/Debit Card, UPI, Net Banking'
        }
    ];

    // Calculate total
    const subtotal = cartItems.reduce((sum, item) => {
        const itemPrice = item.discountedPrice || item.originalPrice || item.price || 0;
        const itemTotal = item.quantity * itemPrice;
        console.log('🔍 Cart item calculation:', { 
            item: item.name || item._id, 
            quantity: item.quantity, 
            price: itemPrice, 
            itemTotal 
        });
        return sum + itemTotal;
    }, 0);
    const shipping = 0;
    const total = subtotal - discount + shipping;

    console.log('🔍 Total calculation:', { subtotal, discount, shipping, total });
    console.log('🔍 Cart items structure:', cartItems);

    // Place COD order
    const handleCODOrder = async () => {
        if (!deliveryAddress.trim()) {
            setError('Please enter a delivery address');
            return;
        }
        
        setIsProcessing(true);
        setError('');
        try {
            const addressData = {
                address_line1: deliveryAddress.trim(),
                city: 'Chennai',
                state: 'Tamil Nadu',
                country: 'India',
                pincode: '600089'
            };
            localStorage.setItem('delivery_address', JSON.stringify(addressData));
            
            const orderData = {
                order_type: 'grocery',
                warehouse_id: warehouseId,
                total_amount: total,
                delivery_address: addressData,
                payment_method: 'cod',
                items: cartItems.map(item => ({
                    grocery_id: item.grocery_id,
                    quantity: item.quantity,
                    price: (item.discountedPrice ?? item.originalPrice ?? item.grocery?.discounted_price ?? item.grocery?.original_price ?? 0)
                })),
                applied_offer: appliedOffer ? {
                    offer_id: appliedOffer.offer_id,
                    discount_amount: discount,
                    description: appliedOffer.description
                } : null
            };
            console.log('DEBUG COD orderData:', orderData);
            // Get user ID for consistent order creation
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userEmail = userData.email || localStorage.getItem('userEmail');
            const userPhone = userData.phone || localStorage.getItem('userPhone');
            
            // Generate a consistent user ID based on email/phone for demo purposes
            const userId = userEmail ? `user_${userEmail.replace('@', '_').replace('.', '_')}` : 
                          userPhone ? `user_${userPhone}` : 
                          'default_user';
            
            console.log('🔍 Grocery Payment: Generated user ID for order creation:', userId);

            const response = await fetch(API_CONFIG.getUrl('/api/gorders'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer demo-token',
                    'x-user-id': userId // Send user ID for consistent order creation
                },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to create order');
            
            // Add order success notification
            addOrderSuccessNotification({
                orderId: result.data.order_number || result.data._id || `GROCERY-${Date.now()}`,
                totalAmount: `₹${total}`,
                restaurantName: 'Grocery Store',
                estimatedDelivery: 'Same day delivery'
            });
            
            await clearCart();
            navigate(`/home-grocery/invoice/${result.data._id || result.data.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const clearCart = async () => {
        try {
            await fetch(API_CONFIG.getUrl('/api/gcart/clear'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer demo-token'
                }
            });
        } catch (err) {
            console.error('Error clearing cart:', err);
        }
    };

    // Payment success handler
    const handlePaymentSuccess = async (data) => {
        setError(null);
        try {
            console.log('🎉 Grocery payment successful, data:', data);
            
            const orderId = data.order?.order_number || data.order_id || `GROCERY-${Date.now()}`;
            
            // Add order success notification
            addOrderSuccessNotification({
                orderId: orderId,
                totalAmount: `₹${total}`,
                restaurantName: 'Grocery Store',
                estimatedDelivery: 'Same day delivery'
            });
            
            // Add payment success notification
            addPaymentSuccessNotification({
                orderId: orderId,
                amount: `₹${total}`,
                paymentMethod: selectedPayment?.name || 'Online Payment'
            });
            
            await clearCart();
            setTimeout(() => {
                navigate('/home-grocery/order', {
                    state: {
                        order: data.order || {
                            id: data.order_id || `GROCERY_${Date.now()}`,
                            total: total,
                            payment_method: selectedPayment?.name || 'Razorpay',
                            status: 'completed',
                            delivery_otp: data.order?.delivery_otp || data.delivery_otp || null,
                            items: cartItems.map(item => ({
                                product: {
                                    name: item.name || 'Grocery Item',
                                    image: item.image || '/placeholder-image.png'
                                },
                                name: item.name || 'Grocery Item',
                                image: item.image || '/placeholder-image.png',
                                price: item.discountedPrice || item.originalPrice || 0,
                                quantity: item.quantity || 1
                            }))
                        },
                        paymentMethod: selectedPayment?.name || 'Razorpay',
                        total: total,
                        paymentData: data.payment,
                        orderNumber: orderId,
                        items: cartItems.map(item => ({
                            product: {
                                name: item.name || 'Grocery Item',
                                image: item.image || '/placeholder-image.png'
                            },
                            name: item.name || 'Grocery Item',
                            image: item.image || '/placeholder-image.png',
                            price: item.discountedPrice || item.originalPrice || 0,
                            quantity: item.quantity || 1
                        }))
                    }
                });
            }, 2000);
        } catch (error) {
            console.error('❌ Error handling grocery payment success:', error);
            setError('Payment successful but error processing order details');
        }
    };

    // Payment error handler
    const handlePaymentError = (error) => {
        setError(error.message);
    };

    // Payment cancel handler
    const handlePaymentCancel = () => {
        setError('Payment was cancelled');
    };

    // Create Razorpay order data
    const createRazorpayOrderData = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token') || localStorage.getItem('demoToken');
        
        if (!token) {
            throw new Error('Please login to proceed with payment');
        }

        return {
            amount: total,
            total_amount: total,
            currency: 'INR',
            order_id: `GROCERY_${Date.now()}`,
            order_model: 'GroceryOrder',
            description: `Grocery order - ${cartItems.length} items`,
            email: user.email || 'customer@example.com',
            contact: user.phone || '+91 9876543210',
            customerName: user.name || 'Customer Name',
            payment_method: selectedPayment?.id || 'razorpay',
            payment_notes: `Payment via ${selectedPayment?.name || 'Razorpay'}`,
            items: cartItems.map(item => ({
                grocery_id: item.grocery_id || item._id,
                quantity: item.quantity,
                price: item.discountedPrice || item.originalPrice || item.price || 0
            })),
            shipping_address: deliveryAddress || 'Default Address',
            applied_offer: appliedOffer ? {
                offer_id: appliedOffer.offer_id,
                discount_amount: discount,
                description: appliedOffer.description
            } : null
        };
    };

    if (loading) return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <Header />
            <div className="pt-28 p-8 text-center">Loading cart...</div>
        </div>
    );
    
    if (cartItems.length === 0) return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <Header />
            <div className="pt-28 pb-8 text-center">Your cart is empty.</div>
        </div>
    );

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <Header />
            <div className='border border-[#E1E1E1] py-4 mt-28'>
                <img src={step3} alt="" className='w-full px-6' />
            </div>
            <div className='px-4 pb-16'>
                {/* ✅ UPDATED: Total Amount Section with Enhanced Discount Details */}
                <div className="bg-[#F1EDFF] rounded-lg px-4 py-4 mt-4 border border-[#E7E7E7]">
                    <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-base text-gray-700">Subtotal</p>
                            <p className="font-medium text-base">₹ {subtotal.toFixed(2)}</p>
                        </div>
                        {appliedOffer ? (
                            <div className="flex justify-between items-center bg-green-100 p-2 rounded-md">
                                <div>
                                    <p className="text-base font-medium text-green-700">Discount</p>
                                    <p className="text-sm text-green-600">{appliedOffer.description}</p>
                                </div>
                                <p className="font-medium text-base text-green-700">- ₹ {discount.toFixed(2)}</p>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-base text-gray-700">Discount</p>
                                <p className="text-sm text-gray-500">
                                    {offers.length > 0 ? 'No eligible offers' : 'No offers available'}
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <p className="text-base text-gray-700">Shipping</p>
                            <p className="font-medium text-base">₹ {shipping.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold text-lg">Total Amount</p>
                            <p className="font-semibold text-lg">₹ {total.toFixed(2)}</p>
                        </div>
                    </div>
                    {appliedOffer && (
                        <div className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                            <p>🎉 Offer Applied: {appliedOffer.description}</p>
                        </div>
                    )}
                    {!appliedOffer && offers.length > 0 && (
                        <div className="mt-3 text-sm text-gray-600 bg-gray-100 p-2 rounded-md">
                            <p>ℹ️ No offers applied. Minimum order value not met.</p>
                        </div>
                    )}
                </div>

                <div className="text-[#242424] text-base font-medium mt-4">Payment Type</div>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                
                {/* Delivery Address Input */}
                <div className="bg-white border rounded-lg p-4 mb-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">Delivery Address</h3>
                        <button
                            onClick={() => navigate('/home-grocery/address')}
                            className="text-blue-600 text-sm hover:text-blue-800 underline"
                        >
                            {deliveryAddress ? 'Edit Address' : 'Add New Address'}
                        </button>
                    </div>
                    {deliveryAddress ? (
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                            <p className="text-gray-800 font-medium">{deliveryAddress}</p>
                            <p className="text-sm text-gray-600 mt-1">✅ Address loaded from your saved details</p>
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Enter delivery address (e.g., Apartment, Building, Street)"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                error && !deliveryAddress.trim() ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                    )}
                    {error && !deliveryAddress.trim() && (
                        <p className="text-red-500 text-sm mt-1">Delivery address is required</p>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Select Payment Method</h3>
                    {paymentMethods.map((method) => (
                        <div key={method.id}
                            className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${selectedPayment?.id === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => {
                                console.log('🔍 Payment method clicked:', method);
                                setSelectedPayment(method);
                            }}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <img src={method.icon} alt={method.name} className="w-8 h-8" />
                                    <div>
                                        <span className="font-medium">{method.name}</span>
                                        <p className="text-xs text-gray-500">{method.description}</p>
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    checked={selectedPayment?.id === method.id}
                                    onChange={() => {
                                        console.log('🔍 Payment method radio changed:', method);
                                        setSelectedPayment(method);
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Payment Buttons */}
                <div className="mt-6 space-y-4">
                    {selectedPayment?.type === 'cod' && (
                        <button
                            onClick={handleCODOrder}
                            disabled={isProcessing || cartItems.length === 0}
                            className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition-colors
                                ${isProcessing || cartItems.length === 0 ? 
                                    'bg-gray-400 cursor-not-allowed' : 
                                    'bg-[#5C3FFF] hover:bg-[#4a32cc]'}
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
                            ) : (
                                `Place Order (COD) - ₹${total.toFixed(2)}`
                            )}
                        </button>
                    )}
                    {selectedPayment?.type === 'razorpay' && (
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
                    )}
                    {!selectedPayment && (
                        <button
                            disabled
                            className="w-full py-4 bg-gray-400 text-white rounded-lg font-semibold text-lg cursor-not-allowed"
                        >
                            Please select a payment method
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentEnhanced;