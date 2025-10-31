import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import deliveryService from '../services/deliveries.jsx';
import { riderAPI } from '../config/superAppApi.js';
import DeliveryHeader from '../components/DeliveryHeader.jsx';
import { API_CONFIG } from '../config/api.js';
import { useNotification } from '../TransactionContext.jsx';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = API_CONFIG.GOOGLE_MAPS.API_KEY;

// Default position (Chennai, India)
const defaultPosition = { lat: 13.0827, lng: 80.2707 };

// Google Maps Geocoding function
async function geocodeAddress(address) {
  try {
    // Validate address input
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return defaultPosition;
    }

    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
      return defaultPosition;
    }

    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: address.trim() }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          // Return default position instead of rejecting
          resolve(defaultPosition);
        }
      });
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return defaultPosition;
  }
}

// Google Maps Directions function
async function getDirections(origin, destination) {
  try {
    const directionsService = new window.google.maps.DirectionsService();
    return new Promise((resolve, reject) => {
      directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        avoidHighways: false,
        avoidTolls: false
      }, (result, status) => {
        if (status === 'OK') {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Directions error:', error);
    throw error;
  }
}

// Voice guidance: speak navigation instructions
function speakInstruction(text) {
  if ('speechSynthesis' in window && text) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.lang = 'en-US';
    window.speechSynthesis.cancel(); // Stop any previous
    window.speechSynthesis.speak(utter);
  }
}

// Helper: Key for localStorage persistence (per route)
function getNavPersistKey(pickup, dropoff) {
  return `deliveryNavState_${pickup}_${dropoff}`;
}

const DeliveryNavigationMap = () => {
  const [routeSteps, setRouteSteps] = useState([]); // Array of step instructions
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  // Google Maps refs
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef({});
  
  // Accept pickup, dropoff, and optionally currentPosition from navigation state
  let pickup = location.state?.pickup;
  let dropoff = location.state?.dropoff;
  
  // ✅ FIXED: Smart orderType detection from multiple sources
  const orderType = location.state?.orderType || 
                    location.state?.trip?.order_type || 
                    location.state?.trip?.type ||
                    'taxi'; // Default fallback for taxi orders
  
  // ✅ FIXED: Provide fallback addresses if missing
  if (!pickup || !dropoff) {
    
    // Provide sensible fallbacks for Chennai area
    if (!pickup) {
      pickup = 'Anna Nagar, Chennai, Tamil Nadu, India';
    }
    if (!dropoff) {
      dropoff = 'T. Nagar, Chennai, Tamil Nadu, India';
    }
  }
  
  
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [routeError, setRouteError] = useState(null);
  const [showRouteError, setShowRouteError] = useState(true);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  
  // Cancel delivery states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Animation state for navigation
  const [navigationActive, setNavigationActive] = useState(false);
  const [navIndex, setNavIndex] = useState(0);
  const navIntervalRef = useRef(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      if (document.getElementById('google-maps-script')) {
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkLoaded);
            setMapLoaded(true);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
        } else {
          setRouteError('Google Maps API loaded but not functional');
        }
      };
      
      script.onerror = () => {
        setRouteError('Failed to load Google Maps API. Check your API key.');
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize Google Map
  const initializeMap = () => {
    if (!mapLoaded || !mapRef.current || !window.google || !window.google.maps) {
      return;
    }

    // Clear any existing map
    if (window.deliveryMap) {
      window.deliveryMap = null;
    }
    
    // Check if container has dimensions
    if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
      setTimeout(() => initializeMap(), 100);
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: userPosition || defaultPosition,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Store map reference
      window.deliveryMap = map;

      // Initialize directions renderer
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#f59e0b',
          strokeWeight: 6,
          strokeOpacity: 0.9
        },
        suppressInfoWindows: false
      });
      directionsRenderer.setMap(map);
      directionsRendererRef.current = directionsRenderer;

      // Only add rider marker (current position)
      if (userPosition) {
        window.riderMarker = new window.google.maps.Marker({
          position: userPosition,
          map: map,
          title: 'Your Location',
          icon: {
            url: 'https://maps.gstatic.com/mapfiles/ms/micons/blue-dot.png',
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });
      }

      // Ensure A/B markers are always visible by setting up a route immediately
      if (pickupCoords && dropoffCoords) {
        fetchRoute(pickupCoords, dropoffCoords);
      }

      // Always fit bounds to show pickup and dropoff locations properly
      if (pickupCoords && dropoffCoords) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(pickupCoords);
        bounds.extend(dropoffCoords);
        map.fitBounds(bounds, { padding: 50 }); // Add padding for better view
      } else if (pickupCoords) {
        // If only pickup is available, center on pickup
        map.setCenter(pickupCoords);
        map.setZoom(15);
      } else if (userPosition) {
        // If only user position is available, center on user
        map.setCenter(userPosition);
        map.setZoom(15);
      }
    } catch (error) {
      setRouteError('Failed to initialize map');
    }
  };

  // Force refresh A/B markers
  const refreshABMarkers = () => {
    if (pickupCoords && dropoffCoords && directionsRendererRef.current) {
      // Clear any existing directions
      directionsRendererRef.current.setDirections({ routes: [] });
      // Re-fetch route to show A/B markers
      setTimeout(() => {
        fetchRoute(pickupCoords, dropoffCoords);
      }, 100);
    }
  };

  // Fetch route using Google Maps Directions API
  const fetchRoute = async (from, to) => {
    if (!mapLoaded || !directionsRendererRef.current) {
      return;
    }

    setIsLoading(true);
    setRouteError(null);

    try {
      const result = await getDirections(from, to);
      
      if (result && result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        // Set route data
        setRouteData(result);
        setDistance(leg.distance.text);
        setDuration(leg.duration.text);
        setRouteSteps(leg.steps || []);
        setCurrentStepIndex(0);
        
        // Clear any existing custom markers first
        if (window.pickupMarker) {
          window.pickupMarker.setMap(null);
          window.pickupMarker = null;
        }
        if (window.dropoffMarker) {
          window.dropoffMarker.setMap(null);
          window.dropoffMarker = null;
        }
        
        // Display route on map with Google's default A/B markers
        directionsRendererRef.current.setDirections(result);
        
        // Also fit the map to show the entire route with proper padding
        if (window.deliveryMap) {
          const bounds = new window.google.maps.LatLngBounds();
          const route = result.routes[0];
          const leg = route.legs[0];
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
          window.deliveryMap.fitBounds(bounds, { padding: 80 }); // More padding for better view
        }
      } else {
        setRouteError('No route found');
      }
    } catch (error) {
      setRouteError('Failed to fetch route');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove navigation state from localStorage on cancel/complete
  const clearNavPersist = () => {
    const persistKey = getNavPersistKey(pickup, dropoff);
    localStorage.removeItem(persistKey);
  };

  // Fetch route when both coordinates are available
  useEffect(() => {
    if (pickupCoords && dropoffCoords && mapLoaded) {
      fetchRoute(pickupCoords, dropoffCoords);
    }
  }, [pickupCoords, dropoffCoords, mapLoaded]);

  // Start navigation handler
  const handleStartNavigation = () => {
    if (routeData && routeData.routes && routeData.routes.length > 0) {
      setNavigationActive(true);
      setNavIndex(0);
    }
  };

  // Update currentStepIndex based on navigation progress
  useEffect(() => {
    if (!navigationActive || !routeSteps.length) return;
    // For now, just use the first step - in a real app, this would track GPS position
    setCurrentStepIndex(0);
  }, [navigationActive, routeSteps]);

  // Voice guidance: speak instruction when current step changes during navigation
  useEffect(() => {
    if (navigationActive && routeSteps[currentStepIndex]) {
      const step = routeSteps[currentStepIndex];
      const instruction = step.instructions || step.maneuver?.instruction || step.instruction;
      speakInstruction(instruction);
    }
    // eslint-disable-next-line
  }, [currentStepIndex, navigationActive]);

  // Helper to calculate remaining distance and time
  function getRemainingStats() {
    // For Google Maps, we'll use the total distance and duration
    // In a real app, this would calculate based on current GPS position
    return { 
      remDistance: distance || '0 km', 
      remDuration: duration || '0 min' 
    };
  }

  const [showArrivedModal, setShowArrivedModal] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const [orderAccepted, setOrderAccepted] = useState(location.state?.orderAccepted || false);
  const [showCodModal, setShowCodModal] = useState(false);
  
  // Cancel delivery reasons
  const cancelReasons = [
    'Customer not available',
    'Wrong address provided',
    'Package not ready',
    'Customer cancelled',
    'Vehicle breakdown',
    'Traffic/Route issues',
    'Other'
  ];
  const [codOtp, setCodOtp] = useState('');
  const [codAmount, setCodAmount] = useState(location.state?.payment || '');
  const orderId = location.state?.orderId || location.state?.id;
  const isCOD = (location.state?.paymentMethod || location.state?.payment_mode || '').toString().toLowerCase() === 'cod';
  
  // OTP verification for delivery completion
  const [showDeliveryOtpModal, setShowDeliveryOtpModal] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [deliveryOtpError, setDeliveryOtpError] = useState('');
  const [deliveryOtpVerified, setDeliveryOtpVerified] = useState(false);
  const [showDeliveryOtpSuccess, setShowDeliveryOtpSuccess] = useState(false);
  const [codCollected, setCodCollected] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);
  
  // Debug logging
  // console.log('DeliveryNavigationMap - Order details:', {
  //   orderId,
  //   orderType,
  //   pickup,
  //   dropoff,
  //   locationState: location.state
  // });
  
  // OTP verification for customer pickup
  const handleVerifyDeliveryOtp = async () => {
    if (!deliveryOtp || deliveryOtp.length !== 6) {
      setDeliveryOtpError('Please enter a 6-digit OTP');
      return;
    }

    // Clear any previous errors immediately
    setDeliveryOtpError('');
    setIsVerifyingOtp(true);

    try {
      const response = await riderAPI.verifyDeliveryOtp(orderId, deliveryOtp, orderType);
      if (response.success) {
        setShowDeliveryOtpSuccess(true);
        setDeliveryOtpError('');
        setIsVerifyingOtp(false);
        
        // For taxi orders, mark as picked up and update status
        if (orderType === 'taxi' || orderType === 'taxi_request') {
          try {
            await riderAPI.updateOrderStatus(orderId, 'out_for_delivery', orderType);
            setPickedUp(true);
            addNotification({
              type: 'success',
              title: 'Customer Verified',
              message: 'Customer picked up successfully!'
            });
            // Close modal after success
            setTimeout(() => {
              setShowDeliveryOtpSuccess(false);
              setShowDeliveryOtpModal(false);
              setDeliveryOtpVerified(true);
            }, 1000);
          } catch (e) {
            console.error('Failed to update order status:', e);
            // Still mark as picked up locally
            setPickedUp(true);
            setShowDeliveryOtpSuccess(false);
            setShowDeliveryOtpModal(false);
            setDeliveryOtpVerified(true);
          }
        } else {
          // For other order types (ecommerce, grocery, food, porter), complete delivery immediately
          try {
            await riderAPI.updateOrderStatus(orderId, 'delivered', orderType);
            
            // Update local state to reflect completion
            setDeliveryOtpVerified(true);
            
            // Navigate immediately without delay
            navigate('/delivery-completed', { 
              state: { 
                orderId: orderId,
                pickup, 
                dropoff, 
                package: location.state?.package,
                payment: location.state?.payment,
                customer: location.state?.customer || 'Customer',
                pickupType: location.state?.pickupType,
                dropoffType: location.state?.dropoffType,
                orderType: orderType
              } 
            });
          } catch (e) {
            console.error('❌ Failed to complete delivery:', e);
            // Still close modal and show error
            setShowDeliveryOtpSuccess(false);
            setShowDeliveryOtpModal(false);
            setDeliveryOtpError('Failed to complete delivery. Please try again.');
          }
        }
      } else {
        setDeliveryOtpError(response.message || 'Invalid OTP. Please try again.');
        setIsVerifyingOtp(false);
      }
    } catch (error) {
      setDeliveryOtpError(error.message || 'Failed to verify OTP. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  // Handle delivery cancellation
  const handleCancelDelivery = async () => {
    if (!cancelReason) {
      addNotification({
        type: 'warning',
        title: 'Cancellation Required',
        message: 'Please select a reason for cancellation'
      });
      return;
    }
    
    setIsCancelling(true);
    
    try {
      if (orderId) {
        // Update order status to cancelled via API
        await riderAPI.updateOrderStatus(orderId, 'cancelled', orderType, {
          cancel_reason: cancelReason,
          cancelled_at: new Date().toISOString()
        });
      }
      
      // Also update local delivery service
      const allDeliveries = deliveryService.getDeliveries();
      let deliveryToCancel = null;
      
      if (orderId) {
        deliveryToCancel = allDeliveries.find(d => d.id === orderId);
      }
      
      if (!deliveryToCancel) {
        // Find by pickup/dropoff
        deliveryToCancel = allDeliveries.find(d => 
          d.pickup === pickup && d.dropoff === dropoff && (d.status === 'pending' || d.status === 'active')
        );
      }
      
      if (deliveryToCancel) {
        deliveryService.cancelDelivery(deliveryToCancel.id, cancelReason);
      }
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('deliveriesDataChanged'));
      
      // Navigate back to appropriate page
      const previousPage = location.state?.previousPage;
      if (previousPage === 'dashboard' || previousPage === 'available-orders') {
        navigate('/dashboard');
      } else if (previousPage === 'trips') {
        navigate('/trips');
      } else {
        navigate('/deliveries');
      }
      
    } catch (error) {
      console.error('Failed to cancel delivery:', error);
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: 'Failed to cancel delivery. Please try again.'
      });
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };
  
  // Address editing
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState('');
  const [addressType, setAddressType] = useState(''); // 'pickup' or 'dropoff'

  // Helper to retry route fetch
  const retryRouteFetch = () => {
    if (pickupCoords && dropoffCoords && mapLoaded) {
      fetchRoute(pickupCoords, dropoffCoords);
    }
    setShowRouteError(true);
  };

  // Get rider's real GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('GPS not supported by this device');
      // Set fallback position
      setUserPosition(defaultPosition);
      setShowLocationWarning(true);
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 30000, // 30 seconds
      timeout: 15000 // 15 seconds
    };

    const handleLocationSuccess = (position) => {
      const riderLocation = { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude 
      };
      setUserPosition(riderLocation);
      setGeoError(''); // Clear any location errors
      setShowLocationWarning(false); // Hide the warning when location is obtained
      
      // Update map center if map is loaded
      if (window.deliveryMap) {
        window.deliveryMap.setCenter(riderLocation);
      }
    };

    const handleLocationError = (error) => {
      let errorMessage = '';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable GPS permissions and refresh the page.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'GPS location unavailable. Check your GPS/network connection.';
          break;
        case error.TIMEOUT:
          errorMessage = 'GPS request timed out. Please ensure GPS is enabled.';
          break;
        default:
          errorMessage = 'Unknown GPS error. Please check your location settings.';
          break;
      }
      
      setGeoError(errorMessage);
      setShowLocationWarning(true);
      // Fallback to pickup location if GPS fails, otherwise use default
      if (pickupCoords) {
        setUserPosition(pickupCoords);
      } else {
        setUserPosition(defaultPosition);
      }
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      geoOptions
    );

    // Watch position for updates (optional - for real-time tracking)
    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      (error) => console.error('GPS watch error:', error),
      geoOptions
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [pickupCoords]);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (mapLoaded) {
      // Add a small delay to ensure the DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [mapLoaded]);

  // Ensure map is properly centered when coordinates change
  useEffect(() => {
    if (window.deliveryMap && pickupCoords && dropoffCoords) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickupCoords);
      bounds.extend(dropoffCoords);
      window.deliveryMap.fitBounds(bounds, { padding: 50 });
    }
  }, [pickupCoords, dropoffCoords]);

  // Also try to initialize when coordinates are available
  useEffect(() => {
    if (mapLoaded && pickupCoords && dropoffCoords && !window.deliveryMap) {
      setTimeout(() => {
        initializeMap();
      }, 200);
    }
  }, [mapLoaded, pickupCoords, dropoffCoords]);

  // Periodic check to ensure A/B markers stay visible
  useEffect(() => {
    if (mapLoaded && pickupCoords && dropoffCoords && directionsRendererRef.current) {
      const checkInterval = setInterval(() => {
        // Check if A/B markers are visible by checking if directions are set
        const currentDirections = directionsRendererRef.current.getDirections();
        if (!currentDirections || !currentDirections.routes || currentDirections.routes.length === 0) {
          refreshABMarkers();
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(checkInterval);
    }
  }, [mapLoaded, pickupCoords, dropoffCoords]);

  // Resolve coordinates using Google Maps Geocoding
  useEffect(() => {
    let isMounted = true;
    async function resolveCoords() {
      if (!mapLoaded) {
        return;
      }

      setPickupCoords(null);
      setDropoffCoords(null);
      setGeoError('');
      setIsLoading(true);
      setRouteError(null);
      
      try {
        // Validate addresses before geocoding
        if (!pickup || !dropoff) {
          setPickupCoords(defaultPosition);
          setDropoffCoords({ lat: defaultPosition.lat + 0.01, lng: defaultPosition.lng + 0.01 });
          setIsLoading(false);
          return;
        }

        // Add timeout to prevent hanging
        const geocodingTimeout = 10000; // 10 seconds
        
        const pickupPromise = geocodeAddress(pickup);
        const dropoffPromise = geocodeAddress(dropoff);
        
        const pickupResult = await Promise.race([
          pickupPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Pickup geocoding timeout')), geocodingTimeout))
        ]);
        
        const dropoffResult = await Promise.race([
          dropoffPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Dropoff geocoding timeout')), geocodingTimeout))
        ]);
        
        // Check if coordinates are valid and different from each other
        const isPickupValid = pickupResult && typeof pickupResult.lat === 'number' && typeof pickupResult.lng === 'number';
        const isDropoffValid = dropoffResult && typeof dropoffResult.lat === 'number' && typeof dropoffResult.lng === 'number';
        const areCoordinatesDifferent = JSON.stringify(pickupResult) !== JSON.stringify(dropoffResult);
        
        if (!isPickupValid) {
          setPickupCoords(defaultPosition);
        } else {
          setPickupCoords(pickupResult);
        }
        
        if (!isDropoffValid) {
          const fallbackDropoff = { lat: defaultPosition.lat + 0.01, lng: defaultPosition.lng + 0.01 };
          setDropoffCoords(fallbackDropoff);
        } else {
          setDropoffCoords(dropoffResult);
        }
        
        if (!areCoordinatesDifferent && isPickupValid && isDropoffValid) {
          const adjustedDropoff = { lat: pickupResult.lat + 0.01, lng: pickupResult.lng + 0.01 };
          setDropoffCoords(adjustedDropoff);
        }
        
        // Set userPosition to pickup if GPS hasn't been set yet
        if (!userPosition && isPickupValid) {
          setUserPosition(pickupResult);
        }

        // Ensure map is properly centered when coordinates are resolved
        if (isMounted && window.deliveryMap && pickupCoords && dropoffCoords) {
          setTimeout(() => {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(pickupCoords);
            bounds.extend(dropoffCoords);
            window.deliveryMap.fitBounds(bounds, { padding: 50 });
          }, 100);
        }
        
      } catch (e) {
        if (isMounted) {
          console.error('Error resolving coordinates:', e);
          setGeoError('Failed to resolve location coordinates');
          // Set fallback coordinates to ensure map shows
          setPickupCoords(defaultPosition);
          setDropoffCoords({ lat: defaultPosition.lat + 0.01, lng: defaultPosition.lng + 0.01 });
          if (!userPosition) {
            setUserPosition(defaultPosition);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    resolveCoords();
    return () => { isMounted = false; };
  }, [pickup, dropoff, mapLoaded]);


  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom, #f59e0b 0px, #f59e0b 60px, #f5f5f5 60px, #f5f5f5 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }}>
      {/* START button - always visible above info bar */}
      <button
        onClick={handleStartNavigation}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 90,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#f59e0b',
          border: 'none',
          boxShadow: '0 4px 16px rgba(245,158,11,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          cursor: 'pointer',
          padding: 0
        }}
        aria-label="Start delivery navigation"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 2L15 22L12 19L9 22L12 2Z" fill="#fff"/></svg>
      </button>
      {/* Accept Order (NEW) - First step in order flow - only show if not already accepted */}
      {orderId && !orderAccepted && !pickedUp && (
        <button
          onClick={async () => {
            try {
              await riderAPI.updateOrderStatus(orderId, 'accepted', orderType);
              setOrderAccepted(true);
            } catch (e) {
              console.error('Failed to accept order:', e);
              addNotification({
                type: 'error',
                title: 'Order Acceptance Failed',
                message: 'Failed to accept order. Please try again.'
              });
            }
          }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 280,
            width: 120,
            height: 40,
            borderRadius: 10,
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(245,158,11,0.18)',
            zIndex: 100,
            cursor: 'pointer',
          }}
          aria-label="Accept order"
        >
          Accept Order
        </button>
      )}
      {/* Picked Up (backend) */}
      {orderId && orderAccepted && !pickedUp && (
        <button
          onClick={async () => {
            console.log('🔍 Customer Picked clicked - Order Type:', orderType);
            // Check if order requires OTP verification for pickup (only taxi orders)
            if (orderType === 'taxi' || orderType === 'taxi_request') {
              console.log('🔍 Showing OTP modal for pickup verification');
              // Ensure COD modal is closed before opening delivery OTP modal
              if (showCodModal) {
                setShowCodModal(false);
              }
              if (!showDeliveryOtpModal) {
                setShowDeliveryOtpModal(true);
              }
              return;
            }
            
            // For porter orders, proceed directly without OTP verification
            if (orderType === 'porter' || orderType === 'porter_request') {
              console.log('🔍 Porter order - marking as out for delivery without OTP');
              try {
                const result = await riderAPI.updateOrderStatus(orderId, 'out_for_delivery', orderType);
                if (result.success) {
                  setPickedUp(true);
                  addNotification({
                    type: 'success',
                    title: 'Customer Picked Up',
                    message: 'Customer picked up successfully!'
                  });
                  return;
                }
              } catch (apiError) {
                console.error('Failed to update porter order status:', apiError);
              }
              
              // Fallback: Update locally if API fails
              setPickedUp(true);
              addNotification({
                type: 'info',
                title: 'Customer Picked Up',
                message: 'Customer picked up (offline mode)'
              });
              return;
            }
            
            // For other order types, proceed directly
            try {
              
              // Try to update via API first
              try {
                const result = await riderAPI.updateOrderStatus(orderId, 'out_for_delivery', orderType);
                if (result.success) {
                  setPickedUp(true);
                  return;
                } else {
                }
              } catch (apiError) {
              }
              
              // Fallback: Update locally if API fails
              setPickedUp(true);
              addNotification({
                type: 'info',
                title: 'Offline Mode',
                message: orderType === 'taxi' 
                  ? 'Customer marked as picked (offline mode)'
                  : 'Order marked as out for delivery (offline mode)'
              });
              
            } catch (e) {
              console.error('Failed to mark as out for delivery:', e);
              addNotification({
                type: 'error',
                title: 'Status Update Failed',
                message: orderType === 'taxi' 
                  ? 'Failed to mark customer as picked. Please try again.'
                  : 'Failed to mark as out for delivery. Please try again.'
              });
            }
          }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 230,
            width: 140,
            height: 40,
            borderRadius: 10,
            background: '#10b981',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(16,185,129,0.18)',
            zIndex: 100,
            cursor: 'pointer',
          }}
          aria-label={orderType === 'taxi' ? "Customer picked" : "Mark out for delivery"}
        >
          {orderType === 'taxi' ? 'Customer Picked' : 'Out for Delivery'}
        </button>
      )}
      {/* COD Collect (backend) */}
      {orderId && pickedUp && isCOD && (
        <button
          onClick={() => {
            console.log('🔍 Collect COD clicked - Order Type:', orderType);
            console.log('🔍 isCOD:', isCOD);
            console.log('🔍 Opening COD modal');
            // Ensure delivery OTP modal is closed before opening COD modal
            if (showDeliveryOtpModal) {
              setShowDeliveryOtpModal(false);
            }
            setShowCodModal(true);
          }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 180,
            width: 140,
            height: 40,
            borderRadius: 10,
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(239,68,68,0.18)',
            zIndex: 100,
            cursor: 'pointer',
          }}
          aria-label="Collect COD"
        >
          Collect COD
        </button>
      )}
      {/* Mark as Delivered (backend) */}
      {orderId && pickedUp && (
        <button
          onClick={async () => {
            if (isMarkingDelivered) return; // Prevent multiple clicks
            
            setIsMarkingDelivered(true);
            
            try {
              // Check if order requires OTP verification for delivery completion (ecommerce, grocery, food, or porter)
              if (orderType === 'ecommerce' || orderType === 'grocery' || orderType === 'food' || orderType === 'porter' || orderType === 'porter_request') {
                // Ensure COD modal is closed before opening delivery OTP modal
                if (showCodModal) {
                  setShowCodModal(false);
                }
                if (!showDeliveryOtpModal) {
                  setShowDeliveryOtpModal(true);
                }
              } else {
                // For other order types (taxi), complete directly
                try {
                  await riderAPI.updateOrderStatus(orderId, 'delivered', orderType);
                  
                  // Navigate to completion page
                  navigate('/delivery-completed', { 
                    state: { 
                      orderId: orderId,
                      pickup, 
                      dropoff, 
                      package: location.state?.package,
                      payment: location.state?.payment,
                      customer: location.state?.customer || 'Customer',
                      pickupType: location.state?.pickupType,
                      dropoffType: location.state?.dropoffType,
                      orderType: orderType
                    } 
                  });
                } catch (e) {
                  console.error('❌ Failed to mark order as delivered:', e);
                  addNotification({
                    type: 'error',
                    title: orderType === 'taxi' ? 'Trip Completion Failed' : 'Delivery Failed',
                    message: orderType === 'taxi' 
                      ? 'Failed to complete trip. Please try again.'
                      : 'Failed to mark order as delivered. Please try again.'
                  });
                }
              }
            } finally {
              setIsMarkingDelivered(false);
            }
          }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 130,
            width: 160,
            height: 40,
            borderRadius: 10,
            background: isMarkingDelivered ? '#ccc' : '#3b82f6',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(59,130,246,0.18)',
            zIndex: 100,
            cursor: isMarkingDelivered ? 'not-allowed' : 'pointer',
            opacity: isMarkingDelivered ? 0.7 : 1
          }}
          aria-label={orderType === 'taxi' ? "Complete trip" : "Mark as delivered"}
        >
          {isMarkingDelivered ? 'Processing...' : (orderType === 'taxi' ? 'Trip Completed' : 'Mark Delivered')}
        </button>
      )}
      {/* Cancel Navigation button - only visible when navigation is active */}
      {navigationActive && (
        <button
          onClick={() => {
            setNavigationActive(false);
            setNavIndex(0);
            if (pickupCoords) {
              setUserPosition(pickupCoords);
            }
            clearNavPersist();
          }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 160,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#e53935',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(229,57,53,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 101,
            padding: 0,
          }}
          aria-label="Cancel navigation"
          title="Cancel navigation"
        >
          {/* X icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#e53935"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
      )}
      
      {/* Cancel Delivery button - always visible when there's an order */}
      {orderId && (
        <button
          onClick={() => setShowCancelModal(true)}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 80,
            height: 32,
            borderRadius: 8,
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(239,68,68,0.18)',
            zIndex: 100,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
          aria-label="Cancel delivery"
        >
          Cancel
        </button>
      )}
      {/* Top search bar mimic */}
      <div className="flex flex-col gap-0 bg-yellow-600 z-10 relative min-h-[40px] rounded-b-[14px] shadow-md px-2 pt-[calc(env(safe-area-inset-top,0px)+4px)] pb-1.5">
        {/* Top row: back arrow, input fields, menu */}
        <div className="flex items-center gap-2 mb-0 w-full">
          {/* Back arrow */}
          <button
            onClick={() => {
              // Smart back navigation based on where user came from
              const previousPage = location.state?.previousPage;
              const orderId = location.state?.orderId;
              
              if (previousPage === 'dashboard' || previousPage === 'available-orders') {
                // If came from dashboard or available orders, go back to dashboard
                navigate('/dashboard');
              } else if (previousPage === 'trips') {
                // If came from trips page, go back to trips
                navigate('/trips');
              } else if (orderId) {
                // If we have an orderId but no specific previous page, go to delivery-in-progress
                navigate('/delivery-in-progress', { 
                  state: { 
                    pickup, 
                    dropoff, 
                    package: location.state?.package,
                    payment: location.state?.payment,
                    customer: location.state?.customer || 'Customer',
                    pickupType: location.state?.pickupType,
                    dropoffType: location.state?.dropoffType
                  } 
                });
              } else {
                // Default fallback - go back in browser history
                navigate(-1);
              }
            }}
            className="bg-none border-none p-0 m-0 cursor-pointer w-8 h-8 flex items-center justify-center flex-shrink-0"
            aria-label="Go back"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 19L8.5 12L15.5 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Input fields with icons */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0"><circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="2.5" fill="#fff"/></svg>
              <div className="bg-white/25 text-white rounded-[12px] px-2 py-1 font-medium text-[13px] flex-1 min-w-0 overflow-hidden text-ellipsis h-[26px] whitespace-nowrap">{pickup}</div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#fff"/></svg>
              <div className="bg-white/25 text-white rounded-[12px] px-2 py-1 font-medium text-[13px] flex-1 min-w-0 overflow-hidden text-ellipsis h-[26px] whitespace-nowrap">{dropoff}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Turn-by-turn direction banner */}
      {navigationActive && routeSteps.length > 0 && (
        <>
          <div style={{
            background: '#fff',
            color: '#222',
            fontWeight: 600,
            fontSize: 17,
            borderRadius: 10,
            margin: '8px auto 0 auto',
            padding: '10px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            maxWidth: 420,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            zIndex: 11,
            position: 'relative',
          }}>
            {/* Arrow icon based on maneuver type and modifier */}
            <span style={{ fontSize: 26, marginRight: 8 }}>
              {(() => {
                const step = routeSteps[currentStepIndex];
                const type = step?.maneuver?.type || step?.type || '';
                const modifier = step?.maneuver?.modifier || step?.modifier || '';
                if (type === 'turn') {
                  if (modifier === 'left') return '⬅️';
                  if (modifier === 'right') return '➡️';
                  if (modifier === 'straight') return '⬆️';
                  if (modifier === 'uturn') return '↩️';
                }
                if (type.includes('left')) return '⬅️';
                if (type.includes('right')) return '➡️';
                if (type.includes('straight')) return '⬆️';
                if (type.includes('uturn')) return '↩️';
                if (type === 'depart') return '🚦';
                if (type === 'arrive') return '🏁';
                return '⬆️';
              })()}
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(() => {
                const step = routeSteps[currentStepIndex];
                const instruction = step?.maneuver?.instruction || step?.instruction;
                const type = step?.maneuver?.type || step?.type || '';
                const modifier = step?.maneuver?.modifier || step?.modifier || '';
                if (instruction) return instruction;
                // Fallback: build instruction from type/modifier
                if (type === 'turn') {
                  if (modifier === 'left') return 'Turn left';
                  if (modifier === 'right') return 'Turn right';
                  if (modifier === 'straight') return 'Go straight';
                  if (modifier === 'uturn') return 'Make a U-turn';
                  return 'Turn';
                }
                if (type === 'depart') return 'Start';
                if (type === 'arrive') return 'Arrive at destination';
                if (type.includes('left')) return 'Turn left';
                if (type.includes('right')) return 'Turn right';
                if (type.includes('straight')) return 'Go straight';
                if (type.includes('uturn')) return 'Make a U-turn';
                return 'Continue';
              })()}
            </span>
            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15, marginLeft: 8 }}>
              {routeSteps[currentStepIndex]?.distance ? `${Math.round(routeSteps[currentStepIndex].distance)} m` : ''}
            </span>
          </div>
        </>
      )}
      {/* Add vertical gap between header and map */}
      <div style={{ height: 8 }} />
      {/* Map */}
      <div style={{
        flex: '1 1 0',
        minHeight: 0,
        minWidth: 0,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Improved error/warning alerts */}
        {showLocationWarning && (
          <div style={{ color: '#b45309', background: '#fffbe6', padding: 10, textAlign: 'center', fontSize: 14, borderRadius: 6, margin: '8px 0', position: 'relative', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            <span>Location access required for navigation</span>
            <button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const riderLocation = { 
                        lat: position.coords.latitude, 
                        lng: position.coords.longitude 
                      };
                      setUserPosition(riderLocation);
                      setGeoError('');
                      setShowLocationWarning(false);
                      
                      // Update map center
                      if (window.deliveryMap) {
                        window.deliveryMap.setCenter(riderLocation);
                      }
                    },
                    (error) => {
                      // Manual location request failed
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
                  );
                }
              }}
              style={{ 
                marginLeft: 8, 
                background: '#b45309', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                padding: '4px 8px', 
                fontWeight: 600, 
                fontSize: 12, 
                cursor: 'pointer' 
              }}
            >
              Enable Location
            </button>
            <button onClick={() => setShowLocationWarning(false)} style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: '#b45309', fontWeight: 700, fontSize: 16, cursor: 'pointer' }} aria-label="Dismiss">×</button>
          </div>
        )}
        {showRouteError && routeError && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', padding: 10, textAlign: 'center', fontSize: 14, borderRadius: 6, margin: '8px 0', position: 'relative', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            <span>{routeError} </span>
            <button onClick={retryRouteFetch} style={{ marginLeft: 8, background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Retry</button>
            <button onClick={() => setShowRouteError(false)} style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: '#b91c1c', fontWeight: 700, fontSize: 16, cursor: 'pointer' }} aria-label="Dismiss">×</button>
          </div>
        )}
        {geoError && (
          <div style={{ color: 'red', background: '#fffbe6', padding: 10, textAlign: 'center', fontSize: 14, borderRadius: 6, margin: '8px 0', position: 'relative', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            {geoError}
          </div>
        )}
        {(pickupCoords && dropoffCoords && mapLoaded) ? (
          <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            {/* Google Maps Container */}
            <div 
              ref={mapRef}
              style={{ 
                height: '100%', 
                width: '100%',
                minHeight: '400px',
                minWidth: '300px',
                borderRadius: '8px',
                backgroundColor: '#f0f0f0' // Fallback background
              }}
            />
            


            {/* Recenter button */}
            <button
              onClick={() => {
                if (window.deliveryMap) {
                  if (pickupCoords && dropoffCoords) {
                    // Center on delivery route
                    const bounds = new window.google.maps.LatLngBounds();
                    bounds.extend(pickupCoords);
                    bounds.extend(dropoffCoords);
                    window.deliveryMap.fitBounds(bounds, { padding: 50 });
                  } else if (userPosition) {
                    // Center on user position
                    window.deliveryMap.setCenter(userPosition);
                    window.deliveryMap.setZoom(15);
                  }
                }
              }}
              style={{
                position: 'absolute',
                right: 24,
                bottom: 170,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#fff',
                color: '#f59e0b',
                border: 'none',
                boxShadow: '0 2px 8px rgba(245,158,11,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                cursor: 'pointer',
                zIndex: 1002,
                padding: 0,
              }}
              aria-label="Recenter map"
              title="Recenter map"
            >
              {/* Crosshair icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="#f59e0b" strokeWidth="2"/><line x1="12" y1="2" x2="12" y2="6" stroke="#f59e0b" strokeWidth="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="#f59e0b" strokeWidth="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="#f59e0b" strokeWidth="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="#f59e0b" strokeWidth="2"/></svg>
            </button>
          </div>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            color: '#666',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#333' }}>
              Loading Map...
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14, lineHeight: 1.4 }}>
              Please wait while we load the delivery route and map.
            </p>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {!mapLoaded && 'Loading Google Maps API...'}
              {!pickupCoords && 'Resolving pickup location...'}
              {!dropoffCoords && 'Resolving dropoff location...'}
              {!userPosition && 'Getting your location...'}
            </div>
            {(!pickup || !dropoff) && (
              <p style={{ margin: '0', color: '#e53e3e', fontSize: 12 }}>
                Missing pickup or dropoff address - using fallback locations
              </p>
            )}
          </div>
        )}
        {/* Compass/center button */}
        <button
          onClick={() => setUserPosition(userPosition)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            cursor: 'pointer',
            padding: 0
          }}
          aria-label="Center map"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#888" strokeWidth="2"/><circle cx="12" cy="12" r="2" fill="#888"/></svg>
        </button>
      </div>
      {/* Bottom info bar mimic */}
      <div style={{
        flex: '0 0 auto',
        background: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        padding: '10px 10px 14px 10px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100vw',
        position: 'relative',
        minHeight: 44,
        justifyContent: 'space-between'
      }}>
        <div>
          {/* Updated info bar content: bold time and distance with icons */}
          {(() => {
            const { remDistance, remDuration } = getRemainingStats();
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span role="img" aria-label="duration">⏱️</span>
                    <span style={{ fontSize: 19, fontWeight: 700, color: '#222' }}>{isLoading ? '--' : remDuration}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span role="img" aria-label="distance">🛣️</span>
                    <span style={{ fontSize: 19, fontWeight: 700, color: '#222' }}>{isLoading ? '--' : remDistance}</span>
                  </span>
                </div>
                <div style={{ color: '#888', fontSize: 12, fontWeight: 400, marginBottom: 2 }}>Fastest route</div>
                {routeError && <div style={{ color: 'red', marginTop: 8 }}>{routeError}</div>}
              </>
            );
          })()}
        </div>
      </div>
      {/* Arrived Modal */}
      {showArrivedModal && !codCollected && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'env(safe-area-inset-top, 12px) env(safe-area-inset-right, 12px) env(safe-area-inset-bottom, 12px) env(safe-area-inset-left, 12px)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 18,
            boxShadow: '0 3px 16px rgba(0,0,0,0.16)',
            textAlign: 'center',
            maxWidth: 320,
            minWidth: 0,
            maxHeight: '85vh',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {orderType === 'taxi' ? 'You have arrived at the destination!' : 'You have arrived at your destination!'}
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 18 }}>
              {orderType === 'taxi' ? 'Trip navigation is complete.' : 'Delivery navigation is complete.'}
            </div>
            <button
              onClick={async () => {
                setShowArrivedModal(false);
                clearNavPersist();

                // If we have an orderId, update the order status
                if (orderId) {
                  try {
                    
                    // Update order status to delivered
                    // ✅ FIXED: Use smart orderType detection
                    await riderAPI.updateOrderStatus(orderId, 'delivered', orderType);
                    
                    
                    // Navigate to completion page
                    navigate('/delivery-completed', { 
                      state: { 
                        orderId: orderId,
                        pickup, 
                        dropoff, 
                        package: location.state?.package,
                        payment: location.state?.payment,
                        customer: location.state?.customer || 'Customer',
                        pickupType: location.state?.pickupType,
                        dropoffType: location.state?.dropoffType,
                        orderType: orderType
                      } 
                    });
                  } catch (error) {
                    console.error('Failed to complete delivery:', error);
                    addNotification({
                      type: 'error',
                      title: orderType === 'taxi' ? 'Trip Completion Failed' : 'Delivery Completion Failed',
                      message: orderType === 'taxi' 
                        ? 'Failed to complete trip. Please try again.'
                        : 'Failed to complete delivery. Please try again.'
                    });
                  }
                } else {
                  // For non-order deliveries, just navigate to completion
                  navigate('/delivery-completed', { 
                    state: { 
                      pickup, 
                      dropoff, 
                      package: location.state?.package,
                      payment: location.state?.payment,
                      customer: location.state?.customer || 'Customer',
                      pickupType: location.state?.pickupType,
                      dropoffType: location.state?.dropoffType,
                      orderType: orderType
                    } 
                  });
                }
              }}
              style={{
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 1.5px 6px rgba(0,0,0,0.11)'
              }}
            >
              {orderType === 'taxi' ? 'Complete Trip' : 'Complete Delivery'}
            </button>
          </div>
        </div>
      )}
      {/* COD Modal */}
      {showCodModal && !codCollected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, width: 320 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Collect COD Payment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, color: '#444' }}>Amount</label>
              <input
                value={codAmount}
                onChange={e => setCodAmount(e.target.value)}
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px' }}
              />
              <label style={{ fontSize: 13, color: '#444' }}>Delivery OTP</label>
              <input
                value={deliveryOtp}
                onChange={e => setDeliveryOtp(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit Delivery OTP"
                style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px', letterSpacing: 3 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setShowCodModal(false)} style={{ flex: 1, background: '#eee', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      await riderAPI.collectCod(orderId, Number(codAmount), deliveryOtp);
                      setCodCollected(true);
                      setShowCodModal(false);
                      addNotification({
                        type: 'success',
                        title: 'Order Delivered',
                        message: 'COD confirmed and order delivered successfully!'
                      });
                      
                      // Navigate directly to completion page to prevent additional popups
                      navigate('/delivery-completed', { 
                        state: { 
                          orderId: orderId,
                          pickup, 
                          dropoff, 
                          package: location.state?.package,
                          payment: location.state?.payment,
                          customer: location.state?.customer || 'Customer',
                          pickupType: location.state?.pickupType,
                          dropoffType: location.state?.dropoffType,
                          orderType: orderType,
                          codCollected: true
                        } 
                      });
                    } catch (e) {
                      addNotification({
                        type: 'error',
                        title: 'COD Failed',
                        message: 'Failed to confirm COD. Check amount/OTP and try again.'
                      });
                    }
                  }}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Address Edit Modal */}
      {showAddressModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, width: 320, maxWidth: '90vw' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              Edit {addressType === 'pickup' ? 'Pickup' : 'Dropoff'} Address
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, color: '#444' }}>Address</label>
              <textarea
                value={editingAddress}
                onChange={e => setEditingAddress(e.target.value)}
                placeholder="Enter new address..."
                rows={3}
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 8, 
                  padding: '8px 10px', 
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button 
                  onClick={() => setShowAddressModal(false)} 
                  style={{ 
                    flex: 1, 
                    background: '#eee', 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '10px 0', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setShowAddressModal(false);
                      
                      // Update the address
                      if (addressType === 'pickup') {
                        pickup = editingAddress;
                      } else {
                        dropoff = editingAddress;
                      }
                      
                      // Re-resolve coordinates for the new address
                      const newCoords = await geocodeAddress(editingAddress);
                      
                      if (addressType === 'pickup') {
                        setPickupCoords(newCoords);
                      } else {
                        setDropoffCoords(newCoords);
                      }
                      
                      // Refresh the route if both addresses are valid
                      if (pickupCoords && dropoffCoords && mapLoaded) {
                        fetchRoute(pickupCoords, dropoffCoords);
                      }
                      
                      addNotification({
                        type: 'success',
                        title: 'Address Updated',
                        message: `${addressType === 'pickup' ? 'Pickup' : 'Dropoff'} address updated successfully!`
                      });
                    } catch (e) {
                      console.error('Address update error:', e);
                      addNotification({
                        type: 'error',
                        title: 'Address Update Failed',
                        message: 'Failed to update address. Please try again.'
                      });
                    }
                  }}
                  style={{ 
                    flex: 1, 
                    background: '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '10px 0', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Delivery Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, width: 320, maxWidth: '90vw' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#ef4444' }}>
              Cancel Delivery
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Please select a reason for cancelling this delivery:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {cancelReasons.map((reason) => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: 14 }}>{reason}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                style={{ 
                  flex: 1, 
                  background: '#6b7280', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '10px 0', 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelDelivery}
                disabled={!cancelReason || isCancelling}
                style={{ 
                  flex: 1, 
                  background: cancelReason && !isCancelling ? '#ef4444' : '#d1d5db', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '10px 0', 
                  fontWeight: 700, 
                  cursor: cancelReason && !isCancelling ? 'pointer' : 'not-allowed' 
                }}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery OTP Verification Modal */}
      {showDeliveryOtpModal && !codCollected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 3px 16px rgba(0,0,0,0.16)', textAlign: 'center', maxWidth: 320, minWidth: 0, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {orderType === 'taxi' || orderType === 'taxi_request' ? 'Verify Customer OTP' : 'Verify Delivery OTP'}
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              {orderType === 'taxi' || orderType === 'taxi_request'
                ? 'Enter the 6-digit OTP provided by the customer to verify pickup'
                : 'Enter the 6-digit OTP provided by the customer to complete delivery'
              }
            </div>
            {!deliveryOtpVerified && !showDeliveryOtpSuccess ? (
              <>
                <input
                  type="text"
                  value={deliveryOtp}
                  onChange={e => { setDeliveryOtp(e.target.value); setDeliveryOtpError(''); }}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 18,
                    borderRadius: 7,
                    border: '1.5px solid #1976d2',
                    marginBottom: 8,
                    outline: 'none',
                    textAlign: 'center',
                    letterSpacing: 2
                  }}
                  autoFocus
                />
                {deliveryOtpError && <div style={{ color: 'red', fontSize: 14, marginBottom: 8 }}>{deliveryOtpError}</div>}
                <button
                  onClick={handleVerifyDeliveryOtp}
                  disabled={isVerifyingOtp}
                  style={{
                    background: isVerifyingOtp ? '#ccc' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    padding: '12px 22px',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: isVerifyingOtp ? 'not-allowed' : 'pointer',
                    width: '100%',
                    marginBottom: 8,
                    opacity: isVerifyingOtp ? 0.7 : 1
                  }}
                >
                  {isVerifyingOtp ? 'Verifying...' : (orderType === 'taxi' || orderType === 'taxi_request' ? 'Verify & Pickup Customer' : 'Verify & Complete Delivery')}
                </button>
                <button
                  onClick={() => {
                    setShowDeliveryOtpModal(false);
                    setIsVerifyingOtp(false);
                    setDeliveryOtpError('');
                  }}
                  style={{
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 7,
                    padding: '12px 22px',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : showDeliveryOtpSuccess ? (
              <div style={{ color: '#10b981', fontSize: 16, fontWeight: 600 }}>
                ✅ OTP Verified Successfully!
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNavigationMap; 