import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClothesHeader from '../Header/ClothesHeader';
import Footer from '../../Utility/Footer';
import { FaArrowLeft, FaSearch, FaSpinner } from 'react-icons/fa';
import API_CONFIG from '../../config/api.config.js';

function SearchResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { query } = location.state || {};
    
    const [searchResults, setSearchResults] = useState([]);
    const [categoryResults, setCategoryResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [searchType, setSearchType] = useState('all'); // 'all', 'products', 'categories'

    // Helper function to get proper image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/placeholder-image.png';
        // Handle Base64 data URLs (e.g., data:image/jpeg;base64,...)
        if (imagePath.startsWith('data:')) return imagePath;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return API_CONFIG.getUrl(imagePath);
        return API_CONFIG.getUploadUrl(imagePath);
    };

    // Search through products and categories from backend
    useEffect(() => {
        const searchAll = async () => {
            if (!query) {
                setLoading(false);
                setSearchResults([]);
                setCategoryResults([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token') || 'demo-token';
                
                // Fetch both products and categories in parallel
                const [productsResponse, categoriesResponse] = await Promise.all([
                    fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PRODUCTS) + '?status=active', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PARENT_CATEGORIES), {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);

                let products = [];
                let categories = [];

                // Process products
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    products = productsData.data || productsData || [];
                    setAllProducts(products);
                    console.log(`🔍 Total Products from Backend: ${products.length}`);
                } else {
                    console.error('❌ Products API failed:', productsResponse.status);
                }

                // Process categories
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    categories = categoriesData.data || categoriesData || [];
                    setAllCategories(categories);
                    console.log(`🔍 Total Categories from Backend: ${categories.length}`);
                } else {
                    console.error('❌ Categories API failed:', categoriesResponse.status);
                }

                // Search in products
                const searchTerm = query.toLowerCase();
                const filteredProducts = products.filter(product => {
                    const productName = (product.name || '').toLowerCase();
                    const productDescription = (product.description || '').toLowerCase();
                    const productCategory = (product.category_id?.name || product.category?.name || '').toLowerCase();
                    
                    return productName.includes(searchTerm) || 
                           productDescription.includes(searchTerm) || 
                           productCategory.includes(searchTerm);
                });

                // Search in categories
                const filteredCategories = categories.filter(category => {
                    const categoryName = (category.name || '').toLowerCase();
                    const categoryDescription = (category.description || '').toLowerCase();
                    const categorySlug = (category.slug || '').toLowerCase();
                    
                    return categoryName.includes(searchTerm) || 
                           categoryDescription.includes(searchTerm) ||
                           categorySlug.includes(searchTerm);
                });

                console.log(`🔍 Search Results: Found ${filteredProducts.length} products and ${filteredCategories.length} categories for "${query}"`);
                setSearchResults(filteredProducts);
                setCategoryResults(filteredCategories);
                
            } catch (error) {
                console.error('❌ Search error:', error);
                setError('Failed to connect to backend. Please try again.');
                setSearchResults([]);
                setCategoryResults([]);
            } finally {
                setLoading(false);
            }
        };

        searchAll();
    }, [query]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ClothesHeader />
                <div className="pt-24 px-4 pb-20">
                    <div className="flex items-center justify-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-blue-600" />
                        <span className="ml-3 text-lg text-gray-600">Searching for "{query}"...</span>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ClothesHeader />
            
            <div className="pt-24 px-4 pb-20">
                {/* Search Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-gray-900">Search Results</h1>
                            <p className="text-gray-600">
                                {searchResults.length + categoryResults.length} results for "{query || 'your search'}"
                                {searchResults.length > 0 && categoryResults.length > 0 && (
                                    <span className="text-sm text-gray-500 ml-2">
                                        ({searchResults.length} products, {categoryResults.length} categories)
                                    </span>
                                )}
                            </p>
                            {error && (
                                <p className="text-red-500 text-sm mt-1">{error}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 || categoryResults.length > 0 ? (
                    <div className="space-y-8">
                        {/* Categories Section */}
                        {categoryResults.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {categoryResults.map((category) => (
                                        <div 
                                            key={category._id || category.id} 
                                            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/categories/${category.slug || category.name?.toLowerCase().replace(/\s+/g, '-')}`)}
                                        >
                                            <div className="aspect-square bg-gray-100">
                                                <img
                                                    src={getImageUrl(category.image)}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error('Failed to load category image:', category.image);
                                                        e.target.onerror = null;
                                                        if (e.target.src !== '/placeholder-image.png') {
                                                            e.target.src = '/placeholder-image.png';
                                                            e.target.alt = `${category.name} - Image not available`;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="p-3">
                                                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                                                    {category.name}
                                                </h3>
                                                
                                                <div className="text-xs text-gray-500 mb-2">
                                                    Category
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        Browse Products
                                                    </span>
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/categories/${category.slug || category.name?.toLowerCase().replace(/\s+/g, '-')}`);
                                                        }}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Products Section */}
                        {searchResults.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {searchResults.map((item) => (
                                        <div key={item._id || item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="aspect-square bg-gray-100">
                                                <img
                                                    src={getImageUrl(item.photo || item.featured_image || item.image || item.image_url)}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-2 bg-white"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error('Failed to load product image:', item.photo || item.featured_image || item.image || item.image_url);
                                                        e.target.onerror = null;
                                                        if (e.target.src !== '/placeholder-image.png') {
                                                            e.target.src = '/placeholder-image.png';
                                                            e.target.alt = `${item.name} - Image not available`;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="p-3">
                                                <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                                                    {item.name}
                                                </h3>
                                                
                                                <div className="text-xs text-gray-500 mb-2">
                                                    {item.category_id?.name || item.category?.name || 'Uncategorized'}
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-900 text-sm">
                                                        ₹{item.price || item.sale_price || 'Price not available'}
                                                    </span>
                                                    
                                                    <button
                                                        onClick={() => navigate(`/product/${item._id || item.id}`)}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FaSearch size={48} className="text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No results found</h2>
                        <p className="text-gray-500 mb-6">
                            We couldn't find any products or categories matching "{query || 'your search'}"
                        </p>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Search
                        </button>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
}

export default SearchResults;
