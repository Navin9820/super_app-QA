import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Minus, 
  Plus, 
  X 
} from 'lucide-react';
import HeaderF from '../ComponentsF/HeaderF';
import FooterFood from '../ComponentsF/FooterFood';
import QuickViewDishModal from '../ComponentsF/QuickViewDishModal';
import { restaurantService, dishService, foodCartService, formatImageUrl, formatCurrency } from '../../services/foodDeliveryService';
import { useFoodCart } from '../../Utility/FoodCartContext';

// Filter and sort options
const filterOptions = [
  { id: 'all', name: 'All' },
  { id: 'veg', name: 'Vegetarian' },
  { id: 'non-veg', name: 'Non-Vegetarian' }
];

const sortOptions = [
  { id: '', name: 'Recommended' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'rating', name: 'Rating: High to Low' },
  { id: 'name', name: 'Name: A to Z' }
];

const pricePresets = [
  { id: 'under_100', label: 'Under ₹100' },
  { id: '100_500', label: '₹100–₹500' },
  { id: '500_1000', label: '₹500–₹1000' },
  { id: 'above_1000', label: '₹1000+' }
];

// Dish Item Component (unchanged)
const DishItem = ({ dish, restaurant, onAddToCart, onQuickView, isAddingToCart, cartItems }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(dish._id, quantity);
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const effectivePrice = dish.sale_price || dish.price;
  const hasDiscount = dish.price > effectivePrice;
  const isInCart = cartItems[dish._id]?.added;

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow w-full max-w-[320px] mx-auto">
      <div className="relative">
        <button className="block w-full h-36" onClick={() => onQuickView(dish)}>
          <img
            src={formatImageUrl(dish.image)}
            alt={dish.name}
            className="w-full h-36 object-cover"
          />
        </button>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {dish.is_bestseller && (
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Bestseller
            </span>
          )}
          {dish.is_trending && (
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Trending
            </span>
          )}
          {hasDiscount && (
            <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              {Math.round(((dish.price - effectivePrice) / dish.price) * 100)}% OFF
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <div className={`w-5 h-5 border-2 flex items-center justify-center ${dish.is_veg ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${dish.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm leading-5 line-clamp-2 min-h-[2.5rem]">
          {dish.name}
        </h3>
        <p className="text-xs font-semibold text-gray-600 mt-1 mb-2 truncate">
          {restaurant?.name || 'Restaurant'}
        </p>
        {dish.description && (
          <p className="text-xs font-semibold text-gray-600 line-clamp-2 mb-2">
            {dish.description}
          </p>
        )}
        {dish.cuisines && dish.cuisines.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 max-h-8 overflow-hidden">
            {dish.cuisines.slice(0, 3).map((cuisine, index) => (
              <span key={index} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
                {cuisine}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{formatCurrency(effectivePrice)}</span>
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through font-semibold">{formatCurrency(dish.price)}</span>
            )}
          </div>
          <div className="flex items-center border border-gray-200 rounded-md">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus size={14} />
            </button>
            <span className="px-2 py-1 font-semibold text-center min-w-[28px] text-xs">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 py-1 hover:bg-gray-50"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        {isInCart ? (
          <button
            onClick={() => navigate('/home-food/cart')}
            className="w-full bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            View Cart
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isAddingToCart}
            className="w-full bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

// Restaurant Header Component (unchanged)
const RestaurantHeader = ({ restaurant }) => {
  if (!restaurant) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex gap-4">
        <img
          src={formatImageUrl(restaurant.image)}
          alt={restaurant.name}
          className="w-24 h-24 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{restaurant.name}</h1>
          <div className="flex items-center gap-4 text-sm font-semibold text-gray-600 mb-2">
            {restaurant.location && (
              <div className="flex items-center">
                <MapPin size={16} className="mr-1" />
                {restaurant.location.area || restaurant.address}
              </div>
            )}
          </div>
          {restaurant.description && (
            <p className="text-gray-600 text-sm font-semibold">{restaurant.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

function RestaurentPageCategory() {
  const navigate = useNavigate();
  const { restaurentCategoryName, restaurant: restaurantParam } = useParams();
  const location = useLocation();
  
  // State
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToFoodCart, forceAddToFoodCart } = useFoodCart();
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [quickViewDish, setQuickViewDish] = useState(null);
  const [conflictDishId, setConflictDishId] = useState(null);
  const [cartItems, setCartItems] = useState({});
  
  // Filter and sorting state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [minRating, setMinRating] = useState(0);
  const [showBestSellersOnly, setShowBestSellersOnly] = useState(false);
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    priceRange: { min: 0, max: 5000 },
    minRating: 0,
    showBestSellersOnly: false,
    showTrendingOnly: false,
    sort: '',
    pricePreset: ''
  });
  const [sortOption, setSortOption] = useState('');
  const filterBarRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Selected restaurant
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Memoize parameters
  const memoizedCategoryName = useMemo(() => restaurentCategoryName, [restaurentCategoryName]);
  const memoizedRestaurantParam = useMemo(() => restaurantParam, [restaurantParam]);

  // Calculate max price for range slider
  const maxItemPrice = useMemo(() => Math.max(...dishes.map(dish => dish.sale_price || dish.price || 0), 0), [dishes]);
  const defaultMaxPrice = Math.max(5000, Math.ceil(maxItemPrice * 1.1));

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  // Refetch data when restaurant parameter changes
  useEffect(() => {
    if (memoizedRestaurantParam) {
      console.log('🔄 Restaurant parameter changed, refetching data...');
      setDishes([]);
      setSelectedRestaurant(null);
      setLoading(true);
    }
  }, [memoizedRestaurantParam]);

  // Fetch data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        console.log('🍽️ Fetching restaurant page data...', { memoizedCategoryName, memoizedRestaurantParam });

        if (memoizedRestaurantParam) {
          console.log('🔍 Fetching data for restaurant ID:', memoizedRestaurantParam);
          
          const [restaurantRes, dishesRes, categoriesRes] = await Promise.all([
            restaurantService.getRestaurantById(memoizedRestaurantParam),
            dishService.getDishesByRestaurant(memoizedRestaurantParam),
            restaurantService.getRestaurantCategories()
          ]);

          console.log('🔍 Restaurant API response:', restaurantRes);
          console.log('🔍 Dishes API response:', dishesRes);

          if (isMounted && restaurantRes.success) {
            setSelectedRestaurant(restaurantRes.data);
            console.log('✅ Restaurant loaded:', restaurantRes.data.name);
          } else {
            console.error('❌ Failed to load restaurant:', restaurantRes.message);
          }

          if (isMounted && dishesRes.success) {
            const restaurantDishes = dishesRes.data.filter(dish => 
              dish.restaurant_id === memoizedRestaurantParam || 
              dish.restaurant === memoizedRestaurantParam ||
              dish.restaurant_id?._id === memoizedRestaurantParam
            );
            setDishes(restaurantDishes);
            console.log('✅ Dishes loaded for restaurant:', restaurantDishes.length, 'dishes out of', dishesRes.data.length, 'total');
          } else {
            console.error('❌ Failed to load dishes:', dishesRes.message);
            setDishes([]);
          }

          if (isMounted && categoriesRes.success) {
            setCategories(categoriesRes.data);
          }
        } else {
          const categoryFilter = memoizedCategoryName && memoizedCategoryName !== ':restaurentCategoryName' 
            ? { category: decodeURIComponent(memoizedCategoryName) } 
            : {};

          const [restaurantsRes, dishesRes, categoriesRes] = await Promise.all([
            restaurantService.getAllRestaurants(categoryFilter),
            dishService.getAllDishes(categoryFilter),
            restaurantService.getRestaurantCategories()
          ]);

          if (isMounted && restaurantsRes.success) {
            setRestaurants(restaurantsRes.data);
            console.log('✅ Restaurants loaded:', restaurantsRes.data.length);
          }

          if (isMounted && dishesRes.success) {
            setDishes(dishesRes.data);
            console.log('✅ Dishes loaded:', dishesRes.data.length);
          }

          if (isMounted && categoriesRes.success) {
            setCategories(categoriesRes.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ Error fetching data:', err);
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [memoizedCategoryName, memoizedRestaurantParam]);

  // Sync tempFilters with main filter state when filter panel opens
  useEffect(() => {
    if (showFilters) {
      setTempFilters({
        priceRange: { ...priceRange },
        minRating,
        showBestSellersOnly,
        showTrendingOnly,
        sort: sortOption,
        pricePreset: ''
      });
    }
  }, [showFilters, priceRange, minRating, showBestSellersOnly, showTrendingOnly, sortOption]);

  // Update price range when maxItemPrice changes
  useEffect(() => {
    setPriceRange({ min: 0, max: defaultMaxPrice });
    setTempFilters(prev => ({ ...prev, priceRange: { min: 0, max: defaultMaxPrice } }));
  }, [defaultMaxPrice]);

  // Clamp function for price range
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Apply price preset
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

  // Apply filters
  const applyFilters = () => {
    const newMin = Math.max(0, Number(tempFilters.priceRange.min));
    const newMax = Math.max(newMin, Number(tempFilters.priceRange.max));
    setPriceRange({ min: newMin, max: newMax });
    setMinRating(tempFilters.minRating);
    setShowBestSellersOnly(tempFilters.showBestSellersOnly);
    setShowTrendingOnly(tempFilters.showTrendingOnly);
    setSortOption(tempFilters.sort || '');
    setShowFilters(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const defaultFilters = {
      priceRange: { min: 0, max: defaultMaxPrice },
      minRating: 0,
      showBestSellersOnly: false,
      showTrendingOnly: false,
      sort: '',
      pricePreset: ''
    };
    setTempFilters(defaultFilters);
    setPriceRange(defaultFilters.priceRange);
    setMinRating(defaultFilters.minRating);
    setShowBestSellersOnly(defaultFilters.showBestSellersOnly);
    setShowTrendingOnly(defaultFilters.showTrendingOnly);
    setSortOption('');
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Filter and sort dishes
  const filteredAndSortedDishes = useMemo(() => {
    let filtered = dishes;

    if (searchQuery.trim()) {
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'veg':
          filtered = filtered.filter(dish => dish.is_veg);
          break;
        case 'non-veg':
          filtered = filtered.filter(dish => !dish.is_veg);
          break;
        default:
          filtered = filtered.filter(dish => 
            dish.cuisines && dish.cuisines.some(cuisine => 
              cuisine.toLowerCase().includes(selectedCategory.toLowerCase())
            )
          );
      }
    }

    if (priceRange.min > 0 || priceRange.max < defaultMaxPrice) {
      filtered = filtered.filter(dish => {
        const price = dish.sale_price || dish.price;
        return price >= Number(priceRange.min) && price <= Number(priceRange.max);
      });
    }

    if (minRating > 0) {
      filtered = filtered.filter(dish => (dish.rating || 0) >= minRating);
    }

    if (showBestSellersOnly) {
      filtered = filtered.filter(dish => dish.is_bestseller);
    }

    if (showTrendingOnly) {
      filtered = filtered.filter(dish => dish.is_trending);
    }

    return [...filtered].sort((a, b) => {
      if (sortOption === 'price-low') {
        return (a.sale_price || a.price) - (b.sale_price || b.price);
      }
      if (sortOption === 'price-high') {
        return (b.sale_price || b.price) - (a.sale_price || a.price);
      }
      if (sortOption === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [dishes, selectedCategory, sortOption, searchQuery, priceRange, minRating, showBestSellersOnly, showTrendingOnly]);

  // Add to cart
  const handleAddToCart = async (dishId, quantity = 1) => {
    try {
      setAddingToCartId(dishId);
      console.log('🛒 Adding to cart:', { dishId, quantity });

      const response = await addToFoodCart(dishId, quantity);
      
      if (response.success) {
        console.log('✅ Added to cart successfully');
        setCartItems(prev => ({
          ...prev,
          [dishId]: { added: true }
        }));
        showToast(`Added ${quantity} item(s) to cart!`, 'success');
      } else if (response.code === 'VENDOR_CONFLICT') {
        setConflictDishId(dishId);
      } else {
        console.error('❌ Failed to add to cart:', response.message);
        showToast(response.message || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCartId(null);
    }
  };

  const confirmSwitchRestaurantInline = async () => {
    if (!conflictDishId) return;
    setAddingToCartId(conflictDishId);
    try {
      const res = await forceAddToFoodCart(conflictDishId, 1);
      if (res?.success) {
        setCartItems(prev => ({
          ...prev,
          [conflictDishId]: { added: true }
        }));
        showToast('Cart updated with new item!', 'success');
      } else {
        showToast(res?.message || 'Failed to add to cart', 'error');
      }
    } finally {
      setConflictDishId(null);
      setAddingToCartId(null);
    }
  };

  const openQuickView = (dish) => setQuickViewDish(dish);
  const closeQuickView = () => setQuickViewDish(null);

  // Dynamic categories
  const dynamicCategories = useMemo(() => {
    const baseCategories = [...filterOptions];
    if (categories.length > 0) {
      categories.forEach(category => {
        if (!baseCategories.find(c => c.id === category.slug)) {
          baseCategories.push({
            id: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
            name: category.name
          });
        }
      });
    }
    return baseCategories;
  }, [categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-sm font-semibold">
        <HeaderF />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading delicious dishes...</p>
          </div>
        </div>
        <FooterFood />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-sm font-semibold">
        <HeaderF />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading data: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <FooterFood />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-sm font-semibold">
      {toast.show && (
        <div className={`fixed top-20 right-4 z-[1000] px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 text-white hover:text-gray-200">×</button>
          </div>
        </div>
      )}
      
      <HeaderF />
      
      <div className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Restaurant Header */}
          {selectedRestaurant && <RestaurantHeader restaurant={selectedRestaurant} />}

          {/* Page Title and Search Bar with Filter Button */}
          <div className="mb-6" ref={filterBarRef}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {selectedRestaurant 
                    ? `Menu - ${selectedRestaurant.name}`
                    : memoizedCategoryName && memoizedCategoryName !== ':restaurentCategoryName'
                      ? `${decodeURIComponent(memoizedCategoryName)} Restaurants`
                      : 'All Restaurants'
                  }
                </h1>
                <p className="text-gray-600 mt-1">
                  {filteredAndSortedDishes.length} dishes available
                </p>
              </div>
            </div>
            
            {/* Search Bar and Filter Button */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label={showFilters ? 'Close filters' : 'Open filters'}
              >
                <Filter size={20} />
                <span className="font-semibold">Filters</span>
              </button>
            </div>

            {/* Active Filters */}
            {(priceRange.min > 0 || priceRange.max < defaultMaxPrice || minRating > 0 || showBestSellersOnly || showTrendingOnly || sortOption || selectedCategory !== 'all') && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-blue-800">Active Filters:</span>
                    {sortOption && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Sort: {sortOptions.find(opt => opt.id === sortOption)?.name || sortOption}
                      </span>
                    )}
                    {selectedCategory !== 'all' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Category: {dynamicCategories.find(cat => cat.id === selectedCategory)?.name || selectedCategory}
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
                    {showTrendingOnly && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Trending Only
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

            {/* Category Buttons */}
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
              {dynamicCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content (Dishes Grid) */}
          <div className="flex-1">
            {filteredAndSortedDishes.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredAndSortedDishes.map((dish) => (
                  <DishItem
                    key={dish._id}
                    dish={dish}
                    restaurant={selectedRestaurant || restaurants.find(r => r._id === dish.restaurant_id)}
                    onAddToCart={handleAddToCart}
                    onQuickView={openQuickView}
                    isAddingToCart={addingToCartId === dish._id}
                    cartItems={cartItems}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No dishes found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search or filters' : 
                     memoizedRestaurantParam ? 'This restaurant has no dishes available' : 
                     'No dishes available for the selected criteria'}
                  </p>
                  {memoizedRestaurantParam && (
                    <p className="text-sm text-gray-500">
                      Restaurant ID: {memoizedRestaurantParam}
                    </p>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side Filter Drawer */}
      {showFilters && (
        <div className="lg:w-80 fixed lg:sticky top-16 right-0 h-[calc(100vh-4rem)] bg-white p-4 rounded-lg shadow-lg z-[110] lg:z-10 overflow-y-auto lg:ml-4 border border-gray-200 transform transition-all duration-300 lg:translate-x-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterMinimized(!isFilterMinimized)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label={isFilterMinimized ? 'Expand filters' : 'Minimize filters'}
              >
                {isFilterMinimized }
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close filters"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {!isFilterMinimized && (
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
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Price Presets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Quick Price</h3>
                <div className="flex flex-wrap gap-2">
                  {pricePresets.map(p => (
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

              {/* Trending */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Trending</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempFilters.showTrendingOnly}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, showTrendingOnly: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-sm">Show Trending Only</span>
                </label>
              </div>

              {/* Apply/Clear Buttons */}
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
            </div>
          )}
        </div>
      )}

      <FooterFood />

      <QuickViewDishModal
        isOpen={!!quickViewDish}
        onClose={closeQuickView}
        dish={quickViewDish}
      />

      {conflictDishId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">
          <div className="bg-white rounded-xl p-5 w-[90%] max-w-sm">
            <div className="text-base text-gray-800 mb-3">You can only order from one restaurant at a time. Clear your cart and add this item?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConflictDishId(null)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={confirmSwitchRestaurantInline} className="px-3 py-1 bg-blue-600 text-white rounded">Clear & Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurentPageCategory;