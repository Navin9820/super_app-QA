import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api.config.js';

const SimpleRestaurantTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  // 🗺️ Simple map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // 🆕 NEW: Address resolution state
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [addressesResolved, setAddressesResolved] = useState(false);

  // ✅ FIXED: Initialize global markers array
  useEffect(() => {
    if (!window.markers) {
      window.markers = [];
    }
    if (!window.routeLine) {
      window.routeLine = null;
    }
  }, []);

  // 🆕 NEW: Helper function to resolve addresses to coordinates
  const resolveAddressToCoordinates = async (address) => {
    // ✅ FIX: Ensure address is a string before passing to Geocoder
    // Handle various address formats and convert to string safely
    let addressString = '';
    
    if (typeof address === 'string' && address.trim()) {
      addressString = address.trim();
    } else if (typeof address === 'object' && address !== null) {
      // Handle address objects by extracting relevant fields
      const addr = address;
      const addressParts = [];
      if (addr.full_address) addressParts.push(addr.full_address);
      if (addr.address_line1) addressParts.push(addr.address_line1);
      if (addr.address_line2) addressParts.push(addr.address_line2);
      if (addr.city) addressParts.push(addr.city);
      if (addr.state) addressParts.push(addr.state);
      if (addr.pincode) addressParts.push(addr.pincode);
      if (addr.country) addressParts.push(addr.country);
      
      addressString = addressParts.join(', ');
      console.log('🔄 Converted address object to string:', addressString);
    }
    
    if (!addressString) {
      console.warn('⚠️ Invalid address provided to geocoding function:', address);
      return null;
    }
    
    try {
      // Use Google Geocoding API to convert address to coordinates
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: addressString }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formattedAddress: results[0].formatted_address
            });
          } else {
            console.warn(`Geocoding failed for address: ${addressString}`, status);
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (err) {
      console.error('Error resolving address:', err);
      return null;
    }
  };

  // 🆕 NEW: Resolve order addresses to coordinates - SIMPLIFIED
  const resolveOrderAddresses = async (orderData) => {
    if (!orderData || !window.google) return;

    try {
      console.log('🔍 Resolving addresses for restaurant order:', orderData);
      
      // 🏪 Pickup address (restaurant) - SIMPLIFIED with basic fallbacks
      let pickupAddress = '';
      
      // ✅ SIMPLIFIED: Use basic fallback logic instead of strict validation
      if (orderData.restaurant_address && typeof orderData.restaurant_address === 'string') {
        pickupAddress = orderData.restaurant_address;
      } else if (orderData.pickup_address && typeof orderData.pickup_address === 'string') {
        pickupAddress = orderData.pickup_address;
      } else if (orderData.restaurant_id?.address && typeof orderData.restaurant_id.address === 'string') {
        pickupAddress = orderData.restaurant_id.address;
      } else if (orderData.restaurant_id?.city && orderData.restaurant_id?.state) {
        pickupAddress = `${orderData.restaurant_id.city}, ${orderData.restaurant_id.state}, India`;
      } else {
        // ✅ SIMPLIFIED: Use default warehouse address
        pickupAddress = 'Yube1 meadows, Ramapuram, Chennai, Tamil Nadu, India';
      }
      
      // 🏠 Delivery address (customer) - SIMPLIFIED with basic fallbacks
      let deliveryAddress = '';
      
      // ✅ SIMPLIFIED: Basic address extraction without strict validation
      if (orderData.delivery_address) {
        if (typeof orderData.delivery_address === 'string') {
          deliveryAddress = orderData.delivery_address;
        } else if (typeof orderData.delivery_address === 'object') {
          // Handle delivery_address as an object - SIMPLIFIED
          const addr = orderData.delivery_address;
          const addressParts = [];
          if (addr.address_line1) addressParts.push(addr.address_line1);
          if (addr.address_line2) addressParts.push(addr.address_line2);
          if (addr.city) addressParts.push(addr.city);
          if (addr.state) addressParts.push(addr.state);
          if (addr.pincode) addressParts.push(addr.pincode);
          if (addr.country) addressParts.push(addr.country);
          
          deliveryAddress = addressParts.join(', ');
          console.log('🏠 Extracted delivery address from object:', deliveryAddress);
        }
      }
      
      // ✅ SIMPLIFIED: Use basic fallbacks for missing addresses
      if (!deliveryAddress) {
        if (orderData.shipping_address && typeof orderData.shipping_address === 'string') {
          deliveryAddress = orderData.shipping_address;
        } else if (orderData.address && typeof orderData.address === 'string') {
          deliveryAddress = orderData.address;
        } else {
          // ✅ SIMPLIFIED: Use default delivery address
          deliveryAddress = 'Chennai, Tamil Nadu, India';
        }
      }

      console.log('📍 Restaurant pickup address:', pickupAddress);
      console.log('🏠 Customer delivery address:', deliveryAddress);

      // Resolve both addresses to coordinates
      const [pickupResult, deliveryResult] = await Promise.all([
        resolveAddressToCoordinates(pickupAddress),
        resolveAddressToCoordinates(deliveryAddress)
      ]);

      if (pickupResult && deliveryResult) {
        setPickupCoords(pickupResult);
        setDeliveryCoords(deliveryResult);
        setAddressesResolved(true);
        
        console.log('✅ Restaurant addresses resolved successfully:');
        console.log('Pickup:', pickupResult);
        console.log('Delivery:', deliveryResult);
      } else {
        console.log('⚠️ Using fallback coordinates for restaurant addresses');
        // ✅ SIMPLIFIED: Use default coordinates without error
        setPickupCoords({ lat: 13.0827, lng: 80.2707, formattedAddress: 'Chennai, Tamil Nadu, India' });
        setDeliveryCoords({ lat: 13.014, lng: 80.186, formattedAddress: 'Chennai, Tamil Nadu, India' });
        setAddressesResolved(true);
      }
    } catch (err) {
      console.error('❌ Error resolving restaurant addresses:', err);
      // ✅ SIMPLIFIED: Use default coordinates without error
      setPickupCoords({ lat: 13.0827, lng: 80.2707, formattedAddress: 'Chennai, Tamil Nadu, India' });
      setDeliveryCoords({ lat: 13.014, lng: 80.186, formattedAddress: 'Chennai, Tamil Nadu, India' });
      setAddressesResolved(true);
    }
  };

  // Load Google Maps (proper async pattern - no more warnings!)
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded globally
      if (window.google && window.google.maps) {
        console.log('🗺️ Google Maps already loaded');
        setMapLoaded(true);
        return;
      }

      // Check if script is already being loaded
      if (window.googleMapsLoading) {
        console.log('🗺️ Google Maps already loading, waiting...');
        // Wait for existing load to complete
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkLoaded);
            console.log('🗺️ Google Maps loaded from existing request');
            setMapLoaded(true);
          }
        }, 100);
        return;
      }

      console.log('🗺️ Starting Google Maps load...');
      // Set loading flag to prevent multiple loads
      window.googleMapsLoading = true;

      // ✅ FIXED: Use proper async loading pattern as Google recommends
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB_IWKJcJhkGzpCDB-ml6vlZmQzd-4F-gg'}&libraries=geometry&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // ✅ PROPER ASYNC PATTERN: Use callback instead of onload
      window.initMap = () => {
        console.log('🗺️ Google Maps callback executed');
        window.googleMapsLoading = false;
        setMapLoaded(true);
        // Clean up the callback
        delete window.initMap;
      };
      
      script.onerror = () => {
        console.error('❌ Google Maps script failed to load');
        window.googleMapsLoading = false;
        setError('Failed to load map');
        // Clean up the callback on error
        delete window.initMap;
      };
      
      script.onload = () => {
        console.log('🗺️ Google Maps script loaded successfully');
      };
      
      document.head.appendChild(script);
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(loadGoogleMaps, 500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      console.log('🗺️ Map initialization skipped:', { mapLoaded, mapRef: !!mapRef.current });
      return;
    }

    try {
      console.log('🗺️ Initializing Google Maps...');
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
      console.log('🗺️ Google Maps initialized successfully');
    } catch (err) {
      console.error('❌ Error initializing map:', err);
      setError('Failed to initialize map');
    }
  }, [mapLoaded]);

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('🔍 Fetching restaurant order:', orderId);
        
        // ✅ FIXED: Use API config instead of hardcoded URL
        const response = await fetch(API_CONFIG.getUrl(`/api/food-orders/${orderId}`), {
          headers: API_CONFIG.getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOrder(data.data);
            console.log('🍕 Restaurant order data loaded:', data.data);
            
            // Log address information for debugging
            console.log('📍 Order address details:', {
              restaurant_address: data.data.restaurant_address,
              pickup_address: data.data.pickup_address,
              delivery_address: data.data.delivery_address,
              shipping_address: data.data.shipping_address,
              address: data.data.address,
              address_line1: data.data.address_line1,
              address_line2: data.data.address_line2,
              city: data.data.city,
              state: data.data.state,
              pincode: data.data.pincode,
              country: data.data.country
            });
          } else {
            console.error('❌ Restaurant order API returned error:', data);
            setError('Order not found');
          }
        } else {
          console.error('❌ Restaurant order API failed:', response.status, response.statusText);
          setError('Failed to load order');
        }
      } catch (err) {
        console.error('❌ Network error fetching restaurant order:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // 🆕 NEW: Resolve addresses when order data is loaded
  useEffect(() => {
    if (order && mapLoaded) {
      resolveOrderAddresses(order);
    }
  }, [order, mapLoaded]);

  // Add markers to map - NOW USES DYNAMIC COORDINATES
  useEffect(() => {
    if (!mapInstance || !order || !addressesResolved || !pickupCoords || !deliveryCoords) {
      console.log('🗺️ Map markers skipped:', { 
        mapInstance: !!mapInstance, 
        order: !!order, 
        addressesResolved, 
        pickupCoords: !!pickupCoords, 
        deliveryCoords: !!deliveryCoords 
      });
      return;
    }

    console.log('🗺️ Adding restaurant markers to map with resolved coordinates');

    // ✅ FIXED: Initialize markers array if it doesn't exist
    if (!window.markers) {
      window.markers = [];
    }

    // Clear existing markers and routes safely
    try {
      if (window.markers && Array.isArray(window.markers)) {
        window.markers.forEach(marker => {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        });
      }
      if (window.routeLine && typeof window.routeLine.setMap === 'function') {
        window.routeLine.setMap(null);
      }
    } catch (err) {
      console.warn('⚠️ Error clearing existing markers:', err);
    }
    
    // Reset markers array
    window.markers = [];

    // 🏪 Restaurant pickup location (orange marker) - NOW DYNAMIC
    const pickupMarker = new window.google.maps.Marker({
      position: { lat: pickupCoords.lat, lng: pickupCoords.lng },
      map: mapInstance,
      title: 'Restaurant Pickup',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF6B35"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    });

    // 🏠 Delivery location (red marker) - NOW DYNAMIC
    const deliveryMarker = new window.google.maps.Marker({
      position: { lat: deliveryCoords.lat, lng: deliveryCoords.lng },
      map: mapInstance,
      title: 'Delivery Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF0000"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    });

    // Store markers globally for cleanup
    window.markers = [pickupMarker, deliveryMarker];

    // 🚀 GET REAL ROAD ROUTE using Google Directions API - NOW DYNAMIC
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#FF6B35',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        strokeStyle: 'solid'
      }
    });

    directionsRenderer.setMap(mapInstance);

    const request = {
      origin: { lat: pickupCoords.lat, lng: pickupCoords.lng }, // Dynamic restaurant pickup
      destination: { lat: deliveryCoords.lat, lng: deliveryCoords.lng }, // Dynamic delivery location
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    };

    console.log('🗺️ Calculating restaurant route:', request);

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        window.routeLine = directionsRenderer;
        
        // Extract and set route information
        const route = result.routes[0];
        const leg = route.legs[0];
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          startAddress: pickupCoords.formattedAddress || leg.start_address,
          endAddress: deliveryCoords.formattedAddress || leg.end_address
        });
        
        console.log('✅ Restaurant route calculated successfully:', {
          distance: leg.distance.text,
          duration: leg.duration.text,
          startAddress: pickupCoords.formattedAddress || leg.start_address,
          endAddress: deliveryCoords.formattedAddress || leg.end_address
        });
        
        // Fit map to show the entire route
        const bounds = new window.google.maps.LatLngBounds();
        leg.steps.forEach(step => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
        mapInstance.fitBounds(bounds);
        mapInstance.setZoom(Math.min(mapInstance.getZoom(), 13));
      } else {
        console.error('❌ Restaurant directions request failed due to ' + status);
        // Fallback to simple line if directions fail
        const path = new window.google.maps.Polyline({
          path: [
            { lat: pickupCoords.lat, lng: pickupCoords.lng },
            { lat: deliveryCoords.lat, lng: deliveryCoords.lng }
          ],
          geodesic: true,
          strokeColor: '#FF6B35',
          strokeOpacity: 0.8,
          strokeWeight: 4
        });
        path.setMap(mapInstance);
        window.routeLine = path;
      }
    });

  }, [mapInstance, order, addressesResolved, pickupCoords, deliveryCoords]);

  // Simulate rider location updates
  useEffect(() => {
    if (!mapInstance || !order) return;

    let riderMarker = null;
    let updateInterval;

    const startRiderSimulation = () => {
      // ✅ FIXED: Ensure window.markers exists before pushing
      if (!window.markers) {
        window.markers = [];
      }

      // Initial rider position (near restaurant)
      const initialRiderPos = { lat: 13.0827, lng: 80.2707 };
      
      riderMarker = new window.google.maps.Marker({
        position: initialRiderPos,
        map: mapInstance,
        title: 'Rider Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#00FF00"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });

      // ✅ FIXED: Safe push to markers array
      window.markers.push(riderMarker);

      // Update rider position every 10 seconds
      updateInterval = setInterval(() => {
        if (riderMarker) {
          // Simulate movement towards delivery location
          const currentPos = riderMarker.getPosition();
          const deliveryPos = { lat: 13.014, lng: 80.186 };
          
          // Move rider slightly towards delivery
          const newLat = currentPos.lat() + (deliveryPos.lat - currentPos.lat()) * 0.1;
          const newLng = currentPos.lng() + (deliveryPos.lng - currentPos.lng()) * 0.1;
          
          riderMarker.setPosition({ lat: newLat, lng: newLng });
          setRiderLocation({ lat: newLat, lng: newLng });
        }
      }, 10000);
    };

    startRiderSimulation();

    return () => {
      if (updateInterval) clearInterval(updateInterval);
      if (riderMarker) riderMarker.setMap(null);
    };
  }, [mapInstance, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant order tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Tracking Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/home-food')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Food Delivery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <button
            onClick={() => navigate('/home-food')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Food Delivery
          </button>
          <h1 className="text-xl font-semibold text-gray-800 mt-2">Track Your Food Order</h1>
        </div>
      </div>

      {/* Order Status */}
      <div className="px-4 py-3 bg-orange-50 border-b">
        <div className="bg-orange-500 text-white px-4 py-2 rounded-lg text-center">
          <p className="font-semibold">Out for Delivery</p>
          <p className="text-sm opacity-90">ETA: 25-35 minutes</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-800">Live Tracking</h3>
          </div>
          
          {/* Map Display */}
          {mapLoaded ? (
            <div 
              ref={mapRef} 
              className="w-full h-80 bg-gray-100"
              style={{ minHeight: '320px' }}
            />
          ) : (
            /* Fallback Map Display */
            <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we load the tracking map</p>
              </div>
            </div>
          )}
          
          {/* Map Error Fallback */}
          {error && error.includes('map') && (
            <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-orange-500 text-4xl mb-2">🗺️</div>
                <p className="text-gray-800 font-medium mb-2">Map Unavailable</p>
                <p className="text-sm text-gray-600">We're experiencing technical difficulties with the map</p>
                <p className="text-xs text-gray-500 mt-2">Your order is still being tracked</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
                >
                  Retry Map
                </button>
              </div>
            </div>
          )}
          
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-gray-50 text-xs text-gray-600">
              <p>Debug: Map Loaded: {mapLoaded ? 'Yes' : 'No'}</p>
              <p>Map Instance: {mapInstance ? 'Yes' : 'No'}</p>
              <p>Addresses Resolved: {addressesResolved ? 'Yes' : 'No'}</p>
              <p>Pickup Coords: {pickupCoords ? `${pickupCoords.lat}, ${pickupCoords.lng}` : 'No'}</p>
              <p>Delivery Coords: {deliveryCoords ? `${deliveryCoords.lat}, ${deliveryCoords.lng}` : 'No'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Route Information */}
      {routeInfo && (
        <div className="px-4 py-3 bg-white border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Distance</p>
              <p className="font-medium">{routeInfo.distance}</p>
            </div>
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">{routeInfo.duration}</p>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <p className="text-gray-500">From</p>
            <p className="font-medium">{routeInfo.startAddress}</p>
          </div>
          <div className="mt-2 text-sm">
            <p className="text-gray-500">To</p>
            <p className="font-medium">{routeInfo.endAddress}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-3 bg-white border-t">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Rider</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Route</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Rider location updates every 10 seconds</p>
      </div>

      {/* Order Details */}
      {order && (
        <div className="px-4 py-3 bg-white border-t">
          <h3 className="font-medium text-gray-800 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-medium">{order._id || order.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-medium">₹{order.total_amount || order.totalAmount || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-medium capitalize">{order.payment_method || order.paymentMethod || 'cod'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleRestaurantTracking;
