import API_CONFIG from "../config/api.config.js";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaFilter, FaSearch, FaTimes,  FaShareAlt, FaStar } from 'react-icons/fa';
import { useCart } from '../Utility/CartContext';
import EcommerceGroceryHeader from './EcommerceGroceryHeader';
import Footer from '../Utility/Footer';

const GenericCategoryPage = () => {
  const { categorySlug, subcategorySlug, parentSlug } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, refreshWishlist, wishlist, cart } = useCart();
  const [cartItems, setCartItems] = useState({});
  const [showShareOptions, setShowShareOptions] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [tempFilters, setTempFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    minRating: 0,
    showBestSellersOnly: false,
    selectedBrands: [],
    sort: '',
    pricePreset: ''
  });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showBestSellersOnly, setShowBestSellersOnly] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState({});

  const extractWishlistItemId = (item) => {
    if (item.product_id && typeof item.product_id === 'object') {
      if (item.product_id._id) return item.product_id._id;
      const idKeys = Object.keys(item.product_id).filter(key => key.includes('id') || key.includes('Id'));
      if (idKeys.length > 0) return item.product_id[idKeys[0]];
    } else if (item.product_id && typeof item.product_id === 'string') {
      return item.product_id;
    }
    return item.id || item._id || item.productId;
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const isProductInCart = (productId) => {
    if (!cart || !cart.items) return false;
    return cart.items.some(item =>
      (item.product_id && item.product_id._id === productId) ||
      (item.product_id && item.product_id === productId) ||
      item._id === productId
    );
  };

  const availableBrands = useMemo(() => {
    const brands = new Set(products.map(product => product.brand_id?.name).filter(Boolean));
    return Array.from(brands).sort();
  }, [products]);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    const max = Math.max(...products.map(p => p.sale_price || p.price || 0));
    return Math.ceil(max);
  }, [products]);

  useEffect(() => {
    const defaultMaxPrice = Math.ceil(maxPrice);
    setPriceRange(prev => ({ min: prev.min, max: defaultMaxPrice }));
    setTempFilters(prev => ({
      ...prev,
      priceRange: { min: prev.priceRange.min, max: defaultMaxPrice },
    }));
  }, [maxPrice]);

  useEffect(() => {
    if (showFilters) {
      setTempFilters({
        priceRange: { ...priceRange },
        minRating,
        showBestSellersOnly,
        selectedBrands,
        sort: sortOption,
        pricePreset: ''
      });
    }
  }, [showFilters, priceRange, minRating, showBestSellersOnly, selectedBrands, sortOption]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    filtered = filtered.filter(product => {
      const price = product.sale_price || product.price || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => product.brand_id?.name && selectedBrands.includes(product.brand_id.name));
    }
    filtered = filtered.filter(product => (product.rating || 0) >= minRating);
    if (showBestSellersOnly) {
      filtered = filtered.filter(product => product.is_best_seller || product.isBestSeller);
    }
    if (showWishlistOnly) {
      filtered = filtered.filter(product => {
        const productId = product._id || product.id;
        return wishlist.some(item => extractWishlistItemId(item) === productId);
      });
    }
    return [...filtered].sort((a, b) => {
      const priceA = a.sale_price || a.price || 0;
      const priceB = b.sale_price || b.price || 0;
      switch (sortOption) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  }, [products, searchQuery, priceRange, selectedBrands, minRating, showBestSellersOnly, showWishlistOnly, sortOption, wishlist]);

  const handleWishlistToggle = async (product) => {
    const productId = product._id || product.id;
    if (wishlistLoading[productId]) return;
    try {
      setWishlistLoading(prev => ({ ...prev, [productId]: true }));
      const freshWishlist = await refreshWishlist();
      const isInWishlist = freshWishlist.some(item => extractWishlistItemId(item) === productId);
      if (isInWishlist) {
        const wishlistItem = freshWishlist.find(item => extractWishlistItemId(item) === productId);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem._id || wishlistItem.id);
          showToast(`${product.name} removed from wishlist`, 'success');
          await refreshWishlist();
        }
      } else {
        const addResult = await addToWishlist(productId, 1);
        if (addResult.success) {
          showToast(addResult.alreadyExists ? `${product.name} is already in wishlist` : `${product.name} added to wishlist`, addResult.alreadyExists ? 'info' : 'success');
          await refreshWishlist();
        } else {
          throw new Error(addResult.message || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showToast(`Failed to update wishlist: ${error.message}`, 'error');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const isInWishlist = (product) => {
    const productId = product._id || product.id;
    if (!productId || !wishlist || wishlist.length === 0) return false;
    return wishlist.some(item => extractWishlistItemId(item) === productId);
  };

  const handleAddToCart = async (product) => {
    try {
      const productId = product._id || product.id;
      const quantity = cartItems[productId]?.quantity || 1;
      const result = await addToCart(productId, quantity);
      if (result.success) {
        setCartItems(prev => ({
          ...prev,
          [productId]: { ...prev[productId], quantity }
        }));
        showToast(`${product.name} added to cart!`, 'success');
      } else {
        throw new Error(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast(`Failed to add ${product.name} to cart`, 'error');
    }
  };

  const handleQuantityChange = (productId, change) => {
    setCartItems(prev => {
      const currentQuantity = prev[productId]?.quantity || 1;
      const newQuantity = Math.max(1, Math.min(500, currentQuantity + change));
      return {
        ...prev,
        [productId]: { ...prev[productId], quantity: newQuantity }
      };
    });
  };

  const handleShare = (product) => {
    setShowShareOptions(showShareOptions === product._id ? null : product._id);
  };

  const shareProduct = (platform, product) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${product.name} on our store!`);
    let shareUrl;
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
    setShowShareOptions(null);
  };

  const applyPricePreset = (preset) => {
    let min = 0, max = maxPrice;
    switch (preset) {
      case 'under_100': min = 0; max = 100; break;
      case '100_500': min = 100; max = 500; break;
      case '500_1000': min = 500; max = 1000; break;
      case 'above_1000': min = 1000; max = maxPrice; break;
      default: break;
    }
    setTempFilters(prev => ({
      ...prev,
      pricePreset: preset,
      priceRange: { min, max }
    }));
  };

  const clearFilters = () => {
    const defaultMaxPrice = Math.ceil(maxPrice);
    setSearchQuery('');
    setPriceRange({ min: 0, max: defaultMaxPrice });
    setSelectedBrands([]);
    setMinRating(0);
    setShowBestSellersOnly(false);
    setShowWishlistOnly(false);
    setSortOption('');
    setTempFilters({
      priceRange: { min: 0, max: defaultMaxPrice },
      minRating: 0,
      showBestSellersOnly: false,
      selectedBrands: [],
      sort: '',
      pricePreset: ''
    });
  };

  const toggleBrand = (brand) => {
    setTempFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brand)
        ? prev.selectedBrands.filter(b => b !== brand)
        : [...prev.selectedBrands, brand],
    }));
  };

  const applyFilters = () => {
    const newMin = Math.max(0, Number(tempFilters.priceRange.min) || 0);
    const newMax = Math.min(maxPrice, Math.max(newMin, Number(tempFilters.priceRange.max) || maxPrice));
    setPriceRange({ min: newMin, max: newMax });
    setMinRating(tempFilters.minRating);
    setShowBestSellersOnly(tempFilters.showBestSellersOnly);
    setSelectedBrands(tempFilters.selectedBrands);
    setSortOption(tempFilters.sort || '');
    setShowFilters(false);
  };

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const getCategoryDisplayName = (slug) => {
    if (!slug || typeof slug !== 'string') return 'Unknown Category';
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayName = subcategorySlug
    ? getCategoryDisplayName(subcategorySlug)
    : getCategoryDisplayName(categorySlug || parentSlug);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('adminToken') || 'demo-token';
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PRODUCTS), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        const data = await response.json();
        let products = Array.isArray(data) ? data : data.data || data.products || [];
        let filteredProducts = [];
        if (subcategorySlug) {
          filteredProducts = products.filter(product => {
            if (!product.sub_category_id) return false;
            const subCatData = product.sub_category_id;
            let productSubSlug = null;
            if (typeof subCatData === 'object' && subCatData.slug) {
              productSubSlug = subCatData.slug;
            } else if (typeof subCatData === 'object' && subCatData.name) {
              productSubSlug = subCatData.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
            }
            return productSubSlug && productSubSlug.toLowerCase() === subcategorySlug.toLowerCase();
          });
        } else if (categorySlug || parentSlug) {
          const targetSlug = categorySlug || parentSlug;
          filteredProducts = products.filter(product => {
            if (!product.category_id) return false;
            const catData = product.category_id;
            let productCatSlug = null;
            if (typeof catData === 'object' && catData.slug) {
              productCatSlug = catData.slug;
            } else if (typeof catData === 'object' && catData.name) {
              productCatSlug = catData.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
            }
            return productCatSlug && productCatSlug.toLowerCase() === targetSlug.toLowerCase();
          });
        }
        if (filteredProducts.length === 0 && subcategorySlug && parentSlug) {
          filteredProducts = products.filter(product => {
            if (!product.category_id) return false;
            const catData = product.category_id;
            let productCatSlug = null;
            if (typeof catData === 'object' && catData.slug) {
              productCatSlug = catData.slug;
            } else if (typeof catData === 'object' && catData.name) {
              productCatSlug = catData.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
            }
            return productCatSlug && productCatSlug.toLowerCase() === parentSlug.toLowerCase();
          });
        }
        setProducts(filteredProducts);
        setError(null);
      } catch (error) {
        console.error('🚨 Error fetching products:', error);
        setError(error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categorySlug, subcategorySlug, parentSlug]);

  useEffect(() => {
    const syncWishlist = async () => {
      try {
        await refreshWishlist();
        setTimeout(async () => await refreshWishlist(), 500);
      } catch (error) {
        console.error('❌ Failed to sync wishlist:', error);
      }
    };
    const token = localStorage.getItem('token');
    if (token) syncWishlist();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-yellow-400 opacity-50" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-sm font-semibold">
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-[1000] px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <EcommerceGroceryHeader />
      <div className="flex-1 pt-24 px-4 sm:px-6 lg:px-8 pb-20 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
              <p className="text-sm font-semibold text-gray-600">
                {subcategorySlug ? 'Subcategory' : 'Category'} • {filteredAndSortedProducts.length} of {products.length} products
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={16} />
                  </button>
                )}
              </div>
              <div className="inline-flex items-stretch border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm font-semibold text-gray-700"
                  type="button"
                  aria-label="Open filters"
                >
                  <FaFilter />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {(priceRange.min > 0 || priceRange.max < maxPrice || minRating > 0 || showBestSellersOnly || selectedBrands.length > 0 || showWishlistOnly || sortOption) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-blue-800">Active Filters:</span>
                    {sortOption && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Sort: {sortOption.replace('price-low', 'Price: Low to High').replace('price-high', 'Price: High to Low').replace('name', 'Name: A to Z').replace('rating', 'Rating: High to Low')}
                      </span>
                    )}
                    {priceRange.min > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Min: ₹{priceRange.min}
                      </span>
                    )}
                    {priceRange.max < maxPrice && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Max: ₹{priceRange.max}
                      </span>
                    )}
                    {minRating > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {minRating}★ & above
                      </span>
                    )}
                    {showBestSellersOnly && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Best Sellers Only
                      </span>
                    )}
                    {showWishlistOnly && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Wishlist Only
                      </span>
                    )}
                    {selectedBrands.map(brand => (
                      <span key={brand} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {brand}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="lg:w-80 fixed lg:sticky top-24 right-0 h-[calc(100vh-6rem)] bg-white p-4 rounded-lg shadow-lg z-50 lg:z-10 overflow-y-auto lg:ml-4 border border-gray-200 transform transition-all duration-300 lg:translate-x-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFilterMinimized(!isFilterMinimized)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    {isFilterMinimized }
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {!isFilterMinimized && (
                <>
                  <div className="space-y-6">
                    {/* Sort by */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Sort by</h3>
                      <select
                        value={tempFilters.sort}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, sort: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                        aria-label="Sort by"
                      >
                        <option value="">None</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Rating: High to Low</option>
                        <option value="name">Name: A to Z</option>
                      </select>
                    </div>

                    {/* Quick Price Presets */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Quick Price</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'under_100', label: 'Under ₹100' },
                          { id: '100_500', label: '₹100–₹500' },
                          { id: '500_1000', label: '₹500–₹1000' },
                          { id: 'above_1000', label: '₹1000+' },
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPricePreset(p.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              tempFilters.pricePreset === p.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => applyPricePreset('')}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            tempFilters.pricePreset === '' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Price Range (₹)</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Min</label>
                            <input
                              type="number"
                              value={tempFilters.priceRange.min}
                              onChange={(e) => {
                                const raw = Number(e.target.value);
                                const minVal = clamp(Number.isFinite(raw) ? Math.floor(raw) : 0, 0, maxPrice);
                                setTempFilters(prev => ({
                                  ...prev,
                                  pricePreset: '',
                                  priceRange: {
                                    min: minVal,
                                    max: Math.max(minVal, prev.priceRange.max)
                                  }
                                }));
                              }}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                              min="0"
                              step="1"
                              inputMode="numeric"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Max</label>
                            <input
                              type="number"
                              value={tempFilters.priceRange.max}
                              onChange={(e) => {
                                const raw = Number(e.target.value);
                                const maxVal = clamp(Number.isFinite(raw) ? Math.floor(raw) : 0, 0, maxPrice);
                                setTempFilters(prev => ({
                                  ...prev,
                                  pricePreset: '',
                                  priceRange: {
                                    min: Math.min(prev.priceRange.min, maxVal),
                                    max: Math.max(prev.priceRange.min, maxVal)
                                  }
                                }));
                              }}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                              min={tempFilters.priceRange.min}
                              step="1"
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min={tempFilters.priceRange.min}
                          max={maxPrice}
                          value={tempFilters.priceRange.max}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const val = clamp(Number.isFinite(raw) ? Math.floor(raw) : tempFilters.priceRange.max, tempFilters.priceRange.min, maxPrice);
                            setTempFilters(prev => ({
                              ...prev,
                              pricePreset: '',
                              priceRange: { ...prev.priceRange, max: val }
                            }));
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-xs text-gray-500">
                          Range: ₹{tempFilters.priceRange.min} – ₹{tempFilters.priceRange.max}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Minimum Rating</h3>
                      <select
                        value={tempFilters.minRating}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                      >
                        <option value={0}>Any Rating</option>
                        <option value={4}>4★ & above</option>
                        <option value={3}>3★ & above</option>
                        <option value={2}>2★ & above</option>
                        <option value={1}>1★ & above</option>
                      </select>
                    </div>

                    {/* Best Sellers */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Best Sellers</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tempFilters.showBestSellersOnly}
                          onChange={(e) => setTempFilters(prev => ({ ...prev, showBestSellersOnly: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm">Show Best Sellers Only</span>
                      </label>
                    </div>

                    {/* Brands */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Brands ({tempFilters.selectedBrands.length} selected)</h3>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {availableBrands.map(brand => (
                          <label key={brand} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={tempFilters.selectedBrands.includes(brand)}
                              onChange={() => toggleBrand(brand)}
                              className="rounded text-blue-600 focus:ring-blue-600"
                            />
                            <span className="text-sm text-gray-600">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Wishlist Only */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Wishlist Only</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showWishlistOnly}
                          onChange={(e) => setShowWishlistOnly(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm text-gray-600">Show Wishlist Only</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={applyFilters}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      Apply Filters
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center pb-8 min-h-0 w-full">
              {filteredAndSortedProducts.map(product => {
                const pid = product._id || product.id;
                const qty = cartItems[pid]?.quantity || 1;
                const inCart = isProductInCart(pid);
                return (
                  <div
                    key={pid}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:-translate-y-1 transition-all duration-300 w-full max-w-[180px] h-[320px] flex flex-col"
                  >
                    <div className="relative w-full h-[180px] bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                      <img
                        src={(() => {
                          const imagePath = product.photo || product.featured_image || product.image;
                          if (!imagePath) return '/placeholder-image.png';
                          if (imagePath.startsWith('data:')) return imagePath;
                          if (imagePath.startsWith('http')) return imagePath;
                          if (imagePath.startsWith('/Uploads/')) return API_CONFIG.getUrl(imagePath);
                          return API_CONFIG.getUploadUrl(imagePath);
                        })()}
                        alt={product.name}
                        className="w-full h-full object-contain p-3 bg-white group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={e => {
                          e.target.onerror = null;
                          if (e.target.src !== '/placeholder-image.png') {
                            e.target.src = '/placeholder-image.png';
                            e.target.alt = `${product.name} - Image not available`;
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <button
                          onClick={() => handleWishlistToggle(product)}
                          disabled={wishlistLoading[pid]}
                          className={`p-1 transition-all duration-200 ${
                            isInWishlist(product) ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'
                          } ${wishlistLoading[pid] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isInWishlist(product) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          {wishlistLoading[pid] ? (
                            <div className="animate-spin h-4 w-4 border-b-2 border-gray-400"></div>
                          ) : (
                            <FaHeart size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleShare(product)}
                          className="p-1.5 rounded-full bg-white/80 text-gray-400 hover:text-blue-600 hover:bg-white transition-all duration-200 backdrop-blur-sm"
                          title="Share product"
                        >
                          <FaShareAlt size={12} />
                        </button>
                      </div>
                      {showShareOptions === product._id && (
                        <div className="absolute top-12 right-2 bg-white rounded-lg shadow-lg p-2 z-10">
                          <button
                            onClick={() => shareProduct('twitter', product)}
                            className="block w-full text-left px-2 py-1 text-sm font-semibold hover:bg-gray-100"
                          >
                            Twitter
                          </button>
                          <button
                            onClick={() => shareProduct('facebook', product)}
                            className="block w-full text-left px-2 py-1 text-sm font-semibold hover:bg-gray-100"
                          >
                            Facebook
                          </button>
                          <button
                            onClick={() => shareProduct('whatsapp', product)}
                            className="block w-full text-left px-2 py-1 text-sm font-semibold hover:bg-gray-100"
                          >
                            WhatsApp
                          </button>
                        </div>
                      )}
                      {product.rating && (
                        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                          <span className="flex">{renderStars(product.rating)}</span>
                          <span>({product.rating})</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <div className="text-xs font-semibold text-gray-500 line-clamp-1">{product.brand_id?.name || 'Unknown Brand'}</div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-black-600">₹{product.sale_price || product.price}</span>
                          {product.sale_price && product.sale_price < product.price && (
                            <span className="text-xs font-semibold text-gray-400 line-through">₹{product.price}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center border rounded px-1 py-0.5 bg-white shrink-0">
                            <button
                              type="button"
                              className="px-1 text-xs font-semibold text-gray-700 disabled:text-gray-300"
                              onClick={() => handleQuantityChange(pid, -1)}
                              disabled={qty <= 1 || isProductInCart(pid)}
                            >
                              -
                            </button>
                            <span className="mx-1 w-4 text-center select-none text-xs font-semibold tabular-nums">{qty}</span>
                            <button
                              type="button"
                              className="px-1 text-xs font-semibold text-gray-700 disabled:text-gray-300"
                              onClick={() => handleQuantityChange(pid, 1)}
                              disabled={qty >= 100 || isProductInCart(pid)}
                            >
                              +
                            </button>
                          </div>

                          {inCart ? (
                            <button
                              onClick={() => navigate('/home-clothes/cart')}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-1 py-1 rounded transition-all duration-200"
                            >
                              View Cart
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-1 py-1 rounded transition-all duration-200 flex items-center justify-center gap-1"
                            >
                              Add to cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-sm font-semibold text-gray-500 mb-4">
                {products.length === 0 ? `No products found in ${displayName}` : 'No products match your filters'}
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-6">
                {products.length === 0
                  ? 'Try browsing other categories.'
                  : 'Try adjusting your filters or search terms.'}
              </p>
              {products.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GenericCategoryPage;