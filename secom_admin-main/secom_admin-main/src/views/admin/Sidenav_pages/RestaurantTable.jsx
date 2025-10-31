import React, { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
} from '@material-tailwind/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FaEllipsisV, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { restaurantService } from '../../../services/restaurantService';
import API_CONFIG from '../../../config/api.config';
import { toast } from 'react-toastify';

const RestaurantTable = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, restaurants: [] });
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);

  // Toast configuration
  const toastOptions = {
    position: 'top-left',
    autoClose: 2500,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    style: {
      width: '300px',
      fontSize: '14px',
    },
  };

  // Debounced search
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  // Fetch restaurants
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getAll();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to fetch restaurants', toastOptions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = (restaurantId) => {
    setSelectedRestaurants((prev) =>
      prev.includes(restaurantId)
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };

  // Handle delete (for both single and multiple)
  const handleDelete = async () => {
    if (deleteDialog.restaurants.length === 0) return;
    try {
      await Promise.all(
        deleteDialog.restaurants.map((r) => restaurantService.delete(r.id))
      );
      toast.success(
        `Deleted ${deleteDialog.restaurants.length} restaurant(s) successfully`,
        toastOptions
      );
      fetchRestaurants();
      setSelectedRestaurants((prev) =>
        prev.filter((id) => !deleteDialog.restaurants.some((r) => r.id === id))
      );
      setDeleteDialog({ open: false, restaurants: [] });
    } catch (error) {
      console.error('Error deleting restaurants:', error);
      toast.error('Failed to delete restaurants', toastOptions);
    }
  };

  // Open delete dialog for multiple restaurants
  const openDeleteDialog = () => {
    if (selectedRestaurants.length > 0) {
      const selected = restaurants.filter((r) => selectedRestaurants.includes(r.id));
      setDeleteDialog({ open: true, restaurants: selected });
    }
  };

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    return (Array.isArray(restaurants) ? restaurants : [])
      .filter((restaurant) => {
        if (statusFilter === 'active') return restaurant.status === true;
        if (statusFilter === 'inactive') return restaurant.status === false;
        return true;
      })
      .filter((restaurant) => {
        return (
          restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.category_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [restaurants, searchTerm, statusFilter]);

  // Navigate to add/edit form
  const navigateToForm = (restaurant = null) => {
    const path = restaurant ? `/admin/restaurant/edit/${restaurant.id}` : '/admin/restaurant/new';
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Typography variant="h6">Loading restaurants...</Typography>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-8 flex flex-col items-center gap-8">
      <Card className="w-full max-w-5xl shadow-lg p-2">
        <Typography variant="h5" className="text-2xl font-bold text-gray-800 p-4">
          Restaurants
        </Typography>
        <CardBody className="px-0 pt-0 pb-2">
          {/* Search and Add Button */}
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-blue-gray-50 bg-blue-gray-50/30 rounded-t-lg">
            <div className="flex-1 flex gap-2 items-center">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-gray-400" />
                <Input
                  type="text"
                  placeholder="Search restaurants..."
                  onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                  className="pl-10"
                  labelProps={{ className: 'hidden' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-blue-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              >
                <option value="all">All</option>
                <option value="active">Available</option>
                <option value="inactive">Unavailable</option>
              </select>
            </div>
            <div className="flex gap-2">
              {selectedRestaurants.length > 0 && (
                <Button
                  color="red"
                  className="flex items-center gap-2 transition-all duration-200 animate-in slide-in-from-right-2"
                  onClick={openDeleteDialog}
                >
                  <FaTrashAlt className="h-4 w-4" />
                  Delete {selectedRestaurants.length}
                </Button>
              )}
              <Button
                color="blue"
                className="flex items-center gap-2 transition-colors duration-150"
                onClick={() => navigateToForm()}
              >
                <PlusIcon className="h-4 w-4" />
                Add Restaurant
              </Button>
            </div>
          </div>
          {/* Table with fixed header and scrollable tbody */}
          <div className="bg-white rounded-b-lg shadow-inner">
            <table className="w-full min-w-[800px] table-fixed">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-16">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedRestaurants.length === filteredRestaurants.length && filteredRestaurants.length > 0}
                      onChange={() => {
                        if (selectedRestaurants.length === filteredRestaurants.length) {
                          setSelectedRestaurants([]);
                        } else {
                          setSelectedRestaurants(filteredRestaurants.map((r) => r.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-20">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Image
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-40">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Name
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-56">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Address
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-40">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Category
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-28">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Status
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-28">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Actions
                    </Typography>
                  </th>
                </tr>
              </thead>
            </table>
            <div className="h-[400px] overflow-y-auto">
              <table className="w-full min-w-[800px] table-fixed">
                <tbody>
                  {filteredRestaurants.map((restaurant, key) => (
                    <tr key={key} className="hover:bg-blue-gray-50 transition-colors duration-150">
                      <td className="py-3 px-6 w-16">
                        <input
                          type="checkbox"
                          id={`select-${restaurant.id}`}
                          checked={selectedRestaurants.includes(restaurant.id)}
                          onChange={() => handleCheckboxChange(restaurant.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-6 w-20">
                        {restaurant.image ? (
                          <img
                            src={API_CONFIG.getUrl(restaurant.image)}
                            alt={restaurant.name}
                            className="h-16 w-16 rounded-lg object-cover border border-blue-gray-100"
                            onError={(e) => {
                              e.target.src = '/path/to/fallback-image.png';
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-blue-gray-100 flex items-center justify-center border border-blue-gray-100">
                            <Typography variant="small" className="text-blue-gray-400">
                              No Image
                            </Typography>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 w-40">
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          {restaurant.name}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-56">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {restaurant.address || 'No address'}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-40">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {restaurant.category_id?.name || 'No category'}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-28 align-middle">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full ${
                            restaurant.status === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          } leading-tight min-w-[56px] h-6`}
                        >
                          {restaurant.status === true ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="py-3 px-6 w-28">
                        <div className="relative inline-block group">
                          <button className="text-gray-600 hover:text-gray-900" aria-label={`Actions for ${restaurant.name}`}>
                            <FaEllipsisV />
                          </button>
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                            <button
                              onClick={() => navigateToForm(restaurant)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                              aria-label={`Edit ${restaurant.name}`}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ open: true, restaurants: [restaurant] })}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                              aria-label={`Delete ${restaurant.name}`}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 flex flex-col items-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
              <FaTrashAlt className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-2 text-center w-full">Delete Restaurant(s)</div>
            <div className="text-center text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-bold text-gray-900">
                {deleteDialog.restaurants.length > 1
                  ? `${deleteDialog.restaurants.length} restaurants`
                  : `"${deleteDialog.restaurants[0]?.name}"`}
              </span>?<br />
              <span className="text-xs text-gray-400">This action cannot be undone.</span>
            </div>
            <div className="flex w-full justify-center gap-2 mt-2">
              <Button
                variant="text"
                color="gray"
                onClick={() => setDeleteDialog({ open: false, restaurants: [] })}
                className="rounded-md px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
              >
                Cancel
              </Button>
              <Button
                variant="text"
                color="red"
                onClick={handleDelete}
                className="rounded-md px-4 py-2 flex items-center gap-2 transition-colors duration-150"
              >
                <FaTrashAlt className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantTable;