import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FooterNav from '../Porter/Footer';
import PorterMapView from './PorterMapView';
import { getBookingById, getUserPorterRequests, getPorterRequest } from '../services/porterService';
import { profileService } from '../services/profileService';
import { getOtpCode, hasOtp } from '../utils/otpUtils';
import backIcon from '../Icons/arrow-left.svg';

const Tracking = () => {
  const location = useLocation();
  const [booking, setBooking] = useState(location.state || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({ fullName: '', phone: '', email: '' });
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();

  // Load user profile data
  useEffect(() => {
    const profile = profileService.getProfile();
    setUserProfile({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      email: profile.email || ''
    });
  }, []);

  // Enhanced booking data retrieval
  useEffect(() => {
    const fetchBookingData = async () => {
      // If booking is passed via navigation state, use it
      if (location.state && location.state._id) {
        setBooking(location.state);
        return;
      }

      // Check localStorage for last booking as fallback
      const lastBooking = localStorage.getItem('lastPorterBooking');
      if (lastBooking) {
        try {
          const parsedBooking = JSON.parse(lastBooking);
          setBooking(parsedBooking);
          return;
        } catch (err) {
          console.warn('Failed to parse last booking from localStorage:', err);
        }
      }

      // If no booking in state or localStorage, try to get the most recent booking from API
      setLoading(true);
      try {
        const userBookings = await getUserPorterRequests();
        if (userBookings && userBookings.length > 0) {
          // Get the most recent booking
          const mostRecentBooking = userBookings[0];
          setBooking(mostRecentBooking);
        } else {
          setError('No bookings found. Please create a new booking.');
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError('Failed to load booking data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!booking) {
      fetchBookingData();
    }
  }, [booking, location.state]);

  // Poll for status/driver updates
  useEffect(() => {
    if (!booking?._id && !booking?.requestId) return;

    const id = booking.requestId || booking._id;
    const poll = async () => {
      try {
        const updated = await getPorterRequest(id);
        if (updated) {
          setBooking(prev => {
            const next = { ...prev, ...updated };
            // prefer driver_info shape for UI
            if (updated.driver_info) next.driver_info = updated.driver_info;
            if (updated.status) next.status = updated.status;
            try { localStorage.setItem('lastPorterBooking', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      } catch (e) {
        // silent
      }
    };

    // initial and interval
    poll();
    const intervalId = setInterval(poll, 5000);
    return () => clearInterval(intervalId);
  }, [booking?._id, booking?.requestId]);

  // Normalize driver info (support both driver_info and driver_id shapes)
  const driver = booking?.driver_info || booking?.driver_id || null;

  // Human friendly status text
  const friendlyStatus = (status) => {
    const map = {
      pending: 'pending',
      confirmed: 'Driver assigned',
      assigned: 'Driver assigned',
      'in_progress': 'Driver on the way',
      'in-progress': 'Driver on the way',
      'on_the_way': 'Driver on the way',
      'on-the-way': 'Driver on the way',
      'in_transit': 'Out for delivery',
      'picked_up': 'Package picked up',
      delivered: 'Package delivered',
      completed: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled'
    };
    return map[status] || status;
  };

  // Convert booking data to format expected by PorterMapView
  const getPickupLocationForMap = () => {
    if (!booking?.pickup_location) return null;
    return {
      lat: booking.pickup_location.latitude || 13.0827,
      lng: booking.pickup_location.longitude || 80.2707,
      address: booking.pickup_location.address
    };
  };

  const getDropoffLocationForMap = () => {
    if (!booking?.dropoff_location) return null;
    return {
      lat: booking.dropoff_location.latitude || 13.0827,
      lng: booking.dropoff_location.longitude || 80.2707,
      address: booking.dropoff_location.address
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center max-w-md">
          <div className="text-gray-500 text-lg mb-4">
            {error || "No booking details found."}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/porter')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Create New Booking
            </button>
            <button
              onClick={() => navigate('/porter/history')}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              View Booking History
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleSubmit() {
    const id = booking._id;
    if (id) {
      navigate(`/porter/live-tracking/${id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 mt-6">
        {/* Header with Back Button and Title */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/porter/confirmation', { state: booking })}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <img src={backIcon} alt="Back" className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-green-600 flex-1 text-center">
            🎉 Booking Confirmed!
          </h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
        <p className="text-center text-sm text-gray-500 mb-4">
          Your booking has been successfully placed.
        </p>

        {/* User Information */}
        {(userProfile.fullName || userProfile.phone || userProfile.email) && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-blue-600 mr-2">👤</span>
              Customer Information
            </h3>
            <div className="space-y-2">
              {userProfile.fullName && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">👤</span>
                  <span className="text-sm text-gray-700">{userProfile.fullName}</span>
                </div>
              )}
              {userProfile.phone && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📞</span>
                  <span className="text-sm text-gray-700">{userProfile.phone}</span>
                </div>
              )}
              {userProfile.email && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">✉️</span>
                  <span className="text-sm text-gray-700">{userProfile.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 text-gray-700 text-sm">
          <div>
            <span className="font-semibold">📍 Pickup:</span>{" "}
            {booking.pickup_location?.address}
          </div>
          <div>
            <span className="font-semibold">📍 Drop:</span> {booking.dropoff_location?.address}
          </div>
          <div>
            <span className="font-semibold">🚚 Vehicle Type:</span>{" "}
            {booking.vehicle_type}
          </div>
          {driver && (
            <div>
              <span className="font-semibold">💁 Assigned Driver:</span>{" "}
              {driver.name || driver.driver_name || 'TBD'}
            </div>
          )}
          <div>
            <span className="font-semibold">📏 Distance:</span>{" "}
            {booking.distance} km
          </div>
          <div>
            <span className="font-semibold">💰 Fare:</span> ₹{booking.fare}
          </div>
          <div>
            <span className="font-semibold">⏱️ Status:</span>{" "}
            <span
              className={`font-semibold ${
                booking.status === "pending"
                  ? "text-yellow-500"
                  : booking.status === "completed"
                  ? "text-green-600"
                  : "text-blue-500"
              }`}
            >
              {friendlyStatus(booking.status)}
            </span>
          </div>
          <div>
            <span className="font-semibold">📅 Booked At:</span>{" "}
            {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : ''}
          </div>
        </div>

        {/* Delivery OTP Display */}
        {hasOtp(booking) && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg shadow-sm">
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
                    {getOtpCode(booking)}
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
                  Share this OTP with the driver
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button onClick={handleSubmit}
            className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
            disabled={!booking._id}
          >
            🔄 Live Tracking
          </button>
        </div>
      </div>

      {/* Google Maps Integration */}
      <div className="max-w-md mx-auto p-4 mt-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Route Overview</h3>
          <PorterMapView
            pickupLocation={getPickupLocationForMap()}
            dropoffLocation={getDropoffLocationForMap()}
            showMap={true}
            style={{ height: '300px', width: '100%' }}
            className="bg-white rounded-2xl shadow-lg"
            showTraffic={false}
            showRoute={true}
          />
        </div>
      </div>

      <FooterNav/>
    </div>
  );
};

export default Tracking;
