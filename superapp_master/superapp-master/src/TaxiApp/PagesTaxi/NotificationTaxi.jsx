import React from 'react'
import banner2 from "../../Images/HomeScreen/banner2.svg";
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import arrow from "../../Icons/arrow-right.svg";

function NotificationTaxi() {
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideTaxi />
            <div className='px-4 pt-20 pb-20'>
                <div className='font-medium text-base'>Notification</div>

                {/* <div className="pt-4 flex flex-col items-center w-full h-[120px] rounded-2xl shadow-md cursor-pointer overflow-hidden">
                    <img
                        src={banner2}
                        alt="banner_image"
                        className="w-full h-full object-cover rounded-2xl"
                    />
                </div> */}

                {/* Taxi Offers Section */}
                <div className='mt-6'>
                    <h2 className='text-lg font-semibold text-gray-800 mb-4'>🚕 Taxi Offers & Deals</h2>
                    
                    {/* Ride Discounts */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-blue-600'>�� Ride Discounts</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200'>
                                <div className='text-sm font-medium text-blue-800'>First Ride</div>
                                <div className='text-xs text-blue-600 mt-1'>50% OFF up to ₹100</div>
                                <div className='text-xs text-gray-500 mt-1'>New Users</div>
                            </div>
                            <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-200'>
                                <div className='text-sm font-medium text-indigo-800'>Daily Commute</div>
                                <div className='text-xs text-indigo-600 mt-1'>20% OFF on 5+ rides</div>
                                <div className='text-xs text-gray-500 mt-1'>Weekday Special</div>
                            </div>
                        </div>
                    </div>

                    {/* Airport & Long Distance */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-green-600'>✈️ Airport & Long Distance</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Airport Transfer</div>
                                <div className='text-xs text-green-600 mt-1'>Flat ₹200 OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>24/7 Service</div>
                            </div>
                            <div className='bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200'>
                                <div className='text-sm font-medium text-emerald-800'>Intercity Travel</div>
                                <div className='text-xs text-emerald-600 mt-1'>15% OFF on ₹1000+</div>
                                <div className='text-xs text-gray-500 mt-1'>Premium Cars</div>
                            </div>
                        </div>
                    </div>

                    {/* Time-Based Offers */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-purple-600'>⏰ Time-Based Offers</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200'>
                                <div className='text-sm font-medium text-purple-800'>Late Night Rides</div>
                                <div className='text-xs text-purple-600 mt-1'>30% OFF 10 PM - 6 AM</div>
                                <div className='text-xs text-gray-500 mt-1'>Safe Travel</div>
                            </div>
                            <div className='bg-gradient-to-br from-pink-50 to-rose-50 p-3 rounded-lg border border-pink-200'>
                                <div className='text-sm font-medium text-pink-800'>Peak Hour Relief</div>
                                <div className='text-xs text-pink-600 mt-1'>25% OFF 5-8 PM</div>
                                <div className='text-xs text-gray-500 mt-1'>Traffic Hours</div>
                            </div>
                        </div>
                    </div>

                    {/* Car Categories */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-orange-600'>�� Car Categories</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200'>
                                <div className='text-sm font-medium text-orange-800'>Premium Cars</div>
                                <div className='text-xs text-orange-600 mt-1'>10% OFF on Luxury</div>
                                <div className='text-xs text-gray-500 mt-1'>Mercedes, BMW</div>
                            </div>
                            <div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-200'>
                                <div className='text-sm font-medium text-yellow-800'>Auto Rickshaw</div>
                                <div className='text-xs text-yellow-600 mt-1'>Flat ₹50 OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Short Distance</div>
                            </div>
                        </div>
                    </div>

                    {/* Package Deals */}
                    <div className='bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-teal-600'>📦 Package Deals</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-200'>
                                <div className='text-sm font-medium text-teal-800'>Monthly Pass</div>
                                <div className='text-xs text-teal-600 mt-1'>20 rides for ₹2000</div>
                                <div className='text-xs text-gray-500 mt-1'>Save ₹1000</div>
                            </div>
                            <div className='bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-200'>
                                <div className='text-sm font-medium text-cyan-800'>Weekend Package</div>
                                <div className='text-xs text-cyan-600 mt-1'>5 rides for ₹500</div>
                                <div className='text-xs text-gray-500 mt-1'>Fri-Sun Only</div>
                            </div>
                        </div>
                    </div>

                    {/* Flash Sale Banner */}
                    <div className='bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h3 className='text-lg font-bold'>⚡ Flash Sale</h3>
                                <p className='text-sm opacity-90'>Ends in 3 hours</p>
                                <p className='text-xs opacity-75 mt-1'>Extra 25% OFF on all taxi rides above ₹200</p>
                            </div>
                            <div className='text-right'>
                                <div className='text-2xl font-bold'>🔥</div>
                                <div className='text-xs opacity-75'>Limited Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Special Taxi Offers */}
                    <div className='bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-indigo-600'>🎁 Special Taxi Offers</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200'>
                                <div>
                                    <div className='text-sm font-medium text-indigo-800'>Refer & Ride Free</div>
                                    <div className='text-xs text-indigo-600'>Get ₹100 for each friend</div>
                                </div>
                                <div className='text-xs bg-indigo-600 text-white px-2 py-1 rounded-full'>NEW</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
                                <div>
                                    <div className='text-sm font-medium text-green-800'>Loyalty Points</div>
                                    <div className='text-xs text-green-600'>Earn 1 point per ₹10 spent</div>
                                </div>
                                <div className='text-xs bg-green-600 text-white px-2 py-1 rounded-full'>HOT</div>
                            </div>
                            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200'>
                                <div>
                                    <div className='text-sm font-medium text-orange-800'>Corporate Account</div>
                                    <div className='text-xs text-orange-600'>15% OFF for business users</div>
                                </div>
                                <div className='text-xs bg-orange-600 text-white px-2 py-1 rounded-full'>SAVE</div>
                            </div>
                        </div>
                    </div>

                    {/* Safety & Convenience */}
                    <div className='bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-emerald-600'>🛡️ Safety & Convenience</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200'>
                                <div className='text-sm font-medium text-emerald-800'>Women Safety</div>
                                <div className='text-xs text-emerald-600 mt-1'>Free rides for women</div>
                                <div className='text-xs text-gray-500 mt-1'>10 PM - 6 AM</div>
                            </div>
                            <div className='bg-gradient-to-br from-green-50 to-teal-50 p-3 rounded-lg border border-green-200'>
                                <div className='text-sm font-medium text-green-800'>Senior Citizens</div>
                                <div className='text-xs text-green-600 mt-1'>20% OFF all rides</div>
                                <div className='text-xs text-gray-500 mt-1'>60+ years</div>
                            </div>
                        </div>
                    </div>

                    {/* Weekend Specials */}
                    <div className='bg-white rounded-xl p-4 mt-4 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-base font-semibold text-rose-600'>�� Weekend Specials</h3>
                            {/* <img src={arrow} alt="View All" className='w-4 h-4' /> */}
                        </div>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-gradient-to-br from-rose-50 to-pink-50 p-3 rounded-lg border border-rose-200'>
                                <div className='text-sm font-medium text-rose-800'>Friday Night Out</div>
                                <div className='text-xs text-rose-600 mt-1'>All rides 30% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Party Night</div>
                            </div>
                            <div className='bg-gradient-to-br from-pink-50 to-rose-50 p-3 rounded-lg border border-pink-200'>
                                <div className='text-sm font-medium text-pink-800'>Sunday Family</div>
                                <div className='text-xs text-pink-600 mt-1'>Family rides 25% OFF</div>
                                <div className='text-xs text-gray-500 mt-1'>Weekend Trip</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterTaxi />
        </div>
    )
}
export default NotificationTaxi;