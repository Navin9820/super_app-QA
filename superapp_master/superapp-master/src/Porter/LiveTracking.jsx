import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, getPorterRequest } from '../services/porterService';
import PorterMapView from './PorterMapView';
import Footer from './Footer';

function LiveTracking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('LiveTracking component loaded with bookingId:', bookingId);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setError('Request timed out. Please try again.');
        setLoading(false);
      }, 10000); // 10 second timeout

      try {
        // First try to get from API
        console.log('Fetching booking with ID:', bookingId);
        const res = await getBookingById(bookingId);
        clearTimeout(timeoutId);
        
        console.log('API response:', res);
        
        if (res.success && res.data) {
          console.log('Booking data loaded:', res.data);
          setBooking(res.data);
          return;
        }

        // If API fails, try to get from localStorage as fallback
        const lastBooking = localStorage.getItem('lastPorterBooking');
        if (lastBooking) {
          try {
            const parsedBooking = JSON.parse(lastBooking);
            if (parsedBooking._id === bookingId || parsedBooking.requestId === bookingId) {
              setBooking(parsedBooking);
              return;
            }
          } catch (parseErr) {
            console.warn('Failed to parse last booking from localStorage:', parseErr);
          }
        }

        setError('Booking not found');
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Poll for live updates (status + driver info)
  useEffect(() => {
    if (!bookingId) return;
    const poll = async () => {
      try {
        const updated = await getPorterRequest(bookingId);
        if (updated) {
          setBooking(prev => {
            const next = { ...prev, ...updated };
            try { localStorage.setItem('lastPorterBooking', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      } catch (e) {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [bookingId]);

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

  const getDriverLocationForMap = () => {
    if (booking?.driver_id?.current_location) {
      return {
        lat: booking.driver_id.current_location.latitude,
        lng: booking.driver_id.current_location.longitude,
        address: 'Driver Location'
      };
    }
    return getPickupLocationForMap(); // Fallback to pickup location
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Tracking Unavailable</h2>
          <p className="text-gray-600 mb-6">{error || 'Booking not found'}</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/porter/tracking')} 
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              ← Back to Tracking
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/porter/tracking')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Live Tracking</h1>
            <div className="w-12"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Booking Info Card */}
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🚚</div>
            <h2 className="text-lg font-bold text-gray-800">Booking #{booking._id?.slice(-6) || 'N/A'}</h2>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {booking.status}
            </div>
          </div>

          {/* Driver Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">Driver Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {booking.driver_info?.driver_name || booking.driver_id?.name || 'TBD'}</p>
              <p><span className="font-medium">Vehicle:</span> {booking.driver_info?.vehicle_number || booking.driver_id?.vehicle_number || ''}</p>
              <p><span className="font-medium">Phone:</span> {booking.driver_info?.driver_phone || booking.driver_id?.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-800 text-sm mb-1">📍 Pickup</h4>
              <p className="text-yellow-700 text-xs">{booking.pickup_location?.address || 'Address not available'}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-semibold text-red-800 text-sm mb-1">🎯 Dropoff</h4>
              <p className="text-red-700 text-xs">{booking.dropoff_location?.address || 'Address not available'}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">Booking Details</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p><span className="font-medium">Vehicle:</span> {booking.vehicle_type}</p>
                <p><span className="font-medium">Distance:</span> {booking.distance || 'N/A'} km</p>
              </div>
              <div>
                <p><span className="font-medium">Fare:</span> ₹{booking.fare}</p>
                <p><span className="font-medium">Item:</span> {booking.item_description || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps Integration - Same as Porter Home */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Live Location Tracking</h3>
          <PorterMapView
            pickupLocation={getPickupLocationForMap()}
            dropoffLocation={getDropoffLocationForMap()}
            driverLocation={getDriverLocationForMap()}
            showMap={true}
            style={{ height: '400px', width: '100%' }}
            className="bg-white rounded-2xl shadow-lg"
            showTraffic={true}
            showRoute={true}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LiveTracking; 