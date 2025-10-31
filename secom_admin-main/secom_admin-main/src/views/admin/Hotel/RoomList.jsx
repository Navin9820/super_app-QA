import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Tooltip, IconButton } from '@material-tailwind/react';
import RoomService from './RoomService';
import API_CONFIG from '../../../config/api.config';

function RoomList() {
  const { hotelId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    RoomService.getRoomsForHotel(hotelId)
      .then(setRooms)
      .catch(() => setError('Failed to fetch rooms'))
      .finally(() => setLoading(false));
  }, [hotelId]);

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await RoomService.deleteRoom(roomId);
        // Refresh the room list
        const updatedRooms = await RoomService.getRoomsForHotel(hotelId);
        setRooms(updatedRooms);
      } catch (error) {
        console.error('Error deleting room:', error);
        setError('Failed to delete room');
      }
    }
  };

  const renderImageGallery = (images, mainImage) => {
    // Prefer gallery images; fall back to main image
    const displayImages = Array.isArray(images) && images.length > 0 ? images : (mainImage ? [mainImage] : []);
    if (displayImages.length === 0) {
      return (
        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
          No Image
        </div>
      );
    }

    return (
      <div className="flex gap-1">
        {displayImages.slice(0, 3).map((imagePath, index) => (
          <img
            key={index}
                                src={API_CONFIG.getImageUrl(imagePath)}
            alt={`Room ${index + 1}`}
            className="w-12 h-12 object-cover rounded border"
            title={`Image ${index + 1}`}
          />
        ))}
        {displayImages.length > 3 && (
          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600">
            +{displayImages.length - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Room Management</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => navigate(`/admin/hotels/${hotelId}/rooms/new`)}
        >
          + Add Room
        </button>
      </div>
      {loading && <div>Loading rooms...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && rooms.length === 0 && (
        <div>No rooms found for this hotel.</div>
      )}
      {!loading && !error && rooms.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded shadow">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Images</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Price</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id || room.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {renderImageGallery(room.images, room.main_image)}
                  </td>
                  <td className="py-2 px-4 font-medium">{room.name}</td>
                  <td className="py-2 px-4 capitalize">{room.type}</td>
                  <td className="py-2 px-4">₹{room.price_per_night}/night</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      room.status === 'available' ? 'bg-green-100 text-green-800' :
                      room.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex space-x-2">
                      <Tooltip content="Edit Room">
                        <IconButton
                          variant="text"
                          color="blue-gray"
                          onClick={() => navigate(`/admin/hotels/${hotelId}/rooms/edit/${room._id}`)}
                        >
                          <FaEdit className="text-lg" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip content="Delete Room">
                        <IconButton
                          variant="text"
                          color="red"
                          onClick={() => handleDelete(room._id)}
                        >
                          <FaTrashAlt className="text-lg" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RoomList; 