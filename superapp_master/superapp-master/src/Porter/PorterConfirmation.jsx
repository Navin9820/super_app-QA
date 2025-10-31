import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, MapPinIcon, TruckIcon, CurrencyRupeeIcon, UserIcon, PhoneIcon, EnvelopeIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import backIcon from '../Icons/arrow-left.svg';
import { profileService } from '../services/profileService';
import { getPorterRequest } from '../services/porterService';
import { getOtpCode, hasOtp } from '../utils/otpUtils';

const PorterConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(location.state);
  const [userProfile, setUserProfile] = useState({ fullName: '', phone: '', email: '' });
  const [currentStatus, setCurrentStatus] = useState(bookingData?.status || 'pending');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  // Debug logging
  console.log('🔍 PorterConfirmation - Received bookingData:', bookingData);
  console.log('🔍 PorterConfirmation - OTP in bookingData:', bookingData?.delivery_otp);

  // Load user profile data and fallback booking data
  useEffect(() => {
    const profile = profileService.getProfile();
    setUserProfile({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      email: profile.email || ''
    });

    // Fallback: Load booking data from localStorage if not available in state
    if (!bookingData) {
      const savedBooking = localStorage.getItem('lastPorterBooking');
      if (savedBooking) {
        try {
          const parsedBooking = JSON.parse(savedBooking);
          console.log('🔍 PorterConfirmation - Loaded from localStorage:', parsedBooking);
          console.log('🔍 PorterConfirmation - OTP from localStorage:', parsedBooking?.delivery_otp);
          // Update the bookingData by navigating with the loaded data
          navigate('/porter/confirmation', { 
            state: parsedBooking,
            replace: true 
          });
        } catch (error) {
          console.error('Failed to parse saved booking data:', error);
        }
      }
    }
  }, [bookingData, navigate]);

  // Persist latest booking data (including driver updates) to localStorage
  useEffect(() => {
    if (bookingData) {
      try {
        localStorage.setItem('lastPorterBooking', JSON.stringify(bookingData));
      } catch (e) {
        console.warn('Failed to persist porter booking to localStorage:', e);
      }
    }
  }, [bookingData]);

  // Function to fetch current status
  const fetchCurrentStatus = useCallback(async () => {
    if (!bookingData?.requestId) {
      console.log('No requestId found in bookingData:', bookingData);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching status for requestId:', bookingData.requestId);
      const updatedRequest = await getPorterRequest(bookingData.requestId);
      console.log('API Response:', updatedRequest);
      console.log('🔍 PorterConfirmation: Driver info from API:', updatedRequest?.driver_info);
      
      if (updatedRequest) {
        const newStatus = updatedRequest.status || updatedRequest.current_status;
        console.log('Current status:', currentStatus, 'New status:', newStatus);
        
        if (newStatus && newStatus !== currentStatus) {
          console.log('Status changed from', currentStatus, 'to', newStatus);
          setCurrentStatus(newStatus);
        }
        
        // Update booking data with driver info if available
        if (updatedRequest.driver_info && updatedRequest.driver_info.driver_name) {
          console.log('🔍 PorterConfirmation: Updating booking data with driver info');
          // Update the booking data in state
          setBookingData(prevData => ({
            ...prevData,
            driver_info: updatedRequest.driver_info
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch status update:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bookingData?.requestId, currentStatus]);

  // Polling effect for status updates
  useEffect(() => {
    if (!bookingData?.requestId) return;

    // Initial fetch
    fetchCurrentStatus();

    // Set up polling every 5 seconds (fast like other orders)
    const interval = setInterval(fetchCurrentStatus, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [bookingData?.requestId, fetchCurrentStatus]);

  // Function to get status display information
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        message: 'Waiting for driver',
        color: 'yellow',
        icon: ClockIcon,
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        dotColor: 'bg-yellow-500'
      },
      confirmed: {
        message: 'Driver assigned',
        color: 'blue',
        icon: CheckCircleIcon,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        dotColor: 'bg-blue-500'
      },
      'in_progress': {
        message: 'Driver on the way',
        color: 'green',
        icon: TruckIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      'in-progress': {
        message: 'Driver on the way',
        color: 'green',
        icon: TruckIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      completed: {
        message: 'Delivery completed',
        color: 'green',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      cancelled: {
        message: 'Request cancelled',
        color: 'red',
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        dotColor: 'bg-red-500'
      },
      canceled: {
        message: 'Request cancelled',
        color: 'red',
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        dotColor: 'bg-red-500'
      },
      assigned: {
        message: 'Driver assigned',
        color: 'blue',
        icon: CheckCircleIcon,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        dotColor: 'bg-blue-500'
      },
      'on_the_way': {
        message: 'Driver on the way',
        color: 'green',
        icon: TruckIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      'on-the-way': {
        message: 'Driver on the way',
        color: 'green',
        icon: TruckIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      'in_transit': {
        message: 'Out for delivery',
        color: 'green',
        icon: TruckIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      'picked_up': {
        message: 'Package picked up',
        color: 'green',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      },
      'delivered': {
        message: 'Package delivered',
        color: 'green',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        dotColor: 'bg-green-500'
      }
    };

    return statusMap[status] || statusMap.pending;
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Booking Data</h2>
          <p className="text-gray-600 mb-6">Please go back and try booking again.</p>
          <button
            onClick={() => navigate('/porter')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Back Button */}
        <div className="bg-green-600 px-6 py-8 text-center relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center text-white hover:text-green-100 transition-colors"
          >
            <img src={backIcon} alt="Back" className="w-6 h-6 filter brightness-0 invert" />
          </button>
          <CheckCircleIcon className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Booking Confirmed!</h1>
          <p className="text-green-100 mt-2">Your porter request has been submitted</p>
        </div>

        {/* Booking Details */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            {/* User Information */}
            {(userProfile.fullName || userProfile.phone || userProfile.email) && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  {userProfile.fullName && (
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{userProfile.fullName}</span>
                    </div>
                  )}
                  {userProfile.phone && (
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{userProfile.phone}</span>
                    </div>
                  )}
                  {userProfile.email && (
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{userProfile.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Location */}
            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Pickup Location</h3>
                <p className="text-gray-600 text-sm">{bookingData.pickup_location?.address || 'Pickup address'}</p>
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Dropoff Location</h3>
                <p className="text-gray-600 text-sm">{bookingData.dropoff_location?.address || 'Dropoff address'}</p>
              </div>
            </div>

            {/* Vehicle Type */}
            <div className="flex items-center space-x-3">
              <TruckIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Vehicle Type</h3>
                <p className="text-gray-600 text-sm capitalize">{bookingData.vehicle_type || 'Auto'}</p>
              </div>
            </div>

            {/* Distance & Fare */}
            <div className="flex items-center space-x-3">
              <CurrencyRupeeIcon className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Distance & Fare</h3>
                <p className="text-gray-600 text-sm">
                  {bookingData.distance} km • ₹{bookingData.fare}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-lg p-4 ${getStatusInfo(currentStatus).bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Current Status</h3>
                <button
                  onClick={fetchCurrentStatus}
                  disabled={isLoading}
                  className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded hover:bg-opacity-75 disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${getStatusInfo(currentStatus).dotColor} rounded-full ${currentStatus === 'pending' ? 'animate-pulse' : ''}`}></div>
                <span className={`text-sm ${getStatusInfo(currentStatus).textColor} capitalize`}>
                  {getStatusInfo(currentStatus).message}
                </span>
                {isLoading && (
                  <div className="ml-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {currentStatus === 'confirmed' && (
                <div className="mt-2 text-xs text-blue-600">
                  Driver details will be shared shortly
                </div>
              )}
              {currentStatus === 'in_progress' && (
                <div className="mt-2 text-xs text-green-600">
                  Track your delivery in real-time
                </div>
              )}
            </div>

            {/* Driver Information Display - Show when driver is assigned */}
            {bookingData?.driver_info && bookingData.driver_info.driver_name && (
              <div className='bg-blue-50 border-2 border-blue-200 rounded-[20px] mt-4 p-4'>
                <div className="text-center">
                  <div className="text-2xl mb-2">🚚</div>
                  <div className="text-lg font-bold text-blue-800 mb-3">
                    Your Delivery Driver
                  </div>
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      {bookingData.driver_info.driver_name}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      📞 {bookingData.driver_info.driver_phone}
                    </div>
                  <div className="text-sm text-gray-600">
                    🚗 {bookingData.driver_info.vehicle_number}
                  </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    Your driver will contact you when they're on the way
                  </div>
                </div>
              </div>
            )}

            {/* Request ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Request ID</h3>
              <p className="text-sm text-gray-600 font-mono">{bookingData.requestId || 'N/A'}</p>
            </div>

            {/* Delivery OTP Display */}
            {hasOtp(bookingData) && (
              <div className='bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-[20px] mt-4 p-4 shadow-sm'>
                <div className="text-center">
                  <div className="text-2xl mb-3">🔐</div>
                  <div className="text-lg font-bold text-yellow-800 mb-3">
                    Porter OTP
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-yellow-100 rounded-lg p-3 transition-colors duration-200"
                    onClick={() => setShowOtp(!showOtp)}
                  >
                    {showOtp ? (
                      <div className="text-3xl font-mono font-bold text-yellow-900 mb-2 tracking-widest">
                        {getOtpCode(bookingData)}
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
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {currentStatus === 'completed' ? (
              <button
                onClick={() => navigate('/porter')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Book Another Delivery
              </button>
            ) : (
              <button
                onClick={() => navigate('/porter')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Another Delivery
              </button>
            )}
            
            {currentStatus !== 'cancelled' && (
              <button
                onClick={() => navigate('/porter/tracking', { state: bookingData })}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {currentStatus === 'completed' ? 'View Details' : 'Track Request'}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {currentStatus === 'pending' && "A driver will be assigned to your request shortly. You'll receive updates on the status."}
              {currentStatus === 'confirmed' && "Your driver has been assigned and will contact you soon."}
              {currentStatus === 'in_progress' && "Your driver is on the way. You can track the delivery in real-time."}
              {currentStatus === 'in_transit' && "Your package is out for delivery. You can track the delivery in real-time."}
              {currentStatus === 'picked_up' && "Your package has been picked up and is on its way to the destination."}
              {currentStatus === 'delivered' && "Your package has been delivered successfully!"}
              {currentStatus === 'completed' && "Your delivery has been completed successfully. Thank you for using our service!"}
              {currentStatus === 'cancelled' && "This request has been cancelled. You can book a new delivery anytime."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PorterConfirmation;
