import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
} from '@material-tailwind/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FaEllipsisV, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { dishService } from '../../../services/restaurantService';
import API_CONFIG from '../../../config/api.config';
import { toast } from 'react-toastify';

const DishTable = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, dishes: [] });
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedDishes, setSelectedDishes] = useState([]);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const data = await dishService.getAll();
      setDishes(data);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      toast.error('Failed to fetch dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  const handleCheckboxChange = (dish) => {
    setSelectedDishes((prev) => {
      if (prev.some((d) => (d._id || d.id) === (dish._id || dish.id))) {
        return prev.filter((d) => (d._id || d.id) !== (dish._id || dish.id));
      }
      return [...prev, dish];
    });
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedDishes.map((dish) => dishService.delete(dish._id || dish.id))
      );
      toast.success('Selected dishes deleted successfully');
      fetchDishes();
      setSelectedDishes([]);
      setDeleteDialog({ open: false, dishes: [] });
    } catch (error) {
      console.error('Error deleting dishes:', error);
      toast.error('Failed to delete dishes');
    }
  };

  const filteredDishes = (Array.isArray(dishes) ? dishes : [])
    .filter((dish) => {
      if (statusFilter === 'active') return dish.status === true;
      if (statusFilter === 'inactive') return dish.status === false;
      return true;
    })
    .filter((dish) => {
      const match = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return match;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const navigateToForm = (dish = null) => {
    const dishId = dish ? (dish._id || dish.id) : null;
    const path = dishId ? `/admin/dish/edit/${dishId}` : '/admin/dish/new';
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Typography variant="h6">Loading dishes...</Typography>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-8 flex flex-col items-center gap-8">
      <Card className="w-full max-w-6xl shadow-lg p-2">
        <Typography variant="h5" className="text-2xl font-bold text-gray-800 p-4">
          Dishes
        </Typography>
        <CardBody className="px-0 pt-0 pb-2">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-blue-gray-50 bg-blue-gray-50/30 rounded-t-lg">
            <div className="flex-1 flex gap-2 items-center">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-gray-400" />
                <Input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  labelProps={{ className: "hidden" }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-blue-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              >
                <option value="all">All</option>
                <option value="active">Available</option>
                <option value="inactive">Unavailable</option>
              </select>
            </div>
            <div className="flex gap-2">
              {selectedDishes.length > 0 && (
                <Button
                  color="red"
                  className="flex items-center gap-2 transition-colors duration-150"
                  onClick={() => setDeleteDialog({ open: true, dishes: selectedDishes })}
                >
                  <FaTrashAlt className="h-4 w-4" />
                  Delete Selected
                </Button>
              )}
              <Button
                color="blue"
                className="flex items-center gap-2 transition-colors duration-150"
                onClick={() => navigateToForm()}
              >
                <PlusIcon className="h-4 w-4" />
                Add Dish
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-b-lg shadow-inner">
            <table className="w-full min-w-[900px] table-fixed">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-16">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Select
                    </Typography>
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
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-48">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Description
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-32">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Price
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-40">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Restaurant
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
              <table className="w-full min-w-[900px] table-fixed">
                <tbody>
                  {filteredDishes.map((dish, key) => (
                    <tr key={key} className="hover:bg-blue-gray-50 transition-colors duration-150">
                      <td className="py-3 px-6 w-16">
                        <input
                          type="checkbox"
                          checked={selectedDishes.some((d) => (d._id || d.id) === (dish._id || dish.id))}
                          onChange={() => handleCheckboxChange(dish)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-6 w-20">
                        <div className="flex items-center space-x-2">
                          {dish.image ? (
                            <img
                              src={API_CONFIG.getImageUrl(dish.image)}
                              alt={dish.name}
                              className="h-16 w-16 rounded-lg object-cover border border-blue-gray-100"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-blue-gray-100 flex items-center justify-center border border-blue-gray-100">
                              <Typography variant="small" className="text-blue-gray-400">
                                No Image
                              </Typography>
                            </div>
                          )}
                          {Array.isArray(dish.images) && dish.images.length > 0 && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">Images</span>
                              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {dish.images.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 w-40">
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          {dish.name}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-48">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {dish.description ? (dish.description.length > 50 ? `${dish.description.substring(0, 50)}...` : dish.description) : 'No description'}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-32">
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          ${dish.price ? parseFloat(dish.price).toFixed(2) : '0.00'}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-40">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {dish.restaurant_id?.name || 'No restaurant'}
                        </Typography>
                      </td>
                      <td className="py-3 px-6 w-28 align-middle">
                        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full
                          ${dish.status === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          leading-tight min-w-[56px] h-6`}>
                          {dish.status === true ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="py-3 px-12 w-28">
                        <div className="relative inline-block group">
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            aria-label={`Actions for ${dish.name}`}
                          >
                            <FaEllipsisV />
                          </button>
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                            <button
                              onClick={() => navigateToForm(dish)}
                              className="text-blue-600 hover:text-blue-600"
                              aria-label={`Edit ${dish.name}`}
                            >
                              <FaEdit />
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

      {deleteDialog.open && (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaTrashAlt className="h-5 w-5 text-red-500" />
            <Typography variant="small" className="font-semibold text-gray-800">
              Delete {selectedDishes.length} Dish{selectedDishes.length > 1 ? 'es' : ''}
            </Typography>
          </div>
          <Typography variant="small" className="text-gray-600 mb-4">
            Are you sure you want to delete {selectedDishes.length} selected dish{selectedDishes.length > 1 ? 'es' : ''}?
            <br />
            <span className="text-xs text-gray-400">This action cannot be undone.</span>
          </Typography>
          <div className="flex justify-end gap-2">
            <Button
              variant="text"
              color="gray"
              onClick={() => setDeleteDialog({ open: false, dishes: [] })}
              className="rounded-md px-3 py-1 text-gray-700 border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="text"
              color="red"
              onClick={handleDelete}
              className="rounded-md px-3 py-1 flex items-center gap-2"
            >
              <FaTrashAlt className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DishTable;