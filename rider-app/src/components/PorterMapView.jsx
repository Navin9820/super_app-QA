import React, { useEffect, useState, useCallback, useRef } from 'react';

const PorterMapView = ({ 
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
    
         // Load Google Maps script - ONLY ONCE
     useEffect(() => {
         console.log('🗺️ PorterMapView: Starting Google Maps loading...');
         
         // Check if already loaded globally
         if (window.google && window.google.maps) {
             console.log('🗺️ PorterMapView: Google Maps already loaded');
             setMapLoaded(true);
             return;
         }
 
         // Check if script is already being loaded
         if (document.getElementById('rider-porter-maps-script')) {
             console.log('🗺️ PorterMapView: Script already exists, waiting...');
             const checkLoaded = setInterval(() => {
                 if (window.google && window.google.maps) {
                     clearInterval(checkLoaded);
                     console.log('🗺️ PorterMapView: Google Maps loaded from existing script');
                     setMapLoaded(true);
                 }
             }, 100);
             return;
         }
 
         console.log('🗺️ PorterMapView: Creating new Google Maps script...');
         
         // Create script element with unique ID for Rider App
         const script = document.createElement('script');
         script.id = 'rider-porter-maps-script';
         script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
         script.async = true;
         script.defer = true;
         
         script.onload = () => {
             console.log('🗺️ PorterMapView: Google Maps script loaded successfully');
             setMapLoaded(true);
         };
         
         script.onerror = () => {
             console.error('❌ PorterMapView: Google Maps script failed to load');
             setError('Failed to load map');
         };
         
         document.body.appendChild(script);
         
         // NO CLEANUP - Keep script loaded
     }, []); // Empty dependency array - run only once
    
    // Initialize map
    useEffect(() => {
        console.log('🗺️ PorterMapView: Map initialization effect triggered:', { 
            mapLoaded, 
            mapRef: !!mapRef.current,
            hasContainer: mapRef.current ? mapRef.current.offsetWidth > 0 : false
        });
        
        if (!mapLoaded || !mapRef.current) {
            console.log('🗺️ PorterMapView: Map initialization skipped');
            return;
        }

        // Check if map container has dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
            console.warn('⚠️ PorterMapView: Map container has zero dimensions, retrying...');
            setTimeout(() => {
                if (mapRef.current && mapRef.current.offsetWidth > 0) {
                    setMapLoaded(prev => !prev); // Retry
                }
            }, 500);
            return;
        }

        try {
            setMapInitializing(true);
            console.log('🗺️ PorterMapView: Initializing Google Maps...');
            
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

            console.log('🗺️ PorterMapView: Google Maps instance created successfully');
            setMapInstance(map);
            
            // Initialize DirectionsService and DirectionsRenderer
            directionsServiceRef.current = new window.google.maps.DirectionsService();
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
                suppressMarkers: !showMarkers, // Show markers only if requested
                polylineOptions: {
                    strokeColor: '#10B981', // Green color for porter
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                },
                suppressInfoWindows: true
            });
            
            // Set up directions renderer
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(map);
            }
            
            console.log('🗺️ PorterMapView: Google Maps initialized successfully');
            
            // Notify parent component
            if (onMapLoaded) {
                onMapLoaded(map);
            }
            
        } catch (err) {
            console.error('❌ PorterMapView: Error initializing map:', err);
            setError('Failed to initialize map');
        } finally {
            setMapInitializing(false);
        }
    }, [mapLoaded, showMarkers, onMapLoaded]);
    
    // Calculate route when coordinates are available
    const calculateRoute = useCallback(async () => {
        if (!pickupCoords || !dropoffCoords || !directionsServiceRef.current || !showRoute) {
            console.log('🔄 PorterMapView: Route calculation skipped:', { 
                hasPickup: !!pickupCoords, 
                hasDropoff: !!dropoffCoords, 
                hasService: !!directionsServiceRef.current,
                showRoute
            });
            return;
        }
        
        console.log('🚀 PorterMapView: Calculating route between:', {
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
            
            console.log('🗺️ PorterMapView: Google Directions request:', request);
            
            const result = await new Promise((resolve, reject) => {
                directionsServiceRef.current.route(request, (result, status) => {
                    if (status === 'OK') {
                        resolve(result);
                    } else {
                        reject(new Error(`Directions request failed: ${status}`));
                    }
                });
            });
            
            console.log('✅ PorterMapView: Route calculated successfully:', result);
            
            // Set directions on renderer
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);
            }
            
            // Store route data
            setRouteData(result);
            
            // Fit map to show entire route
            if (mapInstance && result.routes && result.routes.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                result.routes[0].legs.forEach(leg => {
                    bounds.extend(leg.start_location);
                    bounds.extend(leg.end_location);
                });
                
                // Add some padding
                mapInstance.fitBounds(bounds);
                
                // Ensure zoom level is reasonable
                const listener = google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
                    if (mapInstance.getZoom() > 16) {
                        mapInstance.setZoom(16);
                    }
                });
            }
            
            // Notify parent component
            if (onRouteCalculated) {
                onRouteCalculated(result);
            }
            
        } catch (err) {
            console.error('❌ PorterMapView: Error calculating route:', err);
            setError('Failed to calculate route');
        } finally {
            setIsLoadingRoute(false);
        }
    }, [pickupCoords, dropoffCoords, directionsServiceRef, showRoute, mapInstance, onRouteCalculated]);
    
         // Trigger route calculation when coordinates change - PREVENT LOOPS
     useEffect(() => {
         if (pickupCoords && dropoffCoords && mapInstance && !isLoadingRoute && !routeData) {
             calculateRoute();
         }
     }, [pickupCoords, dropoffCoords, mapInstance, isLoadingRoute, routeData]); // Removed calculateRoute dependency
    
    // Add custom markers if needed
    useEffect(() => {
        if (!mapInstance || !showMarkers || !pickupCoords || !dropoffCoords) {
            return;
        }
        
        console.log('📍 PorterMapView: Adding custom markers...');
        
        // Clear existing markers
        if (window.porterMarkers) {
            window.porterMarkers.forEach(marker => marker.setMap(null));
        }
        window.porterMarkers = [];
        
        try {
            // Pickup marker (green)
            const pickupMarker = new window.google.maps.Marker({
                position: pickupCoords,
                map: mapInstance,
                title: 'Pickup Location',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new window.google.maps.Size(32, 32)
                }
            });
            
            // Dropoff marker (red)
            const dropoffMarker = new window.google.maps.Marker({
                position: dropoffCoords,
                map: mapInstance,
                title: 'Dropoff Location',
                icon: {
                    url: 'https://maps.google.com/maps/api/staticmap?size=32x32&markers=color:red|label:D|' + 
                          dropoffCoords.lat + ',' + dropoffCoords.lng + '&key=' + GOOGLE_MAPS_API_KEY,
                    scaledSize: new window.google.maps.Size(32, 32)
                }
            });
            
            // Info windows
            const pickupInfoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px; text-align: center;">
                        <div style="color: #10B981; font-weight: bold; margin-bottom: 4px;">📍 Pickup</div>
                        <div style="font-size: 12px; color: #6B7280;">
                            ${pickupLocation?.address || 'Pickup location'}
                        </div>
                    </div>
                `
            });
            
            const dropoffInfoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px; text-align: center;">
                        <div style="color: #EF4444; font-weight: bold; margin-bottom: 4px;">🎯 Dropoff</div>
                        <div style="font-size: 12px; color: #6B7280;">
                            ${dropoffLocation?.address || 'Dropoff location'}
                        </div>
                    </div>
                `
            });
            
            // Add click listeners
            pickupMarker.addListener('click', () => {
                pickupInfoWindow.open(mapInstance, pickupMarker);
            });
            
            dropoffMarker.addListener('click', () => {
                dropoffInfoWindow.open(mapInstance, dropoffMarker);
            });
            
            // Store markers for cleanup
            window.porterMarkers = [pickupMarker, dropoffMarker];
            
            console.log('✅ PorterMapView: Custom markers added successfully');
            
        } catch (err) {
            console.error('❌ PorterMapView: Error adding markers:', err);
        }
        
        // Cleanup function
        return () => {
            if (window.porterMarkers) {
                window.porterMarkers.forEach(marker => marker.setMap(null));
                window.porterMarkers = [];
            }
        };
    }, [mapInstance, showMarkers, pickupCoords, dropoffCoords, pickupLocation, dropoffLocation]);
    
    // Loading state
    if (mapInitializing) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Initializing map...</p>
                </div>
            </div>
        );
    }
    
    // Error state
    if (error) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center text-red-600">
                    <p className="mb-2">Error: {error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    
    // Route loading state
    if (isLoadingRoute) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Calculating route...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="porter-map-container">
                         {/* Map Container */}
             <div 
                 ref={mapRef} 
                 style={{ 
                     height, 
                     width: '100%',
                     minHeight: '400px',
                     borderRadius: '8px',
                     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                     backgroundColor: '#f3f4f6'
                 }} 
             />
            
            {/* Route Information */}
            {routeData && pickupLocation && dropoffLocation && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-green-600 mb-2">Pickup</h4>
                            <p className="text-sm text-gray-700">
                                {pickupLocation.address || 'Pickup location'}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-red-600 mb-2">Dropoff</h4>
                            <p className="text-sm text-gray-700">
                                {dropoffLocation.address || 'Dropoff location'}
                            </p>
                        </div>
                    </div>
                    
                    {routeData.routes && routeData.routes[0] && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-lg font-semibold text-blue-600">
                                        {routeData.routes[0].legs[0]?.distance?.text || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">Distance</div>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-green-600">
                                        {routeData.routes[0].legs[0]?.duration?.text || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">Duration</div>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-purple-600">
                                        {routeData.routes[0].legs[0]?.duration_in_traffic?.text || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">Traffic</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PorterMapView;
