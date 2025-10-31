import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Star, Clock, MapPin, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import API_CONFIG from '../../config/api.config.js';
import { dishService } from '../../services/foodDeliveryService';
import HeaderF from '../ComponentsF/HeaderF';
import FooterFood from '../ComponentsF/FooterFood';
import { useFoodCart } from '../../Utility/FoodCartContext';

const DishDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 🆕 NEW: Add missing swiperRef declaration
  const swiperRef = useRef(null);
  
  // 🆕 NEW: Add missing quantity state
  const [quantity, setQuantity] = useState(1);
  
  // 🆕 NEW: Add missing isAdding state
  const [isAdding, setIsAdding] = useState(false);
  
  // 🆕 NEW: Add missing food cart context
  const { addToFoodCart } = useFoodCart();

  useEffect(() => {
    const fetchDish = async () => {
      try {
        setLoading(true);
        const response = await dishService.getDishById(id);
        
        console.log('Dish API Response:', response);
        
        if (response.success && response.data) {
          setDish(response.data);
          console.log('Dish data set:', response.data);
        } else {
          setError('Dish not found');
          console.error('Dish not found in response:', response);
        }
      } catch (err) {
        console.error('Error fetching dish:', err);
        setError('Failed to load dish details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDish();
    }
  }, [id]);

  const getImageUrl = (imagePath) => {
    console.log('getImageUrl called with:', imagePath);
    console.log('API_CONFIG:', API_CONFIG);
    
    if (!imagePath) {
      console.log('No image path provided, using placeholder');
      return '/placeholder-image.png';
    }
    if (imagePath.startsWith('http')) {
      console.log('Image is already a full URL:', imagePath);
      return imagePath;
    }
    
    const fullUrl = API_CONFIG.getImageUrl(imagePath);
    console.log('Generated full URL:', fullUrl);
    return fullUrl;
  };

  const getAllImages = () => {
    const images = [];
    
    // Debug logging
    console.log('Dish data:', dish);
    console.log('Main image:', dish?.image);
    console.log('Additional images:', dish?.images);
    
    // Add main image first if it exists
    if (dish?.image) {
      images.push({
        src: getImageUrl(dish.image),
        alt: `${dish.name || 'Dish'} - Main Image`
      });
    }
    
    // Add additional images
    if (dish?.images && Array.isArray(dish.images)) {
      dish.images.forEach((img, index) => {
        if (img) { // Only add if image exists
          images.push({
            src: getImageUrl(img),
            alt: `${dish.name || 'Dish'} - Image ${index + 1}`
          });
        }
      });
    }
    
    // If no images found, add a placeholder
    if (images.length === 0) {
      images.push({
        src: '/placeholder-image.png',
        alt: 'No image available'
      });
    }
    
    console.log('All images array:', images);
    
    return images;
  };

  const handleImageChange = (swiper) => {
    setCurrentImageIndex(swiper.activeIndex);
  };

  const goToPreviousImage = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const goToNextImage = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleAddToCart = async () => {
    if (!dish?._id) return;
    setIsAdding(true);
    try {
      const res = await addToFoodCart(dish._id, quantity);
      if (!res?.success) {
        alert(res?.message || 'Failed to add to cart');
      } else {
        // Reset for subsequent adds
        setQuantity(1);
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderF />
        <div className="pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        <FooterFood />
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderF />
        <div className="pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dish Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The dish you are looking for does not exist.'}</p>
              <button
                onClick={() => navigate('/home-food')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
        <FooterFood />
      </div>
    );
  }

  const images = getAllImages();
  const hasMultipleImages = images.length > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderF />
      
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ChevronLeft size={20} className="mr-2" />
            Back
          </button> */}

          {/* Image Carousel */}
          <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <Swiper
              ref={swiperRef}
              modules={[Navigation, Pagination]}
              navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }}
              pagination={{ clickable: true }}
              onSlideChange={handleImageChange}
              className="w-full h-96"
            >
              {images.length > 0 ? (
                images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load image:', image.src);
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide>
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">🍕</div>
                      <p className="text-lg">No images available</p>
                      <p className="text-sm">Please check back later</p>
                    </div>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>

            {/* Swiper Built-in Navigation Buttons */}
            <div className="swiper-button-prev !text-white !bg-black/30 hover:!bg-black/50 !w-12 !h-12 !rounded-full !transition-all"></div>
            <div className="swiper-button-next !text-white !bg-black/30 hover:!bg-black/50 !w-12 !h-12 !rounded-full !transition-all"></div>

            {/* Custom Navigation Arrows - Only show when multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-20 border-2 border-gray-200"
                  title="Previous Image"
                >
                  <ChevronLeft size={28} className="text-gray-700" />
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-20 border-2 border-gray-200"
                  title="Next Image"
                >
                  <ChevronRight size={28} className="text-gray-700" />
                </button>
              </>
            )}

            {/* Debug indicator */}
            {/* <div className="absolute top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded text-xs z-20">
              {images.length} image{images.length !== 1 ? 's' : ''} loaded
            </div> */}
            
            {/* Test Navigation Button */}
            <button
              onClick={() => {
                console.log('Test navigation clicked');
                console.log('Current images:', images);
                console.log('Current index:', currentImageIndex);
                console.log('Swiper ref:', swiperRef.current);
                if (images.length > 1) {
                  goToNextImage();
                }
              }}
              // className="absolute top-4 right-20 bg-red-500 text-white px-2 py-1 rounded text-xs z-20"
            >
              {/* Test Nav */}
            </button>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleToggleLike}
                className="bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110"
              >
                <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
              </button>
              <button className="bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Dish Information */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{dish.name}</h1>
                <p className="text-gray-600 text-lg">{dish.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  ₹{dish.price ? parseFloat(dish.price).toFixed(2) : '0.00'}
                </div>
                {dish.original_price && dish.original_price > dish.price && (
                  <div className="text-gray-400 line-through">
                    ₹{parseFloat(dish.original_price).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Rating and Info */}
            <div className="flex items-center space-x-6 text-gray-600 mb-6">
              {dish.rating && (
                <div className="flex items-center">
                  <Star size={20} className="text-yellow-400 fill-yellow-400 mr-2" />
                  <span className="font-medium">{dish.rating}</span>
                </div>
              )}
              {dish.preparation_time && (
                <div className="flex items-center">
                  <Clock size={20} className="mr-2" />
                  <span>{dish.preparation_time} mins</span>
                </div>
              )}
              {dish.restaurant_id?.name && (
                <div className="flex items-center">
                  <MapPin size={20} className="mr-2" />
                  <span>{dish.restaurant_id.name}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {dish.is_vegetarian && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Vegetarian
                </span>
              )}
              {dish.is_spicy && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Spicy
                </span>
              )}
              {dish.is_best_seller && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Best Seller
                </span>
              )}
            </div>

            {/* Add to Cart Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium text-center min-w-[50px]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>

          {/* Additional Details */}
          {dish.category && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Category</h3>
              <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                {dish.category}
              </span>
            </div>
          )}

          {/* Restaurant Information */}
          {dish.restaurant_id && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Restaurant</h3>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500">
                    {dish.restaurant_id.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{dish.restaurant_id.name}</h4>
                  <p className="text-gray-600 text-sm">Restaurant</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterFood />
    </div>
  );
};

export default DishDetail;
