import React, { useState, useEffect } from 'react';
import step2 from "../../Clothes/Images/step2.svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { useFoodCart } from '../../Utility/FoodCartContext';
import { formatCurrency } from '../../services/foodDeliveryService';

function ProductDetailsFood() {
    const navigate = useNavigate();

    const location = useLocation();
    const { foodCart, loading } = useFoodCart();
    const [deliveryAddress, setDeliveryAddress] = useState(null);

    const loadDeliveryAddress = () => {
        // Load delivery address from localStorage
        const savedAddress = localStorage.getItem('delivery_address');
        if (savedAddress) {
            try {
                setDeliveryAddress(JSON.parse(savedAddress));
            } catch (error) {
                console.error('Error parsing delivery address:', error);
            }
        }
    };

    useEffect(() => {
        loadDeliveryAddress();
    }, []);

    // Refresh address when returning from edit
    useEffect(() => {
        if (location.state?.refresh) {
            loadDeliveryAddress();
            // Clear the refresh flag
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    // Show loading if cart is still loading
    if (loading) {
        return (
            <div className='bg-white min-h-screen'>
                <div className="flex items-center justify-center" style={{height: 'calc(100vh - 8rem)'}}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading cart details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if no cart data
    if (!foodCart || !foodCart.items || foodCart.items.length === 0) {
        return (
            <div className='bg-white min-h-screen'>
                <div className="flex items-center justify-center" style={{height: 'calc(100vh - 8rem)'}}>
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

    // Get cart data
    const cartItems = foodCart.items || [];
    const subtotal = foodCart.total_amount || 0;
    const deliveryFee = 0; // Free delivery for now
    const total = subtotal + deliveryFee;
    const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <div className='bg-white min-h-screen'>
            
            <div className='border border-[#E1E1E1] py-4'>
                <img src={step2} alt="" className='w-full mt-20 px-6' />
            </div >

            <div className='px-4 mb-16'>
                <div className="flex justify-between items-center pt-2">
                    <div className="text-base font-medium">Delivery address</div>
                </div>
                <div className="mt-3 bg-white border border-gray-300 rounded-[20px] p-1 flex flex-col justify-between h-full">
                    <div className=" mt-2 p-2 rounded-lg" >
                        {deliveryAddress ? (
                            <>
                                <div className="flex justify-between items-center w-full">
                                    <div>
                                        {deliveryAddress.fullName},
                                        <span className="bg-[#544C4A] px-2 py-1 rounded-full text-white font-normal text-sm ml-2">
                                            {deliveryAddress.type}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/home-food/add-address')}
                                        className="text-[#5C3FFF] hover:text-[#4A2FD8] transition-colors"
                                        title="Edit Address"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mt-2">
                                    {deliveryAddress.address_line1}<br />
                                    {deliveryAddress.address_line2 && <>{deliveryAddress.address_line2}<br /></>}
                                    {deliveryAddress.city}, {deliveryAddress.state}<br />
                                    {deliveryAddress.country} - {deliveryAddress.pincode}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No delivery address set
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-auto pr-4 pb-2">
                        <div className="flex items-center space-x-1 cursor-pointer" onClick={() => navigate('/home-food/choose-address')}>
                            <span className='text-[#5C3FFF] font-semibold text-sm underline'>Change delivery address</span>
                        </div>
                    </div>
                </div>

                <div className="text-base font-medium mt-2">Product details</div>
                
                {/* 🆕 NEW: Dynamic cart items display */}
                {cartItems.map((item, index) => (
                    <div key={index} className='bg-white border border-[#E1E1E1] rounded-[20px] mt-2 flex row gap-4 p-4'>
                        <div className='w-[120px] h-[140px]'>
                            <img 
                                src={item.dish_id?.image || item.image || '/default-food.jpg'} 
                                alt={item.dish_id?.name || item.name || 'Food item'} 
                                className='w-full h-full p-4 object-cover rounded-lg'
                                onError={(e) => {
                                    e.target.src = '/default-food.jpg';
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <div className='font-semibold text-base text-[#242424] pt-4'>
                                {item.dish_id?.name || item.name || 'Food Item'}
                            </div>
                            <p className="font-medium text-sm text-[#242424] mb-2">
                                {formatCurrency(item.dish_id?.price || item.price || 0)}
                                {item.dish_id?.original_price && item.dish_id?.original_price > (item.dish_id?.price || item.price) && (
                                    <span className="line-through text-[#C1C1C1] ml-2">
                                        {formatCurrency(item.dish_id.original_price)}
                                    </span>
                                )}
                            </p>
                            <div className="py-0 rounded-full border border-[#CCCCCC] px-5 w-fit">
                                {item.quantity || 1}
                            </div>
                            {item.special_instructions && (
                                <p className="text-sm text-gray-600 mt-2">
                                    <strong>Special Instructions:</strong> {item.special_instructions}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                <div className='bg-white border border-[#E1E1E1] rounded-[20px] mt-2 p-4'>
                    <div className='font-medium text-sm'>Apply Discount</div>
                    <div className='mt-2 border border-[#CCCCCC] py-1 rounded-full text-center text-sm font-normal'>SUMMER SALE</div>
                    <div className='mt-2 bg-[#5C3FFF] py-2 px-8 rounded-full text-center text-xs font-medium text-white w-max mx-auto'>
                        Apply
                    </div>
                </div>

                <div className="text-base font-medium mt-2">Payment details</div>
                <div className='bg-white border border-[#E1E1E1] rounded-[20px] p-6 mt-2' >
                    <div className="flex justify-between items-center w-full">
                        <p className='font-medium text-sm text-[#484848]'>Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})</p>
                        <p className="font-medium text-sm text-[#484848]">
                            {formatCurrency(subtotal)}
                        </p>
                    </div>
                    <div className="flex justify-between items-center w-full  mt-1">
                        <p className='font-medium text-sm text-[#484848]'>Discount</p>
                        <p className="font-medium text-sm text-[#484848]">
                            -₹ 0
                        </p>
                    </div>
                    <div className="flex justify-between items-center w-full  mt-1">
                        <p className='font-medium text-sm text-[#484848]'>Delivery charges</p>
                        <p className="font-medium text-sm text-[#484848]">
                            Free
                        </p>
                    </div>
                    <hr className='text-[#CCCCCC] mt-2' />
                    <div className="flex justify-between items-center w-full  mt-1">
                        <p className='font-semibold text-base text-[#000000]'> Total Amount</p>
                        <p className="font-semibold text-base text-[#000000]">
                            {formatCurrency(total)}
                        </p>
                    </div>
                    <hr className='text-[#CCCCCC] mt-2' />
                </div>
                
                <button
                    onClick={() => navigate('/home-food/payment-type')}
                    className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6 hover:bg-[#4A2FE8] transition-colors" >
                    Processed to pay
                </button>
            </div>
        </div>
    );
}

export default ProductDetailsFood;