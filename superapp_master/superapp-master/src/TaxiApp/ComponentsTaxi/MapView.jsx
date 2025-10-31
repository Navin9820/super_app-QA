import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MAPS_CONFIG, trackUsage } from '../../config/maps.config';
import MapBase from '../../Components/maps/MapBase';

// Lazy load Google Maps API
let googleMapsLoaded = false;

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

const TaxiMapView = ({
  onLocationSelect = null,
  onRouteCalculated = null,
  className = '',
  style = { height: '400px', width: '100%' }
}) => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(MAPS_CONFIG.DEFAULTS.CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  
  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

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

  // Initialize Google Maps services
  const initializeGoogleServices = useCallback(async () => {
    try {
      const google = await loadGoogleMaps();
      
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll add our own markers
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      
    } catch (err) {
      console.error('Failed to initialize Google services:', err);
      setError('Map services unavailable');
    }
  }, []);

  // Initialize services when component mounts
  useEffect(() => {
    if (MAPS_CONFIG.ENABLED && MAPS_CONFIG.PROVIDER === 'google') {
      initializeGoogleServices();
    }
  }, [initializeGoogleServices]);

  // Update map markers
  const updateMapMarkers = useCallback(() => {
    if (!mapRef.current) return;
    
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
      
      // Add pickup marker
      if (pickupLocation) {
        pickupMarkerRef.current = new google.maps.Marker({
          position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
          map: mapRef.current,
          title: 'Pickup Location',
          label: 'A',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });
      }
      
      // Add dropoff marker
      if (dropoffLocation) {
        dropoffMarkerRef.current = new google.maps.Marker({
          position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
          map: mapRef.current,
          title: 'Dropoff Location',
          label: 'B',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });
      }
      
    } catch (err) {
      console.error('Failed to update markers:', err);
    }
  }, [pickupLocation, dropoffLocation]);

  // Calculate route between pickup and dropoff
  const calculateRoute = useCallback(async () => {
    if (!pickupLocation || !dropoffLocation || !directionsServiceRef.current) {
      return;
    }
    
    setIsLoadingRoute(true);
    setError(null);
    
    try {
      const request = {
        origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        destination: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
        travelMode: google.maps.TravelMode.DRIVING
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
      
      // Fit map to route bounds
      if (mapRef.current && route.bounds) {
        mapRef.current.fitBounds(route.bounds);
      }
      
      // Call callback
      if (onRouteCalculated) {
        onRouteCalculated(routeData);
      }
      
      trackUsage('ROUTING');
      
    } catch (err) {
      console.error('Route calculation failed:', err);
      setError('Failed to calculate route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  }, [pickupLocation, dropoffLocation, onRouteCalculated]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateRoute();
    }
  }, [pickupLocation, dropoffLocation, calculateRoute]);

  // Update markers when locations change
  useEffect(() => {
    updateMapMarkers();
  }, [updateMapMarkers]);

  // Handle map click
  const handleMapClick = useCallback((event) => {
    if (!event || !event.lat) return;
    
    const location = {
      lat: event.lat,
      lng: event.lng,
      address: `Location at ${event.lat.toFixed(6)}, ${event.lng.toFixed(6)}`
    };
    
    // If no pickup location, set pickup. Otherwise, set dropoff
    if (!pickupLocation) {
      setPickupLocation(location);
      if (onLocationSelect) {
        onLocationSelect('pickup', location);
      }
    } else if (!dropoffLocation) {
      setDropoffLocation(location);
      if (onLocationSelect) {
        onLocationSelect('dropoff', location);
      }
    } else {
      // Both locations set, replace dropoff
      setDropoffLocation(location);
      if (onLocationSelect) {
        onLocationSelect('dropoff', location);
      }
    }
  }, [pickupLocation, dropoffLocation, onLocationSelect]);

  // Handle map load
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    // Set up directions renderer
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(map);
    }
    
    // Update markers
    updateMapMarkers();
  }, [updateMapMarkers]);

  // Clear all locations
  const clearLocations = () => {
    setPickupLocation(null);
    setDropoffLocation(null);
    setRoute(null);
    setError(null);
    
    // Clear markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setMap(null);
      dropoffMarkerRef.current = null;
    }
    
    // Reset map view
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(15);
    } else {
      setMapCenter(MAPS_CONFIG.DEFAULTS.CENTER);
      setMapZoom(MAPS_CONFIG.DEFAULTS.ZOOM);
    }
  };

  // Use current location as pickup
  const useCurrentLocationAsPickup = () => {
    if (currentLocation) {
      setPickupLocation(currentLocation);
      if (onLocationSelect) {
        onLocationSelect('pickup', currentLocation);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Status */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">
              {pickupLocation ? 'Pickup Set' : 'Set Pickup'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">
              {dropoffLocation ? 'Dropoff Set' : 'Set Dropoff'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={useCurrentLocationAsPickup}
            disabled={!currentLocation}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📍 Use My Location
          </button>
          <button
            onClick={clearLocations}
            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <MapBase
          center={mapCenter}
          zoom={mapZoom}
          style={style}
          onMapLoad={handleMapLoad}
          onMapClick={handleMapClick}
          showControls={true}
          showAttribution={true}
        />
        
        {/* Map Instructions */}
        <div className="p-3 bg-gray-50 text-xs text-gray-600">
          💡 Click on the map to set pickup (green) and dropoff (red) locations
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
      <div className="space-y-3">
        {pickupLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-green-900 mb-1">Pickup Location</h4>
                <p className="text-green-800 text-sm">{pickupLocation.address}</p>
              </div>
              <button
                onClick={() => {
                  setPickupLocation(null);
                  if (onLocationSelect) onLocationSelect('pickup', null);
                }}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {dropoffLocation && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Dropoff Location</h4>
                <p className="text-red-800 text-sm">{dropoffLocation.address}</p>
              </div>
              <button
                onClick={() => {
                  setDropoffLocation(null);
                  if (onLocationSelect) onLocationSelect('dropoff', null);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxiMapView;
