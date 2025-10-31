import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaHome, FaTrashAlt, FaEllipsisV } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HotelService from './HotelService';
import API_CONFIG from '../../../config/api.config';

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return API_CONFIG.getUrl(path);
}

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const [roomPrices, setRoomPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Fetch hotels and room prices
  useEffect(() => {
    setLoading(true);
    setError(null);
    HotelService.getAllHotels()
      .then(async (data) => {
        setHotels(data);
        const prices = {};
        await Promise.all(
          data.map(async (hotel) => {
            try {
              const rooms = await HotelService.getRoomsForHotel(hotel._id || hotel.id);
              if (rooms && rooms.length > 0) {
                const minPrice = Math.min(...rooms.map((r) => r.price_per_night || 0));
                prices[hotel._id || hotel.id] = minPrice;
              } else {
                prices[hotel._id || hotel.id] = null;
              }
            } catch {
              prices[hotel._id || hotel.id] = null;
            }
          })
        );
        setRoomPrices(prices);
      })
      .catch((err) => {
        setError('Failed to fetch hotels');
        toast.error('Failed to fetch hotels');
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = (hotelId) => {
    setSelectedHotels((prev) =>
      prev.includes(hotelId)
        ? prev.filter((id) => id !== hotelId)
        : [...prev, hotelId]
    );
  };

  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (selectedHotels.length === hotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(hotels.map((hotel) => hotel._id || hotel.id));
    }
  };

  // Handle bulk delete
  const handleDeleteConfirmation = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(
        selectedHotels.map((hotelId) => HotelService.deleteHotel(hotelId))
      );
      toast.success('Selected hotels deleted successfully!');
      setHotels((prevHotels) => prevHotels.filter((hotel) => !selectedHotels.includes(hotel._id || hotel.id)));
      setRoomPrices((prevPrices) => {
        const newPrices = { ...prevPrices };
        selectedHotels.forEach((hotelId) => delete newPrices[hotelId]);
        return newPrices;
      });
      setSelectedHotels([]);
      setOpenDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete hotels. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  return (
    <div className="p-8">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hotel Management</h1>
        <div className="flex gap-2 items-center">
          {selectedHotels.length > 0 && (
            <button
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150"
              onClick={() => setOpenDeleteDialog(true)}
              aria-label="Delete selected hotels"
            >
              <FaTrashAlt className="mr-2" /> Delete Selected
            </button>
          )}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center transition-colors duration-150"
            onClick={() => navigate('/admin/hotels/new')}
            aria-label="Add new hotel"
          >
            + Add Hotel
          </button>
        </div>
      </div>
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && hotels.length === 0 && <div>No hotels found.</div>}
      {!loading && !error && hotels.length > 0 && (
        <table className="min-w-full bg-white border border-gray-200 rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase w-16">
                <input
                  type="checkbox"
                  checked={selectedHotels.length === hotels.length && hotels.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Select all hotels"
                />
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Amenities</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Policies</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => {
              const hotelId = hotel._id || hotel.id;
              const price = roomPrices[hotelId];
              return (
                <tr key={hotelId} className="border-b hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-2 px-4 w-16">
                    <input
                      type="checkbox"
                      checked={selectedHotels.includes(hotelId)}
                      onChange={() => handleCheckboxChange(hotelId)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select ${hotel.name}`}
                    />
                  </td>
                  <td className="py-2 px-4">
                    {hotel.main_image ? (
                      <img
                        src={getImageUrl(hotel.main_image)}
                        alt={hotel.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="py-2 px-4">{hotel.name}</td>
                  <td className="py-2 px-4">{hotel.address?.city || hotel.address || '-'}</td>
                  <td className="py-2 px-4">
                    {hotel.amenities && hotel.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {hotel.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={amenity._id || index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {amenity.name}
                          </span>
                        ))}
                        {hotel.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{hotel.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No amenities</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {hotel.policies && hotel.policies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {hotel.policies.slice(0, 3).map((policy, index) => (
                          <span
                            key={policy._id || index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {policy.title}
                          </span>
                        ))}
                        {hotel.policies.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{hotel.policies.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No policies</span>
                    )}
                  </td>
                  <td className="py-2 px-4 font-semibold">
                    {price === undefined ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : price === null ? (
                      <span className="text-gray-400">No rooms</span>
                    ) : (
                      <span>From ₹{price}/night</span>
                    )}
                  </td>
                  <td className="py-2 px-11 w-28">
                    <div className="relative inline-block group">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        aria-label={`Actions for ${hotel.name}`}
                      >
                        <FaEllipsisV />
                      </button>
                      <div
                        className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2"
                      >
                        <button
                          onClick={() => navigate(`/admin/hotels/edit/${hotelId}`)}
                          className="text-blue-600 hover:text-blue-600"
                          aria-label={`Edit hotel ${hotel.name}`}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/hotels/${hotelId}/rooms`)}
                          className="text-green-600 hover:text-green-800"
                          aria-label={`Manage rooms for ${hotel.name}`}
                          title="Manage Rooms"
                        >
                          <FaHome />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {openDeleteDialog && (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaTrashAlt className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-gray-800">
              Delete {selectedHotels.length} Hotel{selectedHotels.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-gray-600 mb-4">
            Are you sure you want to delete {selectedHotels.length} selected hotel{selectedHotels.length > 1 ? 's' : ''}?
            <br />
            <span className="text-xs text-gray-400">This action cannot be undone.</span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelDelete}
              className="rounded-md px-3 py-1 text-gray-700 border border-gray-300 hover:bg-gray-100"
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmation}
              disabled={isDeleting}
              className="rounded-md px-3 py-1 flex items-center gap-2 text-red-600 hover:text-red-700 disabled:opacity-50"
              aria-label="Confirm deletion"
            >
              <FaTrashAlt className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelList;