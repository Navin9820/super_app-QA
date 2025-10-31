import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import quickLinkService from '../../../services/quickLinkService';
import { categoryService } from '../../../services/categoryService';
import productService from '../../../services/productService';

const QuickLinksTable = () => {
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection states
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuickLink, setEditingQuickLink] = useState(null);

  useEffect(() => {
    fetchQuickLinks();
    fetchCategories();
  }, []);

  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      const response = await quickLinkService.getAllQuickLinks();
      if (response.success) {
        setQuickLinks(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch quick links');
      }
    } catch (err) {
      console.error('Error fetching quick links:', err);
      setError('Failed to fetch quick links');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      console.log('🔍 QuickLinks: fetchCategories response:', response);
      if (response.success) {
        setCategories(response.data || []);
      } else {
        // Handle case where response doesn't have success property
        setCategories(response.data || []);
      }
      console.log('🔍 QuickLinks: Categories state set to:', response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    console.log('🔍 QuickLinks: handleCategoryChange called with:', categoryId);
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setSelectedProducts([]);
    setProducts([]);

    if (categoryId) {
      try {
        // Fetch subcategories for the selected category
        console.log('🔍 QuickLinks: Fetching subcategories for category:', categoryId);
        const response = await categoryService.getSubcategories(categoryId);
        console.log('🔍 QuickLinks: Subcategories response:', response);
        if (response.success) {
          setSubcategories(response.data || []);
        }

        // Fetch products for the selected category
        console.log('🔍 QuickLinks: Fetching products for category:', categoryId);
        const productsResponse = await quickLinkService.getProductsForSelection(categoryId);
        console.log('🔍 QuickLinks: Products response:', productsResponse);
        
        // The api.get() returns response.data, so productsResponse should have the structure
        if (productsResponse && productsResponse.success && productsResponse.data) {
          console.log('🔍 QuickLinks: Setting products:', productsResponse.data);
          setProducts(productsResponse.data || []);
        } else {
          console.log('🔍 QuickLinks: No products found or error:', productsResponse);
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching subcategories/products:', err);
        setProducts([]);
      }
    } else {
      setSubcategories([]);
      setProducts([]);
    }
  };

  const handleSubcategoryChange = async (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setSelectedProducts([]);

    if (subcategoryId && selectedCategory) {
      try {
        const response = await quickLinkService.getProductsForSelection(selectedCategory, subcategoryId);
        if (response.success) {
          setProducts(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    }
  };

  const handleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleBulkCreate = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      const response = await quickLinkService.bulkCreateQuickLinks(selectedProducts);
      if (response.success) {
        toast.success(response.message || 'Quick links created successfully');
        setShowAddModal(false);
        setSelectedCategory('');
        setSelectedSubcategory('');
        setSelectedProducts([]);
        setProducts([]);
        fetchQuickLinks();
      } else {
        toast.error(response.message || 'Failed to create quick links');
      }
    } catch (err) {
      console.error('Error creating quick links:', err);
      toast.error('Failed to create quick links');
    }
  };

  const handleDelete = async (quickLinkId) => {
    if (window.confirm('Are you sure you want to delete this quick link?')) {
      try {
        const response = await quickLinkService.deleteQuickLink(quickLinkId);
        if (response.success) {
          toast.success('Quick link deleted successfully');
          fetchQuickLinks();
        } else {
          toast.error(response.message || 'Failed to delete quick link');
        }
      } catch (err) {
        console.error('Error deleting quick link:', err);
        toast.error('Failed to delete quick link');
      }
    }
  };

  const handleToggleStatus = async (quickLinkId, currentStatus) => {
    try {
      const response = await quickLinkService.updateQuickLink(quickLinkId, {
        is_active: !currentStatus
      });
      if (response.success) {
        toast.success(`Quick link ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchQuickLinks();
      } else {
        toast.error(response.message || 'Failed to update quick link');
      }
    } catch (err) {
      console.error('Error updating quick link:', err);
      toast.error('Failed to update quick link');
    }
  };

  const getStatusColor = (isAvailable) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isAvailable) => {
    return isAvailable ? 'Available' : 'Unavailable';
  };

  if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  
  // Debug logging
  console.log('🔍 QuickLinks: Rendering with categories:', categories);
  console.log('🔍 QuickLinks: Categories length:', categories.length);
  console.log('🔍 QuickLinks: Selected category:', selectedCategory);
  console.log('🔍 QuickLinks: Subcategories:', subcategories);
  console.log('🔍 QuickLinks: Products:', products);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quick Links Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold flex items-center gap-2"
        >
          <FaPlus /> Add Quick Links
        </button>
      </div>

      {/* Quick Links Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quickLinks.map((quickLink) => (
              <tr key={quickLink.id || quickLink._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={quickLink.product_id?.image || '/placeholder.png'}
                        alt={quickLink.product_id?.name}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {quickLink.product_id?.name || 'Unknown Product'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {quickLink.product_id?.category_id?.name || 'Unknown Category'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{quickLink.product_id?.price || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quickLink.is_active)}`}>
                    {getStatusText(quickLink.is_active)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {quickLink.display_order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleStatus(quickLink.id || quickLink._id, quickLink.is_active)}
                      className={`${quickLink.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={quickLink.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {quickLink.is_active ? <FaTimes /> : <FaCheck />}
                    </button>
                    <button
                      onClick={() => handleDelete(quickLink.id || quickLink._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quickLinks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No quick links found. Add some to get started!
        </div>
      )}

      {/* Add Quick Links Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Quick Links</h3>
              
              {/* Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                                 <select
                   value={selectedCategory}
                   onChange={(e) => handleCategoryChange(e.target.value)}
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   style={{ appearance: 'auto' }}
                 >
                   <option value="">Choose a category</option>
                   {categories && categories.length > 0 ? (
                     categories.map((category) => (
                       <option key={category.id || category._id} value={category.id || category._id}>
                         {category.name}
                       </option>
                     ))
                   ) : (
                     <option value="" disabled>No categories available</option>
                   )}
                 </select>
              </div>

              {/* Subcategory Selection */}
              {selectedCategory && subcategories.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subcategory (Optional)
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All subcategories</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id || subcategory._id} value={subcategory.id || subcategory._id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Selection */}
              {products.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Products ({selectedProducts.length} selected)
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded p-2">
                    {products.map((product) => (
                      <div key={product.id || product._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={product.id || product._id}
                          checked={selectedProducts.includes(product.id || product._id)}
                          onChange={() => handleProductSelection(product.id || product._id)}
                          className="mr-2"
                        />
                                                 <label htmlFor={product.id || product._id} className="flex items-center cursor-pointer">
                          <img
                            src={product.photo || product.featured_image || product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWc8L3RleHQ+Cjwvc3ZnPgo='}
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover mr-2"
                            onError={(e) => {
                              e.target.onerror = null; // Prevent infinite loop
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWc8L3RleHQ+Cjwvc3ZnPgo=';
                            }}
                          />
                          <span className="text-sm">{product.name}</span>
                          <span className="text-sm text-gray-500 ml-2">₹{product.price || 0}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCategory('');
                    setSelectedSubcategory('');
                    setSelectedProducts([]);
                    setProducts([]);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={selectedProducts.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Selected ({selectedProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickLinksTable;
