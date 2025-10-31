import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiClock, HiMap, HiCurrencyRupee, HiArrowLeft } from 'react-icons/hi';
import HeaderInsideTaxi from "../ComponentsTaxi/HeaderInsideTaxi";
import API_CONFIG from '../../config/api.config';
import { useNotifications } from '../../Utility/NotificationContext';
import { taxiRideStorage } from '../../services/taxiRideStorageService';

function RideConfirmationScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { addOrderSuccessNotification } = useNotifications();
    const { rideId, rideData, status } = location.state || {};
    
    // Debug logging
    console.log('🔍 RideConfirmationScreen - location.state:', location.state);
    console.log('🔍 RideConfirmationScreen - rideData:', rideData);
    console.log('🔍 RideConfirmationScreen - delivery_otp:', rideData?.delivery_otp);
    console.log('🔍 RideConfirmationScreen - deliveryOtp:', rideData?.deliveryOtp);

    const [rideStatus, setRideStatus] = useState(status || 'pending');
    const [driverInfo, setDriverInfo] = useState(null);
    const [estimatedTime, setEstimatedTime] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [rideSaved, setRideSaved] = useState(false);
    const [showOtp, setShowOtp] = useState(false);

    // Function to save completed ride to storage
    const saveCompletedRide = (rideData, rideId, status, driverInfo) => {
        if (rideSaved) return; // Prevent duplicate saves
        
        try {
            const completedRide = {
                id: rideId,
                rideId: rideId,
                pickup_location: {
                    address: rideData?.pickup_location?.address || 'Pickup location',
                    coordinates: rideData?.pickup_location?.coordinates || [0, 0]
                },
                dropoff_location: {
                    address: rideData?.dropoff_location?.address || 'Destination',
                    coordinates: rideData?.dropoff_location?.coordinates || [0, 0]
                },
                fare: rideData?.fare || 0,
                totalFare: rideData?.fare || 0,
                distance: rideData?.distance || 0,
                duration: rideData?.duration || 0,
                vehicle_type: rideData?.vehicle_type || 'Car',
                status: status,
                payment_method: 'cash', // Default payment method
                driver: driverInfo ? {
                    name: driverInfo.name || 'Driver',
                    phone: driverInfo.phone || 'N/A',
                    vehicle: driverInfo.vehicle_id?.make || 'Car',
                    vehicleNumber: driverInfo.vehicle_id?.model || 'N/A',
                    photo: driverInfo.photo || 'https://randomuser.me/api/portraits/men/32.jpg'
                } : {
                    name: 'Your Captain',
                    phone: 'N/A',
                    vehicle: rideData?.vehicle_type || 'Car',
                    vehicleNumber: 'N/A',
                    photo: 'https://randomuser.me/api/portraits/men/32.jpg'
                },
                createdAt: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                date: new Date().toLocaleDateString(),
                delivery_otp: rideData?.delivery_otp || rideData?.deliveryOtp
            };

            console.log('🔍 RideConfirmationScreen - Saving completed ride:', completedRide);
            taxiRideStorage.addRide(completedRide);
            setRideSaved(true);
            console.log('✅ RideConfirmationScreen - Ride saved successfully to storage');
        } catch (error) {
            console.error('❌ RideConfirmationScreen - Error saving ride:', error);
        }
    };

    useEffect(() => {
        if (!rideId) {
            navigate('/select-location');
            return;
        }

        // Poll for ride status updates
        const interval = setInterval(async () => {
            try {
            const token = localStorage.getItem('token') || 'demo-token';
                const response = await fetch(`${API_CONFIG.getUrl('/api/taxi-rides/my-ride')}/${rideId}`, {
                headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
            const data = await response.json();
                    if (data.success) {
                        const newStatus = data.data.status;
                        const previousStatus = rideStatus;
                        
                        // Check if status changed to 'accepted' and add notification
                        if (newStatus === 'accepted' && previousStatus !== 'accepted') {
                            addOrderSuccessNotification({
                                orderId: rideId || `TAXI-${Date.now()}`,
                                totalAmount: `₹${rideData?.total_fare || '0'}`,
                                restaurantName: 'Taxi Service - Driver Accepted',
                                estimatedDelivery: 'Driver is on the way!'
                            });
                        }
                        
                        // Check if status changed to 'delivered' and add notification
                        if (newStatus === 'delivered' && previousStatus !== 'delivered') {
                            addOrderSuccessNotification({
                                orderId: rideId || `TAXI-${Date.now()}`,
                                totalAmount: `₹${rideData?.total_fare || '0'}`,
                                restaurantName: 'Taxi Service - Destination Arrived',
                                estimatedDelivery: 'You have reached your destination!'
                            });
                        }
                        
                        // Check if status changed to 'completed' and save ride
                        if ((newStatus === 'completed' || newStatus === 'delivered') && previousStatus !== 'completed' && previousStatus !== 'delivered') {
                            console.log('🔍 RideConfirmationScreen - Ride completed, saving to storage...');
                            // Always save as 'completed' for better UX, regardless of backend status
                            saveCompletedRide(rideData, rideId, 'completed', data.data.driver_id);
                        }
                        
                        setRideStatus(newStatus);
                        // ✅ NEW: Use driver_info field for complete driver details
                        if (data.data.driver_info && data.data.driver_info.driver_name) {
                            setDriverInfo(data.data.driver_info);
                            console.log('🔍 RideConfirmationScreen: Driver info updated:', data.data.driver_info);
                        } else if (data.data.driver_id) {
                            setDriverInfo(data.data.driver_id);
                        }
                        if (data.data.estimated_arrival) {
                            setEstimatedTime(data.data.estimated_arrival);
                        }
                    }
        } else {
                    console.warn('Failed to fetch ride status:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error fetching ride status:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [rideId, navigate]);

    // Simple map display - just show coordinates and route info
    useEffect(() => {
        if (rideData?.pickup_location?.coordinates && rideData?.dropoff_location?.coordinates) {
            setMapLoaded(true);
        }
    }, [rideData]);

    // Save ride if it's already completed when component loads
    useEffect(() => {
        if (rideData && rideId && (rideStatus === 'completed' || rideStatus === 'delivered') && !rideSaved) {
            console.log('🔍 RideConfirmationScreen - Ride already completed on load, saving to storage...');
            // Always save as 'completed' for better UX
            saveCompletedRide(rideData, rideId, 'completed', driverInfo);
        }
    }, [rideData, rideId, rideStatus, driverInfo, rideSaved]);

    // Save ride immediately when component loads (for active rides)
    useEffect(() => {
        if (rideData && rideId && !rideSaved) {
            console.log('🔍 RideConfirmationScreen - Saving active ride to storage...');
            saveCompletedRide(rideData, rideId, rideStatus, driverInfo);
        }
    }, [rideData, rideId, rideSaved]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'accepted': return 'text-blue-600 bg-blue-100';
            case 'in_progress': return 'text-green-600 bg-green-100';
            case 'picked_up': return 'text-green-600 bg-green-100';
            case 'delivered': return 'text-purple-600 bg-purple-100';
            case 'completed': return 'text-green-600 bg-green-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-green-600 bg-green-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Looking for driver...';
            case 'accepted': return 'Driver accepted!';
            case 'in_progress': return 'Driver on the way!';
            case 'picked_up': return 'Customer picked up!';
            case 'delivered': return 'Destination Arrived!';
            case 'completed': return 'Ride completed!';
            case 'cancelled': return 'Ride cancelled';
            default: return 'Customer picked up!';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <HiClock className="w-6 h-6" />;
            case 'accepted': 
            case 'in_progress': 
            case 'picked_up':
            case 'delivered':
            case 'completed': return <HiCheckCircle className="w-6 h-6" />;
            case 'cancelled': return <HiArrowLeft className="w-6 h-6" />;
            default: return <HiCheckCircle className="w-6 h-6" />;
        }
    };

    if (!rideId) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
            <HeaderInsideTaxi />
            
            <div className="container mx-auto px-4 pt-20 pb-8">
                {/* Status Header */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6 relative overflow-hidden">
                    {/* Background decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-center mb-6">
                            <div className={`p-4 rounded-full ${getStatusColor(rideStatus)} shadow-lg`}>
                                {getStatusIcon(rideStatus)}
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-center text-gray-800 mb-3 leading-tight">
                            {getStatusText(rideStatus)}
                        </h1>
                        <p className="text-center text-gray-600 text-sm">
                            Ride ID: {rideId}
                        </p>
                    </div>
                </div>

                {/* Delivery OTP Display */}
                {(() => {
                    const hasOtp = rideData && (rideData.delivery_otp || rideData.deliveryOtp);
                    console.log('🔍 RideConfirmationScreen - OTP Display Check:', {
                        rideData: !!rideData,
                        delivery_otp: rideData?.delivery_otp,
                        deliveryOtp: rideData?.deliveryOtp,
                        hasOtp
                    });
                    return hasOtp;
                })() && (
                    <div className='bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-[20px] mb-6 p-4 shadow-sm'>
                        <div className="text-center">
                            <div className="text-2xl mb-3">🔐</div>
                            <div className="text-lg font-bold text-yellow-800 mb-3">
                                Ride OTP
                            </div>
                            <div 
                                className="cursor-pointer hover:bg-yellow-100 rounded-lg p-3 transition-colors duration-200"
                                onClick={() => setShowOtp(!showOtp)}
                            >
                                {showOtp ? (
                                    <div className="text-3xl font-mono font-bold text-yellow-900 mb-2 tracking-widest">
                                        {rideData.delivery_otp || rideData.deliveryOtp}
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
                                    Share this OTP with the driver when they arrive
                                </div>
                            )}
                        </div>
                    </div>
                )}

                                {/* Route Visualization */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <HiMap className="w-5 h-5 mr-2 text-blue-500" />
                        Route Information
                    </h2>
                    <div className="space-y-4">
                        {/* Pickup Location */}
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-700">Pickup Location</p>
                                <p className="text-gray-800">{rideData?.pickup_location?.address || 'Pickup address'}</p>
                                {rideData?.pickup_location?.coordinates && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Coordinates: {rideData.pickup_location.coordinates[0]?.toFixed(6)}, {rideData.pickup_location.coordinates[1]?.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Route Line */}
                        <div className="flex justify-center">
                            <div className="w-0.5 h-8 bg-blue-400 relative">
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
            </div>

                        {/* Dropoff Location */}
                        <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-700">Dropoff Location</p>
                                <p className="text-gray-800">{rideData?.dropoff_location?.address || 'Dropoff address'}</p>
                                {rideData?.dropoff_location?.coordinates && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Coordinates: {rideData.dropoff_location.coordinates[0]?.toFixed(6)}, {rideData.dropoff_location.coordinates[1]?.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Route Summary */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-500">Distance</p>
                                    <p className="text-lg font-semibold text-blue-600">{rideData?.distance || 0} km</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="text-lg font-semibold text-blue-600">{rideData?.duration || 0} min</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Fare</p>
                                    <p className="text-lg font-semibold text-green-600">₹{rideData?.fare || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver Information Display - Show when driver is assigned */}
                        {driverInfo && driverInfo.driver_name && (
                            <div className='bg-blue-50 border-2 border-blue-200 rounded-[20px] mt-4 p-4'>
                                <div className="text-center">
                                    <div className="text-2xl mb-2">🚗</div>
                                    <div className="text-lg font-bold text-blue-800 mb-3">
                                        Your Taxi Driver
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
                    </div>
                </div>

                {/* Ride Details */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Ride Details</h2>
                    
                    <div className="space-y-4">
                        {/* Pickup */}
                        <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Pickup</p>
                                <p className="text-gray-800">{rideData?.pickup_location?.address || 'Pickup location'}</p>
                            </div>
                        </div>

                        {/* Dropoff */}
                        <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Destination</p>
                                <p className="text-gray-800">{rideData?.dropoff_location?.address || 'Destination'}</p>
                            </div>
                        </div>

                        {/* Vehicle Type */}
                        <div className="flex items-center justify-between py-3 border-t border-gray-200">
                            <span className="text-gray-600">Vehicle Type</span>
                            <span className="font-medium">{rideData?.vehicle_type || 'Car'}</span>
                        </div>

                        {/* Distance */}
                        <div className="flex items-center justify-between py-3 border-t border-gray-200">
                            <span className="text-gray-600">Distance</span>
                            <span className="font-medium">{rideData?.distance || 0} km</span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center justify-between py-3 border-t border-gray-200">
                            <span className="text-gray-600">Estimated Time</span>
                            <span className="font-medium">{rideData?.duration || 0} mins</span>
                </div>

                        {/* Fare */}
                        <div className="flex items-center justify-between py-3 border-t border-gray-200">
                            <span className="text-gray-600">Fare</span>
                            <span className="font-medium text-green-600 flex items-center">
                                <HiCurrencyRupee className="w-4 h-4 mr-1" />
                                {rideData?.fare || 0}
                            </span>
            </div>
                </div>
            </div>

                {/* Driver Info (if available) */}
                {driverInfo && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Driver Information</h2>
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {driverInfo.driver_name?.charAt(0) || driverInfo.name?.charAt(0) || 'D'}
                            </div>
                                <div>
                                <p className="font-medium text-gray-800">{driverInfo.driver_name || driverInfo.name || 'Driver'}</p>
                                <p className="text-sm text-gray-600">{driverInfo.driver_phone || driverInfo.phone || 'Phone not available'}</p>
                                <p className="text-sm text-gray-600">Vehicle: {driverInfo.vehicle_type || driverInfo.vehicle_id?.make || 'Car'} {driverInfo.vehicle_number || driverInfo.vehicle_id?.model || ''}</p>
                                </div>
                            </div>
                        </div>
                )}

                {/* Estimated Arrival (if available) */}
                {estimatedTime && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Estimated Arrival</h2>
                        <div className="flex items-center space-x-3">
                            <HiClock className="w-6 h-6 text-blue-500" />
                            <span className="text-lg font-medium text-gray-800">{estimatedTime}</span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                    {(rideStatus === 'pending' || rideStatus === 'completed' || rideStatus === 'cancelled') && (
                        <button
                            onClick={() => navigate('/select-location')}
                            className={`w-full text-white py-3 px-6 rounded-lg font-semibold transition-colors ${
                                rideStatus === 'completed' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            Book Another Ride
                        </button>
                    )}
                    
                    {/* {rideStatus === 'delivered' && (
                        <button
                            onClick={() => navigate('/select-location')}
                            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Rate Your Rideaaaa
                        </button>
                    )} */}

                    <button
                        onClick={() => navigate('/home-taxi')}
                        className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>

                </div>
            </div>
        </div>
    );
}

export default RideConfirmationScreen;