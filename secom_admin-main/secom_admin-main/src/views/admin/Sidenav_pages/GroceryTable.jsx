import React, { useState, useEffect } from 'react';
import groceryService from '../../../services/groceryService';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrashAlt, FaPlus, FaSpinner, FaCheckCircle, FaTimesCircle, FaEllipsisV } from 'react-icons/fa';
import API_CONFIG from '../../../config/api.config';

const GroceryTable = () => {
  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedGroceries, setSelectedGroceries] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, groceries: [] });

  useEffect(() => {
    fetchGroceries();
  }, []);

  const fetchGroceries = async () => {
    setLoading(true);
    try {
      const response = await groceryService.getAllGroceries();
      if (response.success) {
        setGroceries(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch groceries');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (grocery) => {
    setSelectedGroceries((prev) => {
      if (prev.some((g) => g.id === grocery.id)) {
        return prev.filter((g) => g.id !== grocery.id);
      }
      return [...prev, grocery];
    });
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedGroceries.map((grocery) => groceryService.deleteGrocery(grocery.id))
      );
      toast.success('Selected groceries deleted successfully');
      fetchGroceries();
      setSelectedGroceries([]);
      setDeleteDialog({ open: false, groceries: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete groceries');
    }
  };

  const filteredGroceries = groceries
    .filter(grocery => {
      if (statusFilter === 'active') return grocery.status === true;
      if (statusFilter === 'inactive') return grocery.status === false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Grocery Management</h1>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="all">All</option>
            <option value="active">Available</option>
            <option value="inactive">Unavailable</option>
          </select>
          {selectedGroceries.length > 0 && (
            <button
              onClick={() => setDeleteDialog({ open: true, groceries: selectedGroceries })}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150"
            >
              <FaTrashAlt className="mr-2" /> Delete Selected
            </button>
          )}
          <Link
            to="/admin/groceries/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
          >
            <FaPlus className="mr-2" /> Add New Grocery
          </Link>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-8">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Select</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGroceries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No groceries found.</td>
                </tr>
              ) : (
                filteredGroceries.map((grocery) => (
                  <tr key={grocery.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 w-16">
                      <input
                        type="checkbox"
                        checked={selectedGroceries.some((g) => g.id === grocery.id)}
                        onChange={() => handleCheckboxChange(grocery)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <img
                          src={
                            Array.isArray(grocery.images) && grocery.images.length > 0
                              ? API_CONFIG.getImageUrl(grocery.images[0])
                              : (grocery.image ? API_CONFIG.getImageUrl(grocery.image) : 'https://via.placeholder.com/64')
                          }
                          alt={grocery.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                        {Array.isArray(grocery.images) && grocery.images.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">Images</span>
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {grocery.images.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{grocery.name}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <div>Original: ${grocery.original_price}</div>
                      <div className={grocery.discounted_price ? 'text-green-600' : 'text-gray-500'}>
                        {grocery.discounted_price ? `Discounted: $${grocery.discounted_price}` : 'No discount'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{grocery.category}</td>
                    <td className="px-6 py-4">
                      {grocery.status ? (
                        <FaCheckCircle className="text-green-500 text-xl" />
                      ) : (
                        <FaTimesCircle className="text-red-500 text-xl" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium flex justify-center">
                      <div className="relative inline-block group">
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          aria-label={`Actions for ${grocery.name}`}
                        >
                          <FaEllipsisV />
                        </button>
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-3">
                          <Link
                            to={`/admin/groceries/edit/${grocery.id}`}
                            className="text-blue-600 hover:text-blue-700"
                            aria-label={`Edit ${grocery.name}`}
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {deleteDialog.open && (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaTrashAlt className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-gray-800">
              Delete {selectedGroceries.length} Grocery Item{selectedGroceries.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-gray-600 mb-4">
            Are you sure you want to delete {selectedGroceries.length} selected item{selectedGroceries.length > 1 ? 's' : ''}?
            <br />
            <span className="text-xs text-gray-400">This action cannot be undone.</span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteDialog({ open: false, groceries: [] })}
              className="rounded-md px-3 py-1 text-gray-700 border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md px-3 py-1 flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <FaTrashAlt className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroceryTable;