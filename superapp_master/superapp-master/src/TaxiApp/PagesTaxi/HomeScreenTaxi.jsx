import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from "react";
import HeaderInsideTaxi from "../ComponentsTaxi/HeaderInsideTaxi";
import { useNavigate } from "react-router-dom";
import search from "../../Icons/search.svg";
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";
import axios from 'axios';
import { getRecentLocations } from '../../services/taxiRecentLocationsService';
import QuickLinks from "../../Components/QuickLinks";
import ProfileImageDisplay from '../ComponentsTaxi/ProfileImageDisplay';
import { profileService } from '../../services/profileService';

// Curated icon set similar to popular ride apps
const TAXI_ICON_URLS = {
  bike: 'https://img.icons8.com/color/48/motorcycle.png',
  auto: 'https://img.icons8.com/color/48/auto-rickshaw.png',
  car: 'https://img.icons8.com/color/48/car.png',
  suv: 'https://img.icons8.com/color/48/suv--v1.png',
  taxi: 'https://img.icons8.com/color/48/taxi.png',
  sedan: 'https://img.icons8.com/color/48/sedan.png',
  boat: "https://static.vecteezy.com/system/resources/previews/018/974/750/original/blue-boat-icon-png.png"
};

function SidebarMenuItem({ icon, label, subLabel, onClick }) {
  return (
    <div className="flex items-center px-4 py-3 hover:bg-gray-100 rounded-lg cursor-pointer transition mb-1" onClick={onClick}>
      <div className="w-6 h-6 flex items-center justify-center mr-3">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {subLabel && <div className="text-xs text-gray-500">{subLabel}</div>}
      </div>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

function HomeScreenTaxi() {
  const navigate = useNavigate();
  const [showAllServices, setShowAllServices] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [recentLocations, setRecentLocations] = useState([]);
  const [recentLocApiWarning, setRecentLocApiWarning] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [vehicleServices, setVehicleServices] = useState(null);
  const [vehicleApiError, setVehicleApiError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('Set your location');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Scroll to top on component mount to ensure search bar is visible
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      const unified = profileService.getProfile();
      setProfileName(unified.fullName || '');
      setProfilePhone(unified.phone || '');
      setProfileImage(unified.profileImage || '');
      
      const saved = localStorage.getItem('taxiProfile');
      if (saved && !unified.fullName) {
        try {
          const data = JSON.parse(saved);
          setProfileName(data.fullName || '');
          setProfilePhone(data.phone || '');
          setProfileImage(data.profileImage || '');
        } catch {}
      }
    }
  }, [sidebarOpen]);

  useEffect(() => {
    async function fetchRecentLocs() {
      setRecentLocApiWarning('');
      const apiLocs = await getRecentLocations();
      if (apiLocs && Array.isArray(apiLocs)) {
        setRecentLocations(apiLocs);
      } else {
        setRecentLocApiWarning('Recent locations API failed, using localStorage fallback.');
        const stored = localStorage.getItem('recentTaxiLocations');
        if (stored) {
          try {
            setRecentLocations(JSON.parse(stored));
          } catch {
            setRecentLocations([]);
          }
        }
      }
    }
    fetchRecentLocs();
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
          setLoadingLocation(true);
          
          try {
            const response = await fetch(API_CONFIG.getUrl(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`));
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.success && data.data) {
                const d = data.data;
                const readableAddress = d.area && d.city ? `${d.area}, ${d.city}` : (d.city || 'Location detected');
                setLocationAddress(readableAddress);
                localStorage.setItem('userAddress', readableAddress);
              } else {
                setLocationAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
              }
            } else {
              setLocationAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            }
          } catch (error) {
            console.log('⚠️ Google Maps geocoding failed, using coordinates:', error.message);
            setLocationAddress(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationAddress('Location not available');
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setLocationAddress('Geolocation not supported');
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const token = localStorage.getItem('token') || 'demo-token';
        const res = await axios.get(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TAXI_VEHICLES), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setVehicleServices(res.data.data);
        } else {
          setVehicleApiError('API returned unexpected data');
        }
      } catch (err) {
        setVehicleApiError(err.response?.status === 401 || err.response?.status === 403 ? 'Not authorized to access vehicle API' : 'Failed to fetch vehicle data');
        setVehicleServices(null);
      }
    }
    fetchVehicles();
  }, []);

  const addRecentLocation = (location) => {
    setRecentLocations(prev => {
      const filtered = prev.filter(l => l.title !== location.title);
      const updated = [location, ...filtered].slice(0, 5);
      localStorage.setItem('recentTaxiLocations', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchClick = () => {
    navigate("/select-location");
  };

  const defaultVehicleIcons = [
    TAXI_ICON_URLS.bike,
    TAXI_ICON_URLS.auto,
    TAXI_ICON_URLS.car,
    TAXI_ICON_URLS.suv,
    TAXI_ICON_URLS.taxi
  ];

  const mapTypeToIcon = (vehicle) => {
    const typeText = (
      vehicle?.type || vehicle?.category || vehicle?.vehicle_type || vehicle?.model || ''
    )
      .toString()
      .toLowerCase();
    if (typeText.includes('bike') || typeText.includes('motor') || typeText.includes('scooter')) return TAXI_ICON_URLS.bike;
    if (typeText.includes('auto') || typeText.includes('rickshaw')) return TAXI_ICON_URLS.auto;
    if (typeText.includes('suv') || typeText.includes('xuv')) return TAXI_ICON_URLS.suv;
    if (typeText.includes('sedan')) return TAXI_ICON_URLS.sedan;
    if (typeText.includes('boat') || typeText.includes('ship') || typeText.includes('ferry')) return TAXI_ICON_URLS.boat;
    if (typeText.includes('car') || typeText.includes('cab') || typeText.includes('taxi')) return TAXI_ICON_URLS.car;
    const carModelHints = ['camry', 'civic', 'focus', 'accord', 'corolla', 'city', 'swift', 'baleno', 'i20', 'creta', 'seltos', 'innova', 'wagon', 'alto', 'verna', 'fortuner'];
    if (carModelHints.some(h => typeText.includes(h))) return 'https://img.icons8.com/color/48/sedan.png';
    return null;
  };

  const resolveImageUrl = (pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
    if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) return pathOrUrl;
    return API_CONFIG.getImageUrl(pathOrUrl);
  };

  const getVehicleLabel = (vehicle) => {
    const raw = [vehicle?.service_name, vehicle?.type, vehicle?.category, vehicle?.vehicle_type, vehicle?.model, vehicle?.make]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (raw.includes('bike') || raw.includes('motor') || raw.includes('scooter')) return 'Bike';
    if (raw.includes('auto') || raw.includes('rickshaw')) return 'Auto';
    if (raw.includes('boat') || raw.includes('ship') || raw.includes('ferry')) return 'Boat';
    if (raw.includes('suv') || raw.includes('xuv') || raw.includes('fortuner') || raw.includes('creta') || raw.includes('seltos')) return 'SUV';
    if (raw.includes('sedan') || raw.includes('camry') || raw.includes('civic') || raw.includes('verna') || raw.includes('corolla')) return 'Car';
    if (raw.includes('cab') || raw.includes('car') || raw.includes('taxi')) return 'Car';
    return 'Taxi';
  };

  const getVehicleIcon = (vehicle, index = 0) => {
    const fromPhoto = resolveImageUrl(vehicle?.photo);
    if (fromPhoto) return fromPhoto;
    const fromImageUrl = resolveImageUrl(vehicle?.image_url || vehicle?.icon || vehicle?.image);
    if (fromImageUrl) return fromImageUrl;
    const fromType = mapTypeToIcon(vehicle);
    if (fromType) return fromType;
    return defaultVehicleIcons[index % defaultVehicleIcons.length];
  };

  const curatedExplore = [
    { label: "Bike", icon: TAXI_ICON_URLS.bike },
    { label: "Auto", icon: TAXI_ICON_URLS.auto },
    { label: "Car", icon: TAXI_ICON_URLS.car },
    { label: "SUV", icon: TAXI_ICON_URLS.suv },
    { label: "Taxi", icon: TAXI_ICON_URLS.taxi },
    { label: "Boat", icon: TAXI_ICON_URLS.boat }
  ];

  let explore = curatedExplore;
  if (vehicleServices) {
    const hasAuto = explore.some(it => it.label.toLowerCase().includes('auto'));
    if (!hasAuto) {
      explore = [{ label: 'Auto', icon: 'https://img.icons8.com/color/48/auto-rickshaw.png' }, ...explore];
    }
  }

  let allServices = [
    { label: "Bike", icon: TAXI_ICON_URLS.bike },
    { label: "Auto", icon: TAXI_ICON_URLS.auto },
    { label: "Car", icon: TAXI_ICON_URLS.car },
    { label: "SUV", icon: TAXI_ICON_URLS.suv },
    { label: "Taxi", icon: TAXI_ICON_URLS.taxi },
    { label: "Boat", icon: TAXI_ICON_URLS.boat },
    { label: "Sedan", icon: TAXI_ICON_URLS.sedan }
  ];

  if (vehicleServices && Array.isArray(vehicleServices)) {
    const apiServices = vehicleServices.map((v, i) => ({ label: getVehicleLabel(v), icon: getVehicleIcon(v, i) }));
    const existing = new Set(allServices.map(s => s.label.toLowerCase()));
    for (const s of apiServices) {
      const key = (s.label || '').toLowerCase();
      if (key && !existing.has(key)) {
        allServices.push(s);
        existing.add(key);
      }
    }
  }

  const goPlaces = [
    { title: "Chennai International Airp...", img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" },
    { title: "Chennai Central Railway Station", img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" },
    { title: "Chennai Bus Stand", img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80" }
  ];

  const getGoPlaceImg = (place) => {
    if (place && typeof place.img === 'string' && place.img.startsWith('http')) {
      return place.img;
    }
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';
  };

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex flex-col">
      <HeaderInsideTaxi />

      {/* Location Display Section */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-sm text-gray-600">Your location:</span>
            <span className="text-sm font-medium text-gray-800">
              {loadingLocation ? 'Detecting location...' : locationAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 z-50 h-full w-60 max-w-full bg-white shadow-xl transition-transform duration-300 animate-slidein flex flex-col rounded-r-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-800">Taxi</span>
              <button onClick={() => setSidebarOpen(false)} className="text-xl text-gray-400 hover:text-gray-700 leading-none">&times;</button>
            </div>
            <div
              className="bg-white rounded-xl shadow p-3 mx-3 mt-3 mb-2 flex flex-col gap-2 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => { setSidebarOpen(false); navigate('/home-taxi/account'); }}
            >
              <div className="flex items-center gap-3">
                <ProfileImageDisplay 
                  image={profileImage}
                  size="40px"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-800">{profileName || 'Your Name'}</div>
                  <div className="text-xs text-gray-500">{profilePhone || 'Your Phone'}</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <svg width="14" height="14" fill="none" stroke="#FFD700" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="12,2 15,8.5 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 9,8.5" />
                </svg>
                <span className="text-xs font-medium text-gray-700">5.00 My Rating</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-1 pb-4">
              <SidebarMenuItem
                icon={<svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>}
                label="Help"
                onClick={() => { setSidebarOpen(false); navigate('/home-taxi/help'); }}
              />
              <SidebarMenuItem
                icon={<svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>}
                label="My Rides"
                onClick={() => { setSidebarOpen(false); navigate('/home-taxi/my-rides'); }}
              />
              <SidebarMenuItem
                icon={<svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>}
                label="Safety"
                onClick={() => { setSidebarOpen(false); navigate('/home-taxi/safety'); }}
              />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="pt-2 pb-20 overflow-visible">
        {/* Search Bar */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-blue-100 to-white rounded-b-3xl shadow-sm sticky top-0 z-10">
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-3 shadow-sm">
            <span onClick={() => setSidebarOpen(true)} className="mr-3 cursor-pointer">
              <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </span>
            <div className="flex items-center flex-1 cursor-pointer" onClick={handleSearchClick}>
              <img src={search} alt="search" className="w-5 h-5 mr-3" />
              <span className="text-blue-600 font-medium flex-1">Where are you going?</span>
            </div>
          </div>
        </div>

        {/* Recent Locations */}
        <div className="bg-white bg-opacity-80 px-4 pt-2 pb-3 rounded-2xl shadow-sm border-l-2 border-blue-100 mt-2">
          {recentLocations.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">No recent locations yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentLocations.slice(0, 3).map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center p-3 bg-white rounded-xl shadow border border-blue-100 cursor-pointer hover:bg-blue-50 transition min-w-0"
                  onClick={() => {
                    localStorage.setItem('dropLocation', JSON.stringify(loc));
                    navigate('/select-location', { state: { dropLocation: typeof loc.title === 'string' ? loc.title : '' } });
                  }}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 0 1 16 0c0 4.97-3.582 9-8 9z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-blue-700 truncate whitespace-nowrap">{typeof loc.title === 'string' ? loc.title : 'Unknown Location'}</div>
                    <div className="text-xs text-gray-500 truncate whitespace-nowrap">{typeof loc.address === 'string' ? loc.address : ''}</div>
                  </div>
                  <span className="ml-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {recentLocApiWarning && <div style={{ color: 'orange', fontSize: 12, margin: 8 }}>{recentLocApiWarning}</div>}

        {/* Explore Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-4 mt-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-base text-blue-700 tracking-wide">Explore</span>
            <button className="text-blue-600 bg-blue-100 hover:bg-blue-200 text-xs font-medium px-3 py-1 rounded-full shadow-sm transition duration-200" onClick={() => setShowAllServices(true)}>View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {explore.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center min-w-[70px]">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                  <img src={item.icon || 'https://img.icons8.com/color/48/taxi.png'} alt={item.label} className="w-7 h-7" />
                </div>
                <span className="text-xs text-gray-700 text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Banner */}
        {/* <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mx-4 my-3 flex items-center gap-3">
          <div className="flex-1 text-xs text-yellow-900 font-semibold">Thank you for helping us reach the mark of <span className="font-bold">4000000 rides a day!</span><br /><span className="text-[10px] font-normal">Keep riding with us</span></div>
          <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=80&q=80" alt="banner" className="w-16 h-12 rounded-lg object-cover" />
        </div> */}

        {/* Go Places with Taxi */}
        {goPlaces.length > 0 && (
          <div className="mt-6 px-4">
            <div className="font-semibold text-base text-gray-800 mb-2">Go Places with Taxi</div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {goPlaces.map((place, idx) => (
                <div key={idx} className="min-w-[120px] bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                  <img src={getGoPlaceImg(place)} alt={typeof place.title === 'string' ? place.title : 'Place'} className="w-full h-20 object-cover" />
                  <div className="p-2 text-xs font-semibold text-gray-700 truncate">{typeof place.title === 'string' ? place.title : 'Unknown Place'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vehicleApiError && (
          <div style={{ color: 'red', fontSize: 12, margin: 8 }}>Vehicle API error: {vehicleApiError} (showing static data)</div>
        )}

        <FooterTaxi />

        {/* All Services Modal/Bottom Sheet */}
        {showAllServices && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-40">
            <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-4 pb-8 relative animate-slideup shadow-lg">
              <button
                className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700"
                onClick={() => setShowAllServices(false)}
              >
                &times;
              </button>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="font-bold text-lg text-gray-800 mb-4 text-center">All services</div>
              <div className="grid grid-cols-4 gap-4">
                {allServices.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-2 shadow-sm border border-blue-100">
                      <img src={typeof item.icon === 'string' ? item.icon : 'https://img.icons8.com/color/48/taxi.png'} alt={item.label} className="w-8 h-8" />
                    </div>
                    <span className="text-xs text-blue-700 text-center font-normal mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeScreenTaxi;