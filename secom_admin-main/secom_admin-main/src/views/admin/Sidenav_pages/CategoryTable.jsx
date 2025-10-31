import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaSpinner, FaExpandArrowsAlt, FaCompressArrowsAlt, FaEllipsisV } from 'react-icons/fa';
import { FiChevronRight, FiChevronDown, FiFolder, FiFolderMinus } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { categoryService } from '../../../services/categoryService';
import { authService } from '../../../services/authService';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../../config/api.config';

function CategoryTable() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const navigate = useNavigate();

  // Fetch categories on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/auth/sign-in');
        return;
      }
      await fetchCategories();
    };
    checkAuth();
  }, [navigate]);

  // Refetch categories when status filter changes
  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  // Filter categories when search query changes (frontend search only)
  useEffect(() => {
    let filtered = categories;
    if (searchQuery) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    // Sort by createdAt descending (newest first)
    filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass status filter to backend
      const response = await categoryService.getAllCategories(statusFilter);
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load categories');
      if (error.response?.status === 401) {
        navigate('/auth/sign-in');
      }
    } finally {
      setLoading(false);
    }
  };

  // Group categories by parent_id
  const groupCategories = (categories) => {
    const grouped = {};
    categories.forEach(cat => {
      const parent = cat.parent_id || 'root';
      if (!grouped[parent]) grouped[parent] = [];
      grouped[parent].push(cat);
    });
    return grouped;
  };

  // Sort categories by createdAt descending (newest first)
  const sortCategoriesByCreatedAt = (categories) => {
    return [...categories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const groupedCategories = groupCategories(filteredCategories);

  // Get all main categories (parent_id: null), sorted by createdAt descending
  const mainCategories = groupedCategories['root'] ? sortCategoriesByCreatedAt(groupedCategories['root']) : [];

  // Pagination for main categories only
  const totalPages = Math.ceil(mainCategories.length / itemsPerPage);
  const paginatedMainCategories = mainCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Toggle expand/collapse for a category
  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Expand all categories
  const expandAll = () => {
    const allCategoryIds = new Set();
    const addCategoryIds = (categories) => {
      categories.forEach(cat => {
        if (groupedCategories[cat._id || cat.id]) {
          allCategoryIds.add(cat._id || cat.id);
          addCategoryIds(groupedCategories[cat._id || cat.id]);
        }
      });
    };
    addCategoryIds(mainCategories);
    setExpandedCategories(allCategoryIds);
    setAllExpanded(true);
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
    setAllExpanded(false);
  };

  // Recursive function to render categories in tree order
  const renderCategoryRows = (categories, level = 0) => {
    if (!categories) return null;

    return categories.map(category => {
      const categoryId = category._id || category.id;
      const hasChildren = groupedCategories[categoryId] && groupedCategories[categoryId].length > 0;
      const isExpanded = expandedCategories.has(categoryId);
      const children = hasChildren ? sortCategoriesByCreatedAt(groupedCategories[categoryId]) : [];

      return (
        <React.Fragment key={categoryId}>
          <tr className="hover:bg-gray-50 transition-colors duration-150">
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedRows.includes(categoryId)}
                onChange={() => handleRowSelect(categoryId)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center gap-2">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(categoryId)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
                    >
                      {isExpanded ? (
                        <FiChevronDown className="text-gray-600" />
                      ) : (
                        <FiChevronRight className="text-gray-600" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6 h-6"></div>
                  )}
                  {hasChildren ? (
                    isExpanded ? (
                      <FiFolderMinus className="text-blue-500" />
                    ) : (
                      <FiFolder className="text-blue-500" />
                    )
                  ) : (
                    <FiFolder className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  {hasChildren && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {children.length}
                    </span>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {category.parent_id ? (
                filteredCategories.find(cat => (cat._id || cat.id) === category.parent_id)?.name || '-'
              ) : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  category.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {category.status ? 'Available' : 'Unavailable'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {category.image ? (
                <img
                  src={API_CONFIG.getUrl(category.image)}
                  alt={category.name}
                  className="h-10 w-10 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No img</span>
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-500">
                {new Date(category.createdAt).toLocaleDateString()}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center">
              <div className="relative inline-block group">
                <button
                  className="text-gray-600 hover:text-gray-900"
                  aria-label={`Actions for ${category.name}`}
                >
                  <FaEllipsisV />
                </button>
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    onClick={() => navigate(`/admin/categories/edit/${categoryId}`)}
                    className="text-blue-600 hover:text-blue-600"
                    aria-label={`Edit ${category.name}`}
                  >
                    <FaEdit />
                  </button>
                  {/* <button
                    onClick={() => handleDelete(categoryId)}
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Delete ${category.name}`}
                  >
                    <FaTrashAlt />
                  </button> */}
                </div>
              </div>
            </td>
          </tr>
          {/* Render children if expanded */}
          {hasChildren && isExpanded && renderCategoryRows(children, level + 1)}
        </React.Fragment>
      );
    });
  };

  // Handle row selection
  const handleRowSelect = (categoryId) => {
    setSelectedRows(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle bulk selection
  const handleSelectAll = () => {
    const visibleCategories = getVisibleCategories();
    if (selectedRows.length === visibleCategories.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visibleCategories.map(item => item._id || item.id));
    }
  };

  // Get visible categories (including expanded children)
  const getVisibleCategories = () => {
    const visible = [];
    const addVisible = (categories, level = 0) => {
      categories.forEach(category => {
        visible.push(category);
        const categoryId = category._id || category.id;
        if (expandedCategories.has(categoryId) && groupedCategories[categoryId]) {
          addVisible(sortCategoriesByCreatedAt(groupedCategories[categoryId]), level + 1);
        }
      });
    };
    addVisible(paginatedMainCategories);
    return visible;
  };

  // Handle category deletion
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryId);
      toast.success('Category deleted successfully!');
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast.warning('Please select categories to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} categories?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      for (const categoryId of selectedRows) {
        await categoryService.deleteCategory(categoryId);
      }
      toast.success(`${selectedRows.length} categories deleted successfully!`);
      setSelectedRows([]);
      await fetchCategories();
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      toast.error('Failed to delete some categories');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Calculate display stats
  const startMain = (currentPage - 1) * itemsPerPage + 1;
  const endMain = Math.min(currentPage * itemsPerPage, mainCategories.length);
  const totalMain = mainCategories.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchCategories}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header and Search Section */}
      <div className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
            <p className="text-gray-600">Manage your product categories and subcategories</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate('/admin/categories/new')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 transition-colors duration-150"
            >
              <FaPlus /> Add Category
            </button>
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 transition-colors duration-150"
              >
                {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                Delete Selected ({selectedRows.length})
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full lg:w-auto">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Available</option>
                <option value="inactive">Unavailable</option>
              </select>
            </div>
            {/* <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-150"
                title="Expand All"
              >
                <FaExpandArrowsAlt className="text-sm" />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-150"
                title="Collapse All"
              >
                <FaCompressArrowsAlt className="text-sm" />
                Collapse All
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow overflow-hidden rounded-lg bg-white shadow-md">
        <div className="h-full overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === getVisibleCategories().length && getVisibleCategories().length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderCategoryRows(paginatedMainCategories)}
            </tbody>
          </table>

          {paginatedMainCategories.length === 0 && (
            <div className="text-center py-12">
              <FiFolder className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating a new category.'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/admin/categories/new')}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-150"
                  >
                    Add Category
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Section */}
      <div className="flex-shrink-0">
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-md">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startMain}</span>
                  {' '}to{' '}
                  <span className="font-medium">{endMain}</span>
                  {' '}of{' '}
                  <span className="font-medium">{totalMain}</span>
                  {' '}main categories
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-150 ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default CategoryTable;