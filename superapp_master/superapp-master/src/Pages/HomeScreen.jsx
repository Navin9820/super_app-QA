import React, { useState, useEffect } from "react";
import ecommerce from "../Images/HomeScreen/ecommerce.png";
import hotelbanner4 from '../Images/HomeScreen/hotelbanner4.jpg';
import taxibanner from "../Images/HomeScreen/taxi banner.jpg";
import foodbanner from "../Images/HomeScreen/foodbanner.png";
import banner5 from "../Images/HomeScreen/bannerGroceries.jpg";
import { useNavigate } from "react-router-dom";
import Footer from "../Utility/Footer";
import API_CONFIG from "../config/api.config";
import { authService } from "../services/authService";
import { useNotifications } from "../Utility/NotificationContext";
import {
  HiOutlineUser,
  HiOutlineLocationMarker
} from "react-icons/hi";

// ✅ Corrected banners array
const banners = [
  {
    id: 1,
    image: ecommerce,
    route: "/home-clothes",
    title: "E-commerce",
    description: "Shop latest fashion trends",
    gradient: "from-pink-400 to-purple-600"
  },
  {
    id: 2,
    image: banner5,
    route: "/home-grocery",
    title: "Groceries",
    description: "Fresh groceries delivered",
    gradient: "from-green-400 to-blue-500"
  },
  {
    id: 3,
    image: foodbanner,
    route: "/home-food",
    title: "Food Delivery",
    description: "Delicious meals at your doorstep",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    id: 4,
    image: hotelbanner4,
    route: "/home-hotel",
    title: "Hotels",
    description: "Book your perfect stay",
    gradient: "from-blue-400 to-purple-500"
  },
  {
    id: 5,
    image: taxibanner,
    route: "/home-taxi",
    title: "Taxi",
    description: "Quick and safe rides",
    gradient: "from-indigo-400 to-blue-600"
  },
  {
    id: 6,
    image: "https://www.objectivequiz.com/img/post/porter-logistics-services.jpg",
    route: "/porter",
    title: "Fast Delivery",
    description: "Logistics and fast delivery services",
    gradient: "from-gray-400 to-gray-600"
  },

  {
    id: 7,
    image: 'https://png.pngtree.com/background/20231101/original/pngtree-d-render-of-a-white-coach-tour-bus-driving-towards-pointer-picture-image_5833668.jpg',
    route: "",
    title: "Bus Booking",
    description: "Easy and fastest bus booking (Coming Soon)",
    
    gradient: "from-gray-400 to-gray-600"
  },
  {
    id: 8,
    image: 'https://i.pinimg.com/originals/67/99/d0/6799d05841c0bc195da617dd2831a756.jpg',
    route: "",
    title: "Train Booking",
    description: "Online platform for booking train tickets (Coming Soon)",
    gradient: "from-gray-400 to-gray-600"
  },
   {
    id: 9,
    image: 'https://static.vecteezy.com/system/resources/previews/027/232/302/original/airplane-aircraft-airship-aeroplane-airplane-transparent-background-ai-generated-free-png.png',
    route: "",
    title: "Flight Booking",
    description: "Online Flight ticket booking (Coming Soon)",
    gradient: "from-gray-400 to-gray-600"
  },

];

const HomeScreen = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [city, setCity] = useState({
    area: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [loadingCity, setLoadingCity] = useState(false);

  const handleLogout = async () => {
    try {
      // Use authService to properly logout (includes backend API call)
      await authService.logout();
      
      // Navigate to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate to login
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ latitude, longitude });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = "Location access denied";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location services in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
            default:
              errorMessage = "Unable to access location.";
              break;
          }
          
          setLocationError(errorMessage);
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationError("Geolocation not supported");
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (location && !locationError) {
      setLoadingCity(true);
      
      // Use backend proxy for reverse geocoding
      const fetchCityData = async () => {
        try {
          console.log('🗺️ Fetching location name via backend proxy...');
          const proxyUrl = API_CONFIG.getUrl(`/api/maps/reverse-geocode?lat=${location.latitude}&lng=${location.longitude}`);
          const resp = await fetch(proxyUrl);
          
          if (resp.ok) {
            const json = await resp.json();
            if (json?.success && json?.data) {
              const d = json.data;
              const area = d.area || '';
              const cityName = d.city || '';
              const state = d.state || '';
              const pincode = d.pincode || '';
              setCity({ area, city: cityName, state, pincode });
              console.log('✅ Geocoding via proxy successful:', { area, city: cityName, state, pincode, provider: json?.provider });
              return;
            }
          }
          console.log('⚠️ Backend proxy failed, response:', await resp.text());
        } catch (e) {
          console.log('⚠️ Backend proxy error:', e.message);
        }
        
        // Fallback to coordinates if backend fails
        console.log('❌ Backend geocoding failed, showing coordinates');
        setCity({ 
          area: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`, 
          city: 'Unknown Location', 
          state: '', 
          pincode: '' 
        });
      };

      fetchCityData().finally(() => {
        setLoadingCity(false);
      });
    }
  }, [location, locationError]);

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-gradient-to-br from-purple-100 via-white to-blue-100 relative">
      <header className="w-full flex flex-col items-center px-4 py-3 bg-white/60 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="w-full max-w-md flex items-center justify-between">
          <button 
            className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
            onClick={() => navigate('/account')}
          >
            <HiOutlineUser className="w-5 h-5 text-purple-600" />
          </button>
          
          <div className="text-center flex-1 mx-4">
            <h1 className="text-lg font-bold text-[var(--city-bell-color)]">Citybell</h1>
            <div className="flex items-center justify-center text-sm text-gray-600 mt-1">
              <HiOutlineLocationMarker className="w-4 h-4 mr-1 text-purple-500" />
              <span className="max-w-48 truncate">
                {loadingLocation ? "Getting location..." :
                 locationError ? "Location unavailable" :
                 loadingCity ? "Loading..." :
                 city.area || city.city || "Unknown location"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors relative"
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs leading-none">🔔</span>
              </div>
              
              {/* Professional Notification Badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </button>
            
            <button 
              className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
              onClick={handleLogout}
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563eb" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M6 12H15m0 0l-3-3m3 3l-3 3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Main Banners */}
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            onClick={() => navigate(banner.route)}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
            
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-40 object-cover"
              loading="lazy"
              draggable={false}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="text-white font-bold text-lg">{banner.title}</h3>
              <p className="text-white/90 text-sm">
                {banner.description.includes('(Coming Soon)') ? (
                  <>
                    {banner.description.replace('(Coming Soon)', '')}
                    <span className="text-white/90 font-bold text-lg"> (Coming Soon)</span>
                  </>
                ) : (
                  banner.description
                )}
              </p>
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default HomeScreen;