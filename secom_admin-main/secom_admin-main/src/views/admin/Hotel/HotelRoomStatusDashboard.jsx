import React, { useEffect, useState } from 'react';
import HotelService from './HotelService';

const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const HotelRoomStatusDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      try {
        const allHotels = await HotelService.getAllHotels();
        const user = getUserData();
        let filteredHotels = allHotels;
        if (user && user.role !== 'admin') {
          filteredHotels = allHotels.filter(hotel => hotel.created_by === user._id || hotel.created_by === user.id);
        }
        setHotels(filteredHotels);
        if (filteredHotels.length === 1) {
          setSelectedHotelId(filteredHotels[0]._id || filteredHotels[0].id);
        }
      } catch (err) {
        setError('Failed to fetch hotels.');
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  useEffect(() => {
    if (!selectedHotelId) return;
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await HotelService.getRoomsWithBookingStatus(selectedHotelId);
        setRooms(data || []);
      } catch (err) {
        setError('Failed to fetch room status data.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [selectedHotelId]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Room Booking Status Dashboard</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : hotels.length === 0 ? (
        <div>No hotels available for your account.</div>
      ) : (
        <>
          {hotels.length > 1 && (
            <div className="mb-4">
              <label className="font-medium mr-2">Select Hotel:</label>
              <select
                className="input input-bordered"
                value={selectedHotelId}
                onChange={e => setSelectedHotelId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {hotels.map(hotel => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedHotelId && hotels.find(h => h._id === selectedHotelId) && (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border">Room Number</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Price/Night</th>
                  <th className="px-4 py-2 border">Current Booking</th>
                  <th className="px-4 py-2 border">Guest</th>
                  <th className="px-4 py-2 border">Check-in</th>
                  <th className="px-4 py-2 border">Check-out</th>
                  <th className="px-4 py-2 border">Booking Price</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 border">{room.room_number}</td>
                    <td className="px-4 py-2 border">{room.type}</td>
                    <td className="px-4 py-2 border">{room.status}</td>
                    <td className="px-4 py-2 border">${room.price_per_night}</td>
                    <td className="px-4 py-2 border">
                      {room.current_booking ? room.current_booking.status : 'No Booking'}
                    </td>
                    <td className="px-4 py-2 border">
                      {room.current_booking ? room.current_booking.guest : '-'}
                    </td>
                    <td className="px-4 py-2 border">
                      {room.current_booking ? room.current_booking.check_in_date : '-'}
                    </td>
                    <td className="px-4 py-2 border">
                      {room.current_booking ? room.current_booking.check_out_date : '-'}
                    </td>
                    <td className="px-4 py-2 border">
                      {room.current_booking && room.current_booking.final_amount ? `$${room.current_booking.final_amount}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default HotelRoomStatusDashboard; 