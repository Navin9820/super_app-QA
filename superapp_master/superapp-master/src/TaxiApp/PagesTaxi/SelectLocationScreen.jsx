import React, { useState, useEffect } from "react";
import axios from 'axios';
import HeaderInsideTaxi from "../ComponentsTaxi/HeaderInsideTaxi";
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";
import locationPin from "../ImagesTaxi/location-sugg-list.svg";
import { useNavigate, useLocation } from "react-router-dom";
import { getRecentLocations, addRecentLocation, deleteRecentLocation } from '../../services/taxiRecentLocationsService';
import { getPlaceAutocomplete, getPlaceDetails } from '../../services/taxiService';
import API_CONFIG from '../../config/api.config';

// Google Places Autocomplete API
const fetchGooglePlacesSuggestions = async (query) => {
    if (!query || query.trim().length < 2) return [];

    try {
        // Use backend proxy to avoid CORS issues
        const suggestions = await getPlaceAutocomplete(query.trim());
        if (!suggestions) return [];

        // Get place details for each suggestion
        const detailedSuggestions = await Promise.all(
            suggestions.slice(0, 10).map(async (prediction) => {
                try {
                    const details = await getPlaceDetails(prediction.place_id);
                    if (!details || !details.geometry) return null;

                    return {
                        display_name: details.formatted_address,
                        lat: details.geometry.location.lat,
                        lon: details.geometry.location.lng,
                        place_id: prediction.place_id
                    };
                } catch (error) {
                    console.error('Error fetching place details:', error);
                    return null;
                }
            })
        );

        return detailedSuggestions.filter(Boolean);
    } catch (error) {
        console.error('Error fetching Google Places suggestions:', error);
        return [];
    }
};

const MAX_RECENT_LOCATIONS = 5;

export default function SelectLocationScreen() {
    const [pickupLocation, setPickupLocation] = useState(""); // Start empty to allow typing
    const [destination, setDestination] = useState(""); // Start empty
    const [query, setQuery] = useState(""); // To hold current input value for suggestions
    const [suggestions, setSuggestions] = useState([]); // To hold filtered suggestions
    const [activeInput, setActiveInput] = useState(null); // 'pickup' or 'destination'
    const [favorites, setFavorites] = useState({});
    const [recentLocations, setRecentLocations] = useState([]);
    const [recentLocApiWarning, setRecentLocApiWarning] = useState('');
    const [apiError, setApiError] = useState(''); // New state for API error
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVehicleType, setSelectedVehicleType] = useState('Car');
    const [calculatedFare, setCalculatedFare] = useState(null);
    const [calculatedDistance, setCalculatedDistance] = useState(null);
    const [calculatedDuration, setCalculatedDuration] = useState(null);

    const navigate = useNavigate(); // Initialize useNavigate
    const location = useLocation(); // Get navigation state

    // Custom toast notification
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Prefill pickup or drop location if passed in navigation state or localStorage
    useEffect(() => {
        if (location.state && location.state.pickupLocation) {
            setPickupLocation(location.state.pickupLocation);
        }
        if (location.state && location.state.dropLocation) {
            setDestination(location.state.dropLocation);
        }
    }, [location.state]);

    // Load recent locations on component mount
    useEffect(() => {
        async function fetchRecentLocs() {
            setRecentLocApiWarning('');
            const apiLocs = await getRecentLocations();
            if (apiLocs && Array.isArray(apiLocs)) {
                setRecentLocations(apiLocs);
            } else {
                setRecentLocApiWarning('Recent locations API failed, using localStorage fallback.');
                try {
                    const stored = localStorage.getItem('recentTaxiLocations');
                    if (stored) setRecentLocations(JSON.parse(stored));
                } catch {
                    setRecentLocations([]);
                }
            }
        }
        fetchRecentLocs();
    }, []);

    // Save a new location to recent locations
    const saveToRecentLocations = async (locationName, fullAddress) => {
        const newLocation = {
            title: locationName,
            address: fullAddress,
            timestamp: new Date().toISOString()
        };
        let success = false;
        if (!recentLocApiWarning) {
            const apiRes = await addRecentLocation(newLocation);
            if (apiRes) {
                setRecentLocations(prev => [apiRes, ...prev.filter(l => l.title !== locationName)].slice(0, 5));
                success = true;
            }
        }
        if (!success) {
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem('recentTaxiLocations');
                let recent = stored ? JSON.parse(stored) : [];
                recent = recent.filter(loc => loc.title !== locationName);
                recent.unshift(newLocation);
                recent = recent.slice(0, 5);
                localStorage.setItem('recentTaxiLocations', JSON.stringify(recent));
                setRecentLocations(recent);
            } catch {}
        }
    };

    // Remove a location from recent locations
    const removeFromRecentLocations = async (locationTitle, id) => {
        let success = false;
        if (!recentLocApiWarning && id) {
            const apiRes = await deleteRecentLocation(id);
            if (apiRes) {
                setRecentLocations(prev => prev.filter(l => l._id !== id));
                success = true;
            }
        }
        if (!success) {
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem('recentTaxiLocations');
                if (stored) {
                    let recent = JSON.parse(stored);
                    recent = recent.filter(loc => loc.title !== locationTitle);
                    localStorage.setItem('recentTaxiLocations', JSON.stringify(recent));
                    setRecentLocations(recent);
                }
            } catch {}
        }
    };

    // Handle selecting a recent location
    const handleSelectRecentLocation = (location, type) => {
        if (type === 'pickup') {
            setPickupLocation(location.title);
        } else {
            setDestination(location.title);
            saveToRecentLocations(location.title, location.address);
        }
        setActiveInput(null);
        setSuggestions([]);
    };

    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Debounced version of suggestion fetcher
    const debouncedFetchSuggestions = debounce(async (value) => {
        console.log('Fetching suggestions for:', value, 'Active input:', activeInput);
        if (value && value.length >= 3) {
            try {
                const results = await fetchGooglePlacesSuggestions(value);
                setSuggestions(results.map(s => s.display_name));
                setApiError(''); // Clear error on successful fetch
            } catch (err) {
                console.error('Error in debouncedFetchSuggestions:', err);
                if (err?.response?.status === 429) {
                    setSuggestions([]);
                    setApiError('Too many requests. Please wait a moment and try again.');
                } else {
                    setSuggestions([]);
                }
            }
        } else {
            setSuggestions([]);
        }
    }, 500); // Reduced to 500ms for responsiveness

    const handleInputChange = (e, inputType) => {
        const value = e.target.value;
        console.log('Input changed:', value, 'Type:', inputType);
        setQuery(value);
        setActiveInput(inputType);
        debouncedFetchSuggestions(value);
    };

    const handleSelectSuggestion = (suggestion) => {
        if (activeInput === 'pickup') {
            setPickupLocation(suggestion);
        } else if (activeInput === 'destination') {
            setDestination(suggestion);
        }
        setSuggestions([]);
        setQuery("");
        setActiveInput(null);
    };

    const handleClearInput = (inputType) => {
        if (inputType === 'pickup') {
            setPickupLocation("");
        } else if (inputType === 'destination') {
            setDestination("");
        }
        setSuggestions([]);
        setQuery("");
        setActiveInput(null);
    };

    const handleBookRide = async () => {
        if (!pickupLocation || !destination) {
            showToast("Please enter both pickup and drop locations.", 'error');
            return;
        }
        if (pickupLocation.trim() === destination.trim()) {
            showToast("Pickup and drop locations cannot be the same. Please select different locations.", 'error');
            return;
        }

        // Show loading state
        setIsLoading(true);

        try {
            // Save to recent locations
            saveToRecentLocations(destination, destination);

            // Get real coordinates for both addresses
            const pickupCoords = await getCoordinatesFromAddress(pickupLocation);
            const dropoffCoords = await getCoordinatesFromAddress(destination);

            if (!pickupCoords || !dropoffCoords) {
                showToast('Could not get coordinates for addresses. Please try again.', 'error');
                return;
            }

            // Use calculated values if available, otherwise calculate on the fly
            const distance = calculatedDistance || 5; // Fallback if calculation failed
            const duration = calculatedDuration || Math.ceil(distance * 2);
            const fare = calculatedFare || calculateFare(distance, selectedVehicleType, duration);

            // Create taxi ride request with REAL coordinates
            const rideData = {
                pickup_location: {
                    address: pickupLocation,
                    latitude: pickupCoords.lat,
                    longitude: pickupCoords.lng
                },
                dropoff_location: {
                    address: destination,
                    latitude: dropoffCoords.lat,
                    longitude: dropoffCoords.lng
                },
                fare: fare,
                distance: distance,
                duration: duration,
                vehicle_type: selectedVehicleType
            };

            // Note: user_id will be automatically set by backend from authenticated user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('🔍 Debug - User from localStorage:', user);
            console.log('🔍 Debug - Token being sent:', localStorage.getItem('token'));

            // Debug: Log the final request data
            console.log('🔍 Debug - Final rideData being sent:', rideData);
            console.log('🔍 Debug - API URL:', API_CONFIG.getUrl('/api/taxi-rides'));

            // Submit taxi ride request
            const response = await axios.post(API_CONFIG.getUrl('/api/taxi-rides'), rideData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                // Show success message
                showToast('Taxi ride request submitted successfully!', 'success');

                // Navigate to pickup point selection page (where the map is!)
                navigate('/select-pickup-point', {
                    state: {
                        pickupLocation: pickupLocation,
                        destination: destination,
                        dropoffCoords: dropoffCoords,
                        selectedVehicle: selectedVehicleType,
                        baseFare: calculatedFare,
                        totalFare: fare,
                        distance: calculatedDistance,
                        duration: calculatedDuration,
                        delivery_otp: response.data.data.delivery_otp // Pass OTP from backend response
                    },
                    replace: true
                });
            } else {
                throw new Error(response.data.message || 'Failed to create ride request');
            }
        } catch (error) {
            console.error('Error creating taxi ride:', error);
            showToast(
                error.response?.data?.message || error.message || 'Failed to create ride request',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Vehicle type options with base fares, per km and per minute rates (align with SelectPickupPoint)
    const vehicleTypes = [
        { type: 'Bike', baseFare: 25, perKmRate: 7, perMinRate: 0.5, icon: '🛵' },
        { type: 'Auto', baseFare: 30, perKmRate: 8, perMinRate: 0.8, icon: '🛺' },
        { type: 'Car', baseFare: 40, perKmRate: 10, perMinRate: 1, icon: '🚗' },
        { type: 'SUV', baseFare: 80, perKmRate: 18, perMinRate: 2, icon: '🚙' }
    ];

    // Get coordinates from address using Google Geocoding API
    const getCoordinatesFromAddress = async (address) => {
        try {
            const url = new URL(API_CONFIG.getUrl('/api/geocode'));
            url.searchParams.append('address', address);

            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.data) {
                return {
                    lat: data.data.lat,
                    lng: data.data.lng
                };
            }
            return null;
        } catch (error) {
            console.error('Error geocoding address:', error);
            return null;
        }
    };

    // Calculate distance between two coordinates using Google Distance Matrix API
    const calculateDistanceWithCoordinates = async (pickupCoords, dropoffCoords) => {
        try {
            const url = new URL(API_CONFIG.getUrl('/api/distance-matrix'));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origins: [pickupCoords],
                    destinations: [dropoffCoords]
                })
            });

            const data = await response.json();
            if (data.success && data.data) {
                return {
                    distance: data.data.distance,
                    duration: data.data.duration
                };
            }
            return null;
        } catch (error) {
            console.error('Error calculating distance:', error);
            return null;
        }
    };

    // Calculate fare based on distance (km), duration (min) and vehicle type
    const calculateFare = (distance, vehicleType, duration) => {
        const vehicle = vehicleTypes.find(v => v.type === vehicleType);
        if (!vehicle) return 100; // Default fare
        const perMin = vehicle.perMinRate || 0;
        const totalFare = vehicle.baseFare + (distance * vehicle.perKmRate) + ((duration || 0) * perMin);
        return Math.round(totalFare);
    };

    // Update fare when vehicle type or locations change
    useEffect(() => {
        const updateFareWithRealData = async () => {
            if (pickupLocation && destination) {
                try {
                    const pickupCoords = await getCoordinatesFromAddress(pickupLocation);
                    const dropoffCoords = await getCoordinatesFromAddress(destination);

                    if (pickupCoords && dropoffCoords) {
                        const routeData = await calculateDistanceWithCoordinates(pickupCoords, dropoffCoords);

                        if (routeData) {
                            const distance = routeData.distance;
                            const duration = routeData.duration;
                            const fare = calculateFare(distance, selectedVehicleType, duration);

                            setCalculatedDistance(distance);
                            setCalculatedFare(fare);
                            setCalculatedDuration(duration);
                        }
                    }
                } catch (error) {
                    console.error('Error updating fare with real data:', error);
                    const fallbackDistance = Math.max(pickupLocation.length, destination.length) / 20;
                    const fallbackDuration = Math.ceil(fallbackDistance * 2);
                    const fallbackFare = calculateFare(fallbackDistance, selectedVehicleType, fallbackDuration);
                    setCalculatedDistance(fallbackDistance);
                    setCalculatedFare(fallbackFare);
                    setCalculatedDuration(fallbackDuration);
                }
            }
        };

        updateFareWithRealData();
    }, [pickupLocation, destination, selectedVehicleType]);

    const toggleFavorite = (idx) => {
        setFavorites((prev) => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-visible">
            {/* Custom Toast Notification */}
            {toast.show && (
                <div className={`fixed top-24 right-4 z-[100] px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
                    toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{toast.message}</span>
                        <button
                            onClick={() => setToast({ show: false, message: '', type: 'success' })}
                            className="ml-2 text-white hover:text-gray-200"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <HeaderInsideTaxi />
            <div className="pt-24 pb-20 flex flex-col p-1 w-full">
                {/* Location Inputs Container */}
                <div className="bg-white rounded-xl shadow-lg p-2 mb-2 border-l-4 border-blue-200 relative">
                    {/* Pickup Location Input */}
                    <div className="relative mb-2">
                        <div className="p-2 bg-blue-50 border border-gray-200 rounded flex items-center">
                            <img src={locationPin} alt="pickup location icon" className="w-4 h-4 mr-2 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Pickup Location"
                                value={activeInput === 'pickup' ? query : pickupLocation}
                                onChange={(e) => handleInputChange(e, 'pickup')}
                                onFocus={() => {
                                    console.log('Pickup input focused');
                                    setActiveInput('pickup');
                                }}
                                className="w-full bg-transparent border-none focus:outline-none text-sm"
                            />
                            {pickupLocation && (
                                <button
                                    onClick={() => handleClearInput('pickup')}
                                    className="ml-1 text-gray-500 text-base font-bold leading-none hover:text-red-400 transition"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        {activeInput === 'pickup' && (suggestions.length > 0 || query) && (
                            <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                                <div className="py-1">
                                    {suggestions.length > 0 ? (
                                        suggestions.map((suggestion, index) => (
                                            <div
                                                key={`pickup-suggestion-${index}`}
                                                className="py-3 px-4 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-100 last:border-b-0"
                                                onClick={() => handleSelectSuggestion(suggestion)}
                                            >
                                                <img src={locationPin} alt="location" className="w-5 h-5 mr-3 flex-shrink-0 text-blue-500" />
                                                <span className="text-sm text-gray-800">{suggestion}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-3 px-4 text-center text-sm text-gray-500">
                                            No locations found for "{query}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drop Location Input */}
                    <div className="relative">
                        <div className="p-2 bg-blue-50 border border-gray-200 rounded flex items-center">
                            <div className="w-3 h-3 rounded-full bg-black mr-2 flex-shrink-0"></div>
                            <input
                                type="text"
                                placeholder="Drop Location"
                                value={activeInput === 'destination' ? query : destination}
                                onChange={(e) => handleInputChange(e, 'destination')}
                                onFocus={() => {
                                    console.log('Destination input focused');
                                    setActiveInput('destination');
                                }}
                                className="w-full bg-transparent border-none focus:outline-none text-sm"
                            />
                            {destination && (
                                <button
                                    onClick={() => handleClearInput('destination')}
                                    className="ml-1 text-gray-500 text-base font-bold leading-none hover:text-red-400 transition"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        {activeInput === 'destination' && (suggestions.length > 0 || query) && (
                            <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                                <div className="py-1">
                                    {suggestions.length > 0 ? (
                                        suggestions.map((suggestion, index) => (
                                            <div
                                                key={`destination-suggestion-${index}`}
                                                className="py-3 px-4 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-100 last:border-b-0"
                                                onClick={() => handleSelectSuggestion(suggestion)}
                                            >
                                                <img src={locationPin} alt="location" className="w-5 h-5 mr-3 flex-shrink-0 text-blue-500" />
                                                <span className="text-sm text-gray-800">{suggestion}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-3 px-4 text-center text-sm text-gray-500">
                                            No locations found for "{query}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicle Type Selection */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-2">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Select Vehicle Type</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {vehicleTypes.map((vehicle) => (
                            <button
                                key={vehicle.type}
                                onClick={() => setSelectedVehicleType(vehicle.type)}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    selectedVehicleType === vehicle.type
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-2xl mb-1">{vehicle.icon}</div>
                                <div className="text-sm font-medium text-gray-800">{vehicle.type}</div>
                                <div className="text-xs text-gray-500">
                                    Base: ₹{vehicle.baseFare} + ₹{vehicle.perKmRate}/km + ₹{vehicle.perMinRate}/min
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fare Display */}
                {calculatedFare && calculatedDistance && (
                    <div className="bg-white rounded-xl shadow-lg p-4 mb-2">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-sm text-gray-600">Distance</div>
                                <div className="text-lg font-semibold text-gray-800">{calculatedDistance.toFixed(1)} km</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Duration</div>
                                <div className="text-lg font-semibold text-gray-800">{calculatedDuration || Math.ceil(calculatedDistance * 2)} min</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Total Fare</div>
                                <div className="text-2xl font-bold text-green-600">₹{calculatedFare}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Book Ride Button - Fixed Position */}
                <div className="flex justify-center mb-2">
                    <button
                        className={`px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-full font-semibold text-base shadow-md hover:from-blue-600 hover:to-blue-500 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleBookRide}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Ride...' : 'Book Ride'}
                    </button>
                </div>

                {/* Recent Locations - Only show when not typing */}
                {!activeInput && recentLocations.length > 0 && (
                    <div className="flex-1 overflow-y-auto -mx-1 px-1 min-h-0">
                        <div className="bg-white rounded-lg shadow-lg">
                            <div className="py-1.5 px-2 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-600">Recent Locations</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {recentLocations.map((location, index) => (
                                    <div key={`recent-${index}`} className="relative group">
                                        <div
                                            className="py-2 px-3 hover:bg-blue-50 cursor-pointer flex items-start"
                                            onClick={() => handleSelectRecentLocation(location, 'pickup')}
                                        >
                                            <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24" className="mr-2 mt-0.5 flex-shrink-0">
                                                <path d="M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"/>
                                                <path d="M12 8v4"/>
                                                <path d="M12 16h.01"/>
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{location.title}</div>
                                                <div className="text-xs text-gray-500 truncate">{location.address}</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFromRecentLocations(location.title, location._id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 ml-2 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state when no recent locations and not typing */}
                {!activeInput && recentLocations.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="text-4xl mb-2">📍</div>
                            <div className="text-sm">No recent locations yet</div>
                            <div className="text-xs">Start typing to search for places</div>
                        </div>
                    </div>
                )}
                {recentLocApiWarning && <div style={{ color: 'orange', fontSize: 12 }}>{recentLocApiWarning}</div>}
                {apiError && <div style={{ color: 'orange', fontSize: 14 }}>{apiError}</div>}
            </div>
            <FooterTaxi />
        </div>
    );
}