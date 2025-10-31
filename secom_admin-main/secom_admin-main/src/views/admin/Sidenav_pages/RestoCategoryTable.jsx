import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
} from '@material-tailwind/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FaEdit } from 'react-icons/fa';
import { FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { restaurantCategoryService } from '../../../services/restaurantService';
import API_CONFIG from '../../../config/api.config';
import { toast } from 'react-toastify';

const RestoCategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching restaurant categories...');
      const data = await restaurantCategoryService.getAll();
      console.log('Categories fetched successfully:', data);
      setCategories(Array.isArray(data) ? data : []);
      setSelectedCategories([]); // Reset selected categories on fetch
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to fetch categories');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle single category delete
  const handleDelete = async () => {
    if (!deleteDialog.category) return;
    try {
      await restaurantCategoryService.delete(deleteDialog.category.id);
      toast.success('Category deleted successfully');
      fetchCategories();
      setDeleteDialog({ open: false, category: null });
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to delete category');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedCategories.map((categoryId) =>
          restaurantCategoryService.delete(categoryId)
        )
      );
      toast.success('Selected categories deleted successfully');
      fetchCategories();
      setDeleteDialog({ open: false, category: null });
    } catch (error) {
      console.error('Error deleting categories:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to delete categories');
      }
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map((category) => category.id));
    }
  };

  // Filter categories with safety check
  const filteredCategories = (Array.isArray(categories) ? categories : []).filter((category) => {
    const matchesSearch =
      (category.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && category.status) ||
      (statusFilter === 'inactive' && !category.status);
    return matchesSearch && matchesStatus;
  });

  // Navigate to add/edit form
  const navigateToForm = (category = null) => {
    const path = category ? `/admin/restocategory/edit/${category.id}` : '/admin/restocategory/new';
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-8 flex flex-col items-center gap-8">
      <Card className="w-full max-w-5xl shadow-lg p-2">
        <Typography variant="h5" className="text-2xl font-bold text-gray-800 p-4">
          Restaurant Categories
        </Typography>
        <CardBody className="px-0 pt-0 pb-2">
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-blue-gray-50 bg-blue-gray-50/30 rounded-t-lg">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 !border-blue-gray-200 focus:!border-blue-500"
                  labelProps={{ className: "hidden" }}
                  aria-label="Search categories"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-blue-gray-200 rounded-lg bg-white text-blue-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Available</option>
                <option value="inactive">Unavailable</option>
              </select>
              {selectedCategories.length > 0 && (
                <Button
                  color="red"
                  className="flex items-center gap-2"
                  onClick={() => setDeleteDialog({ open: true, category: null })}
                  aria-label="Delete selected categories"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              )}
              <Button
                color="blue"
                className="flex items-center gap-2"
                onClick={() => navigateToForm()}
                aria-label="Add new category"
              >
                <PlusIcon className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Scrollable Table Section with Fixed Header */}
          <div className="bg-white rounded-b-lg shadow-inner">
            <table className="w-full min-w-[640px] table-fixed">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-16" scope="col">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Select all categories"
                    />
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-20" scope="col">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Image
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-40" scope="col">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Name
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-64" scope="col">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Description
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-left w-28" scope="col">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Status
                    </Typography>
                  </th>
                  <th className="border-b border-blue-gray-50 py-3 px-6 text-center w-28" scope="col">
                    <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                      Actions
                    </Typography>
                  </th>
                </tr>
              </thead>
            </table>
            <div className="h-[400px] overflow-y-auto">
              <table className="w-full min-w-[640px] table-fixed">
                <tbody>
                  {filteredCategories.map((category, key) => {
                    const categoryId = category.id;
                    if (!categoryId) {
                      console.error('Category ID is missing:', category);
                      return null;
                    }
                    return (
                      <tr key={categoryId} className="hover:bg-blue-gray-50 transition-colors">
                        <td className="py-3 px-6 w-16">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(categoryId)}
                            onChange={() => handleCheckboxChange(categoryId)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select ${category.name || 'category'}`}
                          />
                        </td>
                        <td className="py-3 px-6 w-20">
                          {category.image ? (
                            <img
                              src={API_CONFIG.getUrl(category.image)}
                              alt={category.name || 'Category image'}
                              className="h-16 w-16 rounded-lg object-cover border border-blue-gray-100"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="h-16 w-16 rounded-lg bg-blue-gray-100 flex items-center justify-center border border-blue-gray-100" style={{ display: category.image ? 'none' : 'flex' }}>
                            <Typography variant="small" className="text-blue-gray-400">
                              No Image
                            </Typography>
                          </div>
                        </td>
                        <td className="py-3 px-6 w-40">
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {category.name || 'N/A'}
                          </Typography>
                        </td>
                        <td className="py-3 px-6 w-64">
                          <Typography variant="small" color="blue-gray" className="font-normal">
                            {category.description || 'No description'}
                          </Typography>
                        </td>
                        <td className="py-3 px-6 w-28 align-middle">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full ${
                              category.status === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            } leading-tight min-w-[56px] h-6`}
                          >
                            {category.status === true ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="py-3 px-6 w-28 text-center">
                          <div className="relative inline-block group">
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              aria-label={`More actions for ${category.name || 'category'}`}
                              aria-haspopup="true"
                            >
                              <FiMoreVertical />
                            </button>
                            <div
                              className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2"
                            >
                              <button
                                onClick={() => navigateToForm(category)}
                                className="text-blue-600 hover:text-blue-600 font-bold"
                                aria-label={`Edit ${category.name || 'category'}`}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-blue-gray-50 rounded-b-lg">
              <Typography variant="h6" color="blue-gray" className="mb-2">
                No categories found
              </Typography>
              <Typography variant="small" color="blue-gray">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first category'}
              </Typography>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiTrash2 className="h-5 w-5 text-red-500" />
            <Typography variant="small" className="font-semibold text-gray-800">
              Delete {deleteDialog.category ? 'Category' : `${selectedCategories.length} Categories`}
            </Typography>
          </div>
          <Typography variant="small" className="text-gray-600 mb-4">
            {deleteDialog.category ? (
              <>
                Delete <span className="font-bold text-gray-900">"{deleteDialog.category?.name || 'category'}"</span>?
              </>
            ) : (
              <>
                Delete <span className="font-bold text-gray-900">{selectedCategories.length}</span>{' '}
                {selectedCategories.length === 1 ? 'category' : 'categories'}?
              </>
            )}
            <br />
            <span className="text-xs text-gray-400">This action cannot be undone.</span>
          </Typography>
          <div className="flex justify-end gap-2">
            <Button
              variant="text"
              color="gray"
              onClick={() => setDeleteDialog({ open: false, category: null })}
              className="rounded-md px-3 py-1 text-gray-700 border border-gray-300 hover:bg-gray-100 text-xs"
              aria-label="Cancel deletion"
            >
              Cancel
            </Button>
            <Button
              variant="text"
              color="red"
              onClick={deleteDialog.category ? handleDelete : handleBulkDelete}
              className="rounded-md px-3 py-1 flex items-center gap-1 text-xs"
              aria-label={`Delete ${deleteDialog.category?.name || 'selected categories'}`}
            >
              <FiTrash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestoCategoryTable;