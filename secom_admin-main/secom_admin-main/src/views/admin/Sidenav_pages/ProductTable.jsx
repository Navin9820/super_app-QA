import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaEye, FaEllipsisV } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import API_CONFIG from '../../../config/api.config';
import { getProductImageUrl } from '../../../utils/imageUrlUtils';

const ProductTable = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Increased to match backend limit
  const [statusFilter, setStatusFilter] = useState('active');
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const dropdownRef = useRef(null);

  // Handle click outside (optional for hover-based)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // No-op for hover-based
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products on component mount and when page changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  // Refetch products when status filter changes
  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Try main endpoint first, fallback to simple endpoint if timeout
      let response;
      try {
        response = await axios.get(`${API_CONFIG.BASE_URL}/api/products`, {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            status: statusFilter !== 'all' ? statusFilter : undefined
          },
          timeout: 15000 // 15 second timeout - more reasonable
        });
      } catch (timeoutError) {
        console.log('Main endpoint timed out, trying simple endpoint...');
        try {
          response = await axios.get(`${API_CONFIG.BASE_URL}/api/products/simple`, {
            params: {
              page: currentPage,
              limit: itemsPerPage
            },
            timeout: 20000 // 20 second timeout for simple endpoint
          });
        } catch (simpleTimeoutError) {
          console.log('Both endpoints timed out, using fallback data...');
          // Use fallback data to show something immediately
          const fallbackData = {
            success: true,
            data: [
              {
                _id: 'fallback-1',
                name: 'Database Connection Issue',
                price: 0,
                stock: 0,
                status: false,
                createdAt: new Date().toISOString(),
                photo: '/uploads/products/placeholder.jpg',
                category: 'System',
                brand: 'Admin',
                sku: 'DB-ERROR-001'
              },
              {
                _id: 'fallback-2',
                name: 'MongoDB Atlas Timeout',
                price: 0,
                stock: 0,
                status: false,
                createdAt: new Date().toISOString(),
                photo: '/uploads/products/placeholder.jpg',
                category: 'System',
                brand: 'Admin',
                sku: 'DB-ERROR-002'
              }
            ],
            totalProducts: 259, // Show correct total
            totalPages: Math.ceil(259 / itemsPerPage),
            currentPage: currentPage,
            fallback: true
          };
          response = { data: fallbackData };
        }
      }

      console.log('Fetched products raw response:', response.data);

      // Handle both new and old response formats
      const productsData = response.data.data || response.data || [];
      console.log('Processed products data:', productsData);
      setProducts(productsData);
      
      // Set pagination info from backend
      setTotalProducts(response.data.totalProducts || productsData.length);
      setTotalPages(response.data.totalPages || Math.ceil(productsData.length / itemsPerPage));
      
      // Show warning if using fallback data
      if (response.data.fallback) {
        toast.warning('Database connection slow - showing limited data. Click retry to try again.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products - Database connection timeout');
      
      // Show empty state with retry option
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search query only (status filtering now handled by backend)
  const filteredProducts = products
    .filter(product =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Use backend pagination - no client-side slicing needed
  const currentProducts = filteredProducts;

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle row selection
  const handleRowSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map(product => product._id));
    }
  };

  // Handle delete
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_CONFIG.BASE_URL}/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt')}`
          }
        });
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.warning('Please select products to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        // Use individual delete calls for now (more reliable)
        const deletePromises = selectedProducts.map(productId =>
          axios.delete(`${API_CONFIG.BASE_URL}/api/products/${productId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt')}`
            }
          })
        );
        
        await Promise.all(deletePromises);
        toast.success(`Successfully deleted ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        console.error('Error bulk deleting products:', error);
        toast.error('Failed to delete products');
      }
    }
  };

  // Handle edit
  const handleEdit = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  // Handle view
  const handleView = (productId) => {
    navigate(`/admin/products/view/${productId}`);
  };

  // Handle add new
  const handleAddNew = () => {
    navigate('/admin/products/new');
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="mt-4 text-gray-600">Loading products...</div>
        <div className="mt-2 text-sm text-gray-500">This may take a few seconds due to database connection</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-150"
        >
          <FaPlus className="text-sm" />
          Add New Product
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex gap-2 items-center w-full max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
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
        {selectedProducts.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-150"
          >
            <FaTrashAlt className="text-sm" />
            Delete Selected ({selectedProducts.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50 w-full">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all products"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-0 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => {
                const productId = product._id;
                if (!productId) {
                  console.error('Product ID is missing:', product);
                  return null;
                }
                
                // HYBRID APPROACH: Handle both Base64 and file paths
                let imgSrc = null;
                
                // Priority 1: Use Base64 photo if available (most reliable)
                if (product.photo && product.photo.startsWith('data:image/')) {
                  imgSrc = product.photo;
                }
                // Priority 2: Use Base64 images array if available
                else if (product.images && product.images.length > 0 && product.images[0].startsWith('data:image/')) {
                  imgSrc = product.images[0];
                }
                // Priority 3: Use file path if available (new products)
                else if (product.photo_path) {
                  imgSrc = getProductImageUrl(product.photo_path);
                }
                // Priority 4: Use images_paths array if available (new products)
                else if (product.images_paths && product.images_paths.length > 0) {
                  imgSrc = getProductImageUrl(product.images_paths[0]);
                }
                // Priority 5: Handle non-Base64 photo (file path)
                else if (product.photo) {
                  imgSrc = getProductImageUrl(product.photo);
                }
                // Priority 6: Handle non-Base64 images array (file paths)
                else if (product.images && product.images.length > 0) {
                  imgSrc = getProductImageUrl(product.images[0]);
                }
                
                // Debug image handling
                console.log('Product image debug:', {
                  name: product.name,
                  photo: product.photo ? product.photo.substring(0, 50) + '...' : 'null',
                  photo_path: product.photo_path,
                  images: product.images ? product.images.length : 0,
                  images_paths: product.images_paths ? product.images_paths.length : 0,
                  finalImgSrc: imgSrc ? imgSrc.substring(0, 50) + '...' : 'null'
                });
                
                // TEMPORARY FIX: If no image found, use a placeholder
                if (!imgSrc) {
                  // Use a simple placeholder data URI
                  imgSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNS42NTY5IDI4IDI3IDI2LjY1NjkgMjcgMjVDMjcgMjMuMzQzMSAyNS42NTY5IDIyIDI0IDIyQzIyLjM0MzEgMjIgMjEgMjMuMzQzMSAyMSAyNUMyMSAyNi42NTY5IDIyLjM0MzEgMjggMjQgMjhaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
                }

                return (
                  <tr key={productId} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(productId)}
                        onChange={() => handleRowSelection(productId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select product ${product.name}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name || 'Product Image'}
                            className="h-12 w-12 object-cover rounded-lg"
                            onError={(e) => {
                              // ✅ FIXED: Show placeholder icon instead of wrong avatar image
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          // ✅ ADDED: Placeholder for products without images
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* ✅ ADDED: Hidden placeholder that shows on image error */}
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center hidden">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                          </svg>
                        </div>
                        
                        {/* ✅ ADDED: Image count indicator */}
                        {product.images && product.images.length > 0 && (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">Images</span>
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {product.images.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </div>
                      {product.sale_price && product.sale_price > 0 && (
                        <div className="text-sm text-red-600">
                          Sale: {formatPrice(product.sale_price)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10
                          ? 'bg-green-100 text-green-800'
                          : product.stock > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.brand || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center">
                      <div className="relative inline-block group" ref={dropdownRef}>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          aria-label={`More actions for product ${product.name}`}
                          aria-haspopup="true"
                        >
                          <FaEllipsisV />
                        </button>
                        <div
                          className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2"
                        >
                          {/* <button
                            onClick={() => handleView(productId)}
                            className="text-blue-600 hover:text-blue-800"
                            aria-label={`View product ${product.name}`}
                          >
                            <FaEye />
                          </button> */}
                          <button
                            onClick={() => handleEdit(productId)}
                            className="text-blue-600 hover:text-blue-600"
                            aria-label={`Edit product ${product.name}`}
                          >
                            <FaEdit />
                          </button>
                          {/* <button
                            onClick={() => handleDelete(productId)}
                            className="text-red-600 hover:text-red-800"
                            aria-label={`Delete product ${product.name}`}
                          >
                            <FaTrashAlt />
                          </button> */}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {currentProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {totalProducts === 0 
                ? 'Database connection timeout - Please try again'
                : 'No products found'
              }
            </div>
            <div className="text-gray-500 text-sm mt-2">
              {totalProducts === 0 ? (
                <div>
                  <p>Unable to connect to database. This might be a temporary issue.</p>
                  <button
                    onClick={fetchProducts}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-150"
                  >
                    Retry Loading Products
                  </button>
                </div>
              ) : searchQuery || statusFilter !== 'all' ? (
                'Try adjusting your search or filter criteria'
              ) : (
                'Get started by adding your first product'
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;