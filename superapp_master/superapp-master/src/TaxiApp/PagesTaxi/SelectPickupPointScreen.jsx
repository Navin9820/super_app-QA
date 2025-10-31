
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeaderInsideTaxi from "../ComponentsTaxi/HeaderInsideTaxi";
// import mapPlaceholder from "../../FoodDilvery/ImagesF/mapfromFigma.svg";
import locationPin from "../ImagesTaxi/location-sugg-list.svg";
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";
import { geocodeAddress, calculateRoute } from '../../services/taxiService';
import API_CONFIG from '../../config/api.config';
import { useNotifications } from '../../Utility/NotificationContext';

function SelectPickupPointScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { addOrderSuccessNotification } = useNotifications();
    const { pickupLocation, destination, dropoffCoords, selectedVehicle, baseFare, totalFare, distance, duration, delivery_otp } = location.state || {};
    console.log('SelectPickupPointScreen state:', {
        pickupLocation,
        destination,
        dropoffCoords,
        selectedVehicle,
        baseFare,
        totalFare,
        distance,
        duration
    });
    
    // Initialize selectedPoint with null
    const [selectedPoint, setSelectedPoint] = useState(null);
    // Saved locations: { home: {name, coords}, work: {name, coords}, custom: {name, coords} }
    const [savedLocations, setSavedLocations] = useState({
        home: null,
        work: null,
        custom: null
    });
    const [customLocationName, setCustomLocationName] = useState('');
    // Search functionality
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    // Recent pickups from localStorage
    const [recentPickups, setRecentPickups] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('recentPickups') || '[]');
        } catch {
            return [];
        }
    });
    // For current location
    const [currentLoc, setCurrentLoc] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    // Show more/less for pickup points
    const [showAllPoints, setShowAllPoints] = useState(false);
    // Track if a recent location is selected
    const [selectedRecentIdx, setSelectedRecentIdx] = useState(null);
    const [error, setError] = useState("");
    // Add state for live distance, duration, and fare
    const [liveDistance, setLiveDistance] = useState(null);
    const [liveDuration, setLiveDuration] = useState(null);
    const [liveFare, setLiveFare] = useState(null);
    const [previousPickup, setPreviousPickup] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapInitializing, setMapInitializing] = useState(false);
    const mapRef = useRef(null);
    
    // Enhanced custom location search functionality
    const [customLocationSearch, setCustomLocationSearch] = useState('');
    const [customLocationResults, setCustomLocationResults] = useState([]);
    const [showCustomLocationResults, setShowCustomLocationResults] = useState(false);
    const [isSearchingCustomLocation, setIsSearchingCustomLocation] = useState(false);
    
    // Route display refs
    const directionsServiceRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const [routeData, setRouteData] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    
    // Google Maps markers
    const [pickupMarker, setPickupMarker] = useState(null);
    const [dropoffMarker, setDropoffMarker] = useState(null);
    
    // Convert selectedCoordinates to proper React state
    const [selectedCoordinates, setSelectedCoordinates] = useState(null);
    
    // Helper: city to pickup points mapping (moved up to avoid initialization issues)
    const cityPickupPoints = {
        Chennai: [
            { id: 1, lat: 13.0827, lng: 80.2707, label: 'Chennai Central', address: 'Chennai Central Railway Station' },
            { id: 2, lat: 13.0635, lng: 80.2409, label: 'T Nagar', address: 'T Nagar, Chennai' },
            { id: 3, lat: 13.0480, lng: 80.2098, label: 'Guindy', address: 'Guindy, Chennai' },
            { id: 4, lat: 13.0604, lng: 80.2496, label: 'Egmore', address: 'Egmore, Chennai' }
        ],
        Coimbatore: [
            { id: 1, lat: 11.0168, lng: 76.9558, label: 'Gandhipuram', address: 'Gandhipuram, Coimbatore' },
            { id: 2, lat: 11.0183, lng: 76.9725, label: 'Town Hall', address: 'Town Hall, Coimbatore' },
            { id: 3, lat: 11.0186, lng: 76.9488, label: 'Ukkadam', address: 'Ukkadam, Coimbatore' },
            { id: 4, lat: 11.0357, lng: 77.0285, label: 'Peelamedu', address: 'Peelamedu, Coimbatore' }
        ],
        Salem: [
            { id: 1, lat: 11.6643, lng: 78.1460, label: 'New Bus Stand', address: 'New Bus Stand, Salem' },
            { id: 2, lat: 11.6537, lng: 78.1621, label: 'Junction', address: 'Salem Junction Railway Station' },
            { id: 3, lat: 11.6640, lng: 78.1580, label: 'Five Roads', address: 'Five Roads, Salem' },
            { id: 4, lat: 11.6691, lng: 78.1402, label: 'Gugai', address: 'Gugai, Salem' }
        ],
        Madurai: [
            { id: 1, lat: 9.9252, lng: 78.1198, label: 'Meenakshi Temple', address: 'Meenakshi Temple, Madurai' },
            { id: 2, lat: 9.9174, lng: 78.1196, label: 'Periyar', address: 'Periyar Bus Stand, Madurai' },
            { id: 3, lat: 9.9300, lng: 78.1140, label: 'Mattuthavani', address: 'Mattuthavani, Madurai' },
            { id: 4, lat: 9.9297, lng: 78.1450, label: 'Anna Nagar', address: 'Anna Nagar, Madurai' }
        ],
        Pondicherry: [
            { id: 1, lat: 11.9416, lng: 79.8083, label: 'Rock Beach', address: 'Rock Beach, Pondicherry' },
            { id: 2, lat: 11.9375, lng: 79.8356, label: 'Auroville', address: 'Auroville, Pondicherry' },
            { id: 3, lat: 11.9396, lng: 79.8317, label: 'White Town', address: 'White Town, Pondicherry' },
            { id: 4, lat: 11.9480, lng: 79.7856, label: 'Serenity Beach', address: 'Serenity Beach, Pondicherry' }
        ]
    };
    
    // Improved city extraction function (moved up to avoid initialization issues)
    function extractCity(locationStr) {
        if (!locationStr) return null;
        const cities = Object.keys(cityPickupPoints);
        // Try to match by splitting on comma and trimming
        const parts = locationStr.split(',').map(s => s.trim().toLowerCase());
        for (const city of cities) {
            if (parts.includes(city.toLowerCase())) {
                return city;
            }
        }
        // Fallback: substring match
        for (const city of cities) {
            if (locationStr.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }
        return null;
    }

    // Custom toast notification (same as e-commerce)
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Calculate route between pickup and dropoff points using Google Maps
    const calculateGoogleRoute = useCallback(async () => {
        console.log('🚀 calculateGoogleRoute called with:', {
            selectedCoordinates,
            dropoffCoords,
            hasDirectionsService: !!directionsServiceRef.current
        });
        
        if (!selectedCoordinates || !dropoffCoords || !directionsServiceRef.current) {
            console.log('Google route calculation skipped:', { 
                hasPickup: !!selectedCoordinates, 
                hasDropoff: !!dropoffCoords, 
                hasService: !!directionsServiceRef.current 
            });
            return;
        }
        
        console.log('Calculating Google route between:', {
            pickup: { lat: selectedCoordinates.lat, lng: selectedCoordinates.lng },
            dropoff: { lat: dropoffCoords.lat, lng: dropoffCoords.lng }
        });
        
        setIsLoadingRoute(true);
        
        try {
            const google = window.google;
            const request = {
                origin: { lat: selectedCoordinates.lat, lng: selectedCoordinates.lng },
                destination: { lat: dropoffCoords.lat, lng: dropoffCoords.lng },
                travelMode: google.maps.TravelMode.DRIVING,
                drivingOptions: {
                    departureTime: new Date(),
                    trafficModel: google.maps.TrafficModel.BEST_GUESS
                }
            };
            
            console.log('Google Directions request:', request);
            
            const result = await new Promise((resolve, reject) => {
                directionsServiceRef.current.route(request, (result, status) => {
                    if (status === 'OK') {
                        resolve(result);
                    } else {
                        reject(new Error(`Route calculation failed: ${status}`));
                    }
                });
            });
            
            const route = result.routes[0];
            const leg = route.legs[0];
            
            const routeInfo = {
                distance: leg.distance.text,
                duration: leg.duration.text,
                polyline: route.overview_polyline.encoded_path,
                steps: leg.steps,
                bounds: route.bounds
            };
            
            console.log('Google route calculated successfully:', routeInfo);
            setRouteData(routeInfo);
            
            // Set the route result in the directions renderer
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);
                console.log('Route set in directions renderer');
            }
            
            // Fit map to route bounds
            if (mapInstance && route.bounds) {
                mapInstance.fitBounds(route.bounds);
                console.log('Map fitted to route bounds');
            }
            
        } catch (err) {
            console.error('Google route calculation failed:', err);
        } finally {
            setIsLoadingRoute(false);
        }
    }, [selectedCoordinates, dropoffCoords, mapInstance]);
    
    // Create and manage Google Maps markers
    const createMarkers = useCallback(() => {
        if (!mapInstance || !window.google) return;
        
        // Clear existing markers
        if (pickupMarker) pickupMarker.setMap(null);
        if (dropoffMarker) dropoffMarker.setMap(null);
        
        // Create pickup marker
        if (selectedCoordinates) {
            const newPickupMarker = new window.google.maps.Marker({
                position: { lat: selectedCoordinates.lat, lng: selectedCoordinates.lng },
                map: mapInstance,
                title: 'Pickup Point',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="2"/>
                            <circle cx="12" cy="12" r="4" fill="white"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(24, 24),
                    anchor: new window.google.maps.Point(12, 12)
                }
            });
            setPickupMarker(newPickupMarker);
        }
        
        // Create dropoff marker
        if (dropoffCoords) {
            const newDropoffMarker = new window.google.maps.Marker({
                position: { lat: dropoffCoords.lat, lng: dropoffCoords.lng },
                map: mapInstance,
                title: 'Dropoff Point',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
                            <circle cx="12" cy="12" r="4" fill="white"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(24, 24),
                    anchor: new window.google.maps.Point(12, 12)
                }
            });
            setDropoffMarker(newDropoffMarker);
        }
    }, [mapInstance, selectedCoordinates, dropoffCoords, pickupMarker, dropoffMarker]);

    useEffect(() => {
        console.log('SelectPickupPointScreen mounted with state:', location.state);
        if (!location.state || !pickupLocation || !destination) {
            console.log('Missing required state, redirecting back');
            navigate('/select-location');
            return;
        }
        
        // Validate dropoffCoords format
        if (dropoffCoords) {
            console.log('✅ dropoffCoords received:', dropoffCoords);
            if (typeof dropoffCoords.lat !== 'number' || typeof dropoffCoords.lng !== 'number') {
                console.error('❌ Invalid dropoffCoords format:', dropoffCoords);
                setError('Invalid dropoff coordinates received');
            }
        } else {
            console.error('❌ Missing dropoffCoords in state');
            // Try to geocode the destination as fallback
            if (destination && typeof destination === 'string') {
                console.log('🔄 Attempting to geocode destination as fallback...');
                geocodeAddressLocal(destination).then(coords => {
                    if (coords) {
                        console.log('✅ Fallback geocoding successful:', coords);
                        // Update the state with the geocoded coordinates
                        location.state = { ...location.state, dropoffCoords: coords };
                    }
                });
            } else {
                setError('Dropoff coordinates not received and destination cannot be geocoded');
            }
        }
        // Load saved locations from localStorage
        try {
            const stored = JSON.parse(localStorage.getItem('taxiSavedLocations') || '{}');
            setSavedLocations({
                home: stored.home || null,
                work: stored.work || null,
                custom: stored.custom || null
            });
            setCustomLocationName(stored.custom?.name || '');
        } catch {}
    }, [location.state, navigate, pickupLocation, destination]);

    const geocodeAddressLocal = useCallback(async (address) => {
        // Use backend proxy to avoid CORS issues
        try {
            console.log('🔍 Attempting to geocode address:', address);
            const result = await geocodeAddress(address);
            console.log('🔍 Geocoding result:', result);
            
            if (result && result.lat && result.lng) {
                const coords = {
                    lat: result.lat,
                    lng: result.lng
                };
                console.log('✅ Successfully geocoded to coordinates:', coords);
                return coords;
            } else {
                console.warn('❌ Geocoding result missing coordinates:', result);
                setError("Could not find the location. Please try a different address.");
                return null;
            }
        } catch (error) {
            console.error('❌ Geocoding error:', error);
            setError("Network error while searching for location. Please check your connection.");
            return null;
        }
    }, []);

    // Search for locations with debouncing
    const searchLocations = useCallback(async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            // Use Google Places API for better search results
            if (window.google && window.google.maps && window.google.maps.places) {
                const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                const request = {
                    query: query,
                    fields: ['name', 'formatted_address', 'geometry', 'place_id']
                };

                service.textSearch(request, (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        const formattedResults = results.slice(0, 5).map(place => ({
                            id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            coords: {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            }
                        }));
                        setSearchResults(formattedResults);
                        setShowSearchResults(true);
                    } else {
                        setSearchResults([]);
                        setShowSearchResults(false);
                    }
                    setIsSearching(false);
                });
            } else {
                // Fallback to geocoding if Places API is not available
                const coords = await geocodeAddressLocal(query);
                if (coords) {
                    setSearchResults([{
                        id: 'search-result-1',
                        name: query,
                        address: query,
                        coords: coords
                    }]);
                    setShowSearchResults(true);
                } else {
                    setSearchResults([]);
                    setShowSearchResults(false);
                }
                setIsSearching(false);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setShowSearchResults(false);
            setIsSearching(false);
        }
    }, [geocodeAddressLocal]);

    // Enhanced custom location search functionality
    const searchCustomLocations = useCallback(async (query) => {
        if (!query || query.length < 3) {
            setCustomLocationResults([]);
            setShowCustomLocationResults(false);
            return;
        }

        setIsSearchingCustomLocation(true);
        try {
            // Use Google Places API for better search results
            if (window.google && window.google.maps && window.google.maps.places) {
                const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                const request = {
                    query: query,
                    fields: ['name', 'formatted_address', 'geometry', 'place_id']
                };

                service.textSearch(request, (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        const formattedResults = results.slice(0, 5).map(place => ({
                            id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            coords: {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            }
                        }));
                        setCustomLocationResults(formattedResults);
                        setShowCustomLocationResults(true);
                    } else {
                        setCustomLocationResults([]);
                        setShowCustomLocationResults(false);
                    }
                    setIsSearchingCustomLocation(false);
                });
            } else {
                // Fallback to geocoding if Places API is not available
                const coords = await geocodeAddressLocal(query);
                if (coords) {
                    setCustomLocationResults([{
                        id: 'custom-search-result-1',
                        name: query,
                        address: query,
                        coords: coords
                    }]);
                    setShowCustomLocationResults(true);
                } else {
                    setCustomLocationResults([]);
                    setShowCustomLocationResults(false);
                }
                setIsSearchingCustomLocation(false);
            }
        } catch (error) {
            console.error('Custom location search error:', error);
            setCustomLocationResults([]);
            setShowCustomLocationResults(false);
            setIsSearchingCustomLocation(false);
        }
    }, [geocodeAddressLocal]);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                searchLocations(searchQuery);
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchLocations]);

    // Debounced custom location search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (customLocationSearch) {
                searchCustomLocations(customLocationSearch);
            } else {
                setCustomLocationResults([]);
                setShowCustomLocationResults(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [customLocationSearch, searchCustomLocations]);

    useEffect(() => {
        async function handlePickupLocation() {
            console.log('🔄 Processing pickupLocation:', pickupLocation);
            console.log('🔄 Current selectedPoint:', selectedPoint);
            
            // Only process if we don't have a valid selectedPoint with coordinates
            if (!selectedPoint || !selectedPoint.lat || !selectedPoint.lng) {
                if (typeof pickupLocation === 'string') {
                    console.log('🔄 PickupLocation is string, attempting to geocode...');
                    const coords = await geocodeAddressLocal(pickupLocation);
                    if (coords) {
                        const newSelectedPoint = { lat: coords.lat, lng: coords.lng, label: pickupLocation };
                        console.log('✅ Setting selectedPoint from geocoded pickupLocation:', newSelectedPoint);
                        setSelectedPoint(newSelectedPoint);
                    } else {
                        console.log('❌ Failed to geocode pickupLocation:', pickupLocation);
                    }
                } else if (pickupLocation.lat && pickupLocation.lng) {
                    const newSelectedPoint = { lat: pickupLocation.lat, lng: pickupLocation.lng, label: pickupLocation.label || '' };
                    console.log('✅ Setting selectedPoint from pickupLocation object:', newSelectedPoint);
                    setSelectedPoint(newSelectedPoint);
                } else {
                    console.log('❌ pickupLocation missing lat/lng:', pickupLocation);
                }
            } else {
                console.log('✅ selectedPoint already has valid coordinates, skipping geocoding');
            }
        }
        handlePickupLocation();
    }, [pickupLocation, geocodeAddressLocal]); // Removed selectedPoint dependency to prevent infinite loops

    useEffect(() => {
        if (selectedPoint && selectedPoint.lat && selectedPoint.lng) {
            setCurrentLoc({ lat: selectedPoint.lat, lng: selectedPoint.lng });
            console.log('Set currentLoc from selectedPoint:', selectedPoint);
        } else if (selectedPoint) {
            console.log('selectedPoint missing lat/lng:', selectedPoint);
        }
    }, [selectedPoint]);

    // Load Google Maps - Simplified and safer approach
    useEffect(() => {
        console.log('🗺️ Starting Google Maps loading effect...');
        
        // Check if already loaded globally
        if (window.google && window.google.maps) {
            console.log('🗺️ Google Maps already loaded');
            setMapLoaded(true);
            return;
        }

        // Check if script is already being loaded
        if (document.getElementById('google-maps-script')) {
            console.log('🗺️ Google Maps script already exists, waiting...');
            // Wait for existing load to complete
            const checkLoaded = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkLoaded);
                    console.log('🗺️ Google Maps loaded from existing script');
                    setMapLoaded(true);
                }
            }, 100);
            return;
        }

        console.log('🗺️ Creating new Google Maps script...');
        
        // Create script element with unique ID
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB_IWKJcJhkGzpCDB-ml6vlZmQzd-4F-gg'}&libraries=geometry,places`;
        script.async = true;
        script.defer = true;
        
        // Use onload instead of callback to avoid window pollution
        script.onload = () => {
            console.log('🗺️ Google Maps script loaded successfully');
            setMapLoaded(true);
        };
        
        script.onerror = () => {
            console.error('❌ Google Maps script failed to load');
            setError('Failed to load map');
        };
        
        // Append to body instead of head for better compatibility
        document.body.appendChild(script);
        
        // Cleanup function
        return () => {
            const existingScript = document.getElementById('google-maps-script');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);
    
    // Cleanup markers on unmount
    useEffect(() => {
        return () => {
            if (pickupMarker) pickupMarker.setMap(null);
            if (dropoffMarker) dropoffMarker.setMap(null);
        };
    }, [pickupMarker, dropoffMarker]);

    // Initialize map
    useEffect(() => {
        console.log('🗺️ Map initialization effect triggered:', { 
            mapLoaded, 
            mapRef: !!mapRef.current,
            mapRefDimensions: mapRef.current ? {
                width: mapRef.current.offsetWidth,
                height: mapRef.current.offsetHeight,
                clientWidth: mapRef.current.clientWidth,
                clientHeight: mapRef.current.clientHeight,
                getBoundingClientRect: mapRef.current.getBoundingClientRect()
            } : 'No mapRef'
        });
        
        if (!mapLoaded || !mapRef.current) {
            console.log('🗺️ Map initialization skipped:', { mapLoaded, mapRef: !!mapRef.current });
            return;
        }

        // Check if map container has dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
            console.warn('⚠️ Map container has zero dimensions:', {
                offsetWidth: mapRef.current.offsetWidth,
                offsetHeight: mapRef.current.offsetHeight,
                clientWidth: mapRef.current.clientWidth,
                clientHeight: mapRef.current.clientHeight,
                getBoundingClientRect: mapRef.current.getBoundingClientRect()
            });
            
            // Try again after a short delay to see if dimensions are available
            setTimeout(() => {
                if (mapRef.current && mapRef.current.offsetWidth > 0 && mapRef.current.offsetHeight > 0) {
                    console.log('🗺️ Container dimensions available after delay, retrying...');
                    // Trigger the effect again
                    setMapLoaded(prev => !prev);
                } else {
                    setError('Map container has no dimensions - check CSS');
                }
            }, 500);
            return;
        }

        try {
            setMapInitializing(true);
            console.log('🗺️ Initializing Google Maps...');
            console.log('🗺️ Map container dimensions:', {
                width: mapRef.current.offsetWidth,
                height: mapRef.current.offsetHeight
            });
            
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: 13.0827, lng: 80.2707 }, // Chennai
                zoom: 13,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            console.log('🗺️ Google Maps instance created successfully');
            setMapInstance(map);
            
            // Initialize DirectionsService and DirectionsRenderer
            directionsServiceRef.current = new window.google.maps.DirectionsService();
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                suppressMarkers: true, // We manage our own markers
                polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                },
                suppressInfoWindows: true // Don't show info windows on route
            });
            
            // Set up directions renderer
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(map);
            }
            
            console.log('🗺️ Google Maps initialized successfully');
            

        } catch (err) {
            console.error('❌ Error initializing map:', err);
            setError('Failed to initialize map');
        } finally {
            setMapInitializing(false);
        }
    }, [mapLoaded]);
    
    // Calculate route when both coordinates are available
    useEffect(() => {
        console.log('🔄 Route calculation useEffect triggered:', {
            hasSelectedCoordinates: !!selectedCoordinates,
            hasDropoffCoords: !!dropoffCoords,
            hasDirectionsService: !!directionsServiceRef.current,
            selectedCoordinates,
            dropoffCoords
        });
        
        if (selectedCoordinates && dropoffCoords && directionsServiceRef.current) {
            console.log('✅ All conditions met, calling calculateGoogleRoute');
            calculateGoogleRoute();
        } else {
            console.log('❌ Route calculation skipped - missing:', {
                selectedCoordinates: !selectedCoordinates,
                dropoffCoords: !dropoffCoords,
                directionsService: !directionsServiceRef.current
            });
        }
    }, [selectedCoordinates, dropoffCoords]); // Removed calculateGoogleRoute from dependencies
    
    // Create markers when coordinates change
    useEffect(() => {
        if (mapInstance && (selectedCoordinates || dropoffCoords)) {
            createMarkers();
        }
    }, [mapInstance, selectedCoordinates, dropoffCoords]); // Removed createMarkers from dependencies
    
    // Center map on both points when available
    useEffect(() => {
        if (mapInstance && selectedCoordinates && dropoffCoords) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(selectedCoordinates);
            bounds.extend(dropoffCoords);
            mapInstance.fitBounds(bounds);
            
            // Add some padding to the bounds
            const listener = window.google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
                if (mapInstance.getZoom() > 15) {
                    mapInstance.setZoom(15);
                }
            });
            

            
            return () => {
                window.google.maps.event.removeListener(listener);
            };
        }
    }, [mapInstance, selectedCoordinates, dropoffCoords]);

    // Helper functions and constants moved to top of component

    // Pickup points (dynamic)
    const pickupCity = extractCity(pickupLocation);
    console.log('pickupLocation:', pickupLocation, 'Detected city:', pickupCity);
    const pickupPoints = cityPickupPoints[pickupCity] || [];

    // Determine if pickupLocation is a geocoded address (not a city)
    const isGeocodedPickup = selectedPoint && selectedPoint.lat && selectedPoint.lng && selectedPoint.label === pickupLocation;
    
    console.log('selectedPoint:', selectedPoint);
    console.log('isGeocodedPickup:', isGeocodedPickup);
    console.log('pickupPoints count:', pickupPoints.length);
    
    // If selectedPoint is a geocoded address (not a city), always add it as the main pickup point
    const allPickupPoints = (isGeocodedPickup || currentLoc)
        ? [
            { id: 99, lat: (isGeocodedPickup ? selectedPoint.lat : currentLoc.lat), lng: (isGeocodedPickup ? selectedPoint.lng : currentLoc.lng), label: pickupLocation || 'Current Location', address: pickupLocation || 'Current Location' },
            ...pickupPoints
        ]
        : pickupPoints;

    // Show only first 2 unless expanded
    const pointsToShow = showAllPoints ? allPickupPoints : allPickupPoints.slice(0, 2);

    // Find selected address
    let selectedAddress = '';
    
    // First priority: If we have a geocoded pickupLocation from state, use it
    if (pickupLocation && typeof pickupLocation === 'string' && selectedPoint && selectedPoint.label === pickupLocation) {
        selectedAddress = pickupLocation;
        console.log('✅ Using geocoded pickupLocation from state:', selectedAddress);
    } else if (selectedRecentIdx !== null && recentPickups[selectedRecentIdx]) {
        selectedAddress = recentPickups[selectedRecentIdx].address;
        console.log('✅ Using selected recent pickup:', selectedAddress);
    } else if (selectedPoint) {
        if (selectedPoint === 99 && currentLoc && currentLoc.address) {
            selectedAddress = currentLoc.address;
            console.log('✅ Using current location:', selectedAddress);
        } else if (selectedPoint.label) {
            // If selectedPoint has a label (from geocoded pickupLocation), use it
            selectedAddress = selectedPoint.label;
            console.log('✅ Using selectedPoint label:', selectedAddress);
        } else {
            const point = allPickupPoints.find(p => p.id === selectedPoint);
            if (point) {
                selectedAddress = point.label;
                console.log('✅ Using pickup point from list:', selectedAddress);
            }
        }
    }
    
    // If still no selectedAddress, fall back to pickupLocation from state
    if (!selectedAddress && pickupLocation) {
        if (typeof pickupLocation === 'string') {
            selectedAddress = pickupLocation;
            console.log('✅ Falling back to pickupLocation from state:', selectedAddress);
        } else if (pickupLocation.label) {
            selectedAddress = pickupLocation.label;
            console.log('✅ Falling back to pickupLocation.label:', selectedAddress);
        }
    }
    
    // Final fallback: if we still don't have coordinates but have selectedAddress, try to geocode it
    if (selectedAddress && !selectedCoordinates && pickupLocation && typeof pickupLocation === 'string') {
        console.log('🔄 Final fallback: attempting to geocode pickupLocation for coordinates');
        // This will be handled by the useEffect that processes pickupLocation
    }

    // Handle selecting a pickup point
    const handlePointSelect = (point) => {
        if (point && typeof point === 'object' && 'id' in point) {
            if (point.id === 99) {
                // If 'Current Location' or geocoded pickup is selected
                if (selectedPoint === 99) {
                    // Unselect: restore previous pickup
                    if (previousPickup !== null) {
                        setSelectedPoint(previousPickup);
                        setPreviousPickup(null);
                    }
                } else {
                    // Store current selection before switching to current location
                    setPreviousPickup(selectedPoint);
                    if (isGeocodedPickup) {
                        // If this is the geocoded pickup location, set it directly
                        setSelectedPoint({ id: 99, lat: point.lat, lng: point.lng, label: pickupLocation });
                        setCurrentLoc({ lat: point.lat, lng: point.lng, address: pickupLocation });
                    } else {
                        handleSetCurrentLocation();
                    }
                }
            } else {
                setSelectedPoint(point.id);
                setCurrentLoc({ lat: point.lat, lng: point.lng, address: point.address || '' });
                setPreviousPickup(null);
            }
        } else {
            setSelectedPoint(point);
            setPreviousPickup(null);
            // Optionally set currentLoc if you have lat/lng info here
        }
        setSelectedRecentIdx(null);
    };

    // Handle selecting a search result
    const handleSearchResultSelect = (result) => {
        console.log('🔍 Selected search result:', result);
        
        // Create a new selected point from search result
        const newSelectedPoint = {
            id: result.id,
            lat: result.coords.lat,
            lng: result.coords.lng,
            label: result.name,
            address: result.address
        };
        
        setSelectedPoint(newSelectedPoint);
        setCurrentLoc({
            lat: result.coords.lat,
            lng: result.coords.lng,
            address: result.address
        });
        
        // Clear search
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        setSelectedRecentIdx(null);
        setPreviousPickup(null);
        
        showToast(`Selected: ${result.name}`, 'success');
    };

    // Handle selecting a custom location search result
    const handleCustomLocationResultSelect = (result) => {
        console.log('🔍 Selected custom location result:', result);
        
        // Create a new selected point from custom location search result
        const newSelectedPoint = {
            id: result.id,
            lat: result.coords.lat,
            lng: result.coords.lng,
            label: result.name,
            address: result.address
        };
        
        setSelectedPoint(newSelectedPoint);
        setCurrentLoc({
            lat: result.coords.lat,
            lng: result.coords.lng,
            address: result.address
        });
        
        // Update custom location name with the selected result
        setCustomLocationName(result.name);
        
        // Clear custom location search
        setCustomLocationSearch('');
        setCustomLocationResults([]);
        setShowCustomLocationResults(false);
        setSelectedRecentIdx(null);
        setPreviousPickup(null);
        
        showToast(`Selected: ${result.name}`, 'success');
    };

    // Handle saving a location
    // Save/Remove location as Home, Work, or Custom (only one at a time)
    const handleSaveLocation = (type) => {
        let point = null;
        if (selectedRecentIdx !== null && recentPickups[selectedRecentIdx]) {
            point = {
                name: type === 'custom' ? customLocationName : type.charAt(0).toUpperCase() + type.slice(1),
                coords: recentPickups[selectedRecentIdx].coordinates,
                address: recentPickups[selectedRecentIdx].address
            };
        } else if (selectedPoint) {
            const p = allPickupPoints.find(p => p.id === selectedPoint) || selectedPoint;
            point = {
                name: type === 'custom' ? customLocationName : type.charAt(0).toUpperCase() + type.slice(1),
                coords: { lat: p.lat, lng: p.lng },
                address: p.label || p.address || ''
            };
        }
        
        setSavedLocations(prev => {
            // If clicking the same type that's already selected, deselect it
            if (prev[type]) {
            const updated = {
                    home: null,
                    work: null,
                    custom: null
            };
            localStorage.setItem('taxiSavedLocations', JSON.stringify(updated));
                if (type === 'custom') setCustomLocationName('');
            return updated;
            }
            
            // Otherwise, select only this type and deselect all others
            const updated = {
                home: null,
                work: null,
                custom: null,
                [type]: point
            };
            
            // Persist to localStorage
            localStorage.setItem('taxiSavedLocations', JSON.stringify(updated));
            
            // Reset custom name if switching away from custom
            if (type !== 'custom') {
            setCustomLocationName('');
        }
            
            return updated;
        });
    };

    // Back button
    const handleBack = () => {
        navigate('/ride-confirmation', { 
            state: { 
                pickupLocation, 
                destination 
            } 
        });
    };

    // Helper: calculate fare
    function calculateFare(distanceKm, durationMin, vehicleType) {
        let baseFare = 40;
        let perKm = 10;
        let perMin = 1;
        if (vehicleType === 'SUV') { baseFare = 80; perKm = 18; perMin = 2; }
        if (vehicleType === 'Auto') { baseFare = 30; perKm = 8; perMin = 0.8; }
        if (vehicleType === 'Bike') { baseFare = 25; perKm = 7; perMin = 0.5; }
        return Math.round(baseFare + (distanceKm * perKm) + (durationMin * perMin));
    }

    // Effect: recalculate distance, duration, and fare whenever pickup or destination changes
    useEffect(() => {
        async function recalcRoute() {
            if (!selectedAddress || !selectedCoordinates || !dropoffCoords || !selectedVehicle) {
                setLiveDistance(null);
                setLiveDuration(null);
                setLiveFare(null);
                return;
            }
            try {
                // Use the coordinates passed from the previous screen
                const routeData = await calculateRoute(
                    { lat: selectedCoordinates.lat, lng: selectedCoordinates.lng },
                    { lat: dropoffCoords.lat, lng: dropoffCoords.lng }
                );
                if (routeData && routeData.distance && routeData.duration) {
                    // Backend API returns numeric values, not text
                    const d = typeof routeData.distance === 'string' ? 
                        parseFloat(routeData.distance.replace(/[^\d.]/g, '')) : 
                        routeData.distance;
                    const t = typeof routeData.duration === 'string' ? 
                        parseFloat(routeData.duration.replace(/[^\d.]/g, '')) : 
                        routeData.duration;
                    setLiveDistance(d);
                    setLiveDuration(t);
                    setLiveFare(calculateFare(d, t, selectedVehicle));
                    return;
                }
            } catch (err) {
                console.warn('Live route calculation failed:', err);
            }
            setLiveDistance(null);
            setLiveDuration(null);
            setLiveFare(null);
        }
        recalcRoute();
    }, [selectedAddress, selectedCoordinates, dropoffCoords, selectedVehicle]);

    const handleConfirmPickup = async () => {
        if (!selectedPoint && selectedRecentIdx === null) {
            showToast('Please select a pickup point', 'error');
            return;
        }

        // Show loading state
        setIsLoading(true);

        try {
            // Save to recent pickups
            if (selectedAddress && selectedCoordinates) {
                const newRecent = [
                    { address: selectedAddress, coordinates: selectedCoordinates },
                    ...recentPickups.filter(r => r.address !== selectedAddress)
                ].slice(0, 3);
                setRecentPickups(newRecent);
                localStorage.setItem('recentPickups', JSON.stringify(newRecent));
            }

            // Recalculate distance, duration, and fare using backend proxy
            let newDistance = distance;
            let newDuration = duration;
            let newTotalFare = totalFare;
            if (selectedCoordinates && dropoffCoords) {
                try {
                    // Use the coordinates passed from the previous screen
                    const routeData = await calculateRoute(
                        { lat: selectedCoordinates.lat, lng: selectedCoordinates.lng },
                        { lat: dropoffCoords.lat, lng: dropoffCoords.lng }
                    );
                    if (routeData && routeData.distance && routeData.duration) {
                        // Backend API returns numeric values, not text
                        newDistance = typeof routeData.distance === 'string' ? 
                            parseFloat(routeData.distance.replace(/[^\d.]/g, '')) : 
                            routeData.distance;
                        newDuration = typeof routeData.duration === 'string' ? 
                            parseFloat(routeData.duration.replace(/[^\d.]/g, '')) : 
                            routeData.duration;
                        newTotalFare = calculateFare(newDistance, newDuration, selectedVehicle);
                    }
                } catch (err) {
                    // If API fails, fallback to previous values
                    console.warn('Route calculation failed, using fallback values:', err);
                }
            }

            // Create taxi ride request
            const rideData = {
                pickup_location: {
                    address: selectedAddress,
                    latitude: selectedCoordinates.lat,
                    longitude: selectedCoordinates.lng
                },
                dropoff_location: {
                    address: typeof destination === 'string' ? destination : destination.address || 'Destination'
                },
                fare: Math.round(newTotalFare),
                distance: newDistance,
                duration: newDuration,
                vehicle_type: selectedVehicle
            };

            // Get user ID from localStorage or context
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                rideData.user_id = user.id;
            }

            // Submit taxi ride request
            const response = await axios.post(API_CONFIG.getUrl('/api/taxi-rides'), rideData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                // Debug logging
                console.log('🔍 SelectPickupPointScreen - API Response:', response.data);
                console.log('🔍 SelectPickupPointScreen - delivery_otp from API:', response.data.data.delivery_otp);
                console.log('🔍 SelectPickupPointScreen - delivery_otp from state:', delivery_otp);
                
                // Add order success notification
                addOrderSuccessNotification({
                    orderId: response.data.data._id || `TAXI-${Date.now()}`,
                    totalAmount: `₹${totalFare}`,
                    restaurantName: 'Taxi Service',
                    estimatedDelivery: '5-10 minutes'
                });
                
                // Show success message
                showToast('Taxi ride request submitted successfully!', 'success');
                
                // Navigate to ride confirmation page
                const finalRideData = {
                    ...rideData,
                    delivery_otp: response.data.data.delivery_otp || delivery_otp // Pass OTP from backend response or state
                };
                console.log('🔍 SelectPickupPointScreen - Final rideData being passed:', finalRideData);
                
                navigate('/ride-confirmation', { 
                    state: { 
                        rideId: response.data.data._id,
                        rideData: finalRideData,
                        status: 'pending'
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

    // Handle current location
    const handleSetCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                let address = 'Current Location';
                try {
                    // Use backend proxy to avoid CORS issues
                    const result = await geocodeAddress(`${lat},${lng}`);
                    if (result && result.formatted_address) {
                        address = result.formatted_address;
                    }
                } catch (err) {
                    // If reverse geocoding fails, keep default label
                }
                const newLoc = {
                    lat,
                    lng,
                    address,
                    label: address
                };
                setCurrentLoc(newLoc);
                setSelectedPoint(99); // Set to id 99 for current location
                setIsLocating(false);
                setError("");
            },
            (err) => {
                setError('Unable to fetch your location. Please enable location services and try again.');
                setIsLocating(false);
            }
        );
    };

    // Set selectedPoint to first available id after allPickupPoints is defined
    useEffect(() => {
        // If we have a geocoded pickupLocation that was successfully processed, don't override it
        if (selectedPoint && selectedPoint.label === pickupLocation) {
            return;
        }
        
        // Only set to hardcoded pickup points if we don't have a geocoded location
        if (allPickupPoints.length > 0 && !selectedPoint) {
            setSelectedPoint(allPickupPoints[0].id);
        }
        setSelectedRecentIdx(null);
    }, [pickupLocation, allPickupPoints.length, selectedPoint]);

    // Set selectedCoordinates based on selectedAddress and selectedPoint
    useEffect(() => {
        if (!selectedAddress) return;
        
        let coords = null;
        
        // First priority: If we have a geocoded pickupLocation from state, use it
        if (pickupLocation && typeof pickupLocation === 'string' && selectedPoint && selectedPoint.label === pickupLocation) {
            coords = { lat: selectedPoint.lat, lng: selectedPoint.lng };
            console.log('✅ Setting coordinates from geocoded pickupLocation:', coords);
        } else if (selectedRecentIdx !== null && recentPickups[selectedRecentIdx]) {
            coords = recentPickups[selectedRecentIdx].coordinates;
            console.log('✅ Setting coordinates from selected recent pickup:', coords);
        } else if (selectedPoint) {
            if (selectedPoint === 99 && currentLoc && currentLoc.address) {
                coords = { lat: currentLoc.lat, lng: currentLoc.lng };
                console.log('✅ Setting coordinates from current location:', coords);
            } else if (selectedPoint.label) {
                coords = { lat: selectedPoint.lat, lng: selectedPoint.lng };
                console.log('✅ Setting coordinates from selectedPoint label:', coords);
            } else {
                const point = allPickupPoints.find(p => p.id === selectedPoint);
                if (point) {
                    coords = { lat: point.lat, lng: point.lng };
                    console.log('✅ Setting coordinates from pickup point list:', coords);
                }
            }
        }
        
        // Only update if coordinates actually changed
        if (coords && (!selectedCoordinates || 
            selectedCoordinates.lat !== coords.lat || 
            selectedCoordinates.lng !== coords.lng)) {
            setSelectedCoordinates(coords);
        }
    }, [selectedAddress, selectedPoint, selectedRecentIdx, recentPickups, currentLoc, allPickupPoints, pickupLocation]);

    if (!location.state || !pickupLocation || !destination) {
        return (
            <div className="relative h-screen bg-gray-100 flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-x-hidden" style={{ minHeight: '100vh', minHeight: '100dvh' }}>
            {/* Custom Toast Notification */}
            {toast.show && (
                <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
                    toast.type === 'success' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
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
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg px-4 py-2 mb-2 max-w-md mx-auto text-center shadow">
                    {error}
                </div>
            )}
            {/* Map fixed at the top, responsive height for mobile */}
            <div className="absolute top-0 left-0 w-full" style={{ height: '40vh', zIndex: 10, minHeight: '250px' }}>
                <div className="w-full h-full rounded-b-3xl overflow-hidden shadow-lg relative">
                    {mapLoaded ? (
                        <div 
                            ref={mapRef} 
                            className="w-full h-full"
                            style={{ 
                                minHeight: '250px', 
                                minWidth: '250px',
                                width: '100%', 
                                height: '100%' 
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">
                                    {mapInitializing ? 'Initializing map...' : 'Loading map...'}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    {mapInitializing ? 'Setting up Google Maps' : 'Please wait while we load the map'}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Google Maps markers are now handled by the createMarkers function */}
                    
                    {/* Route Loading Indicator */}
                    {isLoadingRoute && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 30 }}>
                            <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                <span className="text-sm text-gray-700">Calculating route...</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Current Location Button */}
                    <button 
                        onClick={handleSetCurrentLocation}
                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md z-30 border border-gray-200 hover:bg-gray-100 transition-colors"
                        title="Use my location"
                        disabled={isLocating}
                    >
                        {isLocating ? (
                            <svg className="animate-spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="4" opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#22c55e" strokeWidth="4"/></svg>
                        ) : (
                            <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                        )}
                    </button>
                </div>
                {/* Floating Back Button */}
                <button 
                    onClick={handleBack}
                    className="absolute bottom-3 left-3 bg-white p-2 rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-20"
                >
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-arrow-left'%3E%3Cpath d='m12 19-7-7 7-7'/%3E%3Cpath d='M19 12H5'/%3E%3C/svg%3E" alt="back" className="w-6 h-6 text-gray-800" />
                </button>
            </div>
            {/* Bottom Sheet for Location Selection, scrollable - Fixed positioning for mobile */}
            <div className="absolute left-0 right-0 top-[40vh] bottom-0 z-20 pointer-events-none" style={{ minHeight: '60vh' }}>
                <div className="relative flex-1 bg-white rounded-t-3xl shadow-lg p-3 sm:p-4 flex flex-col overflow-y-auto pointer-events-auto pb-20 sm:pb-24 h-full" style={{ maxHeight: '60vh', minHeight: '400px' }}>
                    <div className="flex items-center mb-2">
                        <img src={locationPin} alt="pickup" className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <p className="font-semibold text-sm sm:text-base leading-tight">Select a pickup point</p>
                            <p className="text-xs text-gray-500 leading-tight">Drag map or select from below</p>
                        </div>
                    </div>
                    {/* Search Input Field - Mobile Optimized */}
                    <div className="relative mb-3">
                        <div className="flex items-center bg-white border-2 border-blue-400 rounded-full px-3 sm:px-4 py-2 sm:py-3 shadow-md transition-all duration-150">
                            <img src={locationPin} alt="pickup" className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={selectedAddress || "Search for a pickup location..."}
                                className="flex-1 text-sm sm:text-base font-medium text-gray-800 bg-transparent border-none outline-none placeholder-gray-500 min-w-0"
                                onFocus={() => {
                                    if (searchResults.length > 0) setShowSearchResults(true);
                                }}
                                onBlur={() => {
                                    // Delay hiding to allow clicking on results
                                    setTimeout(() => setShowSearchResults(false), 200);
                                }}
                            />
                            {isSearching && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2 flex-shrink-0"></div>
                            )}
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setShowSearchResults(false);
                                    }}
                                    className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                        
                        {/* Search Results Dropdown - Mobile Optimized */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 sm:max-h-60 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={result.id || index}
                                        onClick={() => handleSearchResultSelect(result)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 mr-2 sm:mr-3 mt-1">
                                                <svg width="16" height="16" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {result.name}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate mt-1">
                                                    {result.address}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* No Results Message */}
                        {showSearchResults && searchResults.length === 0 && searchQuery && !isSearching && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                                <div className="text-sm text-gray-500">
                                    No locations found for "{searchQuery}"
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Try a different search term
                                </div>
                            </div>
                        )}
                    </div>
                    {/* ETA Display */}
                    <div className="flex items-center mt-1 mb-2 text-xs text-gray-600">
                        <svg width="16" height="16" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="ml-1">Driver ETA: 4 min</span>
                    </div>
                    {/* Live Distance/Fare Display */}
                    {liveDistance && liveFare && (
                        <div className="flex items-center mt-2 mb-2 text-xs text-blue-700 font-semibold">
                            <span>Distance: {liveDistance.toFixed(2)} km</span>
                            <span className="mx-2">|</span>
                            <span>Fare: ₹{liveFare}</span>
                        </div>
                    )}
                    
                    {/* Route Information Display */}
                    {routeData && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <span className="font-semibold text-blue-800">Route Info</span>
                                </div>
                                <div className="text-xs text-blue-600">
                                    {isLoadingRoute ? 'Calculating...' : '✓ Route Ready'}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-600">Distance</div>
                                    <div className="font-semibold text-blue-700">{routeData.distance}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Duration</div>
                                    <div className="font-semibold text-blue-700">{routeData.duration}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                                         {/* Debug Information */}
                     {/* {process.env.NODE_ENV === 'development' && (
                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs">
                             <div className="font-semibold text-gray-700 mb-2">Debug Info</div>
                             <div className="space-y-1">
                                 <div>Pickup: {selectedCoordinates ? `${selectedCoordinates.lat.toFixed(4)}, ${selectedCoordinates.lng.toFixed(4)}` : 'Not set'}</div>
                                 <div>Dropoff: {dropoffCoords ? `${dropoffCoords.lat.toFixed(4)}, ${dropoffCoords.lng.toFixed(4)}` : 'Not set'}</div>
                                 <div>Map: {mapLoaded ? 'Loaded' : 'Loading'} {mapInstance ? '✓' : '✗'}</div>
                                 <div>Route: {routeData ? 'Calculated' : 'Not calculated'}</div>
                                 <div>Directions Service: {directionsServiceRef.current ? '✓' : '✗'}</div>
                             </div>
                             <button 
                                 onClick={() => {
                                     console.log('🧪 Manual route calculation test');
                                     if (selectedCoordinates && dropoffCoords && directionsServiceRef.current) {
                                         calculateGoogleRoute();
                                     } else {
                                         console.log('❌ Cannot calculate route - missing:', {
                                             selectedCoordinates: !selectedCoordinates,
                                             dropoffCoords: !dropoffCoords,
                                             directionsService: !directionsServiceRef.current
                                         });
                                     }
                                 }}
                                 className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                             >
                                 🧪 Test Route Calculation
                             </button>
                         </div>
                     )} */}
                    {/* Recent Locations Section - Mobile Optimized */}
                    {recentPickups.length > 0 && (
                        <div className="mb-3 px-1 sm:px-2">
                            <p className="font-semibold text-xs text-gray-700 mb-2">Recent Locations</p>
                            <div className="flex flex-col gap-2">
                                {recentPickups.map((loc, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center w-full px-2 sm:px-3 py-2 border rounded-lg text-xs font-medium transition-colors text-left focus:outline-none ${selectedRecentIdx === idx ? 'border-2 border-blue-500 bg-blue-100 shadow' : 'border border-blue-200 bg-blue-50 hover:border-blue-300'}`}
                                    >
                                        <button
                                            className="flex-1 flex items-center text-left"
                                            type="button"
                                            onClick={() => {
                                                setCurrentLoc({ lat: loc.coordinates.lat, lng: loc.coordinates.lng, address: loc.address });
                                                setSelectedRecentIdx(idx);
                                                setSelectedPoint(null);
                                            }}
                                        >
                                            <span className="mr-2 sm:mr-3 flex items-center justify-center w-4 h-4 flex-shrink-0">
                                                <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <polyline points="12 6 12 12 16 14"/>
                                                </svg>
                                            </span>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-semibold text-sm truncate">{loc.address}</span>
                                            </div>
                                        </button>
                                        <button
                                            className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                                            title="Remove"
                                            type="button"
                                            onClick={() => {
                                                const newRecents = recentPickups.filter((_, i) => i !== idx);
                                                setRecentPickups(newRecents);
                                                localStorage.setItem('recentPickups', JSON.stringify(newRecents));
                                                if (selectedRecentIdx === idx) setSelectedRecentIdx(null);
                                            }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <hr className="my-1 border-gray-200" />
                        </div>
                    )}
                    {/* Save Location As Section - Mobile Optimized */}
                    <div className="mb-4 px-1 sm:px-2">
                        <p className="font-medium text-sm text-gray-700 mb-3">Save location as</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                            <button 
                                onClick={() => handleSaveLocation('home')}
                                className={`flex items-center px-4 py-2 border rounded-full text-sm font-medium transition-all duration-200 ${
                                    savedLocations.home 
                                        ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md' 
                                        : 'border border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                                title={savedLocations.home ? (savedLocations.home.address || savedLocations.home.name) : 'Save as Home location'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home mr-2" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                <span>Home</span>
                            </button>
                            <button 
                                onClick={() => handleSaveLocation('work')}
                                className={`flex items-center px-4 py-2 border rounded-full text-sm font-medium transition-all duration-200 ${
                                    savedLocations.work 
                                        ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md' 
                                        : 'border border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                                title={savedLocations.work ? (savedLocations.work.address || savedLocations.work.name) : 'Save as Work location'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase mr-2" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
                                <span>Work</span>
                            </button>
                            <button 
                                onClick={() => handleSaveLocation('custom')}
                                className={`flex items-center px-4 py-2 border rounded-full text-sm font-medium transition-all duration-200 ${
                                    savedLocations.custom 
                                        ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md' 
                                        : 'border border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                                title={savedLocations.custom ? (savedLocations.custom.address || savedLocations.custom.name) : 'Add custom location name'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                <span>Add New</span>
                            </button>
                        </div>
                        {savedLocations.custom && (
                            <div className="relative mt-3 mb-3">
                                <div className="flex items-center bg-white border-2 border-blue-400 rounded-full px-3 py-2 shadow-md transition-all duration-150">
                                    <svg width="16" height="16" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24" className="mr-2 flex-shrink-0">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <input
                                        type="text"
                                        className="flex-1 text-sm font-medium text-gray-800 bg-transparent border-none outline-none placeholder-gray-500 min-w-0"
                                        placeholder="Search for a custom location..."
                                        value={customLocationSearch}
                                        onChange={e => {
                                            setCustomLocationSearch(e.target.value);
                                        }}
                                        onFocus={() => {
                                            if (customLocationResults.length > 0) setShowCustomLocationResults(true);
                                        }}
                                        onBlur={() => {
                                            // Delay hiding to allow clicking on results
                                            setTimeout(() => setShowCustomLocationResults(false), 200);
                                        }}
                                    />
                                    {isSearchingCustomLocation && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2 flex-shrink-0"></div>
                                    )}
                                    {customLocationSearch && (
                                        <button
                                            onClick={() => {
                                                setCustomLocationSearch('');
                                                setCustomLocationResults([]);
                                                setShowCustomLocationResults(false);
                                            }}
                                            className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                        >
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Custom Location Search Results Dropdown */}
                                {showCustomLocationResults && customLocationResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                        {customLocationResults.map((result, index) => (
                                            <button
                                                key={result.id || index}
                                                onClick={() => handleCustomLocationResultSelect(result)}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                            >
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 mr-2 mt-1">
                                                        <svg width="16" height="16" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {result.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate mt-1">
                                                            {result.address}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {/* No Results Message for Custom Location */}
                                {showCustomLocationResults && customLocationResults.length === 0 && customLocationSearch && !isSearchingCustomLocation && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                                        <div className="text-sm text-gray-500">
                                            No locations found for "{customLocationSearch}"
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Try a different search term
                                        </div>
                                    </div>
                                )}
                                
                                {/* Custom Location Name Input (for manual entry) */}
                                <input
                                    type="text"
                                    className="block w-full border border-blue-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400 transition mt-3"
                                    placeholder="Or enter custom location name manually"
                                    value={customLocationName}
                                    onChange={e => {
                                        setCustomLocationName(e.target.value);
                                        setSavedLocations(prev => {
                                            const updated = { ...prev, custom: prev.custom ? { ...prev.custom, name: e.target.value } : null };
                                            localStorage.setItem('taxiSavedLocations', JSON.stringify(updated));
                                            return updated;
                                        });
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    {/* Pickup Points List */}
                    {/* <div className="mb-3 px-2 md:px-4">
                        <p className="font-medium text-xs text-gray-700 mb-1">Or select from suggested points</p>
                        <div className="flex flex-col gap-2">
                            {pointsToShow.map(point => (
                                <button
                                    key={point.id}
                                    className={`flex items-center w-full px-3 py-2 border rounded-lg text-xs font-medium transition-colors text-left focus:outline-none ${selectedPoint === point.id ? 'border-2 border-blue-500 bg-blue-100 shadow' : 'border border-blue-200 bg-blue-50 hover:border-blue-300'}`}
                                    onClick={() => handlePointSelect(point)}
                                >
                                    <span className={`mr-3 flex items-center justify-center w-4 h-4 rounded-full border ${selectedPoint === point.id ? 'border-yellow-400 bg-yellow-400' : 'border-gray-300 bg-white'}`}
                                        style={{ minWidth: '1rem' }}
                                    >
                                        {selectedPoint === point.id && (
                                            <span className="block w-2 h-2 bg-white rounded-full mx-auto" />
                                        )}
                                    </span>
                                    <div className="flex flex-col flex-1">
                                        <span className="font-semibold text-sm">{point.label}</span>
                                        <span className="text-gray-500 text-xs">{point.address}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {allPickupPoints.length > 2 && (
                            <button
                                className="text-xs text-green-600 underline mt-1"
                                onClick={() => setShowAllPoints(!showAllPoints)}
                            >
                                {showAllPoints ? 'Show Less' : 'Show More'}
                            </button>
                        )}
                    </div> */}
                    {/* Confirm Pickup Button - Mobile Optimized */}
                    <button
                        onClick={handleConfirmPickup}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold shadow-lg mt-auto transition-all duration-150 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ letterSpacing: '0.02em' }}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            'Confirm Pickup'
                        )}
                    </button>
                </div>
            </div>
            <FooterTaxi />
        </div>
    );
}

export default SelectPickupPointScreen;