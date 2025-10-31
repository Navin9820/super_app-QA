import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MAPS_CONFIG, trackUsage, getCurrentProvider } from '../../config/maps.config';

// Lazy load Google Maps API to prevent unnecessary loading
let googleMapsLoaded = false;
let googleMapsLoading = false;

const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (googleMapsLoaded) {
      resolve(window.google);
      return;
    }
    
    if (googleMapsLoading) {
      // Wait for existing loading to complete
      const checkLoaded = setInterval(() => {
        if (googleMapsLoaded) {
          clearInterval(checkLoaded);
          resolve(window.google);
        }
      }, 100);
      return;
    }
    
    googleMapsLoading = true;
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      resolve(window.google);
      return;
    }
    
    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.API_KEYS.GOOGLE}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      trackUsage('MAP_LOADS');
      resolve(window.google);
    };
    
    script.onerror = () => {
      googleMapsLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(script);
  });
};

const MapBase = ({
  center = MAPS_CONFIG.DEFAULTS.CENTER,
  zoom = MAPS_CONFIG.DEFAULTS.ZOOM,
  minZoom = MAPS_CONFIG.DEFAULTS.MIN_ZOOM,
  maxZoom = MAPS_CONFIG.DEFAULTS.MAX_ZOOM,
  style = { height: '400px', width: '100%' },
  className = '',
  onMapLoad = null,
  onMapClick = null,
  children = null,
  showControls = true,
  showAttribution = true,
  provider = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProvider, setCurrentProvider] = useState(provider || MAPS_CONFIG.PROVIDER);

  // Initialize map based on provider
  const initializeMap = useCallback(async () => {
    if (!MAPS_CONFIG.ENABLED) {
      setError('Maps are disabled');
      setIsLoading(false);
      return;
    }

    try {
      if (currentProvider === 'google') {
        await initializeGoogleMap();
      } else {
        await initializeLeafletMap();
      }
    } catch (err) {
      console.error('Map initialization failed:', err);
      setError('Failed to load map');
      setIsLoading(false);
      
      // Try fallback provider
      if (currentProvider !== 'osm') {
        console.log('🔄 Trying fallback to OpenStreetMap...');
        setCurrentProvider('osm');
      }
    }
  }, [currentProvider, center, zoom]);

  // Initialize Google Maps
  const initializeGoogleMap = async () => {
    try {
      const google = await loadGoogleMaps();
      
      if (!mapRef.current) return;
      
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: showControls,
        streetViewControl: showControls,
        fullscreenControl: showControls,
        zoomControl: showControls,
        scaleControl: showControls,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      mapInstanceRef.current = map;
      
      // Add click listener
      if (onMapClick) {
        map.addListener('click', (event) => {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            latLng: event.latLng
          });
        });
      }
      
      // Call onMapLoad callback
      if (onMapLoad) {
        onMapLoad(map);
      }
      
      setIsLoading(false);
      trackUsage('MAP_LOADS');
      
    } catch (err) {
      console.error('Google Maps initialization failed:', err);
      throw err;
    }
  };

  // Initialize Leaflet Map (Fallback)
  const initializeLeafletMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = await import('leaflet');
      const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
      
      // Import Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      
      // Fix Leaflet marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      
      if (!mapRef.current) return;
      
      const map = L.map(mapRef.current).setView(center, zoom);
      mapInstanceRef.current = map;
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: maxZoom,
        minZoom: minZoom
      }).addTo(map);
      
      // Add click listener
      if (onMapClick) {
        map.on('click', (event) => {
          onMapClick({
            lat: event.latlng.lat,
            lng: event.latlng.lng,
            latLng: event.latlng
          });
        });
      }
      
      // Call onMapLoad callback
      if (onMapLoad) {
        onMapLoad(map);
      }
      
      setIsLoading(false);
      trackUsage('MAP_LOADS');
      
    } catch (err) {
      console.error('Leaflet initialization failed:', err);
      throw err;
    }
  };

  // Initialize map when component mounts or provider changes
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        if (currentProvider === 'google') {
          // Google Maps cleanup
          if (mapInstanceRef.current.setMap) {
            mapInstanceRef.current.setMap(null);
          }
        } else {
          // Leaflet cleanup
          if (mapInstanceRef.current.remove) {
            mapInstanceRef.current.remove();
          }
        }
      }
    };
  }, [currentProvider]);

  // Handle provider changes
  useEffect(() => {
    if (provider && provider !== currentProvider) {
      setCurrentProvider(provider);
    }
  }, [provider, currentProvider]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        ref={mapRef}
        style={style}
        className={`bg-gray-100 flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading {getCurrentProvider()?.name || 'map'}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        style={style}
        className={`bg-red-50 border border-red-200 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              initializeMap();
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map container
  return (
    <div className="relative">
      <div 
        ref={mapRef}
        style={style}
        className={className}
      />
      
      {/* Provider indicator */}
      {showAttribution && (
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
          {getCurrentProvider()?.name || 'Map'}
        </div>
      )}
      
      {/* Children (markers, overlays, etc.) */}
      {children && React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            map: mapInstanceRef.current,
            provider: currentProvider 
          });
        }
        return child;
      })}
    </div>
  );
};

export default MapBase;
