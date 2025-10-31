import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { Search, Calendar, Bed, ArrowLeft } from 'lucide-react';
import FooterHotel from '../ComponentsHotel/FooterHotel';
import GuestsHotel from '../ComponentsHotel/GuestsHotel';
import HotelCalendar from '../ComponentsHotel/HotelCalendar';
import HotelImage1 from '../ImagesHotel/HotelImage1.svg';
import CitiesAndRecommendedHotel from '../ComponentsHotel/CitiesAndRecommendedHotel';
import API_CONFIG from '../../config/api.config.js';
import axios from 'axios';
import { getPlaceAutocomplete, getPlaceDetails } from '../../services/taxiService';

function HomeH() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomsGuests, setRoomsGuests] = useState('');
  const [showGuestsModal, setShowGuestsModal] = useState(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    budget: [],
    popular: [],
    facilities: [],
    property: [],
    review: [],
    room: [],
    rating: [],
    location: [],
  });
  const [popularLocations, setPopularLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [recommendedHotels, setRecommendedHotels] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({
    city: '',
    checkInDate: '',
    checkOutDate: '',
    roomsGuests: ''
  });

  // Custom toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const filterOptions = [
    {
      id: 'budget',
      label: 'Budget',
      options: ['₹0 - ₹2,000', '₹2,000 - ₹5,000', '₹5,000 - ₹10,000', '₹10,000 - ₹20,000', '₹20,000+'],
    },
    {
      id: 'popular',
      label: 'Popular',
      options: ['Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Airport Shuttle', 'Parking'],
    },
    {
      id: 'facilities',
      label: 'Facilities',
      options: ['Restaurant', 'Bar', 'Gym', 'Spa', 'Business Center', 'Laundry'],
    },
    {
      id: 'property',
      label: 'Property',
      options: ['Hotel', 'Resort', 'Apartment', 'Villa', 'Guest House', 'Hostel'],
    },
    {
      id: 'review',
      label: 'Review',
      options: ['Excellent (9+)', 'Very Good (8+)', 'Good (7+)', 'Fair (6+)', 'Poor (5+)'],
    },
    {
      id: 'room',
      label: 'Room',
      options: ['Air Conditioning', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Ocean View'],
    },
    {
      id: 'rating',
      label: 'Rating',
      options: ['5 Star', '4 Star', '3 Star', '2 Star', '1 Star'],
    },
    {
      id: 'location',
      label: 'Location',
      options: ['City Center', 'Beachfront', 'Airport', 'Downtown', 'Suburbs', 'Business District'],
    },
  ];

  const popularDestinations = [
    {
      id: 1,
      name: 'Mumbai',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      description: 'The City of Dreams',
    },
    {
      id: 2,
      name: 'Chennai',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      description: 'Gateway to South India',
    },
    {
      id: 3,
      name: 'Delhi',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
      description: 'Heart of India',
    },
    {
      id: 4,
      name: 'Hyderabad',
      image: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=600&q=80',
      description: 'City of Pearls',
    },
    {
      id: 5,
      name: 'Kochi',
      image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
      description: 'Queen of Arabian Sea',
    },
    {
      id: 6,
      name: 'Gujarat',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
      description: 'Land of Legends',
    },
  ];

  // Validation function
  const validateInputs = () => {
    const newErrors = {
      city: '',
      checkInDate: '',
      checkOutDate: '',
      roomsGuests: ''
    };
    let isValid = true;

    // City validation
    if (!city.trim()) {
      newErrors.city = 'Please enter a city';
      isValid = false;
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!checkInDate) {
      newErrors.checkInDate = 'Please select check-in date';
      isValid = false;
    } else {
      const checkIn = new Date(checkInDate);
      if (checkIn < today) {
        newErrors.checkInDate = 'Check-in date cannot be in the past';
        isValid = false;
      }
    }

    if (!checkOutDate) {
      newErrors.checkOutDate = 'Please select check-out date';
      isValid = false;
    } else {
      const checkOut = new Date(checkOutDate);
      const checkIn = new Date(checkInDate);
      if (checkOut <= checkIn) {
        newErrors.checkOutDate = 'Check-out date must be after check-in date';
        isValid = false;
      }
    }

    // Rooms and guests validation
    if (!roomsGuests) {
      newErrors.roomsGuests = 'Please select rooms and guests';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Google Places Autocomplete API (same as taxi app)
  const fetchGooglePlacesSuggestions = async (query) => {
    if (!query || query.trim().length < 2) return [];
    
    try {
      // Use backend proxy to avoid CORS issues (same as taxi app)
      const suggestions = await getPlaceAutocomplete(query.trim());
      if (!suggestions) return [];
      
      // Get place details for each suggestion
      const detailedSuggestions = await Promise.all(
        suggestions.slice(0, 8).map(async (prediction) => {
          try {
            const details = await getPlaceDetails(prediction.place_id);
            if (!details || !details.geometry) return null;
            
            return {
              display_name: details.formatted_address,
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
              place_id: prediction.place_id,
              name: details.name || details.formatted_address
            };
          } catch (error) {
            console.error('Error fetching place details:', error);
            return null;
          }
        })
      );
      
      return detailedSuggestions.filter(Boolean);
    } catch (error) {
      console.error('Error fetching Google Places suggestions:', error);
      return [];
    }
  };

  // Debounced search function using Google Places API
  const debouncedSearchLocations = debounce(async (value) => {
    if (value && value.length >= 2) {
      setLoadingSuggestions(true);
      try {
        const results = await fetchGooglePlacesSuggestions(value);
        const suggestions = results.map(place => ({
          name: place.display_name,
          type: 'location',
          place_id: place.place_id,
          lat: place.lat,
          lng: place.lng
        }));
        
        setLocationSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  }, 500); // 500ms debounce (same as taxi app)

  const handleCityChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setErrors(prev => ({ ...prev, city: '' }));
    if (value.length >= 2) {
      debouncedSearchLocations(value);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationSelect = (location) => {
    setCity(location.name);
    setSelectedLocation(location);
    setShowSuggestions(false);
    setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleInputFocus = () => {
    if (city.length >= 2) {
      debouncedSearchLocations(city);
    } else {
      // Show popular cities when input is focused but empty or has less than 2 characters
      const popularCities = [
        'Mumbai, Maharashtra, India',
        'Delhi, India', 
        'Bangalore, Karnataka, India',
        'Hyderabad, Telangana, India',
        'Chennai, Tamil Nadu, India',
        'Kochi, Kerala, India'
      ];
      const suggestions = popularCities.map(city => ({
        name: city,
        type: 'popular'
      }));
      setLocationSuggestions(suggestions);
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleFilterSelect = (filterId, option) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: prev[filterId].includes(option)
        ? prev[filterId].filter((item) => item !== option)
        : [...prev[filterId], option],
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      budget: [],
      popular: [],
      facilities: [],
      property: [],
      review: [],
      room: [],
      rating: [],
      location: [],
    });
  };

  useEffect(() => {
    const loadPopularLocations = async () => {
      try {
        const response = await axios.get(API_CONFIG.getUrl('/api/hotels'), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        });
        
        const hotels = response.data.data || [];
        const cities = [...new Set(hotels.map(hotel => hotel.address?.city).filter(Boolean))];
        const popularCities = cities.slice(0, 6).map(city => ({ name: city, type: 'city' }));
        setPopularLocations(popularCities);
      } catch (error) {
        console.error('Error fetching popular locations:', error);
        setPopularLocations([]);
      }
    };
    loadPopularLocations();
  }, []);

  useEffect(() => {
    async function fetchRecommendedHotels() {
      try {
        const response = await axios.get(API_CONFIG.getUrl('/api/hotels'), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        });
        
        const hotels = response.data.data || [];
        const sortedHotels = hotels.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.total_reviews || 0) - (a.total_reviews || 0));
        setRecommendedHotels(sortedHotels.slice(0, 6));
      } catch (error) {
        console.error('Error fetching recommended hotels:', error);
        setRecommendedHotels([]);
      }
    }
    fetchRecommendedHotels();
  }, []);

  const handleCityClick = async (cityName) => {
    try {
      setCity(cityName);
      setErrors(prev => ({ ...prev, city: '' }));
      navigate('/hotel-search-results', {
        state: {
          city: cityName,
          checkInDate,
          checkOutDate,
          roomsGuests,
          filters: selectedFilters,
        },
      });
    } catch (error) {
      showToast('Error searching hotels. Please try again.', 'error');
    }
  };

  const handleSearch = async () => {
    try {
      if (!validateInputs()) {
        Object.values(errors).forEach(error => {
          if (error) showToast(error, 'warning');
        });
        return;
      }
      const cityName = city.split(',')[0].trim();
      
      // Save search data to localStorage for auto-fill in booking form
      const searchData = {
        city: cityName,
        checkInDate,
        checkOutDate,
        roomsGuests,
        timestamp: Date.now()
      };
      localStorage.setItem('hotelSearchData', JSON.stringify(searchData));
      
      navigate('/hotel-search-results', {
        state: {
          city: cityName,
          checkInDate,
          checkOutDate,
          roomsGuests,
          filters: selectedFilters,
        },
      });
    } catch (error) {
      showToast('Error searching hotels. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : toast.type === 'warning'
            ? 'bg-yellow-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="relative h-56 md:h-72 w-full flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80')` }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">Book Your Perfect Stay</h1>
          <p className="text-lg md:text-2xl text-white font-medium drop-shadow">Find the best hotels, resorts, and more</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-16 md:-mt-20 z-20 relative">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col md:flex-row items-center gap-2 md:gap-0">
          <div className="flex-1 relative w-full md:w-auto">
            <label htmlFor="city" className="text-xs text-gray-500 block mb-1 font-semibold md:text-xs">City, Area or Property</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              <input
                type="text"
                id="city"
                placeholder="Enter city, area or property name"
                value={city}
                onChange={handleCityChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className={`w-full pl-7 pr-2 py-1 text-xs md:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50 ${errors.city ? 'border-red-500' : 'border-gray-200'}`}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              {showSuggestions && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingSuggestions ? (
                    <div className="px-3 py-4 text-center text-gray-500 text-xs md:text-sm">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Searching locations...
                    </div>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((location, index) => (
                      <div
                        key={index}
                        onClick={() => handleLocationSelect(location)}
                        className="px-3 py-3 hover:bg-blue-50 cursor-pointer text-xs md:text-sm flex items-center border-b border-gray-100 last:border-b-0"
                      >
                        <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-gray-800 block">{location.name}</span>
                          {location.type === 'popular' && (
                            <span className="text-xs text-blue-600 font-medium">Popular destination</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-xs md:text-sm">
                      No locations found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>
          <div className="flex-1 relative w-full md:w-auto">
            <label htmlFor="check-in" className="text-xs text-gray-500 block mb-1 font-semibold md:text-xs">Check-In</label>
            <div
              id="check-in"
              onClick={() => setShowCheckInCalendar(true)}
              className={`w-full px-2 py-1 text-xs md:text-sm border rounded-lg bg-gray-50 cursor-pointer flex items-center ${errors.checkInDate ? 'border-red-500' : 'border-gray-200'}`}
            >
              <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-500" />
              {checkInDate ? <span className="text-xs md:text-sm">{checkInDate}</span> : <span className="text-gray-400 text-xs md:text-sm">Select date</span>}
            </div>
            {errors.checkInDate && <p className="text-red-500 text-xs mt-1">{errors.checkInDate}</p>}
            {showCheckInCalendar && (
              <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-screen max-w-xs md:left-0 md:translate-x-0 md:w-full mt-2 z-30">
                <HotelCalendar
                  onClose={() => setShowCheckInCalendar(false)}
                  onSelectDate={(date) => {
                    setCheckInDate(date);
                    setShowCheckInCalendar(false);
                    setErrors(prev => ({ ...prev, checkInDate: '' }));
                  }}
                />
              </div>
            )}
          </div>
          <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>
          <div className="flex-1 relative w-full md:w-auto">
            <label htmlFor="check-out" className="text-xs text-gray-500 block mb-1 font-semibold md:text-xs">Check-Out</label>
            <div
              id="check-out"
              onClick={() => setShowCheckOutCalendar(true)}
              className={`w-full px-2 py-1 text-xs md:text-sm border rounded-lg bg-gray-50 cursor-pointer flex items-center ${errors.checkOutDate ? 'border-red-500' : 'border-gray-200'}`}
            >
              <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-500" />
              {checkOutDate ? <span className="text-xs md:text-sm">{checkOutDate}</span> : <span className="text-gray-400 text-xs md:text-sm">Select date</span>}
            </div>
            {errors.checkOutDate && <p className="text-red-500 text-xs mt-1">{errors.checkOutDate}</p>}
            {showCheckOutCalendar && (
              <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-screen max-w-xs md:left-0 md:translate-x-0 md:w-full mt-2 z-30">
                <HotelCalendar
                  onClose={() => setShowCheckOutCalendar(false)}
                  onSelectDate={(date) => {
                    setCheckOutDate(date);
                    setShowCheckOutCalendar(false);
                    setErrors(prev => ({ ...prev, checkOutDate: '' }));
                  }}
                />
              </div>
            )}
          </div>
          <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>
          <div className="flex-1 relative w-full md:w-auto">
            <label htmlFor="rooms-guests" className="text-xs text-gray-500 block mb-1 font-semibold md:text-xs">Rooms & Guests</label>
            <div
              id="rooms-guests"
              onClick={() => setShowGuestsModal(true)}
              className={`w-full px-2 py-1 text-xs md:text-sm border rounded-lg bg-gray-50 cursor-pointer flex items-center ${errors.roomsGuests ? 'border-red-500' : 'border-gray-200'}`}
            >
              <Bed className="w-3 h-3 md:w-4 md:h-4 mr-2 text-gray-500" />
              {roomsGuests ? <span className="text-xs md:text-sm">{roomsGuests}</span> : <span className="text-gray-400 text-xs md:text-sm">Add guests</span>}
            </div>
            {errors.roomsGuests && <p className="text-red-500 text-xs mt-1">{errors.roomsGuests}</p>}
            {showGuestsModal && (
              <div className="absolute top-[110%] left-0 w-full mt-2 z-30 bg-white shadow-lg rounded-lg p-4">
                <GuestsHotel
                  closeGuests={(selectedGuests) => {
                    setRoomsGuests(selectedGuests);
                    setShowGuestsModal(false);
                    setErrors(prev => ({ ...prev, roomsGuests: '' }));
                  }}
                />
              </div>
            )}
          </div>
          <div className="w-full md:w-auto mt-2 md:mt-6 flex justify-end">
            <button
              className="bg-sky-600 text-white px-4 py-2 rounded-lg shadow hover:bg-sky-700 transition font-bold text-base w-full md:w-auto min-h-[36px] md:text-base md:px-6 md:py-3"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {filterOptions.map((option) => (
            <div key={option.id} className="relative">
              <button
                onClick={() => setActiveFilter(activeFilter === option.id ? null : option.id)}
                className={`px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border transition-colors flex items-center gap-1 md:gap-2 shadow-sm ${activeFilter === option.id
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50'
                  }`}
              >
                {option.label}
                <svg
                  className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${activeFilter === option.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeFilter === option.id && (
                <div className="absolute top-full left-0 mt-1 md:mt-2 bg-white rounded-xl shadow-lg z-30 border border-gray-200 min-w-[120px] md:min-w-[200px]">
                  <div className="p-1 md:p-3 max-h-40 md:max-h-60 overflow-y-auto">
                    {option.options.map((item) => (
                      <label
                        key={item}
                        className="flex items-center space-x-1 md:space-x-3 py-1 md:py-2 px-1 cursor-pointer hover:bg-gray-50 rounded text-xs md:text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilters[option.id].includes(item)}
                          onChange={() => handleFilterSelect(option.id, item)}
                          className="w-3 h-3 md:w-4 md:h-4 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs md:text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-1 md:mt-2 px-2 md:px-3 pb-2 md:pb-3 flex justify-end">
                    <button
                      onClick={() => setActiveFilter(null)}
                      className="px-2 py-1 md:px-4 md:py-1.5 text-xs md:text-sm bg-sky-600 text-white rounded-full hover:bg-sky-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={clearAllFilters}
            className="px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border border-gray-200 bg-gray-50 text-sky-600 hover:bg-sky-100 ml-1 md:ml-2"
          >
            Clear all
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-600 font-semibold">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block appearance-none bg-white border border-gray-300 px-2 py-1 text-xs rounded-md shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="Recommended">Recommended</option>
              <option value="Price: low to high">Price: low to high</option>
              <option value="Price: high to low">Price: high to low</option>
              <option value="Distance from city centre">Distance from city centre</option>
              <option value="Guest rating + our choices">Guest rating + our choices</option>
              <option value="Property class">Property class</option>
            </select>
          </div>
        </div>
        {Object.values(selectedFilters).some((filters) => filters.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filterOptions.map((option) =>
              selectedFilters[option.id].map((selected) => (
                <div
                  key={`${option.id}-${selected}`}
                  className="flex items-center bg-sky-100 text-sky-700 rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                >
                  <span>{selected}</span>
                  <button
                    onClick={() => handleFilterSelect(option.id, selected)}
                    className="ml-2 text-sky-400 hover:text-sky-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <CitiesAndRecommendedHotel
        popularDestinations={popularDestinations}
        handleCityClick={handleCityClick}
        recommendedHotels={recommendedHotels}
        navigate={navigate}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        roomsGuests={roomsGuests}
      />

      <FooterHotel />
    </div>
  );
}

export default HomeH;