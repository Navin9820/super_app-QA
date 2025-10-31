import React from 'react'
import arrow from "../../Icons/arrow-right.svg";
import { useNavigate } from 'react-router-dom';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";

function SettingsTaxi() {
    const navigate = useNavigate();
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideTaxi />
            <div className='pt-20 px-4 pb-20'>
                <div className='font-medium text-base pt-4'>Settings</div>
                
                {/* Account Settings */}
                <div className='bg-white border border-[#E1E1E1] p-4 rounded-[20px] mt-4'>
                    <div className="text-sm font-semibold text-gray-600 mb-3">Account Settings</div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-taxi/account")}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs">👤</span>
                            </div>
                            <h2 className="text-sm font-medium">Profile & Account</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-taxi/payment")}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-xs">💳</span>
                            </div>
                            <h2 className="text-sm font-medium">Payment Methods</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>

                    {/* <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-taxi/notification")}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 text-xs">🔔</span>
                            </div>
                            <h2 className="text-sm font-medium">Notifications</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div> */}
                </div>

                {/* Ride Preferences */}
                {/* <div className='bg-white border border-[#E1E1E1] p-4 rounded-[20px] mt-4'>
                    <div className="text-sm font-semibold text-gray-600 mb-3">Ride Preferences</div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 text-xs">🚗</span>
                            </div>
                            <h2 className="text-sm font-medium">Default Vehicle Type</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Auto</span>
                            <img
                                src={arrow}
                                className="w-4 h-4 cursor-pointer transform transition-transform"
                                alt="Toggle view"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs">📍</span>
                            </div>
                            <h2 className="text-sm font-medium">Home Address</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-xs">🏢</span>
                            </div>
                            <h2 className="text-sm font-medium">Work Address</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600 text-xs">🛡️</span>
                            </div>
                            <h2 className="text-sm font-medium">Emergency Contacts</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                </div> */}

                {/* App Settings */}
                {/* <div className='bg-white border border-[#E1E1E1] p-4 rounded-[20px] mt-4'>
                    <div className="text-sm font-semibold text-gray-600 mb-3">App Settings</div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 text-xs">🌙</span>
                            </div>
                            <h2 className="text-sm font-medium">Dark Mode</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-4 bg-gray-300 rounded-full relative">
                                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 text-xs">🔊</span>
                            </div>
                            <h2 className="text-sm font-medium">Sound & Vibration</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-4 bg-blue-500 rounded-full relative">
                                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs">🌐</span>
                            </div>
                            <h2 className="text-sm font-medium">Language</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">English</span>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-xs">📱</span>
                            </div>
                            <h2 className="text-sm font-medium">App Version</h2>
                        </div>
                        <span className="text-xs text-gray-500">v2.1.0</span>
                    </div>
                </div> */}

                {/* Legal & Support */}
                <div className='bg-white border border-[#E1E1E1] p-4 rounded-[20px] mt-4'>
                    <div className="text-sm font-semibold text-gray-600 mb-3">Legal & Support</div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-taxi/terms-conditions")}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 text-xs">📄</span>
                            </div>
                            <h2 className="text-sm font-medium">Terms & Conditions</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-taxi/privacy")}>
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 text-xs">🔒</span>
                            </div>
                        <h2 className="text-sm font-medium">Privacy Policy</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-taxi/about")}>
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 text-xs">ℹ️</span>
                            </div>
                        <h2 className="text-sm font-medium">About</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 text-xs">🚪</span>
                            </div>
                            <h2 className="text-sm font-medium text-red-600">Sign Out</h2>
                        </div>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                </div>
            </div>
            <FooterTaxi />
        </div>
    )
}
export default SettingsTaxi;