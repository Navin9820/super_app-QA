import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MAPS_CONFIG } from '../config/maps.config';

// Lazy load Google Maps API
let googleMapsLoaded = false;

// Helper function to create marker content
const createMarkerContent = (label, color) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="
      background-color: ${color};
      color: white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      ${label}
    </div>
  `;
  return div;
};

const loadGoogleMaps = async () => {
  if (googleMapsLoaded) return window.google;
  
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve(window.google);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.API_KEYS.GOOGLE}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsLoaded = true;
      resolve(window.google);
    };
    
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    
    document.head.appendChild(script);
  });
};

const PorterMapView = ({
  pickupLocation = null,
  dropoffLocation = null,
  driverLocation = null,
  onLocationSelect = null,
  onRouteCalculated = null,
  className = '',
  style = { height: '400px', width: '100%' },
  showMap = true,
  showTraffic = false,
  showRoute = false
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(MAPS_CONFIG.DEFAULTS.CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [showTrafficState, setShowTrafficState] = useState(showTraffic);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const trafficLayerRef = useRef(null);

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location'
          };
          setCurrentLocation(location);
          setMapCenter([location.lat, location.lng]);
          setMapZoom(15);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    try {
      setIsMapLoading(true);
      const google = await loadGoogleMaps();
      
      if (!mapRef.current) return;
      
      // Create map instance
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: mapCenter[0], lng: mapCenter[1] },
        zoom: mapZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false
      });
      
      // Initialize services
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll add our own markers
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      
      // Initialize traffic layer
      trafficLayerRef.current = new google.maps.TrafficLayer();
      if (showTrafficState) {
        trafficLayerRef.current.setMap(mapInstanceRef.current);
      }
      
      // Set up directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }
      
      // Update markers
      updateMapMarkers();
      
      setIsMapLoading(false);
      
    } catch (err) {
      console.error('Failed to initialize Google Maps:', err);
      setError('Map services unavailable');
      setIsMapLoading(false);
    }
  }, [mapCenter, mapZoom]);
  
  // Toggle traffic layer
  const toggleTraffic = useCallback(() => {
    if (trafficLayerRef.current && mapInstanceRef.current) {
      if (showTrafficState) {
        trafficLayerRef.current.setMap(null);
      } else {
        trafficLayerRef.current.setMap(mapInstanceRef.current);
      }
      setShowTrafficState(!showTrafficState);
    }
  }, [showTrafficState]);

  // Initialize map when component mounts
  useEffect(() => {
    if (showMap && MAPS_CONFIG.ENABLED && MAPS_CONFIG.PROVIDER === 'google') {
      initializeMap();
    }
  }, [showMap, initializeMap]);

  // Update map markers when locations change
  const updateMapMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    try {
      const google = window.google;
      if (!google || !google.maps) return;
      
      // Clear existing markers
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setMap(null);
      }
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setMap(null);
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
      }
      
      // Add pickup marker
      if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
        try {
          // Use AdvancedMarkerElement instead of deprecated Marker
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
              map: mapInstanceRef.current,
              title: 'Pickup Location',
              content: createMarkerContent('A', 'green')
            });
          } else {
            // Fallback to regular Marker if AdvancedMarkerElement not available
            pickupMarkerRef.current = new google.maps.Marker({
              position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
              map: mapInstanceRef.current,
              title: 'Pickup Location',
              label: 'A',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }
            });
          }
        } catch (err) {
          console.warn('Failed to create pickup marker:', err);
        }
      }
      
      // Add dropoff marker
      if (dropoffLocation && dropoffLocation.lat && dropoffLocation.lng) {
        try {
          // Use AdvancedMarkerElement instead of deprecated Marker
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            dropoffMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
              map: mapInstanceRef.current,
              title: 'Dropoff Location',
              content: createMarkerContent('B', 'red')
            });
          } else {
            // Fallback to regular Marker if AdvancedMarkerElement not available
            dropoffMarkerRef.current = new google.maps.Marker({
              position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
              map: mapInstanceRef.current,
              title: 'Dropoff Location',
              label: 'B',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }
            });
          }
        } catch (err) {
          console.warn('Failed to create dropoff marker:', err);
        }
      }
      
      // Add driver marker
      if (driverLocation && driverLocation.lat && driverLocation.lng) {
        try {
          // Use AdvancedMarkerElement instead of deprecated Marker
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: driverLocation.lat, lng: driverLocation.lng },
              map: mapInstanceRef.current,
              title: 'Driver Location',
              content: createMarkerContent('🚚', 'blue')
            });
          } else {
            // Fallback to regular Marker if AdvancedMarkerElement not available
            driverMarkerRef.current = new google.maps.Marker({
              position: { lat: driverLocation.lat, lng: driverLocation.lng },
              map: mapInstanceRef.current,
              title: 'Driver Location',
              label: '🚚',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }
            });
          }
        } catch (err) {
          console.warn('Failed to create driver marker:', err);
        }
      }
      
    } catch (err) {
      console.error('Failed to update markers:', err);
    }
  }, [pickupLocation, dropoffLocation, driverLocation]);

  // Calculate route between pickup and dropoff
  const calculateRoute = useCallback(async () => {
    if (!showRoute || !pickupLocation || !dropoffLocation || !directionsServiceRef.current) {
      return;
    }
    
    setIsLoadingRoute(true);
    setError(null);
    
    try {
      const google = window.google;
      const request = {
        origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        destination: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      };
      
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
      
      const routeData = {
        distance: leg.distance.text,
        duration: leg.duration.text,
        polyline: route.overview_polyline.encoded_path,
        steps: leg.steps,
        bounds: route.bounds
      };
      
      setRoute(routeData);
      
      // CRITICAL FIX: Set the route result in the directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result);
      }
      
      // Fit map to route bounds
      if (mapInstanceRef.current && route.bounds) {
        mapInstanceRef.current.fitBounds(route.bounds);
      }
      
      // Call callback
      if (onRouteCalculated) {
        onRouteCalculated(routeData);
      }
      
    } catch (err) {
      console.error('Route calculation failed:', err);
      setError('Failed to calculate route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  }, [pickupLocation, dropoffLocation, onRouteCalculated]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (showRoute && pickupLocation && dropoffLocation && pickupLocation.lat && dropoffLocation.lat) {
      calculateRoute();
    }
  }, [showRoute, pickupLocation, dropoffLocation, calculateRoute]);

  // Update markers when locations change
  useEffect(() => {
    updateMapMarkers();
  }, [updateMapMarkers]);

  // Update map center when locations change
  useEffect(() => {
    if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
      setMapCenter([pickupLocation.lat, pickupLocation.lng]);
      setMapZoom(15);
    } else if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(15);
    }
  }, [pickupLocation, currentLocation]);

  if (!showMap) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map */}
      <div className="border border-gray-200 rounded-lg overflow-hidden relative">
        {isMapLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        <div 
          ref={mapRef}
          style={style}
        />
        
        {/* Map Controls */}
        <div className="p-3 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            🗺️ Map showing pickup and dropoff locations with route
          </div>
          <button
            onClick={toggleTraffic}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              showTrafficState 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {showTrafficState ? 'Hide Traffic' : 'Show Traffic'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Route Information */}
      {route && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Route Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Distance:</span>
              <span className="ml-2 font-medium">{route.distance}</span>
            </div>
            <div>
              <span className="text-blue-700">Duration:</span>
              <span className="ml-2 font-medium">{route.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Route */}
      {isLoadingRoute && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Calculating route...</p>
        </div>
      )}

      {/* Location Details */}
      <div className="space-y-3 pb-4">
        {pickupLocation && pickupLocation.lat && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-green-900 mb-1">Pickup Location</h4>
                <p className="text-green-800 text-sm">{pickupLocation.address || 'Location set'}</p>
              </div>
            </div>
          </div>
        )}

        {dropoffLocation && dropoffLocation.lat && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Dropoff Location</h4>
                <p className="text-red-800 text-sm">{dropoffLocation.address || 'Location set'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PorterMapView;
