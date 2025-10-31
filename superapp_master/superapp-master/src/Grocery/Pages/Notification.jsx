import React from 'react'
import arrow from "../../Icons/arrow-right.svg";
import Footer from '../SubPages/Footer';
import Header from '../SubPages/Header';
import banner2 from "../../Images/HomeScreen/banner2.svg";

function Notification() {
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <Header />
            <div className='px-4 pt-24 pb-28'>
                <div className='font-medium text-base'>Notification</div>

                {/* Grocery Offers Section */}
                <div className='mt-6'>
                    <h2 className='text-lg font-semibold text-gray-800 mb-4'>Grocery Offers & Deals</h2>
                    
                    {/* Fresh Vegetables & Fruits */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-green-600'>🥑 Fresh Vegetables & Fruits</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Organic Bundle</div>
                                <div className='text-xs text-green-600 mt-1'>Buy 3 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Fresh Daily</div>
                            </div>
                            <div className='bg-gradient-to-br from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200'>
                                <div className='text-sm font-medium text-orange-800'>Seasonal Fruits</div>
                                <div className='text-xs text-gray-500 mt-1'>Limited Stock</div>
                            </div>
                        </div>
                    </div>

                    {/* Dairy & Bakery */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-blue-600'>🧀 Dairy & Bakery</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200'>
                                <div className='text-sm font-medium text-blue-800'>Fresh Milk</div>
                                <div className='text-xs text-blue-600 mt-1'>Buy 2 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Daily Delivery</div>
                            </div>
                            <div className='bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-200'>
                                <div className='text-sm font-medium text-amber-800'>Bread & Pastries</div>
                                <div className='text-xs text-gray-500 mt-1'>Evening Sale</div>
                            </div>
                        </div>
                    </div>

                    {/* Pantry Essentials */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-purple-600'>🛒 Pantry Essentials</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200'>
                                <div className='text-sm font-medium text-purple-800'>Rice & Pulses</div>
                                <div className='text-xs text-purple-600 mt-1'>Buy 5kg Get 1kg Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Bulk Savings</div>
                            </div>
                            <div className='bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-lg border border-red-200'>
                                <div className='text-sm font-medium text-red-800'>Cooking Oils</div>
                                <div className='text-xs text-gray-500 mt-1'>Premium Quality</div>
                            </div>
                        </div>
                    </div>

                    {/* Beverages */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-teal-600'>🥤 Beverages</h3>
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-200'>
                                <div className='text-sm font-medium text-teal-800'>Soft Drinks</div>
                                <div className='text-xs text-teal-600 mt-1'>Buy 6 Get 2 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Party Pack</div>
                            </div>
                            <div className='bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200'>
                                <div className='text-sm font-medium text-emerald-800'>Juices & Smoothies</div>
                                <div className='text-xs text-gray-500 mt-1'>Healthy Choice</div>
                            </div>
                        </div>
                    </div>

                    {/* Flash Sale Banner */}
                    <div className='bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h3 className='text-lg font-bold'>⚡ Flash Sale</h3>
                                <p className='text-sm opacity-90'>Ends in 3 hours</p>
                            </div>
                            <div className='text-right'>
                                <div className='text-2xl font-bold'>🔥</div>
                                <div className='text-xs opacity-75'>Limited Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Special Offers */}
                    <div className='bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-indigo-600'>🎁 Special Offers</h3>
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200'>
                                <div>
                                    <div className='text-sm font-medium text-indigo-800'>First Order Bonus</div>
                                    <div className='text-xs text-indigo-600'>Get ₹100 OFF on ₹500+</div>
                                </div>
                                <div className='text-xs bg-indigo-600 text-white px-2 py-1 rounded-full'>NEW</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
                                <div>
                                    <div className='text-sm font-medium text-green-800'>Refer & Earn</div>
                                    <div className='text-xs text-green-600'>Get ₹50 for each friend</div>
                                </div>
                                <div className='text-xs bg-green-600 text-white px-2 py-1 rounded-full'>HOT</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Notification;