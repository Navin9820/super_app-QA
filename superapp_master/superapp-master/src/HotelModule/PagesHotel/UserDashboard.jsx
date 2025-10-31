import API_CONFIG from '../../config/api.config.js';
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, User, Star, ArrowLeft, X } from 'lucide-react';
import CancellationModal from '../ComponentsHotel/CancellationModal';
import { cancelBooking } from '../Services/hotelApi';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelIndex, setCancelIndex] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Custom toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Fetch bookings from backend on mount
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.MY_BOOKINGS), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        // Fallback to localStorage if API fails
        const arr = localStorage.getItem('hotelBookings');
        const localBookings = arr ? JSON.parse(arr) : [];
        setBookings(localBookings);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Filter out empty/invalid bookings
  const filteredValid = bookings.filter((booking) => {
    const { hotel, bookingDetails } = booking || {};
    const hasHotel = hotel && hotel.name && hotel.name !== 'Hotel Name';
    const hasGuest = bookingDetails && bookingDetails.name && bookingDetails.name !== 'N/A';
    const hasCheckIn = bookingDetails && bookingDetails.checkIn && bookingDetails.checkIn !== 'N/A';
    const hasCheckOut = bookingDetails && bookingDetails.checkOut && bookingDetails.checkOut !== 'N/A';
    return hasHotel || hasGuest || hasCheckIn || hasCheckOut;
  });

  // Remove duplicates by unique booking key
  const seenKeys = new Set();
  const filteredBookings = filteredValid.filter((b) => {
    const bd = b?.bookingDetails || {};
    const key = `${bd.hotel_id || ''}|${bd.room_id || ''}|${bd.checkIn || ''}|${bd.checkOut || ''}|${bd.contact || ''}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const openCancelModal = (idx) => {
    setCancelIndex(idx);
    setIsModalOpen(true);
  };

  const handleConfirmCancellation = async (reason) => {
    setIsCancelling(true);
    try {
      const booking = bookings[cancelIndex];
      await cancelBooking(booking, reason);
      const updated = bookings.filter((_, i) => i !== cancelIndex);
      setBookings(updated);
      localStorage.setItem('hotelBookings', JSON.stringify(updated));
      showToast('Booking cancelled successfully!', 'success');
    } catch (error) {
      showToast('An error occurred during cancellation. Please try again.', 'error');
    } finally {
      setIsCancelling(false);
      setIsModalOpen(false);
      setCancelIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm font-semibold text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (!filteredBookings.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">No Bookings Found</h2>
          <Link
            to="/home-hotel"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            Find a Hotel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-semibold ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <CancellationModal
        isOpen={isModalOpen}
        onClose={() => !isCancelling && setIsModalOpen(false)}
        onConfirm={handleConfirmCancellation}
        isProcessing={isCancelling}
      />
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative text-center mb-6">
            <button
              onClick={() => navigate('/home-hotel')}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 bg-blue-100 rounded-full p-2 shadow-sm transition-transform duration-150 ease-in-out hover:scale-110"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Your Bookings</h1>
            <p className="mt-1 text-sm font-semibold text-gray-600">All your hotel reservations in one place.</p>
          </div>

          {/* Book another stay button */}
          <div className="mb-6 bg-white text-center rounded-lg shadow-sm border border-gray-100 p-4">
            <Link
              to="/home-hotel"
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
            >
              Book another stay
            </Link>
          </div>

          <div className="space-y-6">
            {filteredBookings.map((booking, idx) => {
              const { hotel, city, bookingDetails } = booking;
              const { name, contact, special, checkIn, checkOut, guests } = bookingDetails || {};
              return (
                <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{hotel?.name || 'Hotel Name'}</h2>
                      <div className="flex items-center text-sm font-semibold text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{city || 'City'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openCancelModal(idx)}
                      className="flex items-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                      aria-label="Cancel booking"
                    >
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800 border-b pb-1 flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        Guest Information
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Full Name</label>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Contact Number</label>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{contact || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800 border-b pb-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        Reservation Dates
                      </h3>
                      <div className="flex justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600">Check-in</label>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{checkIn || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 text-right">Check-out</label>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5 text-right">{checkOut || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">Guests</label>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-blue-600" />
                          {guests && typeof guests === 'object'
                            ? `${guests.adults || 0} Adult${guests.adults > 1 ? 's' : ''}${
                                guests.children > 0 ? `, ${guests.children} Child${guests.children > 1 ? 'ren' : ''}` : ''
                              }${guests.infants > 0 ? `, ${guests.infants} Infant${guests.infants > 1 ? 's' : ''}` : ''}`
                            : guests || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {special && (
                      <div className="md:col-span-2 space-y-2 mt-4">
                        <h3 className="text-sm font-semibold text-gray-800 border-b pb-1 flex items-center">
                          <Star className="w-4 h-4 mr-2 text-blue-600" />
                          Special Requests
                        </h3>
                        <p className="text-sm font-semibold text-gray-700 bg-gray-50 p-3 rounded-lg">{special}</p>
                      </div>
                    )}
                    <div className="md:col-span-2 mt-4 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-600">Total Price</span>
                        <span className="text-lg font-semibold text-gray-800">
                          ₹{bookingDetails?.totalAmount?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;