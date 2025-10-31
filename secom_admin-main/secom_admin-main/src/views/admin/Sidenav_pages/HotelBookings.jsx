import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaEye, FaEdit, FaEllipsisV, FaTrashAlt } from 'react-icons/fa';
import hotelBookingService from '../../../services/hotelBookingService';

const HotelBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await hotelBookingService.getAllBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch hotel bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await hotelBookingService.updateBookingStatus(bookingId, newStatus);
      toast.success('Booking status updated successfully');
      fetchBookings(); // Refresh the list
    } catch (err) {
      toast.error('Failed to update booking status');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      await hotelBookingService.deleteBooking(bookingId);
      toast.success('Booking deleted successfully');
      fetchBookings(); // Refresh the list
    } catch (err) {
      toast.error('Failed to delete booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Safely resolve guest information from various possible fields
  const getGuestInfo = (booking) => {
    if (!booking) return { name: 'N/A', email: 'N/A', phone: null };
    const candidateName =
      booking.guest?.name ||
      booking.guest_name ||
      booking.name ||
      booking.contact_name ||
      booking.bookingDetails?.name ||
      booking.customer?.name ||
      booking.profile?.fullName ||
      booking.user?.fullName ||
      booking.user?.name;

    const candidateEmail =
      booking.guest?.email ||
      booking.guest_email ||
      booking.email ||
      booking.contact_email ||
      booking.bookingDetails?.email ||
      booking.customer?.email ||
      booking.user?.email ||
      null;

    const candidatePhone =
      booking.contact_number ||
      booking.phone ||
      booking.bookingDetails?.contact ||
      booking.guest?.phone ||
      booking.customer?.phone ||
      booking.user?.phone ||
      null;

    return {
      name: candidateName || 'Guest',
      email: candidateEmail || (candidatePhone ? `+91 ${candidatePhone}` : 'N/A'),
      phone: candidatePhone
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading hotel bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error}</p>
        <button
          onClick={fetchBookings}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Hotel Bookings</h2>
        {/* <div className="flex gap-2">
          <button
            onClick={fetchBookings}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-semibold"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div> */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {/* <th className="px-4 py-2 border text-left">Booking ID</th> */}
              <th className="px-4 py-2 border text-left">Guest</th>
              <th className="px-4 py-2 border text-left">Hotel</th>
              <th className="px-4 py-2 border text-left">Room</th>
              <th className="px-4 py-2 border text-left">Check-in</th>
              <th className="px-4 py-2 border text-left">Check-out</th>
              <th className="px-4 py-2 border text-left">Guests</th>
              <th className="px-4 py-2 border text-left">Total Amount</th>
              <th className="px-4 py-2 border text-left">Booking Status</th>
              <th className="px-4 py-2 border text-left">Payment Status</th>
              <th className="px-4 py-2 border text-left">Created At</th>
              {/* <th className="px-4 py-2 border text-left">Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-2 text-center text-gray-500">
                  No hotel bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const guest = getGuestInfo(booking);
                return (
                <tr key={booking._id} className="border-b hover:bg-gray-50">
                  {/* <td className="px-4 py-2 border">
                    <span className="font-mono text-sm">{booking._id?.slice(-8)}</span>
                  </td> */}
                  <td className="px-4 py-2 border">
                    <div>
                      <div className="font-medium">{guest.name || 'Guest'}</div>
                      {guest.phone && (
                        <div className="text-sm text-gray-700">{guest.phone}</div>
                      )}
                      {guest.email && (
                        <div className="text-xs text-gray-500">{guest.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    {booking.hotel ? (
                      <div>
                        <div className="font-medium">{booking.hotel.name}</div>
                        <div className="text-sm text-gray-500">{booking.hotel.address?.city || 'N/A'}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Hotel not found</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    {booking.room ? (
                      <div>
                        <div className="font-medium">{booking.room.name}</div>
                        <div className="text-sm text-gray-500">{booking.room.type}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Room not found</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    {formatDate(booking.check_in_date)}
                  </td>
                  <td className="px-4 py-2 border">
                    {formatDate(booking.check_out_date)}
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="text-sm">
                      <div>Adults: {booking.guests?.adults || 0}</div>
                      <div>Children: {booking.guests?.children || 0}</div>
                      <div>Infants: {booking.guests?.infants || 0}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="font-medium">{formatCurrency(booking.final_amount)}</div>
                    <div className="text-sm text-gray-500">
                      {booking.total_nights} night{booking.total_nights !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    <select
                      value={booking.booking_status}
                      onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.booking_status)} border-0`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                      {booking.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="text-sm">
                      <div>{formatDateTime(booking.createdAt)}</div>
                    </div>
                  </td>
                  {/* <td className="px-4 py-2 border">
                    <div className="relative inline-block group">
                      <button className="text-gray-600 hover:text-gray-900">
                        <FaEllipsisV />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <button
                          onClick={() => handleDelete(booking._id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <FaTrashAlt className="mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </td> */}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HotelBookings; 