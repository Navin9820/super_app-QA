import React, { useEffect, useState, useCallback, useRef } from 'react';

const TaxiMapView = ({ 
    pickupLocation, 
    dropoffLocation, 
    pickupCoords, 
    dropoffCoords,
    height = '400px',
    showRoute = true,
    showMarkers = true,
    onMapLoaded = null,
    onRouteCalculated = null
}) => {
    // State management
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapInitializing, setMapInitializing] = useState(false);
    const [routeData, setRouteData] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [error, setError] = useState(null);
    
    // Refs
    const mapRef = useRef(null);
    const directionsServiceRef = useRef(null);
    const directionsRendererRef = useRef(null);
    
    // Google Maps API Key - Rider App specific
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB_IWKJcJhkGzpCDB-ml6vlZmQzd-4F-gg';
    
    // Load Google Maps script
    useEffect(() => {
        console.log('🗺️ TaxiMapView: Starting Google Maps loading...');
        
        // Check if already loaded globally
        if (window.google && window.google.maps) {
            console.log('🗺️ TaxiMapView: Google Maps already loaded');
            setMapLoaded(true);
            return;
        }

        // Check if script is already being loaded
        if (document.getElementById('rider-taxi-maps-script')) {
            console.log('🗺️ TaxiMapView: Script already exists, waiting...');
            const checkLoaded = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkLoaded);
                    console.log('🗺️ TaxiMapView: Google Maps loaded from existing script');
                    setMapLoaded(true);
                }
            }, 100);
            return;
        }

        console.log('🗺️ TaxiMapView: Creating new Google Maps script...');
        
        // Create script element with unique ID for Rider App
        const script = document.createElement('script');
        script.id = 'rider-taxi-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log('🗺️ TaxiMapView: Google Maps script loaded successfully');
            setMapLoaded(true);
        };
        
        script.onerror = () => {
            console.error('❌ TaxiMapView: Google Maps script failed to load');
            setError('Failed to load map');
        };
        
        document.body.appendChild(script);
        
        // Cleanup function
        return () => {
            const existingScript = document.getElementById('rider-taxi-maps-script');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);
    
    // Initialize map
    useEffect(() => {
        console.log('🗺️ TaxiMapView: Map initialization effect triggered:', { 
            mapLoaded, 
            mapRef: !!mapRef.current,
            hasContainer: mapRef.current ? mapRef.current.offsetWidth > 0 : false
        });
        
        if (!mapLoaded || !mapRef.current) {
            console.log('🗺️ TaxiMapView: Map initialization skipped');
            return;
        }

        // Check if map container has dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
            console.warn('⚠️ TaxiMapView: Map container has zero dimensions, retrying...');
            setTimeout(() => {
                if (mapRef.current && mapRef.current.offsetWidth > 0) {
                    setMapLoaded(prev => !prev); // Retry
                }
            }, 500);
            return;
        }

        try {
            setMapInitializing(true);
            console.log('🗺️ TaxiMapView: Initializing Google Maps...');
            
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

            console.log('🗺️ TaxiMapView: Google Maps instance created successfully');
            setMapInstance(map);
            
            // Initialize DirectionsService and DirectionsRenderer
            directionsServiceRef.current = new window.google.maps.DirectionsService();
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                suppressMarkers: !showMarkers, // Show markers only if requested
                polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                },
                suppressInfoWindows: true
            });
            
            // Set up directions renderer
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(map);
            }
            
            console.log('🗺️ TaxiMapView: Google Maps initialized successfully');
            
            // Notify parent component
            if (onMapLoaded) {
                onMapLoaded(map);
            }
            
        } catch (err) {
            console.error('❌ TaxiMapView: Error initializing map:', err);
            setError('Failed to initialize map');
        } finally {
            setMapInitializing(false);
        }
    }, [mapLoaded, showMarkers, onMapLoaded]);
    
    // Calculate route when coordinates are available
    const calculateRoute = useCallback(async () => {
        if (!pickupCoords || !dropoffCoords || !directionsServiceRef.current || !showRoute) {
            console.log('🔄 TaxiMapView: Route calculation skipped:', { 
                hasPickup: !!pickupCoords, 
                hasDropoff: !!dropoffCoords, 
                hasService: !!directionsServiceRef.current,
                showRoute
            });
            return;
        }
        
        console.log('🚀 TaxiMapView: Calculating route between:', {
            pickup: pickupCoords,
            dropoff: dropoffCoords
        });
        
        setIsLoadingRoute(true);
        
        try {
            const google = window.google;
            const request = {
                origin: pickupCoords,
                destination: dropoffCoords,
                travelMode: google.maps.TravelMode.DRIVING,
                drivingOptions: {
                    departureTime: new Date(),
                    trafficModel: google.maps.TrafficModel.BEST_GUESS
                }
            };
            
            console.log('🗺️ TaxiMapView: Google Directions request:', request);
            
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
            
            console.log('✅ TaxiMapView: Route calculated successfully:', routeInfo);
            setRouteData(routeInfo);
            
            // Set the route result in the directions renderer
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);
                console.log('🗺️ TaxiMapView: Route set in directions renderer');
            }
            
            // Fit map to route bounds
            if (mapInstance && route.bounds) {
                mapInstance.fitBounds(route.bounds);
                console.log('🗺️ TaxiMapView: Map fitted to route bounds');
            }
            
            // Notify parent component
            if (onRouteCalculated) {
                onRouteCalculated(routeInfo);
            }
            
        } catch (err) {
            console.error('❌ TaxiMapView: Route calculation failed:', err);
            setError('Route calculation failed');
        } finally {
            setIsLoadingRoute(false);
        }
    }, [pickupCoords, dropoffCoords, mapInstance, showRoute, onRouteCalculated]);
    
    // Trigger route calculation when coordinates change
    useEffect(() => {
        if (pickupCoords && dropoffCoords && mapInstance && showRoute) {
            console.log('🔄 TaxiMapView: Coordinates available, calculating route...');
            calculateRoute();
        }
    }, [pickupCoords, dropoffCoords, mapInstance, showRoute, calculateRoute]);
    
    // Center map on both points when available
    useEffect(() => {
        if (mapInstance && pickupCoords && dropoffCoords) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(pickupCoords);
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
    }, [mapInstance, pickupCoords, dropoffCoords]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
            }
        };
    }, []);
    
    return (
        <div className="relative w-full" style={{ height }}>
            {mapLoaded ? (
                <div 
                    ref={mapRef} 
                    className="w-full h-full"
                    style={{ 
                        minHeight: '300px', 
                        minWidth: '300px',
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
            
            {/* Route Loading Indicator */}
            {isLoadingRoute && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Calculating route...</span>
                    </div>
                </div>
            )}
            
            {/* Error Display */}
            {error && (
                <div className="absolute top-4 left-4 right-4 z-30">
                    <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm">
                        {error}
                    </div>
                </div>
            )}
            
            {/* Route Information Display */}
            {routeData && (
                <div className="absolute bottom-4 left-4 z-30">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Route Info</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
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
                </div>
            )}
        </div>
    );
};

export default TaxiMapView;
