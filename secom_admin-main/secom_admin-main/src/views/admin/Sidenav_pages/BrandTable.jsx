import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaEllipsisV } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import brandService from '../../../services/brandService';
import API_CONFIG from '../../../config/api.config';

const BrandTable = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('active');
  const [clickedEdit, setClickedEdit] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await brandService.getAllBrands();
      console.log('Fetched brands:', response);
      
      // Ensure we have an array of brands
      if (Array.isArray(response)) {
        setBrands(response);
        console.log(`✅ Successfully loaded ${response.length} brands`);
      } else {
        console.warn('⚠️ Response is not an array:', response);
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to fetch brands. Please check your connection and try again.');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter brands based on search query and status
  const filteredBrands = brands
    .filter(brand => {
      if (statusFilter === 'active') return brand.status === true;
      if (statusFilter === 'inactive') return brand.status === false;
      return true; // 'all'
    })
    .filter(brand =>
      brand.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBrands = filteredBrands.slice(startIndex, endIndex);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle row selection
  const handleRowSelection = (brandId) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedBrands.length === currentBrands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(currentBrands.map(brand => brand.id));
    }
  };

  // Handle delete
  const handleDelete = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await brandService.deleteBrand(brandId);
        toast.success('Brand deleted successfully');
        fetchBrands();
      } catch (error) {
        console.error('Error deleting brand:', error);
        toast.error('Failed to delete brand');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedBrands.length === 0) {
      toast.warning('Please select brands to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedBrands.length} brands?`)) {
      try {
        await brandService.bulkDeleteBrands(selectedBrands);
        toast.success('Brands deleted successfully');
        setSelectedBrands([]);
        fetchBrands();
      } catch (error) {
        console.error('Error bulk deleting brands:', error);
        toast.error('Failed to delete brands');
      }
    }
  };

  // Handle edit
  const handleEdit = (brandId) => {
    setClickedEdit(brandId);
    navigate(`/admin/brands/edit/${brandId}`);
  };

  // Handle add new
  const handleAddNew = () => {
    navigate('/admin/brands/new');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Brand Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Total brands: {brands.length} | Showing: {filteredBrands.length}
          </p>
        </div>
        <div className="flex gap-2">
          {/* <button
            onClick={fetchBrands}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            title="Refresh brands"
          >
            <FaSearch className="text-sm" />
            Refresh
          </button> */}
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus className="text-sm" />
            Add New Brand
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex gap-2 items-center w-full max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="all">All</option>
            <option value="active">Available</option>
            <option value="inactive">Unavailable</option>
          </select>
        </div>
        {selectedBrands.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaTrashAlt className="text-sm" />
            Delete Selected ({selectedBrands.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedBrands.length === currentBrands.length && currentBrands.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Select all brands"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBrands.map((brand) => (
              <tr key={brand.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={() => handleRowSelection(brand.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label={`Select ${brand.name}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {brand.photo ? (
                    <img
                      src={API_CONFIG.getImageUrl(brand.photo)}
                      alt={brand.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {brand.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      brand.status === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {brand.status === true ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(brand.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center">
                  <div className="relative inline-block group">
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      aria-label={`Actions for ${brand.name}`}
                    >
                      <FaEllipsisV />
                    </button>
                    <button
                      onClick={() => handleEdit(brand.id)}
                      className={`absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        clickedEdit === brand.id ? 'text-blue-600' : 'text-blue-600 hover:text-blue-600'
                      }`}
                      aria-label={`Edit ${brand.name}`}
                    >
                      <FaEdit />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {currentBrands.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaSearch className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {brands.length === 0 ? 'No brands created yet' : 'No brands match your search'}
            </h3>
            <p className="text-gray-500 mb-6">
              {brands.length === 0 
                ? 'Get started by creating your first brand.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {brands.length === 0 && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
              >
                <FaPlus className="text-sm" />
                Create Your First Brand
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredBrands.length)} of {filteredBrands.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandTable;