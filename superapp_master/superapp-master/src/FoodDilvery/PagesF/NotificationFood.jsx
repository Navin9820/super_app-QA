import React from 'react'
import banner2 from "../../Images/HomeScreen/banner2.svg";
import HeaderInsideFood from '../ComponentsF/HeaderInsideFood';
import FooterFood from '../ComponentsF/FooterFood';

function NotificationFood() {
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideFood />
            <div className='px-4 pt-24 pb-28'>
                <div className='font-medium text-base'>Notification</div>

                {/* <div className="pt-4 flex flex-col items-center w-full h-[120px] rounded-2xl shadow-md cursor-pointer overflow-hidden">
                    <img
                        src={banner2}
                        alt="banner_image"
                        className="w-full h-full object-cover rounded-2xl"
                    />
                </div> */}

                {/* Food Offers Section */}
                <div className='mt-6 hidden'>
                    <h2 className='text-lg font-semibold text-gray-800 mb-4'>🍽️ Food Offers & Deals</h2>
                    
                    {/* Restaurant Specials */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-red-600'>🍴 Restaurant Specials</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-lg border border-red-200'>
                                <div className='text-sm font-medium text-red-800'>New Restaurants</div>
                                <div className='text-xs text-red-600 mt-1'>50% OFF First Order</div>
                                <div className='text-xs text-gray-500 mt-1'>Limited Time</div>
                            </div>
                            <div className='bg-gradient-to-br from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200'>
                                <div className='text-sm font-medium text-orange-800'>Premium Dining</div>
                                <div className='text-xs text-orange-600 mt-1'>Buy 1 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Fine Dining</div>
                            </div>
                        </div>
                    </div>

                    {/* Cuisine Offers */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-green-600'>🥗 Cuisine Offers</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Indian Cuisine</div>
                                <div className='text-xs text-green-600 mt-1'>30% OFF Thali</div>
                                <div className='text-xs text-gray-500 mt-1'>Authentic Taste</div>
                            </div>
                            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200'>
                                <div className='text-sm font-medium text-blue-800'>Chinese & Asian</div>
                                <div className='text-xs text-blue-600 mt-1'>Buy 2 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Wok Special</div>
                            </div>
                        </div>
                    </div>

                    {/* Meal Deals */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-purple-600'>🍕 Meal Deals</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200'>
                                <div className='text-sm font-medium text-purple-800'>Lunch Specials</div>
                                <div className='text-xs text-purple-600 mt-1'>40% OFF 12-3 PM</div>
                                <div className='text-xs text-gray-500 mt-1'>Office Lunch</div>
                            </div>
                            <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-200'>
                                <div className='text-sm font-medium text-indigo-800'>Dinner Combos</div>
                                <div className='text-xs text-indigo-600 mt-1'>Free Dessert</div>
                                <div className='text-xs text-gray-500 mt-1'>Family Pack</div>
                            </div>
                        </div>
                    </div>

                    {/* Fast Food & Snacks */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-yellow-600'>🍔 Fast Food & Snacks</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-200'>
                                <div className='text-sm font-medium text-yellow-800'>Burger Combos</div>
                                <div className='text-xs text-yellow-600 mt-1'>Buy 2 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Value Meals</div>
                            </div>
                            <div className='bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200'>
                                <div className='text-sm font-medium text-amber-800'>Pizza Deals</div>
                                <div className='text-xs text-amber-600 mt-1'>50% OFF Large</div>
                                <div className='text-xs text-gray-500 mt-1'>Weekend Special</div>
                            </div>
                        </div>
                    </div>

                    {/* Beverages & Desserts */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-pink-600'>🥤 Beverages & Desserts</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-pink-50 to-rose-50 p-3 rounded-lg border border-pink-200'>
                                <div className='text-sm font-medium text-pink-800'>Soft Drinks</div>
                                <div className='text-xs text-pink-600 mt-1'>Buy 3 Get 2 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Party Pack</div>
                            </div>
                            <div className='bg-gradient-to-br from-rose-50 to-pink-50 p-3 rounded-lg border border-rose-200'>
                                <div className='text-sm font-medium text-rose-800'>Ice Cream & Cakes</div>
                                <div className='text-xs text-rose-600 mt-1'>25% OFF Desserts</div>
                                <div className='text-xs text-gray-500 mt-1'>Sweet Treats</div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Offers */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-teal-600'>🚀 Delivery Offers</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-200'>
                                <div className='text-sm font-medium text-teal-800'>Free Delivery</div>
                                <div className='text-xs text-teal-600 mt-1'>On Orders Above ₹200</div>
                                <div className='text-xs text-gray-500 mt-1'>Quick Delivery</div>
                            </div>
                            <div className='bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-200'>
                                <div className='text-sm font-medium text-cyan-800'>Express Delivery</div>
                                <div className='text-xs text-cyan-600 mt-1'>30 Minutes or Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Guaranteed</div>
                            </div>
                        </div>
                    </div>

                    {/* Flash Sale Banner */}
                    <div className='bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h3 className='text-lg font-bold'>⚡ Flash Sale</h3>
                                <p className='text-sm opacity-90'>Ends in 2 hours</p>
                                <p className='text-xs opacity-75 mt-1'>Extra 20% OFF on all food orders above ₹300</p>
                            </div>
                            <div className='text-right'>
                                <div className='text-2xl font-bold'>🔥</div>
                                <div className='text-xs opacity-75'>Limited Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Special Food Offers */}
                    <div className='bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-indigo-600'>🎁 Special Food Offers</h3>
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200'>
                                <div>
                                    <div className='text-sm font-medium text-indigo-800'>First Food Order</div>
                                    <div className='text-xs text-indigo-600'>Get ₹150 OFF on ₹400+</div>
                                </div>
                                <div className='text-xs bg-indigo-600 text-white px-2 py-1 rounded-full'>NEW</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
                                <div>
                                    <div className='text-sm font-medium text-green-800'>Loyalty Rewards</div>
                                    <div className='text-xs text-green-600'>Earn points on every order</div>
                                </div>
                                <div className='text-xs bg-green-600 text-white px-2 py-1 rounded-full'>HOT</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200'>
                                <div>
                                    <div className='text-sm font-medium text-orange-800'>Group Orders</div>
                                    <div className='text-xs text-orange-600'>10% OFF on ₹1000+ orders</div>
                                </div>
                                <div className='text-xs bg-orange-600 text-white px-2 py-1 rounded-full'>SAVE</div>
                            </div>
                        </div>
                    </div>

                    {/* Weekend Specials */}
                    <div className='bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-emerald-600'>🌟 Weekend Specials</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200'>
                                <div className='text-sm font-medium text-emerald-800'>Friday Night</div>
                                <div className='text-xs text-emerald-600 mt-1'>All Pizzas 40% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Party Night</div>
                            </div>
                            <div className='bg-gradient-to-br from-green-50 to-teal-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Sunday Brunch</div>
                                <div className='text-xs text-green-600 mt-1'>Buy 1 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Family Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterFood />
        </div>
    )
}
export default NotificationFood;