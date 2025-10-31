import API_CONFIG from "../../config/api.config.js";
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EcommerceGroceryHeader from '../../Components/EcommerceGroceryHeader';
import search from "../../Icons/search.svg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import banner1 from "../Images/mens_wear_banner.jpg";
import banner2 from "../Images/womens_wear_banner.jpg";
import banner3 from "../Images/cosmetics_banner.jpg";
import banner4 from "../Images/home_appliances_banner.jpeg";
import "swiper/css/free-mode";
import mensWear from "../Images/mensWear.jpg";
import womensWear from "../Images/womensWear.jpeg";
import arrow from "../../Icons/rigtharrowbutton.svg";
import Footer from '../../Utility/Footer';
import cosmetics from '../Images/cosmetics.jpg';
import homeAppliances from '../Images/homeAppliance.jpg';
import Header, { LocationDisplay } from '../../Grocery/SubPages/Header';

// Default images for categories
const defaultImages = {
    'mens-wear': mensWear,
    'womens-wear': womensWear,
    'women\'s-wear': womensWear,
    'cosmetics': cosmetics,
    'home-appliances': homeAppliances,
    'sports-equipment': mensWear, // fallback image
    'default': cosmetics
};

// Custom category images - replace these URLs with your uploaded images
const customCategoryImages = {
    // Add more custom images as needed
};

const bannerImage = [
    { id: 1, mobile_image_url: banner1 },
    { id: 2, mobile_image_url: banner2 },
    { id: 3, mobile_image_url: banner3 },
    { id: 4, mobile_image_url: banner4 }
];

function HomeC() {
    const categorySwiperRef = useRef(null);
    const navigate = useNavigate();
    const searchInputRef = useRef(null); // Ref for search input
    const [categories, setCategories] = useState([]);
    const [isListening, setIsListening] = useState(false); // Track microphone state
    const [searchQuery, setSearchQuery] = useState(''); // Add search query state
    const [showSuggestions, setShowSuggestions] = useState(false); // Show search suggestions
    const [searchHistory, setSearchHistory] = useState([]); // Store search history

    // Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token') || 'demo-token';
                console.log('🏠 HomeC: Fetching categories from backend...');
                const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PARENT_CATEGORIES), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const categoriesData = responseData.data || responseData;
                    const activeCategories = Array.isArray(categoriesData) ? categoriesData : [];
                    const transformedCategories = activeCategories.map(category => {
                        const categoryName = category.name || 'Unknown';
                        const categorySlug = category.slug || categoryName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                        
                        // Use backend image URL first, then fallback to local images
                        let categoryImage = defaultImages['default'];
                        
                        if (category.image && category.image.trim()) {
                            categoryImage = category.image;
                        } else if (customCategoryImages[categorySlug]) {
                            categoryImage = customCategoryImages[categorySlug];
                        } else if (defaultImages[categorySlug]) {
                            categoryImage = defaultImages[categorySlug];
                        }
                        
                        // Special case: Replace "Clothes" with bell icon
                        let displayName = categoryName;
                        let useCustomImage = false;
                        
                        if (categoryName.toLowerCase() === 'clothes' || categoryName.toLowerCase() === 'mens-wear') {
                            categoryImage = '/Uploads/products/uploaded-1754672409165-244882.svg';
                            displayName = ''; // Hide the text, show only the bell icon
                            useCustomImage = true;
                        }
                        
                        return {
                            name: displayName,
                            image: categoryImage,
                            route: `/categories/${categorySlug}`,
                            useCustomImage: useCustomImage
                        };
                    }).sort((a, b) => a.name.localeCompare(b.name)); // Sort categories alphabetically by name
                    setCategories(transformedCategories);
                } else {
                    console.log('🏠 HomeC: API failed, using fallback categories');
                }
            } catch (error) {
                console.error('🏠 HomeC: Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // Load search history on component mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
            try {
                setSearchHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        }
    }, []);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Robust search handler - supports both category navigation and product search
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const searchTerm = searchQuery.trim().toLowerCase();
            
            // Add to search history
            const newHistory = [searchQuery.trim(), ...searchHistory.filter(item => item !== searchQuery.trim())].slice(0, 5);
            setSearchHistory(newHistory);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            
            // Enhanced category mapping based on your actual categories
            const categoryMappings = {
                'mens-wear': [
                    'men', 'mens', 'male', 'shirt', 'shirts', 'pants', 'trousers', 'jeans',
                    'suit', 'blazer', 'jacket', 'coat', 'sweater', 'hoodie', 't-shirt',
                    'tshirt', 'polo', 'formal', 'casual', 'shoes', 'boots', 'sneakers',
                    'belt', 'tie', 'watch', 'accessories', 'mens wear', 'menswear'
                ],
                'womens-wear': [
                    'women', 'womens', 'female', 'dress', 'dresses', 'top', 'tops', 'blouse',
                    'skirt', 'skirts', 'pants', 'jeans', 'leggings', 'saree', 'sari',
                    'kurta', 'kurti', 'salwar', 'churidar', 'heels', 'sandals', 'bag',
                    'purse', 'jewelry', 'jewellery', 'makeup', 'cosmetics', 'womens wear', 'womenswear'
                ],
                'cosmetics': [
                    'cosmetic', 'cosmetics', 'makeup', 'make-up', 'beauty', 'lipstick',
                    'foundation', 'eyeshadow', 'mascara', 'kajal', 'eyeliner', 'blush',
                    'powder', 'compact', 'primer', 'concealer', 'highlighter', 'setting spray',
                    'skincare', 'skin care', 'moisturizer', 'sunscreen', 'face wash',
                    'cleanser', 'toner', 'serum', 'cream', 'lotion', 'beauty products'
                ],
                'home-appliances': [
                    'home', 'appliance', 'appliances', 'kitchen', 'refrigerator', 'fridge',
                    'washing machine', 'microwave', 'oven', 'mixer', 'grinder', 'blender',
                    'toaster', 'iron', 'vacuum', 'cleaner', 'fan', 'cooler', 'ac',
                    'air conditioner', 'heater', 'geyser', 'water purifier', 'electronics',
                    'gadgets', 'furniture', 'sofa', 'chair', 'table', 'bed', 'wardrobe'
                ],
                'books': [
                    'book', 'books', 'novel', 'fiction', 'non-fiction', 'textbook',
                    'educational', 'study', 'academic', 'literature', 'magazine',
                    'journal', 'publication', 'reading', 'library', 'ebook', 'audiobook'
                ],
                'electronics': [
                    'electronic', 'electronics', 'mobile', 'phone', 'smartphone', 'laptop',
                    'computer', 'tablet', 'headphone', 'earphone', 'speaker', 'camera',
                    'tv', 'television', 'gaming', 'console', 'charger', 'cable', 'gadget'
                ]
            };

            // Check if search term matches any category
            let matchedCategory = null;
            for (const [category, keywords] of Object.entries(categoryMappings)) {
                if (keywords.some(keyword => searchTerm.includes(keyword))) {
                    matchedCategory = category;
                    break;
                }
            }

            // If category is matched, navigate to it
            if (matchedCategory) {
                console.log(`🔍 Search matched category: ${matchedCategory}`);
                setShowSuggestions(false);
                navigate(`/categories/${matchedCategory}`);
            } else {
                // Check if it's a specific product search
                const productKeywords = [
                    'samsung', 'lg', 'whirlpool', 'bosch', 'philips', 'panasonic',
                    'sony', 'mi', 'realme', 'oppo', 'vivo', 'apple', 'nike', 'adidas',
                    'puma', 'reebok', 'maybelline', 'lakme', 'nykaa', 'loreal',
                    'color', 'size', 'brand', 'model', 'series', 'inch', 'kg', 'liter'
                ];

                const isProductSearch = productKeywords.some(keyword => searchTerm.includes(keyword)) ||
                                       searchTerm.length > 3;

                if (isProductSearch) {
                    console.log(`🔍 Product search detected: ${searchTerm}`);
                    setShowSuggestions(false);
                    navigate('/search-results', { 
                        state: { query: searchQuery.trim() } 
                    });
                } else {
                    console.log(`🔍 Category search detected: ${searchTerm}`);
                    setShowSuggestions(false);
                    navigate('/search-results', { 
                        state: { query: searchQuery.trim(), showCategories: true } 
                    });
                }
            }
        }
    };

    // Derived: category matches for immediate feedback in suggestions
    const hasCategoryMatches = (() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return false;
        return categories.some(c => (c.name || '').toLowerCase().includes(q));
    })();

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 2,
        slidesToScroll: 1,
        arrows: false,
    };

    return (
        <div className="min-h-screen">
            <EcommerceGroceryHeader />
            <div className="pt-24 mb-28 px-4">
                <div className="pt-2 px-4">
                    {/* <LocationDisplay /> */}
                </div>
                
                {/* Search */}
                <div className="flex justify-center mt-4">
                    <div className="relative w-full" ref={searchInputRef}>
                        <form onSubmit={handleSearch} className="relative w-full flex">
                            <img src={search} alt="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-7 h-7" />
                            <input
                                type="text"
                                placeholder="What do you want.."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(e.target.value.length > 0);
                                }}
                                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                                className="flex-1 pl-10 pr-10 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF]"
                            />
                        </form>

                        {/* Search Suggestions */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[100] max-h-60 overflow-y-auto">
                                {/* Category Matches */}
                                {hasCategoryMatches && (
                                    <div className="p-3">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Categories</h4>
                                        <div className="space-y-1">
                                            {categories
                                                .filter(c => (c.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
                                                .slice(0, 3)
                                                .map((category, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setSearchQuery(category.name);
                                                            setShowSuggestions(false);
                                                            navigate(category.route);
                                                        }}
                                                        className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left transition-colors"
                                                    >
                                                        <span className="mr-3 text-blue-500">📁</span>
                                                        <span className="text-sm text-gray-700">{category.name}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Popular Searches */}
                                {searchQuery.trim().length === 0 && (
                                    <div className="p-3">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Popular Searches</h4>
                                        <div className="space-y-1">
                                            {['shirts', 'dresses', 'lipstick', 'shoes', 'cosmetics', 'home appliances'].map((term, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSearchQuery(term);
                                                        setShowSuggestions(false);
                                                        handleSearch({ preventDefault: () => {} });
                                                    }}
                                                    className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left transition-colors"
                                                >
                                                    <span className="mr-3 text-gray-400">🔍</span>
                                                    <span className="text-sm text-gray-700">{term}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {searchHistory.length > 0 && (
                                    <div className="p-3">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Searches</h4>
                                        <div className="space-y-1">
                                            {searchHistory.slice(0, 3).map((term, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSearchQuery(term);
                                                        setShowSuggestions(false);
                                                        handleSearch({ preventDefault: () => {} });
                                                    }}
                                                    className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left transition-colors"
                                                >
                                                    <span className="mr-3 text-gray-400">🕒</span>
                                                    <span className="text-sm text-gray-700">{term}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Search All Products */}
                                {searchQuery.trim().length > 0 && (
                                    <div className="p-3 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setShowSuggestions(false);
                                                handleSearch({ preventDefault: () => {} });
                                            }}
                                            className="flex items-center w-full p-2 hover:bg-blue-50 rounded text-left transition-colors"
                                        >
                                            <span className="mr-3 text-blue-500">🔍</span>
                                            <span className="text-sm text-blue-600 font-medium">
                                                Search "{searchQuery}" in all products
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Banners */}
                <div className="w-full">
                    <Swiper
                        spaceBetween={16}
                        slidesPerView="auto"
                        loop={true}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        modules={[Autoplay]}
                        className="!py-4 w-full"
                    >
                        {bannerImage.map((banner) => (
                            <SwiperSlide key={banner.id} className="!w-full">
                                <div className="flex flex-col items-center w-full h-[200px] rounded-2xl shadow-md cursor-pointer overflow-hidden">
                                    <img
                                        src={banner.mobile_image_url}
                                        alt="banner"
                                        className="w-full h-full object-cover rounded-2xl"
                                        loading="lazy"
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Categories */}
                <div className="flex justify-between items-center w-full mt-2">
                    <div className="font-medium text-[16px]">Categories</div>
                    <button 
                        onClick={() => navigate('/categories')}
                        className="flex items-center justify-center p-1 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                        title="View all categories"
                    >
                        <img src={arrow} alt="arrow" className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    {categories.map((category, index) => (
                        <div
                            key={index}
                            className="relative w-full aspect-square rounded-xl overflow-hidden bg-white"
                            onClick={() => navigate(category.route)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover"
                            />
                            {!category.useCustomImage && category.name && (
                                <div className="absolute top-3 left-3 bg-white bg-opacity-90 px-3 py-1 rounded font-bold uppercase text-xs tracking-wide shadow-sm">
                                    {category.name}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default HomeC;