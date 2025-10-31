import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TripCard from './TripCard.jsx';
import tripService from '../services/trips.jsx';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { API_CONFIG, buildLocationIQUrl } from '../config/api.js';
import { SUPER_APP_API_CONFIG } from '../config/superAppApi.js';

const defaultPosition = API_CONFIG.MAP.DEFAULT_CENTER;

const iconPilot = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});
const iconPickup = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
const iconDropoff = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: 'dropoff-marker'
});

// Helper: Map location names to coordinates
const locationCoords = {
  'Chennai Central': [13.0827, 80.2707],
  'T Nagar': [13.0418, 80.2337],
  'Anna Nagar': [13.0878, 80.2170],
  'Adyar': [13.0067, 80.2570],
  'Velachery': [12.9791, 80.2214],
  'Guindy': [13.0067, 80.2206],
  'Mylapore': [13.0336, 80.2671],
  'Kodambakkam': [13.0486, 80.2214],
  'Nungambakkam': [13.0604, 80.2410],
  'Saidapet': [13.0213, 80.2214],
  'Egmore': [13.0827, 80.2619],
  'Perambur': [13.1203, 80.2337],
  'Tambaram': [12.9246, 80.1272],
  'Porur': [13.0320, 80.1588],
  'Ambattur': [13.1143, 80.1480],
  'Poonamallee': [13.0486, 80.0950],
  'Thiruvanmiyur': [12.9842, 80.2590],
  'Besant Nagar': [12.9982, 80.2590],
  'Royapettah': [13.0524, 80.2619],
  'Triplicane': [13.0604, 80.2822],
  'Teynampet': [13.0418, 80.2493],
  'Vadapalani': [13.0496, 80.2120],
  'Aminjikarai': [13.0827, 80.2206],
  'Kilpauk': [13.0827, 80.2410],
  'Washermanpet': [13.1203, 80.2785],
  'Vepery': [13.0827, 80.2619],
  'Choolaimedu': [13.0697, 80.2305],
  'Ashok Nagar': [13.0380, 80.2120],
  'Koyambedu': [13.0700, 80.1947],
  'Mogappair': [13.0982, 80.1800],
  'Thirumangalam': [13.0945, 80.1860],
  'Mandaveli': [13.0232, 80.2636],
  'Alwarpet': [13.0336, 80.2493],
  'Tondiarpet': [13.1300, 80.2900],
  'Purasawalkam': [13.0878, 80.2493],
  'Ayanavaram': [13.1040, 80.2340],
  'Villivakkam': [13.1100, 80.2000],
  'Chromepet': [12.9500, 80.1400],
  'Pallavaram': [12.9670, 80.1490],
  'Guindy Industrial Estate': [13.0100, 80.2100],
  'Sholinganallur': [12.8996, 80.2270],
  'Shenoy Nagar': [13.0820, 80.2330],
  'Madhavaram': [13.1548, 80.2337],
  'Perungudi': [12.9623, 80.2416],
  'Medavakkam': [12.9249, 80.2057],
  'Pallikaranai': [12.9492, 80.2180],
  'Nandanam': [13.0275, 80.2376],
  'Saidapet West': [13.0213, 80.2120],
  'Ramapuram': [13.0212, 80.1709],
  'Mambalam': [13.0418, 80.2206],
  'Chintadripet': [13.0732, 80.2717],
  'Royapuram': [13.1203, 80.2931],
  'Vyasarpadi': [13.1277, 80.2456],
  'Kotturpuram': [13.0086, 80.2416],
  'Alandur': [13.0107, 80.2067],
  'Tiruvottiyur': [13.1600, 80.3000],
  'Ennore': [13.2100, 80.3200],
  'Manali': [13.1740, 80.2570],
  'Minjur': [13.2770, 80.2660],
  'Red Hills': [13.1700, 80.1840],
  'Avadi': [13.1143, 80.1098],
  // Delivery-specific locations
  'DTDC, Nungambakkam': [13.0604, 80.2410],
  'Swiggy, Mylapore': [13.0336, 80.2671],
  'Pizza Hut, T Nagar': [13.0418, 80.2337],
  'Big Bazaar, Velachery': [12.9791, 80.2214],
  'KFC, T Nagar': [13.0418, 80.2337],
  'Reliance Fresh, Velachery': [12.9791, 80.2214],
  'Apollo Pharmacy, Mylapore': [13.0336, 80.2671],
  'Domino\'s, Nungambakkam': [13.0604, 80.2410],
  'Croma, Phoenix MarketCity': [12.9716, 80.2207],
  'Subway, Marina Beach': [13.0594, 80.2835],
  'Spencer\'s, Express Avenue': [13.0594, 80.2835],
  'Blue Dart, Guindy': [13.0067, 80.2206],
  'McDonald\'s, Chromepet': [12.9500, 80.1400],
  'MedPlus, Kilpauk': [13.0827, 80.2410],
  'Burger King, Vadapalani': [13.0496, 80.2120],
  'Nilgiris, Alandur': [13.0107, 80.2067],
  // Only Chennai locations above. All other locations removed.
  'Priya, Adyar': [13.0067, 80.2570],
  // Delivery addresses from console logs
  'Yubel meadows, Ramapuram, Parthasarathy Nagar, Manapakkam, Ramapuram, Chennai, Tamil Nadu 600089': [13.0212, 80.1709],
  'Angammal Colony, Salem, Tamil Nadu 6': [11.6643, 78.1460],
  '123 Main Street, Food City, State, 123456': [13.0827, 80.2707], // Default to Chennai center
};

// Professional: Robust location lookup with caching and fallbacks
async function getLatLngForLocation(name) {
  // 1. Try exact match
  if (locationCoords[name]) {
    return locationCoords[name];
  }
  
  // 2. Try backend geocoding proxy
  try {
    const response = await fetch(`${SUPER_APP_API_CONFIG.BASE_URL}/maps/geocode?address=${encodeURIComponent(name)}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data && data.data.latitude && data.data.longitude) {
        const coords = [data.data.latitude, data.data.longitude];
        
        // Cache the result
        locationCoords[name] = coords;
        return coords;
      }
    }
  } catch (error) {
    console.error('Backend geocoding error:', error.message);
  }
  
  // 3. Try LocationIQ directly as fallback
  try {
    const locationIQKey = API_CONFIG.LOCATIONIQ.API_KEY;
    const response = await fetch(`https://us1.locationiq.com/v1/search.php?key=${locationIQKey}&q=${encodeURIComponent(name)}&format=json&limit=1`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.length > 0 && data[0].lat && data[0].lon) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        
        // Cache the result
        locationCoords[name] = coords;
        return coords;
      }
    }
  } catch (error) {
    console.error('LocationIQ geocoding error:', error.message);
  }
  
  // 4. Try partial matching for known locations
  const partialMatch = Object.keys(locationCoords).find(key => 
    name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())
  );
  
  if (partialMatch) {
    return locationCoords[partialMatch];
  }
  
  // 5. Fallback to default position
  return defaultPosition;
}

function MapAutoCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15);
  }, [position, map]);
  return null;
}

function FitRouteBounds({ routeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords && routeCoords.length > 1) {
      map.fitBounds(routeCoords, { padding: [50, 50] });
    }
  }, [routeCoords, map]);
  return null;
}

// API Key is now managed in config/api.js

const Map = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [showTripCard, setShowTripCard] = useState(false);
  const [currentRideRequest, setCurrentRideRequest] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);

  // Generate at least 30 unique Chennai ride requests
  const chennaiLocations = Object.keys(locationCoords);
  const customerNames = [
    'Arun Kumar', 'Priya S', 'Ravi', 'Sneha', 'Vikram', 'Rahul Kumar', 'Priya Sharma', 'Amit Patel',
    'Sneha Reddy', 'Vikram Singh', 'Vikram D.', 'Lakshmi Devi', 'Krishna Kumar', 'Radha Rani',
    'Suresh Kumar', 'Anjali Sharma', 'Rajesh Kumar', 'Meera Patel', 'David Wilson', 'Sarah Johnson',
    'Abdul Rahman', 'Fatima Begum', 'Ganesh Prasad', 'Lakshmi Narayan', 'Venkatesh Iyer',
    'Ramesh Kumar', 'Sita Devi', 'Arjun Reddy', 'Priyanka Singh', 'Amitabh Kumar', 'Deepika Sharma',
    'Rahul Dravid', 'Anil Kumble', 'Sachin Tendulkar', 'Karthik', 'Divya', 'Manoj', 'Sunita', 'Ajay', 'Neha', 'Vishal'
  ];
  const allRideRequestsList = [];
  let reqCount = 0;
  for (let i = 0; i < chennaiLocations.length; i++) {
    for (let j = 0; j < chennaiLocations.length; j++) {
      if (i !== j && reqCount < 200) {
        allRideRequestsList.push({
          pickup: chennaiLocations[i],
          dropoff: chennaiLocations[j],
          distance: Math.floor(Math.random() * 20 + 3) + ' km',
          fare: Math.floor(Math.random() * 200 + 50),
          time: Math.floor(Math.random() * 30 + 10) + ' mins',
          customerName: customerNames[reqCount % customerNames.length],
          customerPhone: '+91 ' + (9000000000 + Math.floor(Math.random() * 1000000000)),
          status: 'pending'
        });
        reqCount++;
      }
      if (reqCount >= 200) break;
    }
    if (reqCount >= 200) break;
  }

  // Only keep requests where both pickup and dropoff are in locationCoords (Chennai)
  const rideRequestsList = allRideRequestsList.filter(
    req => locationCoords[req.pickup] && locationCoords[req.dropoff]
  );

  // Shuffle rideRequestsList so the order is random every time
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  shuffle(rideRequestsList);

  // Get geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentPosition(defaultPosition);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setCurrentPosition(defaultPosition)
    );
  }, []);

  // Check for existing active trip
  useEffect(() => {
    const activeTrip = tripService.getActiveTrip();
    if (activeTrip) {
      navigate('/active-trip');
    }
  }, [navigate]);

  const handleToggleOnline = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (newStatus) {
      // Going online - show the first ride request
      const randomIndex = Math.floor(Math.random() * rideRequestsList.length);
      const request = rideRequestsList[randomIndex];
      if (request) {
        setCurrentRideRequest(request);
        setShowTripCard(true);
      }
    } else {
      // Going offline - clear any pending requests and active trip
      setShowTripCard(false);
      setCurrentRideRequest(null);
      setRouteCoords([]);
      setRouteError(null);
      tripService.clearRideRequests();
      tripService.clearActiveTrip();
    }
  };

  const handleAcceptRide = () => {
    if (!currentRideRequest) return;
    tripService.createTrip(currentRideRequest); // Set active trip
    setShowTripCard(false);
    setCurrentRideRequest(null);
    navigate('/active-trip');
  };

  const handleRejectRide = () => {
    if (!currentRideRequest) return;
    // Reject the ride request
    tripService.rejectRideRequest(currentRideRequest.id);
    setShowTripCard(false);
    setCurrentRideRequest(null);
    setRouteCoords([]);
    setRouteError(null);
    // Show the next ride request if available
    const randomRequest = rideRequestsList[Math.floor(Math.random() * rideRequestsList.length)];
    if (randomRequest) {
      setCurrentRideRequest(randomRequest);
      setShowTripCard(true);
    }
  };

  const handleNavigate = () => {
    // In real app, this would open maps app
    alert('Opening navigation to pickup location...');
  };

  // Enhanced route fetching with better error handling
  useEffect(() => {
    const fetchRoute = async () => {
      if (!currentRideRequest || !pickupCoords || !dropoffCoords) {
        setRouteCoords([]);
        return;
      }

      setIsLoadingRoute(true);
      setRouteError(null);

      try {
        // Use backend proxy for directions
        const response = await axios.get(`${SUPER_APP_API_CONFIG.BASE_URL}/maps/directions`, {
          params: {
            from: `${pickupCoords[0]},${pickupCoords[1]}`,
            to: `${dropoffCoords[0]},${dropoffCoords[1]}`,
            mode: 'driving'
          },
          timeout: 10000
        });

        if (response.data?.success && response.data?.data) {
          const routeData = response.data.data;
          
          if (routeData.polyline && routeData.provider === 'google') {
            // Decode Google's polyline for smooth route display
            const decodedCoords = decodePolyline(routeData.polyline);
            setRouteCoords(decodedCoords);
          } else if (routeData.coordinates && routeData.coordinates.length >= 2) {
            // Use provided coordinates (for OSM or fallback routes)
            setRouteCoords(routeData.coordinates);
          } else {
            // Fallback to straight line
            setRouteCoords([pickupCoords, dropoffCoords]);
          }
        } else {
          // Fallback to straight line if no route found
          setRouteCoords([pickupCoords, dropoffCoords]);
        }
      } catch (error) {
        console.error('Route fetching failed:', error.message);
        setRouteError('Failed to fetch route');
        
        // Fallback to straight line
        setRouteCoords([pickupCoords, dropoffCoords]);
        
        if (error.response) {
          console.error('API Error:', error.response.status, error.response.data);
        }
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [currentRideRequest, pickupCoords, dropoffCoords]);

  useEffect(() => {
    async function resolveCoords() {
      if (currentRideRequest) {
        setPickupCoords(await getLatLngForLocation(currentRideRequest.pickup));
        setDropoffCoords(await getLatLngForLocation(currentRideRequest.dropoff));
      } else {
        setPickupCoords(null);
        setDropoffCoords(null);
      }
    }
    resolveCoords();
  }, [currentRideRequest]);

  // Helper function to decode Google's polyline format
  const decodePolyline = (encoded) => {
    try {
      // Improved polyline decoder for Google Maps
      const coords = [];
      let index = 0, len = encoded.length;
      let lat = 0, lng = 0;
      
      while (index < len) {
        let shift = 0, result = 0;
        
        do {
          let b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (result >= 0x20);
        
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        
        shift = 0;
        result = 0;
        
        do {
          let b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (result >= 0x20);
        
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        
        coords.push([lat / 1e5, lng / 1e5]);
      }
      
      // Ensure we have at least start and end points
      if (coords.length === 0) {
        console.warn('⚠️ Polyline decode resulted in no coordinates');
        return [pickupCoords, dropoffCoords];
      }
      
      // If we only have one point, add the end point
      if (coords.length === 1) {
        coords.push(dropoffCoords);
      }
      
      return coords;
    } catch (error) {
      console.warn('Polyline decode failed, using fallback:', error);
      return [pickupCoords, dropoffCoords];
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#f5f5f5',
      position: 'relative',
      overflow: 'hidden',
      padding: 0,
      margin: 0
    }}>
      {/* Map Container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1
      }}>
        {currentPosition && (
          <MapContainer center={currentPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
            {/* Auto-fit to route if present, else center on current position */}
            {currentRideRequest && routeCoords.length > 1 ? (
              <FitRouteBounds routeCoords={routeCoords} />
            ) : (
              <MapAutoCenter position={currentPosition} />
            )}
            <TileLayer
              attribution={API_CONFIG.GOOGLE_MAPS.ATTRIBUTION}
              url={API_CONFIG.GOOGLE_MAPS.TILE_LAYER}
              tileSize={256}
            />
            {/* Pilot's current location */}
            <Marker position={currentPosition} icon={iconPilot}>
              <Popup>You are here</Popup>
            </Marker>
            {/* Ride request pickup marker */}
            {currentRideRequest && pickupCoords && (
              <Marker position={pickupCoords} icon={iconPickup}>
                <Popup>Pickup: {currentRideRequest.pickup}</Popup>
              </Marker>
            )}
            {/* Ride request dropoff marker */}
            {currentRideRequest && dropoffCoords && (
              <Marker position={dropoffCoords} icon={iconDropoff}>
                <Popup>Dropoff: {currentRideRequest.dropoff}</Popup>
              </Marker>
            )}
            {/* Google Maps-style route polyline with border */}
            {currentRideRequest && routeCoords.length > 0 && (
              <>
                {/* Shadow layer for depth */}
                <Polyline
                  positions={routeCoords}
                  pathOptions={{
                    color: "#000",
                    weight: 9, // thinner shadow
                    opacity: 0.15,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
                {/* White border */}
                <Polyline
                  positions={routeCoords}
                  pathOptions={{
                    color: "#fff",
                    weight: 6, // thinner border
                    opacity: 1,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
                {/* Main vibrant blue line */}
                <Polyline
                  positions={routeCoords}
                  pathOptions={{
                    color: "#2563eb", // Tailwind blue-600
                    weight: 3.5, // thinner main line
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </>
            )}
          </MapContainer>
        )}
      </div>

      {/* Online/Offline Status */}
      <div className="absolute top-5 left-5 right-5 z-20">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100">
              {isOnline ? "You're Online" : "You're Offline"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {isOnline ? 'Ready to accept rides' : 'Go online to start earning'}
            </div>
            {isOnline && !currentRideRequest && (
              <div className="text-[10px] text-green-600 dark:text-green-400 mt-1">
                Waiting for ride requests...
              </div>
            )}
            {currentRideRequest && (
              <div className={`text-[10px] mt-1 ${isLoadingRoute ? 'text-yellow-500 dark:text-yellow-400' : routeError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}> 
                {isLoadingRoute ? '🔄 Loading route...' : routeError ? '⚠️ Route unavailable' : '✅ Route loaded'}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleOnline}
              className={`px-5 py-2 rounded-lg font-bold text-white transition-colors ${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Message for First Time Online */}
      {isOnline && !currentRideRequest && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 15,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxWidth: '300px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#333' }}>
            You're Online!
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: 14, lineHeight: 1.4 }}>
            You'll receive ride requests automatically. 
            When a request comes in, you can accept or reject it.
          </p>
          <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            fontSize: 12,
            color: '#666'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#4CAF50' }}>✅</span> Accept
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#f44336' }}>❌</span> Reject
            </div>
          </div>
        </div>
      )}

      {/* Ride Request Card */}
      {showTripCard && currentRideRequest && (
        <div style={{
          position: 'absolute',
          bottom: 200, // medium up
          left: '12%', // medium width
          right: '12%',
          zIndex: 30,
          width: '76%', // medium width
          display: 'flex',
          justifyContent: 'center',
        }}>
          <TripCard
            trip={currentRideRequest}
            onAccept={handleAcceptRide}
            onReject={handleRejectRide}
            style={{ padding: 28, fontSize: 16, minWidth: 270, minHeight: 170 }} // medium card
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="absolute bottom-5 right-5 z-20">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-[50px] h-[50px] bg-white dark:bg-gray-800 border-none rounded-full shadow-lg cursor-pointer text-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Back to Dashboard"
          >
            ←
          </button>
          <button 
            onClick={handleNavigate}
            className="w-[50px] h-[50px] bg-white dark:bg-gray-800 border-none rounded-full shadow-lg cursor-pointer text-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Navigate"
          >
            📍
          </button>
          <button 
            className="w-[50px] h-[50px] bg-white dark:bg-gray-800 border-none rounded-full shadow-lg cursor-pointer text-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Search"
          >
            🔍
          </button>
        </div>
      </div>

    </div>
  );
};

export default Map;
export { locationCoords, getLatLngForLocation, defaultPosition }; 