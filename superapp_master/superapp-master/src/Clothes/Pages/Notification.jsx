import React from 'react'
// import arrow from "../../Icons/arrow-right.svg"; // This line can also be removed if the file is no longer used
import Footer from '../../Utility/Footer';
import ClothesHeader from '../Header/ClothesHeader';
import TopBannerSection from '../../Components/TopBannerSection.jsx';

function Notification() {
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <ClothesHeader />
            <div className='px-4 pt-24 pb-28'>
                <div className="flex items-center gap-3 mb-4">
                    <div className='font-medium text-base'>Notification</div>
                </div>
                
                {/* Flash Sale Banner */}
                <div className='mt-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h3 className='text-lg font-bold'>⚡ Flash Sale</h3>
                            <p className='text-sm opacity-90'>Ends in 4 hours</p>
                            <p className='text-xs opacity-75 mt-1'>Extra 15% OFF on all categories above</p>
                        </div>
                        <div className='text-right'>
                            <div className='text-2xl font-bold'>🔥</div>
                            <div className='text-xs opacity-75'>Limited Time</div>
                        </div>
                    </div>
                </div>

                <div className='mt-6 space-y-5'>
                    {/* Home Appliances Offers */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-blue-600'>🏠 Home Appliances Offers</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200'>
                                <div className='text-sm font-medium text-blue-800'>Washing Machines</div>
                                <div className='text-xs text-blue-600 mt-1'>Flat 25% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Free Installation</div>
                            </div>
                            <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-200'>
                                <div className='text-sm font-medium text-indigo-800'>Refrigerators</div>
                                <div className='text-xs text-indigo-600 mt-1'>Up to 30% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Energy Efficient</div>
                            </div>
                        </div>
                        <div className='mt-3 text-sm text-gray-600'>
                            🚚 Free delivery for orders above ₹15,000 • 🎁 Extended warranty included
                        </div>
                    </div>

                    {/* Women's Wear Offers */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-pink-600'>👗 Women's Wear Offers</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-pink-50 to-rose-50 p-3 rounded-lg border border-pink-200'>
                                <div className='text-sm font-medium text-pink-800'>Sarees & Dresses</div>
                                <div className='text-xs text-pink-600 mt-1'>Buy 2 Get 1 Free</div>
                                <div className='text-xs text-gray-500 mt-1'>Festival Collection</div>
                            </div>
                            <div className='bg-gradient-to-br from-rose-50 to-pink-50 p-3 rounded-lg border border-rose-200'>
                                <div className='text-sm font-medium text-rose-800'>Kurtis & Tops</div>
                                <div className='text-xs text-rose-600 mt-1'>Extra 15% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Casual Wear</div>
                            </div>
                        </div>
                        <div className='mt-3 text-sm text-gray-600'>
                            💎 Extra 10% off on select brands • 👗 Trending styles at best prices
                        </div>
                    </div>

                    {/* Men's Wear Offers */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-green-600'>👔 Men's Wear Offers</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Casual Wear</div>
                                <div className='text-xs text-green-600 mt-1'>30% OFF T-shirts</div>
                                <div className='text-xs text-gray-500 mt-1'>Premium Cotton</div>
                            </div>
                            <div className='bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200'>
                                <div className='text-sm font-medium text-emerald-800'>Formal Collection</div>
                                <div className='text-xs text-emerald-600 mt-1'>40% OFF Shirts</div>
                                <div className='text-xs text-gray-500 mt-1'>Office Ready</div>
                            </div>
                        </div>
                        <div className='mt-3 text-sm text-gray-600'>
                            🎯 Exclusive deals for club members • 🎉 New arrivals every week
                        </div>
                    </div>

                    {/* Cosmetics Offers */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-purple-600'>💄 Cosmetics Offers</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200'>
                                <div className='text-sm font-medium text-purple-800'>Beauty Brands</div>
                                <div className='text-xs text-purple-600 mt-1'>Up to 40% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Top Brands</div>
                            </div>
                            <div className='bg-gradient-to-br from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-200'>
                                <div className='text-sm font-medium text-pink-800'>Skincare Range</div>
                                <div className='text-xs text-pink-600 mt-1'>Buy 1 Get 1</div>
                                <div className='text-xs text-gray-500 mt-1'>Natural Products</div>
                            </div>
                        </div>
                        <div className='mt-3 text-sm text-gray-600'>
                            🎁 Free gift on purchases above ₹3,000 • ✨ Sample products included
                        </div>
                    </div>

                    {/* Electronics & Gadgets */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-orange-600'>📱 Electronics & Gadgets</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200'>
                                <div className='text-sm font-medium text-orange-800'>Smartphones</div>
                                <div className='text-xs text-orange-600 mt-1'>Up to 35% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Latest Models</div>
                            </div>
                            <div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-200'>
                                <div className='text-sm font-medium text-yellow-800'>Laptops & PCs</div>
                                <div className='text-xs text-yellow-600 mt-1'>Student Discount</div>
                                <div className='text-xs text-gray-500 mt-1'>EMI Available</div>
                            </div>
                        </div>
                        <div className='mt-3 text-sm text-gray-600'>
                            💳 EMI options available • 🔋 Extended warranty on all products
                        </div>
                    </div>

                    {/* Sports & Fitness */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-teal-600'>🏋️ Sports & Fitness</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-200'>
                                <div className='text-sm font-medium text-teal-800'>Sports Shoes</div>
                                <div className='text-xs text-teal-600 mt-1'>Buy 1 Get 1</div>
                                <div className='text-xs text-gray-500 mt-1'>Running & Gym</div>
                            </div>
                            <div className='bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-200'>
                                <div className='text-sm font-medium text-cyan-800'>Fitness Equipment</div>
                                <div className='text-xs text-cyan-600 mt-1'>25% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Home Gym</div>
                            </div>
                        </div>
                        <div className='mt-3 text-sm text-gray-600'>
                            🏆 Premium sports brands • 💪 Free fitness consultation
                        </div>
                    </div>

                    {/* Special Offers */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-indigo-600'>🎁 Special Offers</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200'>
                                <div>
                                    <div className='text-sm font-medium text-indigo-800'>First Order Bonus</div>
                                    <div className='text-xs text-indigo-600'>Get ₹200 OFF on ₹500+</div>
                                </div>
                                <div className='text-xs bg-indigo-600 text-white px-2 py-1 rounded-full'>NEW</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
                                <div>
                                    <div className='text-sm font-medium text-green-800'>Refer & Earn</div>
                                    <div className='text-xs text-green-600'>Get ₹100 for each friend</div>
                                </div>
                                <div className='text-xs bg-green-600 text-white px-2 py-1 rounded-full'>HOT</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200'>
                                <div>
                                    <div className='text-sm font-medium text-orange-800'>Loyalty Program</div>
                                    <div className='text-xs text-orange-600'>Earn points on every purchase</div>
                                </div>
                                <div className='text-xs bg-orange-600 text-white px-2 py-1 rounded-full'>SAVE</div>
                            </div>
                        </div>
                    </div>

                    {/* Weekend Specials */}
                    <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='font-semibold text-lg text-emerald-600'>🎉 Weekend Specials</div>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200'>
                                <div className='text-sm font-medium text-emerald-800'>Friday Sale</div>
                                <div className='text-xs text-emerald-600 mt-1'>All Electronics 20% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Tech Friday</div>
                            </div>
                            <div className='bg-gradient-to-br from-green-50 to-teal-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Sunday Funday</div>
                                <div className='text-xs text-green-600 mt-1'>Fashion Items BOGO</div>
                                <div className='text-xs text-gray-500 mt-1'>Style Sunday</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
export default Notification;