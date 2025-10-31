import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MAPS_CONFIG, trackUsage } from '../../config/maps.config';
import MapBase from './MapBase';

// Lazy load Google Maps API
let googleMapsLoaded = false;

const loadGoogleMaps = async () => {
  console.log('🔄 Loading Google Maps API...');
  
  if (googleMapsLoaded && window.google && window.google.maps && window.google.maps.places) {
    console.log('✅ Google Maps already loaded');
    return window.google;
  }
  
  return new Promise((resolve, reject) => {
    // Check if already loaded with places library
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps found in window object');
      googleMapsLoaded = true;
      resolve(window.google);
      return;
    }
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('⏳ Waiting for existing Google Maps script to load...');
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Existing Google Maps script loaded successfully');
          googleMapsLoaded = true;
          resolve(window.google);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }
    
    console.log('📡 Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.API_KEYS.GOOGLE}&libraries=places,geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    // Set up global callback
    window.initGoogleMaps = () => {
      console.log('🎯 Google Maps callback triggered');
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps loaded successfully with Places library');
        googleMapsLoaded = true;
        resolve(window.google);
      } else {
        console.error('❌ Google Maps loaded but Places library missing');
        reject(new Error('Google Maps Places library not available'));
      }
    };
    
    script.onload = () => {
      console.log('📜 Google Maps script loaded');
      // Give it a moment for the callback to fire
      setTimeout(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Google Maps loaded via onload event');
      googleMapsLoaded = true;
      resolve(window.google);
        } else {
          console.error('❌ Google Maps script loaded but API not available');
          reject(new Error('Google Maps API not available after script load'));
        }
      }, 1000);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps script');
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(script);
  });
};

const AddressPicker = ({
  value = '',
  onChange = null,
  placeholder = 'Search for an address...',
  showMap = true,
  mapHeight = '300px',
  className = '',
  required = false,
  disabled = false,
  onLocationSelect = null,
  defaultCenter = MAPS_CONFIG.DEFAULTS.CENTER
}) => {
  const [searchValue, setSearchValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(15);
  const [autocompleteReady, setAutocompleteReady] = useState(false);
  
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Update map marker when location changes
  const updateMapMarker = useCallback((location) => {
    if (!mapRef.current || !location) return;
    
    try {
      const google = window.google;
      if (!google || !google.maps) return;
      
      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      
      // Create new marker
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapRef.current,
        title: location.address,
        draggable: true
      });
      
      markerRef.current = marker;
      
      // Add drag listener
      marker.addListener('dragend', () => {
        const newPosition = marker.getPosition();
        const newLocation = {
          ...location,
          lat: newPosition.lat(),
          lng: newPosition.lng()
        };
        
        setSelectedLocation(newLocation);
        setMapCenter([newLocation.lat, newLocation.lng]);
        
        if (onChange) {
          onChange(newLocation);
        }
        
        if (onLocationSelect) {
          onLocationSelect(newLocation);
        }
      });
      
    } catch (err) {
      console.error('Error updating map marker:', err);
    }
  }, [onChange, onLocationSelect]);

  // Handle fallback search using OpenStreetMap Nominatim
  const handleFallbackSearch = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setError('Please enter at least 3 characters to search');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try multiple search strategies for better results
      const searchQueries = [
        `${query} India`, // Add country for better results
        query, // Original query
        `${query} landmark`, // Try as landmark
        `${query} business`, // Try as business
        `${query} Chennai`, // Add city for better results
        `${query} Tamil Nadu` // Add state for better results
      ];
      
      let results = [];
      for (const searchQuery of searchQueries) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5&addressdetails=1`
          );
          
          if (response.ok) {
            const searchResults = await response.json();
            results = [...results, ...searchResults];
          }
        } catch (fetchErr) {
          console.warn('Search query failed:', searchQuery, fetchErr);
          // Continue with next query
        }
      }
      
      // Remove duplicates based on place_id
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex(r => r.place_id === result.place_id)
      );
      
      if (uniqueResults.length === 0) {
        // If no results found, create a manual location from the search query
        console.log('No results found, creating manual location for:', query);
        const location = {
          placeId: `manual_${Date.now()}`,
          address: query,
          lat: 13.0827, // Default to Chennai coordinates
          lng: 80.2707,
          components: []
        };
        
        setSelectedLocation(location);
        setSearchValue(location.address);
        setMapCenter([location.lat, location.lng]);
        setMapZoom(15);
        setShowSuggestions(false);
        setError(null);
        
        // Update marker on map
        updateMapMarker(location);
        
        // Call onChange callback
        if (onChange) {
          onChange(location);
        }
        
        // Call onLocationSelect callback
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        
        trackUsage('GEOCODING');
        return;
      }
        
      // Use the first result
      const result = uniqueResults[0];
      const location = {
        placeId: result.place_id,
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        components: result.address || []
      };
        
      setSelectedLocation(location);
      setSearchValue(location.address);
      setMapCenter([location.lat, location.lng]);
      setMapZoom(17);
      setShowSuggestions(false);
      setError(null);
        
      // Update marker on map
      updateMapMarker(location);
        
      // Call onChange callback
      if (onChange) {
        onChange(location);
      }
        
      // Call onLocationSelect callback
      if (onLocationSelect) {
        onLocationSelect(location);
      }
        
      trackUsage('GEOCODING');
      
    } catch (err) {
      console.error('Fallback search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onLocationSelect, updateMapMarker]);

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = useCallback(async () => {
    console.log('🚀 Initializing Google Places Autocomplete...');
    
    try {
      const google = await loadGoogleMaps();
      console.log('✅ Google Maps loaded, initializing autocomplete...');
      
      if (!searchInputRef.current) {
        console.warn('❌ Search input ref not available');
        setError('Search input not available');
        return;
      }
      
      // Verify that places library is available
      if (!google.maps || !google.maps.places || !google.maps.places.Autocomplete) {
        console.error('❌ Google Maps Places library not available:', {
          maps: !!google.maps,
          places: !!(google.maps && google.maps.places),
          autocomplete: !!(google.maps && google.maps.places && google.maps.places.Autocomplete)
        });
        throw new Error('Google Maps Places library not available');
      }
      
      console.log('✅ Google Places API available, creating autocomplete...');
      
      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      
      // Create new autocomplete instance using the older API for now
      // TODO: Migrate to PlaceAutocompleteElement when Google provides better documentation
      // Note: The newer PlaceAutocompleteElement has different configuration options and doesn't support 'fields'
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['establishment', 'geocode'], // Include businesses, landmarks, and addresses
        componentRestrictions: { country: 'IN' }, // Restrict to India
        fields: ['place_id', 'formatted_address', 'geometry', 'address_components', 'name', 'types']
      });
      
      console.log('✅ Autocomplete created successfully');
      
      // Handle place selection
      autocompleteRef.current.addListener('place_changed', () => {
        console.log('📍 Place selection triggered');
        const place = autocompleteRef.current.getPlace();
        console.log('📍 Selected place:', place);
        console.log('📍 Place details:', {
          name: place.name,
          formatted_address: place.formatted_address,
          types: place.types,
          geometry: place.geometry ? 'Present' : 'Missing'
        });
        
        if (!place.geometry) {
          console.warn('❌ No geometry found for selected place');
          setError('No location found for this address');
          return;
        }
        
        const location = {
          placeId: place.place_id,
          address: place.formatted_address,
          name: place.name || place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          components: place.address_components,
          types: place.types || []
        };
        
        console.log('✅ Location processed:', location);
        
        setSelectedLocation(location);
        setSearchValue(place.formatted_address);
        setMapCenter([location.lat, location.lng]);
        setMapZoom(17);
        setShowSuggestions(false);
        setError(null);
        
        // Update marker on map
        updateMapMarker(location);
        
        // Call onChange callback
        if (onChange) {
          console.log('📞 Calling onChange callback');
          onChange(location);
        }
        
        // Call onLocationSelect callback
        if (onLocationSelect) {
          console.log('📞 Calling onLocationSelect callback');
          onLocationSelect(location);
        }
        
        trackUsage('PLACES');
        console.log('✅ Place selection completed successfully');
      });
      
      // Add input event listener for debugging
      searchInputRef.current.addEventListener('input', (e) => {
        console.log('⌨️ Input event:', e.target.value);
      });
      
      console.log('✅ Google Places Autocomplete initialized successfully');
      setAutocompleteReady(true);
      
    } catch (err) {
      console.error('❌ Failed to initialize autocomplete:', err);
      setError('Google Places API unavailable - Using fallback search');
      
      // Enable fallback search functionality
      if (searchInputRef.current) {
        const handleKeyPress = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            console.log('🔍 Fallback search triggered');
            handleFallbackSearch(searchValue);
          }
        };
        searchInputRef.current.addEventListener('keypress', handleKeyPress);
      }
    }
  }, [onChange, onLocationSelect, updateMapMarker, handleFallbackSearch]);

  // Initialize autocomplete when component mounts
  useEffect(() => {
    console.log('🎯 AddressPicker mounted, checking config...');
    console.log('Config:', {
      ENABLED: MAPS_CONFIG.ENABLED,
      PROVIDER: MAPS_CONFIG.PROVIDER,
      API_KEY: MAPS_CONFIG.API_KEYS.GOOGLE ? 'Present' : 'Missing'
    });
    
    if (MAPS_CONFIG.ENABLED && MAPS_CONFIG.PROVIDER === 'google') {
      console.log('✅ Initializing autocomplete...');
      initializeAutocomplete();
    } else {
      console.warn('❌ Maps disabled or provider not Google:', {
        enabled: MAPS_CONFIG.ENABLED,
        provider: MAPS_CONFIG.PROVIDER
      });
    }
  }, [initializeAutocomplete]);

  // Add CSS for Google Places autocomplete styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pac-container {
        z-index: 9999 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        border: 1px solid #e5e7eb !important;
        margin-top: 4px !important;
      }
      .pac-item {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
        cursor: pointer !important;
        font-size: 14px !important;
      }
      .pac-item:hover {
        background-color: #f9fafb !important;
      }
      .pac-item-selected {
        background-color: #eff6ff !important;
      }
      .pac-item-query {
        font-weight: 600 !important;
        color: #1f2937 !important;
      }
      .pac-matched {
        font-weight: 600 !important;
        color: #2563eb !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);


  // Handle map click
  const handleMapClick = useCallback((event) => {
    if (!event || !event.lat) return;
    
    const location = {
      placeId: null,
      address: `Location at ${event.lat.toFixed(6)}, ${event.lng.toFixed(6)}`,
      lat: event.lat,
      lng: event.lng,
      components: []
    };
    
    setSelectedLocation(location);
    setMapCenter([event.lat, event.lng]);
    updateMapMarker(location);
    
    if (onChange) onChange(location);
    if (onLocationSelect) onLocationSelect(location);
  }, [onChange, onLocationSelect, updateMapMarker]);

  // Handle map load
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    // Add marker if location is already selected
    if (selectedLocation) {
      updateMapMarker(selectedLocation);
    }
  }, [selectedLocation, updateMapMarker]);

  // Handle manual address input
  const handleAddressChange = (e) => {
    const value = e.target.value;
    console.log('⌨️ Address input changed:', value);
    setSearchValue(value);
    setShowSuggestions(false);
    
    // Clear selection if input is empty
    if (!value) {
      setSelectedLocation(null);
      if (onChange) {
      onChange(null);
      }
    }
  };

  // Handle address input focus
  const handleAddressFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle address input blur
  const handleAddressBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };


  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion.description);
    setShowSuggestions(false);
    
    // Trigger search
    if (searchInputRef.current) {
      searchInputRef.current.value = suggestion.description;
      // Trigger Google Places search
      const event = new Event('input', { bubbles: true });
      searchInputRef.current.dispatchEvent(event);
    }
  };

  // Handle "Use My Location" button
  const handleUseMyLocation = () => {
    setIsLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setIsLoading(false);
      return;
    }
    
    console.log('📍 Getting current location...');
    console.log('📍 Browser geolocation support:', !!navigator.geolocation);
    console.log('📍 HTTPS protocol:', window.location.protocol === 'https:');
    console.log('📍 Current URL:', window.location.href);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Current position obtained:', position.coords);
        
        const location = {
          placeId: null,
          address: `Current Location (${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)})`,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          components: []
        };
        
        setSelectedLocation(location);
        setSearchValue('Getting address...');
        setMapCenter([location.lat, location.lng]);
        setMapZoom(17);
        setIsLoading(false);
        
        // Update marker on map
        updateMapMarker(location);
        
        if (onChange) onChange(location);
        if (onLocationSelect) onLocationSelect(location);
        
        // Reverse geocode to get address
        reverseGeocode(location.lat, location.lng);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setIsLoading(false);
        
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please check permissions and try again.';
            break;
        }
        
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    console.log('🔄 Reverse geocoding coordinates:', lat, lng);
    
    // Show loading state
    setSearchValue('Getting address...');
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      console.log('⏰ Reverse geocoding timeout, using coordinates');
      const location = {
        placeId: `current_${Date.now()}`,
        address: `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        lat,
        lng,
        components: []
      };
      
      setSelectedLocation(location);
      setSearchValue(location.address);
      updateMapMarker(location);
      
      if (onChange) onChange(location);
      if (onLocationSelect) onLocationSelect(location);
    }, 3000); // 3 second timeout
    
    try {
      // Try Google Maps first
      if (MAPS_CONFIG.ENABLED && MAPS_CONFIG.PROVIDER === 'google') {
        try {
          const google = await loadGoogleMaps();
          const geocoder = new google.maps.Geocoder();
          
          geocoder.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                console.log('✅ Google reverse geocoding successful');
                console.log('📍 Geocoding result:', results[0]);
                
                const location = {
                  placeId: results[0].place_id,
                  address: results[0].formatted_address,
                  name: results[0].name || results[0].formatted_address,
                  lat,
                  lng,
                  components: results[0].address_components
                };
                
                console.log('📍 Final location object:', location);
                
                // Clear timeout since we got the result
                clearTimeout(timeoutId);
                
                setSelectedLocation(location);
                setSearchValue(location.address);
                
                // Update marker on map
                updateMapMarker(location);
                
                if (onChange) onChange(location);
                if (onLocationSelect) onLocationSelect(location);
                
                trackUsage('GEOCODING');
              } else {
                console.warn('❌ Google reverse geocoding failed:', status);
                // Fallback to OpenStreetMap
                fallbackReverseGeocode(lat, lng);
              }
            }
          );
        } catch (googleErr) {
          console.warn('❌ Google Maps reverse geocoding error:', googleErr);
          // Fallback to OpenStreetMap
          fallbackReverseGeocode(lat, lng);
        }
      } else {
        // Use OpenStreetMap directly
        fallbackReverseGeocode(lat, lng);
      }
    } catch (err) {
      console.error('❌ Reverse geocoding failed:', err);
      // Keep the current location with basic info
      const location = {
        placeId: `current_${Date.now()}`,
        address: `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        lat,
        lng,
        components: []
      };
      
      setSelectedLocation(location);
      setSearchValue(location.address);
      updateMapMarker(location);
      
      if (onChange) onChange(location);
      if (onLocationSelect) onLocationSelect(location);
    }
  };

  // Fallback reverse geocoding using OpenStreetMap Nominatim
  const fallbackReverseGeocode = async (lat, lng) => {
    console.log('🔄 Using OpenStreetMap reverse geocoding...');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenStreetMap reverse geocoding successful:', data);
        
        const location = {
          placeId: data.place_id || `osm_${Date.now()}`,
          address: data.display_name || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          name: data.name || data.display_name || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
          components: data.address ? Object.entries(data.address).map(([key, value]) => ({
            long_name: value,
            short_name: value,
            types: [key]
          })) : []
        };
        
        console.log('📍 OpenStreetMap location object:', location);
        
        // Clear timeout since we got the result
        clearTimeout(timeoutId);
        
        setSelectedLocation(location);
        setSearchValue(location.address);
        
        // Update marker on map
        updateMapMarker(location);
        
        if (onChange) onChange(location);
        if (onLocationSelect) onLocationSelect(location);
        
        trackUsage('GEOCODING');
      } else {
        throw new Error('OpenStreetMap reverse geocoding failed');
      }
    } catch (err) {
      console.error('❌ OpenStreetMap reverse geocoding failed:', err);
      
      // Final fallback - use coordinates
      const location = {
        placeId: `fallback_${Date.now()}`,
        address: `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        lat,
        lng,
        components: []
      };
      
      setSelectedLocation(location);
      setSearchValue(location.address);
      updateMapMarker(location);
      
      if (onChange) onChange(location);
      if (onLocationSelect) onLocationSelect(location);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedLocation && onChange) {
      onChange(selectedLocation);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Search Input */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
        
        {/* Autocomplete Status Indicator */}
        {autocompleteReady && (
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 text-green-500 text-xs">
            ✓
          </div>
        )}
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={handleAddressChange}
          onFocus={handleAddressFocus}
          onBlur={handleAddressBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Use My Location Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={disabled || isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all duration-200"
          title="Use my current location"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <>
              <span>📍</span>
              <span className="hidden sm:inline">My Location</span>
            </>
          )}
        </button>
        
        
      </div>


      {/* Error Display */}
      {error && !selectedLocation && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span>{error}</span>
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <button
              onClick={() => {
                console.log('🔄 Retrying autocomplete initialization...');
                setError(null);
                initializeAutocomplete();
              }}
              className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
            >
              Retry Google Places
            </button>
            {error.includes('location') && (
              <button
                onClick={() => {
                  console.log('📍 Retrying current location...');
                  setError(null);
                  handleUseMyLocation();
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
              >
                Retry Location
              </button>
            )}
            {error.includes('fallback') && (
              <button
                onClick={() => {
                  console.log('🔍 Using fallback search...');
                  handleFallbackSearch(searchValue);
                }}
                className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition-colors"
              >
                Use Fallback Search
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Message for Manual Location */}
      {selectedLocation && selectedLocation.placeId && selectedLocation.placeId.startsWith('manual_') && (
        <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">✅</span>
            <span>Location created successfully! You can adjust the position by clicking on the map.</span>
          </div>
        </div>
      )}

      {/* Success Message for Current Location */}
      {selectedLocation && selectedLocation.placeId && (selectedLocation.placeId.startsWith('current_') || selectedLocation.placeId.startsWith('osm_') || selectedLocation.placeId.startsWith('fallback_')) && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-green-500">📍</span>
            <span>Current location detected! Address has been automatically filled.</span>
          </div>
        </div>
      )}

      {/* Map Display */}
      {showMap && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <MapBase
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: mapHeight, width: '100%' }}
            onMapLoad={handleMapLoad}
            onMapClick={handleMapClick}
            showControls={true}
            showAttribution={true}
          />
          
          {/* Map Instructions */}
          <div className="p-3 bg-gray-50 text-xs text-gray-600">
            💡 Click on the map to set location or search for an address above
          </div>
        </div>
      )}

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Selected Location</h4>
              <p className="text-blue-800 text-sm">{selectedLocation.address}</p>
              <p className="text-blue-600 text-xs mt-1">
                Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedLocation(null);
                setSearchValue('');
                // Don't call onChange with null to prevent errors
                // if (onChange) onChange(null);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddressPicker;
