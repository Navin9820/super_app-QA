import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BsArrowRight, BsFire } from 'react-icons/bs';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { TrendingUp, Clock, MapPin } from 'lucide-react';
import HeaderF from '../ComponentsF/HeaderF';
import FooterFood from '../ComponentsF/FooterFood';
import { 
  restaurantService, 
  dishService, 
  formatImageUrl, 
  formatCurrency, 
  formatTime 
} from '../../services/foodDeliveryService';

// Static banner images
import promoBanner1 from "../ImagesF/indian-banner1.jpg";
import promoBanner2 from "../ImagesF/indian-banner2.jpg";
import promoBanner3 from "../ImagesF/indian-banner3.jpg";
import mainBanner1 from "../ImagesF/main-banner1.jpg";
import mainBanner2 from "../ImagesF/main-banner2.jpg";
import mainBanner3 from "../ImagesF/main-banner3.jpg";

// Promotional banners
const promoBanners = [
  { id: 1, imageF: promoBanner1, alt: "Weekend Special Offer" },
  { id: 2, imageF: promoBanner2, alt: "Family Combo Deal" },
  { id: 3, imageF: promoBanner3, alt: "Festival Discount" }
];

// Main banners
const mainBanners = [
  { 
    id: 1, 
    title: "BIG",
    subtitle: "Home delivery",
    offers: [
      { type: "Flat", discount: "25% off", description: "No packaging charges" },
      { type: "Flat", discount: "35% off", description: "CakeZone Patisserie" }
    ],
    image: mainBanner1,
    overlay: "rgba(0,0,0,0.3)"
  },
  { 
    id: 2, 
    title: "SPECIAL",
    subtitle: "Weekend offer",
    offers: [
      { type: "Flat", discount: "30% off", description: "On all orders" },
      { type: "Extra", discount: "Free item", description: "With every purchase" }
    ],
    image: mainBanner2,
    overlay: "rgba(0,0,0,0.25)"
  },
  { 
    id: 3, 
    title: "NEW",
    subtitle: "Try our specials",
    offers: [
      { type: "Combo", discount: "40% off", description: "Family meal deal" },
      { type: "Free", discount: "Delivery", description: "On orders above $20" }
    ],
    image: mainBanner3,
    overlay: "rgba(0,0,0,0.35)"
  }
];

// Category Item Component
const CategoryItem = ({ category }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex flex-col items-center cursor-pointer px-1"
      onClick={() => navigate(`/home-food/restaurent-list-based-on-category/${encodeURIComponent(category.name)}`)}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 flex items-center justify-center rounded-full mb-2 border border-blue-200 overflow-hidden">
        {category.image ? (
          <img
            src={formatImageUrl(category.image)}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-blue-600 font-semibold">
            {category.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-xs text-center font-semibold text-gray-700 truncate w-full max-w-[60px] sm:max-w-none">
        {category.name}
      </p>
    </div>
  );
};

// Restaurant Item Component
const RestaurantItem = ({ restaurant, categoryName }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => navigate(`/home-food/restaurent-list-based-on-category/${encodeURIComponent(categoryName)}/restaurant/${restaurant._id}`)}
    >
      <div className="relative h-40">
        <img
          src={formatImageUrl(restaurant.image)}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {restaurant.offers && (
          <span className="absolute top-2 left-2 bg-red-600 text-white font-semibold px-2 py-1 rounded-md shadow">
            {typeof restaurant.offers === 'string' 
              ? restaurant.offers 
              : restaurant.offers.title || (restaurant.offers.discount_percentage ? restaurant.offers.discount_percentage + '% OFF' : 'Special Offer')
            }
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 truncate">{restaurant.name}</h3>
        </div>
        <div className="flex items-center gap-4 text-gray-600 font-semibold mb-2">
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{restaurant.delivery_time || '30-40 min'}</span>
          </div>
          <div className="flex items-center">
            <MapPin size={14} className="mr-1" />
            <span>{restaurant.location?.area || 'Nearby'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {restaurant.cuisines?.slice(0, 2).map((cuisine, index) => (
            <span key={index} className="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">
              {cuisine}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Bestseller Item Component
const BestsellerItem = ({ dish }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex-shrink-0 w-52 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/home-food/dish/${dish._id || dish.id}`)}
    >
      <div className="relative">
        {dish.image ? (
          <img
            src={formatImageUrl(dish.image)}
            alt={dish.name}
            className="w-full h-24 object-cover"
          />
        ) : (
          <div className="w-full h-24 bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {dish.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {dish.is_trending && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full font-semibold flex items-center">
            <TrendingUp size={10} className="mr-1" />
            #{dish.trending_rank}
          </div>
        )}
        {dish.discount_percentage > 0 && (
          <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded font-semibold">
            {dish.discount_percentage}% OFF
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 truncate text-sm">{dish.name}</h3>
        {/* Dish Description */}
        <div className="mt-2 mb-3">
          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
            {(() => {
              // Always use the full default description if the existing description is too short or empty
              const existingDesc = dish.description;
              if (!existingDesc || existingDesc.length < 20 || existingDesc.length === 1) {
                return `${dish.name} is a delicious and flavorful dish prepared with fresh ingredients and authentic spices. This mouth-watering recipe combines traditional cooking methods with modern presentation, creating a perfect balance of taste and nutrition. Each bite offers a burst of flavors that will satisfy your cravings and leave you wanting more.`;
              }
              return existingDesc;
            })()}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-black font-semibold">{formatCurrency(dish.price)}</span>
            {dish.original_price && dish.original_price > dish.price && (
              <span className="text-gray-400 font-semibold line-through ml-1">{formatCurrency(dish.original_price)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 font-semibold text-gray-500">
          <span>{formatTime(dish.preparation_time)}</span>
          <span className={`px-2 py-1 rounded font-semibold ${dish.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}`}>
            {dish.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}
          </span>
        </div>
      </div>
    </div>
  );
};

function HomeScreenF() {
  const navigate = useNavigate();
  const location = useLocation();
  const categorySwiperRef = useRef(null);
  
  // State for dynamic data
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default categories
  const defaultCategories = [
    { _id: 'default-1', name: 'North Indian', image: null },
    { _id: 'default-2', name: 'South Indian', image: null },
    { _id: 'default-3', name: 'Chinese', image: null },
    { _id: 'default-4', name: 'Italian', image: null },
    { _id: 'default-5', name: 'Fast Food', image: null },
    { _id: 'default-6', name: 'Desserts', image: null }
  ];
  
  // Cuisine filter state
  const [selectedCuisine, setSelectedCuisine] = useState(null);

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('Set your location');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Location detection with Google Maps geocoding
  useEffect(() => {
    console.log('HeaderF: Checking header rendering');
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress && savedAddress !== 'Set your location' && !savedAddress.includes('Location (')) {
      setLocationAddress(savedAddress);
      return;
    }
    
    if (savedAddress && savedAddress.includes('Location (')) {
      localStorage.removeItem('userAddress');
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
          setLoadingLocation(true);
          
          try {
            const response = await fetch(API_CONFIG.getUrl(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`));
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.success && data.data) {
                const d = data.data;
                let readableAddress = 'Location detected';
                
                if (d.area && d.city) {
                  readableAddress = `${d.area}, ${d.city}`;
                } else if (d.city) {
                  readableAddress = d.city;
                } else if (d.state) {
                  readableAddress = d.state;
                } else if (d.country) {
                  readableAddress = d.country;
                }
                
                setLocationAddress(readableAddress);
                localStorage.setItem('userAddress', readableAddress);
                console.log('✅ Food HomeScreen: Location detected:', readableAddress);
              } else {
                const cityName = await getCityNameFromCoords(latitude, longitude);
                if (cityName) {
                  setLocationAddress(cityName);
                  localStorage.setItem('userAddress', cityName);
                } else {
                  setLocationAddress('Current Location');
                  localStorage.setItem('userAddress', 'Current Location');
                }
              }
            } else {
              const cityName = await getCityNameFromCoords(latitude, longitude);
              if (cityName) {
                setLocationAddress(cityName);
                localStorage.setItem('userAddress', cityName);
              } else {
                setLocationAddress('Current Location');
                localStorage.setItem('userAddress', 'Current Location');
              }
            }
          } catch (error) {
            console.log('⚠️ Google Maps geocoding failed, trying alternative:', error.message);
            const cityName = await getCityNameFromCoords(latitude, longitude);
            if (cityName) {
              setLocationAddress(cityName);
              localStorage.setItem('userAddress', cityName);
            } else {
              setLocationAddress('Current Location');
              localStorage.setItem('userAddress', 'Current Location');
            }
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationAddress('Location not available');
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setLocationAddress('Geolocation not supported');
      setLoadingLocation(false);
    }
  }, []);

  // Helper function to get city name from coordinates
  const getCityNameFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (response.ok) {
        const data = await response.json();
        if (data.city) {
          return data.city;
        } else if (data.principalSubdivision) {
          return data.principalSubdivision;
        } else if (data.countryName) {
          return data.countryName;
        }
      }
    } catch (error) {
      console.log('Alternative geocoding failed:', error);
    }
    return null;
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🍽️ HomeScreenF: Starting to fetch food delivery data...');

        let restaurantsRes, categoriesRes, bestSellersRes;

        try {
          console.log('🍽️ HomeScreenF: Calling restaurantService.getAllRestaurants()...');
          restaurantsRes = await restaurantService.getAllRestaurants();
          console.log('✅ Restaurants API response:', restaurantsRes);
        } catch (err) {
          console.error('❌ Restaurant API failed:', err);
          restaurantsRes = { success: false, message: err.message };
        }

        try {
          console.log('🍽️ HomeScreenF: Calling restaurantService.getRestaurantCategories()...');
          categoriesRes = await restaurantService.getRestaurantCategories();
          console.log('✅ Categories API response:', categoriesRes);
        } catch (err) {
          console.error('❌ Categories API failed:', err);
          categoriesRes = { success: false, message: err.message };
        }

        try {
          console.log('📞 HomeScreenF: Calling dishService.getBestsellerDishes()...');
          bestSellersRes = await dishService.getBestsellerDishes();
          console.log('✅ Bestsellers API response:', bestSellersRes);
        } catch (err) {
          console.error('❌ Bestsellers API failed:', err);
          bestSellersRes = { success: false, message: err.message };
        }

        if (restaurantsRes.success) {
          setRestaurants(restaurantsRes.data);
          console.log('✅ Restaurants loaded:', restaurantsRes.data.length);
        } else {
          setRestaurants([]);
          console.error('❌ Failed to load restaurants:', restaurantsRes.message);
        }

        if (categoriesRes.success) {
          const apiCategories = categoriesRes.data || [];
          if (apiCategories.length >= 4) {
            setCategories(apiCategories);
          } else {
            const combined = [...apiCategories, ...defaultCategories.slice(0, 4 - apiCategories.length)];
            setCategories(combined);
          }
          console.log('✅ Categories loaded:', apiCategories.length);
        } else {
          setCategories(defaultCategories.slice(0, 4));
          console.error('❌ Failed to load categories:', categoriesRes.message);
        }

        if (bestSellersRes.success) {
          setBestSellers(bestSellersRes.data);
          console.log('✅ Bestsellers loaded:', bestSellersRes.data.length);
        } else {
          setBestSellers([]);
          console.error('❌ Failed to load bestsellers:', bestSellersRes.message);
        }

      } catch (err) {
        console.error('❌ Error in fetchData:', err);
        setError(err.message);
        setRestaurants([]);
        setCategories([]);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check for cuisine in URL on mount
  useEffect(() => {
    const match = location.pathname.match(/restaurent-list-based-on-category\/(.+)$/);
    if (match && match[1]) {
      setSelectedCuisine(decodeURIComponent(match[1]));
    } else {
      setSelectedCuisine(null);
    }
  }, [location.pathname]);

  // Filter restaurants by selected cuisine
  const filteredRestaurants = selectedCuisine
    ? restaurants.filter(r => r.cuisines && r.cuisines.some(c => c.toLowerCase().includes(selectedCuisine.toLowerCase())))
    : restaurants;

  // Slider settings with adjusted gaps
  const categorySettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    slidesPerRow: 1,
    variableWidth: true,
    arrows: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4, variableWidth: true } },
      { breakpoint: 768, settings: { slidesToShow: 4, variableWidth: true } },
      { breakpoint: 640, settings: { slidesToShow: 4, variableWidth: true } },
      { breakpoint: 480, settings: { slidesToShow: 4, variableWidth: true } },
      { breakpoint: 320, settings: { slidesToShow: 4, variableWidth: true } }
    ]
  };

  const restaurantSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    variableWidth: true,
    arrows: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2.5, variableWidth: true } },
      { breakpoint: 768, settings: { slidesToShow: 1.8, variableWidth: true } },
      { breakpoint: 480, settings: { slidesToShow: 1.2, variableWidth: true } },
      { breakpoint: 320, settings: { slidesToShow: 1.1, variableWidth: true } }
    ]
  };

  const handleCategoryClick = (category) => {
    navigate(`/home-food/restaurent-list-based-on-category/${encodeURIComponent(category.name)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderF />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-semibold">Loading delicious food options...</p>
          </div>
        </div>
        <FooterFood />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderF />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">Error loading food delivery data: {error}</p>
            <button
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
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
    <div className="min-h-screen bg-gray-50">
      <HeaderF className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md" />
      <div className="pt-20 pb-20">
        {/* Location Display Section */}
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-600">Delivery to:</span>
              <span className="font-semibold text-gray-800">
                {loadingLocation ? 'Detecting location...' : locationAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Main Banner Section */}
        <div className="px-4 mt-4 relative">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            className="rounded-lg overflow-hidden"
          >
            {mainBanners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div className="relative h-40 bg-gradient-to-r from-blue-400 to-blue-600">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center px-6" style={{ backgroundColor: banner.overlay }}>
                    <div className="text-white">
                      <h2 className="text-2xl font-semibold">{banner.title}</h2>
                      <p className="text-lg mb-2">{banner.subtitle}</p>
                      <div className="space-y-1">
                        {banner.offers.map((offer, index) => (
                          <p key={index} className="font-semibold">
                            {offer.type} {offer.discount} - {offer.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {mainBanners.length > 1 && (
            <>
              <button
                onClick={() => {
                  const swiper = document.querySelector('.swiper')?.swiper;
                  if (swiper) swiper.slidePrev();
                }}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const swiper = document.querySelector('.swiper')?.swiper;
                  if (swiper) swiper.slideNext();
                }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">What's on your mind?</h2>
              <button 
                onClick={() => navigate('/home-food/categories')}
                className="text-blue-600 font-semibold flex items-center"
              >
                See all <BsArrowRight className="ml-1" />
              </button>
            </div>
            <Slider {...categorySettings}>
              {categories.map((category) => (
                <div key={category._id} className="px-2">
                  <div onClick={() => handleCategoryClick(category)}>
                    <CategoryItem category={category} />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}

        {/* Top Restaurants Section */}
        {filteredRestaurants.length > 0 && (
          <div className="mt-8 px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedCuisine ? `${selectedCuisine} Restaurants` : 'Top Restaurants'}
              </h2>
              <button 
                onClick={() => navigate('/home-food/restaurant-details')}
                className="text-blue-600 font-semibold flex items-center"
              >
                See all <BsArrowRight className="ml-1" />
              </button>
            </div>
            <Slider {...restaurantSettings}>
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant._id} className="px-2">
                  <RestaurantItem restaurant={restaurant} categoryName={selectedCuisine || 'All Restaurants'} />
                </div>
              ))}
            </Slider>
          </div>
        )}

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <div className="mt-8 px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BsFire className="text-red-500 mr-2" />
                Best Sellers
              </h2>
              <button 
                onClick={() => navigate('/home-food/categories')}
                className="text-blue-600 font-semibold flex items-center"
              >
                See all <BsArrowRight className="ml-1" />
              </button>
            </div>
            <Slider {...restaurantSettings}>
              {bestSellers.map((dish) => (
                <div key={dish._id} className="px-2">
                  <BestsellerItem dish={dish} />
                </div>
              ))}
            </Slider>
          </div>
        )}

        {/* Promotional Banners */}
        <div className="mt-8 px-4">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            className="rounded-lg overflow-hidden"
          >
            {promoBanners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <img
                  src={banner.imageF}
                  alt={banner.alt}
                  className="w-full h-32 object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Empty state when no data */}
        {restaurants.length === 0 && categories.length === 0 && bestSellers.length === 0 && !loading && (
          <div className="mt-8 px-4 text-center">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No restaurants available</h3>
              <p className="text-gray-600 font-semibold mb-4">We're working hard to bring delicious food to your area soon!</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
      <FooterFood />
    </div>
  );
}

export default HomeScreenF;