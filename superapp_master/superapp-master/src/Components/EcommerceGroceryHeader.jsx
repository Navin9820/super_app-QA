import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import location from "../Images/HomeScreen/location.svg";
import API_CONFIG from "../config/api.config.js";

function EcommerceGroceryHeader() {
    const navigate = useNavigate();
    const [locationData, setLocationData] = useState({
        shortAddress: "",
        fullAddress: "",
        isLoading: false,
        error: null
    });
    const [showTooltip, setShowTooltip] = useState(false);

    // Load saved location on mount
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
            shortAddress: "Getting location...",
            fullAddress: "Getting location...",
            isLoading: true,
            error: null
        };
        setLocationData(loadingData);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Try backend proxy first
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
                                console.log('✅ Ecommerce Header: Proxy geocoding successful:', successData);
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ Ecommerce Header: Proxy geocoding failed, falling back:', e.message);
                    }

                    // Fallback: use coordinates
                    const fallbackAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    const successData = {
                        shortAddress: fallbackAddress,
                        fullAddress: fallbackAddress,
                        isLoading: false,
                        error: null
                    };
                    setLocationData(successData);
                    localStorage.setItem('userLocation', JSON.stringify(successData));
                    console.log('📍 Ecommerce Header: Using coordinate fallback:', fallbackAddress);
                    
                } catch (error) {
                    console.warn('❌ Ecommerce Header: Geocoding failed:', error.message);
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
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex justify-between items-center pt-8 px-4 pb-2 z-50">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 border border-gray-200"
                    title="Go back"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-base font-extrabold tracking-wide text-[var(--city-bell-color)]">City Bell</h1>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
        </div>
    );
}

export default EcommerceGroceryHeader;  