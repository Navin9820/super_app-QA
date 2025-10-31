import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import leftarrow from "../../Icons/arrow-left.svg";
import location from "../../Images/HomeScreen/location.svg";
import API_CONFIG from '../../config/api.config';

// Extracted LocationDisplay component for reuse
export function LocationDisplay() {
    const [locationData, setLocationData] = useState({
        shortAddress: "",
        fullAddress: "",
        isLoading: false,
        error: null
    });
    const [showTooltip, setShowTooltip] = useState(false);

    // Always try to get current location on mount
    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const parsedLocation = JSON.parse(savedLocation);
                setLocationData(parsedLocation);
            } catch (error) {
                console.error('Error parsing saved location:', error);
                localStorage.removeItem('userLocation');
            }
        }
    }, []);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            const errorData = {
                shortAddress: "",
                fullAddress: "",
                isLoading: false,
                error: "Geolocation is not supported by this browser."
            };
            setLocationData(errorData);
            localStorage.setItem('userLocation', JSON.stringify(errorData));
            return;
        }
        const loadingData = {
            shortAddress: "",
            fullAddress: "",
            isLoading: true,
            error: null
        };
        setLocationData(loadingData);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Use a comprehensive approach for reverse geocoding with multiple fallbacks
                    let response = null;
                    let data = null;
                    
                    // Prefer backend proxy to avoid CORS and hide keys
                    try {
                        const proxyUrl = API_CONFIG.getUrl(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                        const resp = await fetch(proxyUrl);
                        if (resp.ok) {
                            const json = await resp.json();
                            if (json?.success && json?.data) {
                                const d = json.data;
                                const shortAddress = d.area || d.city || 'Location found';
                                const fullAddress = d.fullAddress || `${d.area ? d.area + ', ' : ''}${d.city || ''}${d.state ? ', ' + d.state : ''}${d.pincode ? ' ' + d.pincode : ''}`.trim();
                                const successData = { shortAddress, fullAddress, isLoading: false, error: null };
                                setLocationData(successData);
                                localStorage.setItem('userLocation', JSON.stringify(successData));
                                console.log('✅ Food Header: Proxy geocoding successful:', successData);
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ Food Header: Proxy geocoding failed, falling back:', e.message);
                    }

                    // Use backend proxy for reverse geocoding
                    try {
                        console.log('🗺️ Fetching location name via backend proxy...');
                        const response = await fetch(
                            `${API_CONFIG.BASE_URL}/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`
                        );
                        
                        if (response.ok) {
                            const result = await response.json();
                            if (result.success && result.data) {
                                const { area, city, state, fullAddress } = result.data;
                                const locationName = area || city || state || fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                                setLocationData({ shortAddress: locationName, fullAddress: locationName, isLoading: false, error: null });
                                console.log('✅ Backend proxy geocoding successful:', locationName);
                                return;
                            }
                        }
                        console.log('⚠️ Backend proxy failed');
                    } catch (error) {
                        console.log('⚠️ Backend proxy error:', error.message);
                    }

                    // Fallback: show coordinates
                    const fallbackAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    const fallbackData = {
                        shortAddress: fallbackAddress,
                        fullAddress: fallbackAddress,
                        isLoading: false,
                        error: null
                    };
                    setLocationData(fallbackData);
                    localStorage.setItem('userLocation', JSON.stringify(fallbackData));
                    console.log('📍 Food Header: Using coordinate fallback:', fallbackAddress);
                    
                } catch (error) {
                    console.warn('❌ All geocoding methods failed:', error.message);
                    // Ultimate fallback: use coordinates as location
                    const { latitude, longitude } = position.coords;
                    const fallbackAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    const errorData = {
                        shortAddress: fallbackAddress,
                        fullAddress: fallbackAddress,
                        isLoading: false,
                        error: "Location details unavailable"
                    };
                    setLocationData(errorData);
                    localStorage.setItem('userLocation', JSON.stringify(errorData));
                    console.log('📍 Food Header: Using coordinate fallback:', fallbackAddress);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = "Failed to get your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                    default:
                        errorMessage = "An unknown error occurred.";
                        break;
                }
                const errorData = {
                    shortAddress: "",
                    fullAddress: "",
                    isLoading: false,
                    error: errorMessage
                };
                setLocationData(errorData);
                localStorage.setItem('userLocation', JSON.stringify(errorData));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    };

    const handleTooltip = (show) => {
        setShowTooltip(show);
    };

    return (
        <div className="flex flex-col items-end min-w-0 relative max-w-[60vw] justify-end">
            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">Current Location</span>
            <div className="flex items-center gap-1 min-w-0">
                <span
                    className="text-sm font-semibold text-black truncate max-w-[180px] cursor-pointer"
                    onMouseEnter={() => handleTooltip(true)}
                    onMouseLeave={() => handleTooltip(false)}
                    onTouchStart={() => handleTooltip(!showTooltip)}
                >
                    {locationData.isLoading ? "Getting location..." : locationData.shortAddress}
                </span>
                <img 
                    src={location} 
                    alt="Location" 
                    className="w-4 h-4 flex-shrink-0 cursor-pointer" 
                    onClick={getCurrentLocation}
                />
                {showTooltip && locationData.fullAddress && (
                    <div className="absolute bottom-full right-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 max-w-[200px] break-words">
                        {locationData.fullAddress}
                    </div>
                )}
            </div>
            {locationData.error && (
                <div className="text-xs text-red-500 mt-1 absolute left-1/2 -translate-x-1/2 top-full w-full text-center">{locationData.error}</div>
            )}
        </div>
    );
}

function HeaderF() {
    const navigate = useNavigate();
    const [cartItemCount, setCartItemCount] = useState(0);

    // Fetch cart items count on mount and when component updates
    useEffect(() => {
        const fetchCartCount = async () => {
            try {
                const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FOOD_CART), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-token'
                    }
                });
                
                if (response.ok) {
                    const responseData = await response.json();
                    const cartData = responseData.data || [];
                    setCartItemCount(cartData.length);
                } else {
                    setCartItemCount(0);
                }
            } catch (err) {
                console.error('Error loading cart count:', err);
                setCartItemCount(0);
            }
        };

        fetchCartCount();

        // Set up interval to refresh cart count every 2 seconds
        const interval = setInterval(fetchCartCount, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex flex-row items-center justify-between pt-8 px-4 pb-2 z-50">
            <div className="flex items-center gap-2 min-w-0">
                <img src={leftarrow} alt="arrow" className="w-6 h-6 cursor-pointer flex-shrink-0" onClick={()=> navigate(-1)}/> 
                <h1 className="text-base font-extrabold tracking-wide text-[var(--city-bell-color)] ml-1">City Bell</h1>
            </div>
            <div className="flex items-center gap-4">
                <LocationDisplay />
                {/* Cart Icon with Badge */}
                <div className="relative">
                    <button
                        onClick={() => navigate('/home-food/cart')}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ShoppingCart size={24} className="text-gray-700" />
                        {/* Cart Badge */}
                        {cartItemCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium shadow-md z-10 px-1">
                                {cartItemCount > 9 ? '9+' : cartItemCount}
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HeaderF;