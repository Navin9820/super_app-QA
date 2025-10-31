import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect, useRef } from 'react';
import Footer from '../SubPages/Footer';
import Header from '../SubPages/Header';
import { FaFilter, FaHeart, FaEye, FaStar, FaSearch, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { addToGroceryCart } from '../../services/groceryCartService';
import banner1 from '../Images/banner1.png';
import banner2 from '../Images/baner2.png';
import banner3 from '../Images/banner3.png';
import banner4 from '../Images/banner4.png';
import banner5 from '../Images/banner5.png';
import catFruits from '../Images/cat_fruits.png';
import catMasala from '../Images/cat_masala.png';
import catInstant from '../Images/cat_instant.png';
import catDairy from '../Images/cat_dairy.png';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

// Image Imports for Grocery Categories
import eggImage from '../Images/egg.png';
import chipsImage from '../Images/potato_chips.png';
import cerealImage from '../Images/cereal.png';
import riceImage from '../Images/rice.png';
import coffeeImage from '../Images/coffee.png';
import chocolateBarsImage from '../Images/chocolate_bars.png';

// Default placeholder image for items without specific images
const defaultImage = '/placeholder-image.png';

const GroceryCard = ({ item, addToCart, addToWishlist, cartItems, wishlistItems }) => {
  const [quantity, setQuantity] = useState(1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
    } else {
      console.error('Invalid image file. Please upload a valid image file (max 5MB).');
    }
  };

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    };
  }, [uploadedImage]);

  // Calculate discount percentage only if there's a valid discount
  const hasValidDiscount = item.discountedPrice && item.discountedPrice > 0 && item.discountedPrice < item.originalPrice;
  const discountPercentage = hasValidDiscount ? Math.round(((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100) : 0;
  
  const cartItem = cartItems.find(
    cartItem =>
      ((cartItem.grocery_id === item.id || cartItem.groceryId === item.id)) &&
      cartItem.category === item.category
  );
  const isInCart = !!cartItem;
  
  const wishlistItem = wishlistItems.find(
    wishlistItem => wishlistItem.grocery_id === item.id && wishlistItem.category === item.category
  );
  const isInWishlist = !!wishlistItem;

  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
      setJustAdded(false);
    } else if (wishlistItem) {
      setQuantity(wishlistItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [cartItem, wishlistItem]);

  const openQuickView = () => setShowQuickViewModal(true);
  const closeQuickView = () => setShowQuickViewModal(false);

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setJustAdded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 w-full max-w-[200px] mx-auto"
    >
      <div className="relative">
        <img
          src={item.image}
          alt={`${item.name} - ${item.description}`}
          className="w-full h-[120px] object-contain p-2 bg-white"
          onError={(e) => {
            e.target.onerror = null;
            if (e.target.src !== defaultImage) {
              e.target.src = defaultImage;
              e.target.alt = `${item.name} - Image not available`;
            }
          }}
        />
        <div className="absolute top-2 right-2 flex space-x-2">
          {/* Heart and Eye: icons only, no round bg */}
          <button
            className="p-0 m-0 bg-transparent text-gray-400 hover:text-red-500"
            onClick={() => addToWishlist(item, quantity)}
            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label="Wishlist"
          >
            <FaHeart className={`w-5 h-5 ${isInWishlist ? 'text-red-500' : ''}`} />
          </button>
          <button
            className="p-0 m-0 bg-transparent text-gray-500 hover:text-gray-700"
            onClick={openQuickView}
            title="Quick View"
            aria-label="Quick view"
          >
            <FaEye className="w-5 h-5" />
          </button>
        </div>
        
        {item.isBestSeller && (
          <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-semibold">
            Best Seller
          </span>
        )}
      </div>
      
      <div className="p-2 overflow-hidden">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-5 line-clamp-2 min-h-[2.5rem] pr-2">{item.name}</h3>
          {hasValidDiscount && (
            <span className="text-[10px] font-semibold text-blue-600 whitespace-nowrap">{discountPercentage}% OFF</span>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mb-1 line-clamp-2 min-h-[1.5rem]">{item.description}</p>
        
        <div className="flex items-center space-x-2 mb-2">
          <p className="text-sm font-semibold text-black">
            ₹{(() => {
              const hasDiscount = item.discountedPrice && item.discountedPrice > 0 && item.discountedPrice < item.originalPrice;
              const displayPrice = hasDiscount ? item.discountedPrice : item.originalPrice;
              return typeof displayPrice === 'number' ? displayPrice.toFixed(2) : '0.00';
            })()}
          </p>
          {hasValidDiscount && (
            <p className="text-xs text-gray-400 line-through">
              ₹{typeof item.originalPrice === 'number' ? item.originalPrice.toFixed(2) : '0.00'}
            </p>
          )}
        </div>
        
        <div className="mt-2 flex items-center justify-between flex-nowrap gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {justAdded || isInCart ? (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1 px-2 rounded-md shrink-0"
                onClick={() => navigate('/home-grocery/cart')}
              >
                View Cart
              </button>
            ) : (
              <button 
                className={`text-white text-xs font-semibold py-0.5 px-0.5 rounded-md shrink-0 ${isInCart ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleAddToCart}
                disabled={isInCart}
              >
                Add to Cart
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-semibold text-gray-700">Qty:</span>
            <div className="flex items-center border rounded px-0.5 py-0.5 bg-white">
              <button
                type="button"
                className="px-0 text-xs font-bold text-gray-700 disabled:text-gray-300"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isInCart}
              >-</button>
              <span className="mx-1 w-4 text-center select-none text-xs">{quantity}</span>
              <button
                type="button"
                className="px-0 text-xs font-bold text-gray-700 disabled:text-gray-300"
                onClick={() => setQuantity(q => Math.min(500, q + 1))}
                disabled={quantity >= 500 || isInCart}
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {showQuickViewModal && (
        <QuickViewModal item={item} onClose={closeQuickView} addToCart={addToCart} cartItems={cartItems} navigate={navigate} />
      )}
    </motion.div>
  );
};

const QuickViewModal = ({ item, onClose, addToCart, cartItems, navigate }) => {
  const [quantity, setQuantity] = useState(1);
  const [localInCart, setLocalInCart] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swipeRef = useRef({ startX: 0 });

  const isInCart = cartItems.some(
    cartItem =>
      (cartItem.grocery_id === item.id || cartItem.groceryId === item.id || cartItem.id === item.id) &&
      cartItem.category === item.category
  );

  useEffect(() => {
    const cartItem = cartItems.find(ci => ci.id === item.id && ci.category === item.category);
    if (cartItem) {
      setQuantity(cartItem.quantity);
      setLocalInCart(true);
    } else {
      setQuantity(1);
      setLocalInCart(false);
    }
  }, [cartItems, item]);

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setLocalInCart(true);
  };

  const normalizeImage = (src) => {
    if (!src) return null;
    if (typeof src !== 'string') return null;
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    if (src.startsWith('/Uploads/')) return API_CONFIG.getUrl(src);
    return API_CONFIG.getUploadUrl(src);
  };

  const rawImages = [
    item.image,
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.gallery) ? item.gallery : []),
    ...(Array.isArray(item.photos) ? item.photos : []),
    ...(Array.isArray(item.media) ? item.media : []),
    item.image1, item.image2, item.image3, item.image4, item.image5,
    item.img1, item.img2, item.img3, item.img4, item.img5,
    item.thumbnail, item.thumbnail2
  ].filter(Boolean);

  const galleryImages = (rawImages.length ? rawImages : [defaultImage])
    .map(normalizeImage)
    .filter(Boolean);

  const showPrev = () => setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  const showNext = () => setActiveIndex((prev) => (prev + 1) % galleryImages.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 pt-8 z-50 md:items-center md:pt-0">
      <div className="bg-white rounded-lg shadow-xl max-w-xs md:max-w-lg w-full max-h[90vh] overflow-y-auto transform transition-all sm:scale-100 sm:w-full sm:mx-auto">
        <div className="p-3 border-b flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">Quick View</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>
        <div className="p-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/2 flex-shrink-0">
              <div
                className="relative rounded-md overflow-hidden select-none"
                onTouchStart={(e) => { swipeRef.current.startX = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
                  if (dx > 40) showPrev();
                  if (dx < -40) showNext();
                }}
              >
                <img
                  src={galleryImages[activeIndex]}
                  alt={`${item.name} - ${item.description}`}
                  className="w-full h-auto rounded-md object-cover aspect-square"
                  draggable="false"
                />
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-white"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-white"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`w-2 h-2 rounded-full ${activeIndex === idx ? 'bg-blue-600' : 'bg-white border border-gray-300'}`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{item.name}</h3>
              <div className="flex items-center mb-1"> 
                <FaStar className="text-yellow-400 mr-1" />
                <span className="text-xs text-gray-600">{item.rating}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2 text-justify line-clamp-3">{item.description}</p>
              <div className="flex items-center space-x-2 mb-2"> 
                <p className="text-sm font-semibold text-black">
                  ₹{(() => {
                    const hasDiscount = item.discountedPrice && item.discountedPrice > 0 && item.discountedPrice < item.originalPrice;
                    const displayPrice = hasDiscount ? item.discountedPrice : item.originalPrice;
                    return typeof displayPrice === 'number' ? displayPrice.toFixed(2) : '0.00';
                  })()}
                </p>
                {item.discountedPrice && item.discountedPrice > 0 && item.discountedPrice < item.originalPrice && (
                  <p className="text-xs text-gray-400 line-through">₹{item.originalPrice.toFixed(2)}</p>
                )}
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between flex-nowrap gap-2">
                  {localInCart || isInCart ? (
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded-md text-xs shrink-0"
                      onClick={() => {
                        onClose();
                        navigate('/home-grocery/cart');
                      }}
                    >
                      View Cart
                    </button>
                  ) : (
                    <button
                      className={`text-white font-semibold py-1 px-2 rounded-md text-xs shrink-0 ${localInCart || isInCart ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      onClick={handleAddToCart}
                      disabled={localInCart || isInCart}
                    >
                      Add to Cart
                    </button>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-semibold text-gray-700">Qty:</span>
                    <div className="flex items-center border rounded px-1 py-0.5 bg-white">
                      <button
                        type="button"
                        className="px-1 text-xs font-bold text-gray-700 disabled:text-gray-300"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || isInCart}
                      >-</button>
                      <span className="mx-1 w-4 text-center select-none text-xs">{quantity}</span>
                      <button
                        type="button"
                        className="px-1 text-xs font-bold text-gray-700 disabled:text-gray-300"
                        onClick={() => setQuantity(q => Math.min(500, q + 1))}
                        disabled={quantity >= 500 || isInCart}
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div> 
          </div>
        </div>
      </div>
    </div>
  );
};

function Groceries() {
  const [randomizedItems, setRandomizedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [minRating, setMinRating] = useState(0);
  const [showBestSellersOnly, setShowBestSellersOnly] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    priceRange: { min: 0, max: 5000 },
    minRating: 0,
    showBestSellersOnly: false,
    sort: '',
    pricePreset: '' // '', 'under_100', '100_500', '500_1000', 'above_1000'
  });
  const [showAllCategories, setShowAllCategories] = useState(false);
  const filterBarRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  useEffect(() => {
    const fetchGroceries = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERIES));
        if (!response.ok) throw new Error('Failed to fetch groceries');
        const data = await response.json();
        
        const formattedData = data.data.map(item => {
          const originalPrice = typeof item.original_price === 'string' 
            ? parseFloat(item.original_price) 
            : item.original_price;
          const discountedPrice = typeof item.discounted_price === 'string'
            ? parseFloat(item.discounted_price)
            : item.discounted_price;
          
        return {
            ...item,
            discountedPrice: isNaN(discountedPrice) ? 0 : discountedPrice,
            originalPrice: isNaN(originalPrice) ? 0 : originalPrice,
            isBestSeller: item.is_best_seller,
            image: item.image?.startsWith('data:') 
              ? item.image 
              : item.image?.startsWith('http') 
                ? item.image 
                : item.image?.startsWith('/Uploads/') 
                  ? API_CONFIG.getUrl(item.image)
                  : API_CONFIG.getUploadUrl(item.image)
          };
        });
        
        const shuffled = [...formattedData].sort(() => Math.random() - 0.5);
        setRandomizedItems(shuffled);
        setLoading(false);
      } catch (error) {
        setFetchError(error.message);
        setLoading(false);
      }
    };
    fetchGroceries();
  }, []);

  const maxItemPrice = Math.max(...randomizedItems.map(item => item.discountedPrice || 0), 0);
  const defaultMaxPrice = Math.max(5000, Math.ceil(maxItemPrice * 1.1));

  useEffect(() => {
    setPriceRange({ min: 0, max: defaultMaxPrice });
    setTempFilters(prev => ({ ...prev, priceRange: { min: 0, max: defaultMaxPrice } }));
  }, [maxItemPrice, defaultMaxPrice]);

  useEffect(() => {
    if (showFilters) {
      setTempFilters(prev => ({
        ...prev,
        priceRange: { ...priceRange },
        minRating,
        showBestSellersOnly,
        sort: sortOption
      }));
    }
  }, [showFilters, priceRange, minRating, showBestSellersOnly, sortOption]);

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const applyPricePreset = (preset) => {
    let min = 0, max = defaultMaxPrice;
    switch (preset) {
      case 'under_100': min = 0; max = 100; break;
      case '100_500': min = 100; max = 500; break;
      case '500_1000': min = 500; max = 1000; break;
      case 'above_1000': min = 1000; max = defaultMaxPrice; break;
      default: break;
    }
    setTempFilters(prev => ({
      ...prev,
      pricePreset: preset,
      priceRange: { min, max }
    }));
  };

  const applyFilters = () => {
    const newMin = Math.max(0, Number(tempFilters.priceRange.min));
    const newMax = Math.max(newMin, Number(tempFilters.priceRange.max));
    setPriceRange({ min: newMin, max: newMax });
    setMinRating(tempFilters.minRating);
    setShowBestSellersOnly(tempFilters.showBestSellersOnly);
    setSortOption(tempFilters.sort || '');
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      priceRange: { min: 0, max: defaultMaxPrice },
      minRating: 0,
      showBestSellersOnly: false,
      sort: '',
      pricePreset: ''
    };
    setTempFilters(defaultFilters);
    setPriceRange(defaultFilters.priceRange);
    setMinRating(defaultFilters.minRating);
    setShowBestSellersOnly(defaultFilters.showBestSellersOnly);
    setSortOption('');
    setSearchQuery('');
  };

  const filteredItems = randomizedItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = item.discountedPrice >= Number(priceRange.min) && 
                        item.discountedPrice <= Number(priceRange.max);
    const matchesRating = (item.rating || 0) >= minRating;
    const matchesBestSeller = !showBestSellersOnly || item.isBestSeller;
    return matchesCategory && matchesSearch && matchesPrice && matchesRating && matchesBestSeller;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOption === 'price-low') {
      const priceA = typeof a.discountedPrice === 'number' ? a.discountedPrice : 0;
      const priceB = typeof b.discountedPrice === 'number' ? b.discountedPrice : 0;
      return priceA - priceB;
    }
    if (sortOption === 'price-high') {
      const priceA = typeof a.discountedPrice === 'number' ? a.discountedPrice : 0;
      const priceB = typeof b.discountedPrice === 'number' ? b.discountedPrice : 0;
      return priceB - priceA;
    }
    if (sortOption === 'rating') {
      const ratingA = typeof a.rating === 'number' ? a.rating : 0;
      const ratingB = typeof b.rating === 'number' ? b.rating : 0;
      return ratingB - ratingA;
    }
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const handleAuthError = (err) => {
    if (err?.message === 'Unauthorized' || err?.status === 401 || err?.message === 'Session expired. Please log in again.') {
      authService.logout();
      sessionStorage.setItem('redirectUrl', window.location.pathname);
      showToast('Session expired. Please log in again.', 'error');
      navigate('/login');
      return true;
    }
    return false;
  };

  const fetchCartItems = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_CART), {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        }
      });
      
      if (response.ok) {
        const responseData = await response.json();
        const cartData = responseData.data || [];
        const formatted = cartData.map(item => ({
          ...item,
          originalPrice: parseFloat(item.original_price ?? item.originalPrice ?? 0),
          discountedPrice: parseFloat(item.discounted_price ?? item.discountedPrice ?? 0),
          image: item.image
            ? item.image.startsWith('http')
              ? item.image
              : API_CONFIG.getUploadUrl(item.image)
            : '/placeholder-image.png',
          size: item.size || 'N/A'
        }));
        setCartItems(formatted);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      setCartItems([]);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const addToCart = async (item, quantity) => {
    try {
      const response = await addToGroceryCart({ grocery_id: item.id, quantity });

      if (response.success) {
        showToast(`Added ${quantity} ${item.name} to cart!`, 'success');
        await fetchCartItems();
      } else {
        throw new Error(response.message || 'Failed to add to cart');
      }
    } catch (err) {
      if (!handleAuthError(err)) {
        showToast('Error adding item to cart. Please try again.', 'error');
      }
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_WISHLIST), {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map(item => {
          const grocery = item.grocery || item;
          return {
            ...item,
            id: item._id || item.id,
            grocery_id: item.grocery_id || grocery.id,
            name: grocery.name || item.name,
            category: grocery.category || item.category,
            originalPrice: parseFloat(grocery.original_price ?? item.original_price ?? item.originalPrice ?? 0),
            discountedPrice: parseFloat(grocery.discounted_price ?? item.discounted_price ?? item.discountedPrice ?? 0),
            image: (grocery.image || item.image)
              ? (grocery.image || item.image).startsWith('http')
                ? (grocery.image || item.image)
                : API_CONFIG.getUploadUrl(grocery.image || item.image)
              : '/placeholder-image.png'
          };
        });
        setWishlistItems(formatted);
      } else {
        setWishlistItems([]);
      }
    } catch (err) {
      setWishlistItems([]);
    }
  };

  const addToWishlist = async (item, quantity = 1) => {
    try {
      const existingItem = wishlistItems.find(wishlistItem => 
        wishlistItem.grocery_id === item.id && wishlistItem.category === item.category
      );

      if (existingItem) {
        const response = await fetch(API_CONFIG.getUrl(`/api/gwishlist/${existingItem._id || existingItem.id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-token'
          }
        });

        if (response.ok) {
          setWishlistItems(prev => prev.filter(wishlistItem => 
            !(wishlistItem.grocery_id === item.id && wishlistItem.category === item.category)
          ));
          showToast(`Removed ${item.name} from wishlist!`, 'success');
        } else {
          throw new Error('Failed to remove from wishlist');
        }
      } else {
        const payload = {
          grocery_id: item.id,
          name: item.name,
          image: item.image,
          category: item.category,
          original_price: item.originalPrice,
          discounted_price: item.discountedPrice,
          quantity: quantity
        };

        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_WISHLIST), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-token'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const newWishlistItem = {
            id: Date.now(),
            grocery_id: item.id,
            name: item.name,
            image: item.image,
            category: item.category,
            original_price: item.originalPrice,
            discounted_price: item.discountedPrice,
            quantity: quantity
          };
          setWishlistItems(prev => [...prev, newWishlistItem]);
          showToast(`Added ${item.name} to wishlist!`, 'success');
        } else {
          throw new Error('Failed to add to wishlist');
        }
      }
    } catch (err) {
      showToast('Error updating wishlist. Please try again.', 'error');
      await fetchWishlist();
    }
  };

  const bannerImages = [banner1, banner2, banner3, banner4, banner5];
  const [currentBanner, setCurrentBanner] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);
  const goToBanner = (idx) => setCurrentBanner(idx);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % bannerImages.length);

  const categoryList = [
    { name: 'Fruits & Vegetables', image: catFruits, label: 'Fruits & Vegetables' },
    { name: 'Bakery, Cakes & Dairy', image: catDairy, label: 'Bakery, Cakes & Dairy' },
    { name: 'Breakfast & More', image: cerealImage, label: 'Breakfast & More' },
    { name: 'Eggs, Meat & Fish', image: eggImage, label: 'Eggs, Meat & Fish' },
    { name: 'Masalas, Oils & Dry Fruits', image: catMasala, label: 'Masalas, Oils & Dry Fruits' },
    { name: 'Atta, Rice, Dals & Sugar', image: riceImage, label: 'Atta, Rice, Dals & Sugar' },
    { name: 'Chips, Biscuits & Namkeen', image: chipsImage, label: 'Chips, Biscuits & Namkeen' },
    { name: 'Hot & Cold Beverages', image: coffeeImage, label: 'Hot & Cold Beverages' },
    { name: 'Instant & Frozen Foods', image: catInstant, label: 'Instant & Frozen Foods' },
    { name: 'Chocolates & Ice Creams', image: chocolateBarsImage, label: 'Chocolates & Ice Creams' },
  ];

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.show && (
        <div className={`fixed top-20 right-4 z-[1000] px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 text-white hover:text-gray-200">×</button>
          </div>
        </div>
      )}
      
      <Header />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-32 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Shop by category</h2>
              <button
                className="text-blue-600 font-semibold text-sm hover:underline focus:outline-none"
                onClick={() => setShowAllCategories((prev) => !prev)}
              >
                {showAllCategories ? 'Show less' : 'Show more'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(showAllCategories ? categoryList : categoryList.slice(0, 3)).map((cat) => (
                <button
                  key={cat.name}
                  className="flex flex-col items-center bg-white rounded-lg shadow p-1 hover:bg-gray-100 focus:outline-none transition"
                  onClick={() => {
                    setSelectedCategory(cat.label);
                    setTimeout(() => {
                      filterBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  type="button"
                >
                  <img src={cat.image} alt={cat.label} className="w-20 h-20 object-contain mb-1" />
                  <span className="text-xs font-semibold text-center text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-6 relative">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -50) {
                  nextBanner();
                } else if (info.offset.x > 50) {
                  prevBanner();
                }
              }}
              className="w-full h-56 md:h-80 object-cover rounded-xl shadow-md transition-all duration-500 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'pan-y' }}
            >
              <img
                src={bannerImages[currentBanner]}
                alt={`Banner ${currentBanner + 1}`}
                className="w-full h-56 md:h-80 object-cover rounded-xl"
                draggable="false"
              />
            </motion.div>
            <button
              onClick={prevBanner}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 shadow-md z-10"
              aria-label="Previous banner"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full p-2 shadow-md z-10"
              aria-label="Next banner"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {bannerImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToBanner(idx)}
                  className={`w-2.5 h-2.5 rounded-full ${currentBanner === idx ? 'bg-blue-600' : 'bg-white border border-gray-300'} transition-all`}
                  aria-label={`Go to banner ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div ref={filterBarRef} className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for fruits and vegetables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  />
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

              <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Items
                </button>
                {categoryList.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === cat.label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {(priceRange.min > 0 || priceRange.max < defaultMaxPrice || minRating > 0 || showBestSellersOnly || sortOption) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-blue-800">Active Filters:</span>
                      {sortOption && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Sort: {sortOption}
                        </span>
                      )}
                      {priceRange.min > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Min: ₹{priceRange.min}
                        </span>
                      )}
                      {priceRange.max < defaultMaxPrice && (
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
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!loading && !fetchError && (
              <div className="mt-4 mb-2 text-sm text-gray-600">
                Showing {sortedItems.length} of {randomizedItems.length} items
                {searchQuery && ` for "${searchQuery}"`}
              </div>
            )}

            {loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading grocery items...</p>
                </div>
              </div>
            ) : fetchError ? (
              <div className="text-center py-12 text-red-500">{fetchError}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center">
                {sortedItems.map((item) => (
                  <GroceryCard
                    key={`${item.category}-${item.id}`}
                    item={item}
                    addToCart={addToCart}
                    addToWishlist={addToWishlist}
                    cartItems={cartItems}
                    wishlistItems={wishlistItems}
                  />
                ))}
              </div>
            )}

            {sortedItems.length === 0 && !loading && !fetchError && (
              <div className="text-center py-12">
                <p className="text-gray-500">No items found matching your criteria.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
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
                  {/* {isFilterMinimized ? <FaChevronDown /> : <FaChevronUp />} */}
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

                  {/* Quick Price presets */}
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
                              const minVal = clamp(Number.isFinite(raw) ? Math.floor(raw) : 0, 0, defaultMaxPrice);
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
                              const maxVal = clamp(Number.isFinite(raw) ? Math.floor(raw) : 0, 0, defaultMaxPrice);
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
                        max={defaultMaxPrice}
                        value={tempFilters.priceRange.max}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          const val = clamp(Number.isFinite(raw) ? Math.floor(raw) : tempFilters.priceRange.max, tempFilters.priceRange.min, defaultMaxPrice);
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

                  {/* Best sellers */}
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
                </div>

                <div className="mt-4 flex justify-between items-center border-t pt-4">
                  <button
                    onClick={clearAllFilters}
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
      </div>
      <Footer />
    </div>
  );
}

export default Groceries;