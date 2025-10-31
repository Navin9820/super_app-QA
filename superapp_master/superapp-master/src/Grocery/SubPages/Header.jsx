import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from "react";
import location from "../../Images/HomeScreen/location.svg";
import leftarrow from "../../Icons/arrow-left.svg";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

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
                                console.log('✅ Grocery Header: Proxy geocoding successful:', successData);
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ Grocery Header: Proxy geocoding failed, falling back:', e.message);
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
                                setDisplayLocation(locationName);
                                console.log('✅ Backend proxy geocoding successful:', locationName);
                                return;
                            }
                        }
                        console.log('⚠️ Backend proxy failed');
                    } catch (error) {
                        console.log('⚠️ Backend proxy error:', error.message);
                    }

                    // Fallback: show coordinates
                    setDisplayLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    console.log('📍 Using coordinates as fallback');
                    
                    // Method 2: Try OpenStreetMap without CORS mode
                    if (!data) {
                        try {
                            console.log('🔍 Method 2: Trying OpenStreetMap without CORS mode...');
                            response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                                {
                                    method: 'GET',
                                    headers: {
                                        'Accept': 'application/json',
                                        'User-Agent': 'SuperApp/1.0'
                                    }
                                }
                            );
                            
                            if (response.ok) {
                                data = await response.json();
                                console.log('✅ Method 2: OpenStreetMap without CORS successful');
                            }
                        } catch (error) {
                            console.log('⚠️ Method 2 failed:', error.message);
                        }
                    }
                    
                    // Method 3: Try LocationIQ API (alternative geocoding service)
                    if (!data) {
                        try {
                            console.log('🔍 Method 3: Trying LocationIQ API...');
                            response = await fetch(
                                `https://us1.locationiq.com/v1/reverse.php?key=demo&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                                {
                                    method: 'GET',
                                    headers: {
                                        'Accept': 'application/json'
                                    }
                                }
                            );
                            
                            if (response.ok) {
                                data = await response.json();
                                console.log('✅ Method 3: LocationIQ API successful');
                            }
                        } catch (error) {
                            console.log('⚠️ Method 3 failed:', error.message);
                        }
                    }
                    
                    // Method 4: Try BigDataCloud API (another free alternative)
                    if (!data) {
                        try {
                            console.log('🔍 Method 4: Trying BigDataCloud API...');
                            response = await fetch(
                                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                                {
                                    method: 'GET',
                                    headers: {
                                        'Accept': 'application/json'
                                    }
                                }
                            );
                            
                            if (response.ok) {
                                data = await response.json();
                                console.log('✅ Method 4: BigDataCloud API successful');
                            }
                        } catch (error) {
                            console.log('⚠️ Method 4 failed:', error.message);
                        }
                    }
                    
                    // Method 5: Try Positionstack API (another alternative)
                    if (!data) {
                        try {
                            console.log('🔍 Method 5: Trying Positionstack API...');
                            response = await fetch(
                                `https://api.positionstack.com/v1/reverse?access_key=demo&query=${latitude},${longitude}&output=json`,
                                {
                                    method: 'GET',
                                    headers: {
                                        'Accept': 'application/json'
                                    }
                                }
                            );
                            
                            if (response.ok) {
                                data = await response.json();
                                console.log('✅ Method 5: Positionstack API successful');
                            }
                        } catch (error) {
                            console.log('⚠️ Method 5 failed:', error.message);
                        }
                    }
                    
                    // If all methods failed, use coordinate fallback
                    if (!data) {
                        console.warn('❌ All geocoding methods failed, using coordinate fallback');
                        throw new Error('All geocoding APIs failed');
                    }
                    
                    // Process the successful response data
                    let address = {};
                    
                    // Handle different API response formats
                    if (data.address) {
                        // OpenStreetMap format
                        address = data.address;
                    } else if (data.address && data.address.country) {
                        // LocationIQ format
                        address = data.address;
                    } else if (data.locality) {
                        // BigDataCloud format
                        address = {
                            city: data.locality,
                            state: data.principalSubdivision,
                            postcode: data.postcode,
                            suburb: data.locality
                        };
                    } else if (data.data && data.data[0]) {
                        // Positionstack format
                        const item = data.data[0];
                        address = {
                            city: item.locality,
                            state: item.region,
                            postcode: item.postcode,
                            suburb: item.neighbourhood
                        };
                    }
                    
                    let shortAddress = "";
                    if (address.suburb) {
                        shortAddress = address.suburb;
                    } else if (address.neighbourhood) {
                        shortAddress = address.neighbourhood;
                    } else if (address.quarter) {
                        shortAddress = address.quarter;
                    } else if (address.district) {
                        shortAddress = address.district;
                    } else {
                        shortAddress = "Location found";
                    }
                    
                    const fullParts = [];
                    if (address.house_number) fullParts.push(address.house_number);
                    if (address.road) fullParts.push(address.road);
                    if (address.suburb) fullParts.push(address.suburb);
                    if (address.neighbourhood) fullParts.push(address.neighbourhood);
                    if (address.quarter) fullParts.push(address.quarter);
                    if (address.city) fullParts.push(address.city);
                    if (address.town) fullParts.push(address.town);
                    if (address.village) fullParts.push(address.village);
                    if (address.district) fullParts.push(address.district);
                    if (address.state) fullParts.push(address.state);
                    if (address.postcode) fullParts.push(address.postcode);
                    if (address.country) fullParts.push(address.country);
                    
                    const fullAddress = fullParts.length > 0 ? fullParts.join(', ') : shortAddress;
                    const successData = {
                        shortAddress: shortAddress,
                        fullAddress: fullAddress,
                        isLoading: false,
                        error: null
                    };
                    setLocationData(successData);
                    localStorage.setItem('userLocation', JSON.stringify(successData));
                    console.log('✅ Grocery Header: Geocoding successful:', { shortAddress, fullAddress });
                    
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
                    console.log('📍 Grocery Header: Using coordinate fallback:', fallbackAddress);
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
                    className="w-6 h-6 cursor-pointer ml-1 flex-shrink-0"
                    onClick={getCurrentLocation}
                    title="Click to get current location"
                />
                {/* Tooltip for full address */}
                {showTooltip && !locationData.isLoading && !locationData.error && (
                    <div className="absolute right-0 top-10 bg-black text-white text-xs rounded px-2 py-1 z-50 max-w-xs whitespace-normal shadow-lg">
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

function Header() {
    const navigate = useNavigate();
    const [cartItemCount, setCartItemCount] = useState(0);

    // Fetch cart items count on mount and when component updates
    useEffect(() => {
        const fetchCartCount = async () => {
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
                        onClick={() => navigate('/home-grocery/cart')}
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

export default Header;
