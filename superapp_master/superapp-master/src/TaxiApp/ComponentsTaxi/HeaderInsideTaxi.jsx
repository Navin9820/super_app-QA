import React, { useState, useEffect } from "react";
import location from "../../Images/HomeScreen/location.svg";
import leftarrow from "../../Icons/arrow-left.svg";
import { useNavigate, useLocation } from "react-router-dom";
import API_CONFIG from "../../config/api.config";

function HeaderInsideTaxi() {
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const [userLocation, setUserLocation] = useState(null);
    const [locationData, setLocationData] = useState({
        shortAddress: 'Detecting location...',
        fullAddress: 'Detecting location...',
        isLoading: true,
        error: null
    });
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);

    const handleBack = () => {
        if (routerLocation.pathname === '/home-taxi/account') {
            navigate('/home-taxi');
        } else {
            navigate(-1);
        }
    };

    // Get user's current location with improved error handling and fallbacks
    const getCurrentLocation = () => {
        // Prevent multiple simultaneous requests
        if (isRequestingLocation) {
            console.log('📍 Taxi Header: Location request already in progress, skipping...');
            return;
        }

        if (!navigator.geolocation) {
            const errorData = {
                shortAddress: 'Location not supported',
                fullAddress: 'Location not supported',
                isLoading: false,
                error: 'Geolocation not supported by your browser'
            };
            setLocationData(errorData);
            return;
        }

        setIsRequestingLocation(true);

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
                    setUserLocation({ lat: latitude, lng: longitude });
                    
                    // Try backend proxy first (same as EcommerceGroceryHeader)
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
                                console.log('✅ Taxi Header: Proxy geocoding successful:', successData);
                                setIsRequestingLocation(false);
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('⚠️ Taxi Header: Proxy geocoding failed, falling back:', e.message);
                    }

                    // Fallback 1: BigDataCloud API
                    try {
                        const response = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                        );
                        const data = await response.json();
                        
                        let shortAddress, fullAddress;
                        if (data.city && data.principalSubdivision) {
                            shortAddress = `${data.city}, ${data.principalSubdivision}`;
                            fullAddress = data.locality ? `${data.locality}, ${data.city}, ${data.principalSubdivision}` : shortAddress;
                        } else if (data.locality) {
                            shortAddress = data.locality;
                            fullAddress = data.locality;
                        } else {
                            shortAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                            fullAddress = shortAddress;
                        }
                        
                        const successData = { shortAddress, fullAddress, isLoading: false, error: null };
                        setLocationData(successData);
                        localStorage.setItem('userLocation', JSON.stringify(successData));
                        console.log('✅ Taxi Header: BigDataCloud geocoding successful:', successData);
                        setIsRequestingLocation(false);
                        return;
                    } catch (bigDataError) {
                        console.log('⚠️ Taxi Header: BigDataCloud failed, using coordinates:', bigDataError.message);
                    }

                    // Fallback 2: Use coordinates
                    const fallbackAddress = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                    const successData = {
                        shortAddress: fallbackAddress,
                        fullAddress: fallbackAddress,
                        isLoading: false,
                        error: null
                    };
                    setLocationData(successData);
                    localStorage.setItem('userLocation', JSON.stringify(successData));
                    console.log('📍 Taxi Header: Using coordinate fallback:', fallbackAddress);
                    setIsRequestingLocation(false);
                    
                } catch (error) {
                    console.warn('❌ Taxi Header: Geocoding failed:', error.message);
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
                    setIsRequestingLocation(false);
                }
            },
            (error) => {
                console.error('❌ Taxi Header: Geolocation error:', error);
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
                    shortAddress: "Location unavailable",
                    fullAddress: "Location unavailable",
                    isLoading: false,
                    error: errorMessage
                };
                setLocationData(errorData);
                localStorage.setItem('userLocation', JSON.stringify(errorData));
                setIsRequestingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    };

    // Load location from localStorage on mount
    useEffect(() => {
        try {
            const storedLocation = localStorage.getItem('userLocation');
            if (storedLocation) {
                const parsedLocation = JSON.parse(storedLocation);
                setLocationData(parsedLocation);
                console.log('📍 Taxi Header: Loaded location from localStorage:', parsedLocation);
            }
        } catch (error) {
            console.warn('⚠️ Taxi Header: Failed to parse stored location:', error);
        }
        
        // Always try to get fresh location
        getCurrentLocation();
    }, []);
    return (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex justify-between items-center pt-8 px-4 pb-2 z-50">
            <h1 className="text-lg font-bold flex items-center gap-2">
                <img src={leftarrow} alt="arrow" className="w-6 h-6 cursor-pointer" onClick={handleBack}/>
                TAXI
            </h1>
            <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600 text-right max-w-48">
                    <span>Current Location</span><br />
                    <span className="font-semibold text-black truncate block" title={locationData.fullAddress}>
                        {locationData.isLoading ? 'Detecting...' : locationData.shortAddress}
                    </span>
                    {locationData.error && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-red-500 truncate" title={locationData.error}>
                                {locationData.error}
                            </span>
                            <button 
                                onClick={getCurrentLocation}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                title="Retry location detection"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center gap-1">
                    <img 
                        src={location} 
                        alt="Location" 
                        className={`w-8 h-8 transition-opacity ${isRequestingLocation ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-70'}`}
                        onClick={isRequestingLocation ? undefined : getCurrentLocation}
                        title={isRequestingLocation ? 'Getting location...' : 'Refresh location'}
                    />
                    {(locationData.isLoading || isRequestingLocation) && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    {locationData.error && !locationData.isLoading && !isRequestingLocation && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" title="Location error"></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HeaderInsideTaxi;
