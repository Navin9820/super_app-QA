import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FooterNav from '../Porter/Footer';
import { getUserPorterRequests } from '../services/porterService';
import { getOtpCode, hasOtp } from '../utils/otpUtils';
import backIcon from '../Icons/arrow-left.svg';

const Booking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealedOtps, setRevealedOtps] = useState(new Set());
  const navigate = useNavigate();

  const toggleOtpVisibility = (bookingId) => {
    setRevealedOtps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const userBookings = await getUserPorterRequests();
        setBookings(userBookings || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load booking history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
    // Poll periodically to keep history fresh
    const id = setInterval(fetchBookings, 10000);
    return () => clearInterval(id);
  }, []);

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
      delivered: 'delivered',
      completed: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled'
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 mt-6">
        {/* Header with Back Button and Title */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <img src={backIcon} alt="Back" className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-blue-600 flex-1 text-center">
            🚚 Porter Booking History
          </h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-500">Loading bookings...</div>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center">
            <div className="text-gray-500 mb-4">No bookings found.</div>
            <button
              onClick={() => navigate('/porter')}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Create New Booking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, idx) => (
              <div 
                key={booking._id || idx} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate('/porter/tracking', { state: booking })}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm text-gray-700">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : ''}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {friendlyStatus(booking.status)}
                  </div>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><span className="font-semibold">📍 Pickup:</span> {booking.pickup_location?.address}</div>
                  <div><span className="font-semibold">📍 Drop:</span> {booking.dropoff_location?.address}</div>
                  <div className="flex justify-between">
                    { (booking.driver_info?.vehicle_number || booking.driver_id?.vehicle_number) ? (
                      <span><span className="font-semibold">🚗 Vehicle:</span> {booking.driver_info?.vehicle_number || booking.driver_id?.vehicle_number}</span>
                    ) : <span></span> }
                    <span><span className="font-semibold">💰 Fare:</span> ₹{booking.fare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><span className="font-semibold">👨‍💼 Driver:</span> {booking.driver_info?.driver_name || booking.driver_id?.name || 'TBD'}</span>
                    <span><span className="font-semibold">📏 Distance:</span> {booking.distance} km</span>
                  </div>
                  
                  {/* Delivery OTP Display */}
                  {hasOtp(booking) && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-yellow-100 rounded-md p-2 -m-2 transition-colors duration-200"
                        onClick={() => toggleOtpVisibility(booking._id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-yellow-800">🔐 Porter OTP</span>
                          <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">
                            {revealedOtps.has(booking._id) ? 'Hide' : 'Click to reveal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {revealedOtps.has(booking._id) ? (
                            <div className="text-lg font-bold text-yellow-900 font-mono tracking-wider">
                              {getOtpCode(booking)}
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-yellow-600 font-mono tracking-wider">
                              ••••••
                            </div>
                          )}
                          <div className="text-yellow-600">
                            {revealedOtps.has(booking._id) ? '👁️' : '👁️‍🗨️'}
                          </div>
                        </div>
                      </div>
                      {revealedOtps.has(booking._id) && (
                        <div className="text-xs text-yellow-700 mt-2 pt-2 border-t border-yellow-200">
                          Share this OTP with the driver
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  Click to view details →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FooterNav/>
    </div>
  );
};

export default Booking;
