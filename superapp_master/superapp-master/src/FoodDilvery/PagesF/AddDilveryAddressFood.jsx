import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import HeaderF from '../ComponentsF/HeaderF';
import FooterFood from '../ComponentsF/FooterFood';
import AddressPicker from '../../Components/maps/AddressPicker';
import { profileService } from '../../services/profileService';

// Import images
import step1 from "../../Clothes/Images/step1.svg";
import gpsIcon from "../../Clothes/Images/gps.svg";

function AddDeliveryAddressFood() {
  const [selected, setSelected] = useState("Home");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    altPhoneNumber: "",
    houseNo: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });

  // List of all Indian states and union territories
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  // List of countries
  const countries = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Japan', 'China', 'Brazil', 'Russia', 'South Africa', 'Mexico',
    'Italy', 'Spain', 'South Korea', 'Indonesia', 'Netherlands', 'Switzerland',
    'Sweden', 'Singapore', 'Malaysia', 'Thailand', 'United Arab Emirates', 'Saudi Arabia'
  ];

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Function to sync address to all modules
  const syncAddressToAllModules = (addressData) => {
    try {
      const unifiedAddress = {
        fullName: addressData.fullName,
        phone: addressData.phone,
        addressLine1: addressData.address_line1,
        addressLine2: addressData.address_line2,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        country: addressData.country
      };
      const currentProfile = profileService.getProfile();
      const updatedProfile = { ...currentProfile, ...unifiedAddress };
      profileService.saveProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to sync address to all modules:', error);
    }
  };

  useEffect(() => {
    const loadSavedData = () => {
      try {
        const existingAddress = localStorage.getItem('delivery_address');
        if (existingAddress) {
          const address = JSON.parse(existingAddress);
          setSelected(address.type || "Home");
          setFormData({
            fullName: address.fullName || "",
            phoneNumber: address.phone || "",
            altPhoneNumber: address.altPhone || "",
            houseNo: address.address_line1 || "",
            landmark: address.address_line2 || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            country: address.country || "India"
          });
        }
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          setFormData(prev => ({
            ...prev,
            fullName: prev.fullName || profile.name || "",
            phoneNumber: prev.phoneNumber || profile.phone || "",
            country: prev.country || "India"
          }));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  const addressTypes = ["Home", "Office", "Others"];
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;
    if (field === 'phoneNumber' || field === 'altPhoneNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    if (field === 'pincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }
    if (field === 'fullName' || field === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else if (formData.fullName.trim().length < 1) {
      newErrors.fullName = 'Name must be at least 1 character';
    } else if (formData.fullName.trim().length > 20) {
      newErrors.fullName = 'Name must not exceed 20 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Name can only contain letters and spaces';
    }

    // Phone Number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be 10 digits and start with 6, 7, 8, or 9';
    }

    // Alternative Phone Number validation
    if (formData.altPhoneNumber.trim() && !/^[6-9]\d{9}$/.test(formData.altPhoneNumber.trim())) {
      newErrors.altPhoneNumber = 'Alternative phone number must be 10 digits and start with 6, 7, 8, or 9';
    }

    // Complete Address validation
    if (!formData.houseNo.trim()) {
      newErrors.houseNo = 'Complete address is required';
    } else if (formData.houseNo.trim().length < 10) {
      newErrors.houseNo = 'Please enter a complete address (at least 10 characters)';
    }

    // Landmark validation
    if (formData.landmark.trim() && formData.landmark.trim().length < 3) {
      newErrors.landmark = 'Landmark must be at least 3 characters if provided';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.city.trim())) {
      newErrors.city = 'City can only contain letters and spaces';
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (formData.country === 'India' && !indianStates.includes(formData.state)) {
      newErrors.state = 'Please select a valid state';
    }

    // Pincode validation
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (formData.country === 'India' && !/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode (cannot start with 0)';
    }

    // Country validation
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    } else if (!countries.includes(formData.country)) {
      newErrors.country = 'Please select a valid country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (location) => {
    if (!location) return;
    setSelectedLocation(location);
    const fullAddress = location.address || location.name || '';
    let landmark = '';
    let city = '';
    let state = '';
    let pincode = '';
    let buildingName = '';

    if (location.components && location.components.length > 0) {
      const components = location.components;
      const route = components.find(c => c.types?.includes('route'))?.long_name || '';
      const sublocality = components.find(c => c.types?.includes('sublocality'))?.long_name || '';
      const locality = components.find(c => c.types?.includes('locality'))?.long_name || '';
      const administrativeArea = components.find(c => c.types?.includes('administrative_area_level_1'))?.long_name || '';
      const postalCode = components.find(c => c.types?.includes('postal_code'))?.long_name || '';
      const establishment = components.find(c => c.types?.includes('establishment'))?.long_name || '';
      const pointOfInterest = components.find(c => c.types?.includes('point_of_interest'))?.long_name || '';
      const premise = components.find(c => c.types?.includes('premise'))?.long_name || '';
      const subpremise = components.find(c => c.types?.includes('subpremise'))?.long_name || '';
      buildingName = establishment || pointOfInterest || premise || subpremise || '';
      landmark = sublocality || locality || buildingName || '';
      city = locality || administrativeArea || '';
      state = administrativeArea || '';
      pincode = postalCode || '';
    } else if (location.address) {
      const addressParts = location.address.split(', ');
      landmark = addressParts[2] || addressParts[1] || '';
      city = addressParts[addressParts.length - 3] || addressParts[addressParts.length - 2] || '';
      state = addressParts[addressParts.length - 2] || '';
      pincode = addressParts[addressParts.length - 1]?.match(/\d{6}/)?.[0] || '';
    }

    let enhancedAddress = fullAddress;
    if (buildingName && !fullAddress.includes(buildingName)) {
      enhancedAddress = `${buildingName}, ${fullAddress}`;
    }

    setFormData(prev => ({
      ...prev,
      houseNo: enhancedAddress,
      landmark,
      city,
      state,
      pincode
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const deliveryAddress = {
      address_line1: formData.houseNo,
      address_line2: formData.landmark,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pincode: formData.pincode,
      phone: formData.phoneNumber,
      fullName: formData.fullName,
      altPhone: formData.altPhoneNumber,
      type: selected,
      location: selectedLocation
    };

    localStorage.setItem('delivery_address', JSON.stringify(deliveryAddress));
    syncAddressToAllModules(deliveryAddress);
    window.dispatchEvent(new CustomEvent('addressUpdated', { detail: { addressData: deliveryAddress } }));
    showToast('Address saved successfully');
    navigate('/home-food/choose-address', { state: { refresh: true } });
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col text-sm font-semibold'>
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
      
      <HeaderF />
      
      <div className="flex-1 overflow-y-auto pt-20">
        <div className="px-2 sm:px-4 py-2 sm:py-6 w-full max-w-md mx-auto pb-32">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              {localStorage.getItem('delivery_address') ? 'Edit delivery address' : 'Add delivery address'}
            </h2>
          </div>

          {/* Location Header */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">F</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-blue-700">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Delivery to</span>
                  </div>
                  <p className="text-blue-800 font-semibold text-sm sm:text-base truncate">
                    {selectedLocation ? selectedLocation.address : 'Select your location'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="flex items-center gap-1 text-blue-600 text-xs sm:text-sm hover:text-blue-700 transition-colors self-start sm:self-auto"
              >
                <span>{showMapPicker ? 'Hide Map' : 'Add Location'}</span>
                <img src={gpsIcon} alt="GPS Location" className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Map-based Address Picker */}
          {showMapPicker && (
            <div className="mb-4 sm:mb-6 bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-blue-800">
                  📍 Select Delivery Location
                </h3>
                <button
                  onClick={() => {
                    const locationButton = document.querySelector('button[title="Use my current location"]');
                    if (locationButton) {
                      locationButton.click();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  title="Get current location"
                >
                  <span>📍</span>
                  <span>Current Location</span>
                </button>
              </div>
              <AddressPicker
                onChange={handleLocationSelect}
                onLocationSelect={handleLocationSelect}
                placeholder="Search for your delivery address..."
                showMap={true}
                mapHeight="200px"
                className="w-full"
              />
            </div>
          )}

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <span className="text-blue-600 text-sm">✅</span>
                <span className="text-blue-800 text-xs sm:text-sm">Location Selected - Address Auto-Filled</span>
              </div>
              <div className="space-y-1">
                <p className="text-blue-700 text-xs sm:text-sm break-words">
                  {selectedLocation.name && selectedLocation.name !== selectedLocation.address ? selectedLocation.name : selectedLocation.address}
                </p>
                {selectedLocation.name && selectedLocation.name !== selectedLocation.address && (
                  <p className="text-blue-600 text-xs break-words">
                    📍 {selectedLocation.address}
                  </p>
                )}
                <p className="text-blue-600 text-xs">
                  🗺️ Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
              <p className="text-blue-600 text-xs mt-2">📍 Complete address has been filled in the "Complete Address" field below</p>
            </div>
          )}

          {/* Address Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-12">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Full name*</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name (1-20 characters)"
                maxLength="20"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base ${
                  errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                required
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.fullName}</p>}
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Phone number*</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter 10-digit phone number (starts with 6, 7, 8, or 9)"
                  maxLength="10"
                  className={`w-full px-3 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                    errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Alternative phone</label>
                <input
                  type="tel"
                  name="altPhoneNumber"
                  value={formData.altPhoneNumber}
                  onChange={(e) => handleInputChange('altPhoneNumber', e.target.value)}
                  placeholder="Enter alternative phone (starts with 6, 7, 8, or 9)"
                  maxLength="10"
                  className={`w-full px-3 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                    errors.altPhoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.altPhoneNumber && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.altPhoneNumber}</p>}
              </div>
            </div>

            {/* Complete Address */}
            <div>
              <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                Complete Address*
                {selectedLocation && formData.houseNo && (
                  <span className="text-blue-600 text-xs ml-1 sm:ml-2">📍 Auto-filled from selected location</span>
                )}
              </label>
              <input
                type="text"
                name="houseNo"
                value={formData.houseNo}
                onChange={(e) => handleInputChange('houseNo', e.target.value)}
                placeholder="Enter complete address including house number, road name, area, colony, etc."
                maxLength="200"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                  selectedLocation && formData.houseNo ? 'bg-green-50 border-green-300' :
                  errors.houseNo ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                required
              />
              {errors.houseNo && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.houseNo}</p>}
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                Near by landmark
                <span className="text-gray-500 text-xs ml-1">(optional)</span>
                {selectedLocation && formData.landmark && (
                  <span className="text-blue-600 text-xs ml-1 sm:ml-2">📍 Auto-filled</span>
                )}
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
                placeholder="Enter nearby landmark (optional)"
                maxLength="50"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                  selectedLocation && formData.landmark ? 'bg-green-50 border-green-300' :
                  errors.landmark ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
              />
              {errors.landmark && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.landmark}</p>}
            </div>

            {/* City, State, Country, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  City*
                  {selectedLocation && formData.city && (
                    <span className="text-blue-600 text-xs ml-1 sm:ml-2">📍 Auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city name"
                  maxLength="30"
                  className={`w-full px-3 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                    selectedLocation && formData.city ? 'bg-green-50 border-green-300' :
                    errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.city}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  State*
                  {selectedLocation && formData.state && (
                    <span className="text-blue-600 text-xs ml-1 sm:ml-2">📍 Auto-filled</span>
                  )}
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                    selectedLocation && formData.state ? 'bg-green-50 border-green-300' :
                    errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                  required
                >
                  <option value="">Select State</option>
                  {indianStates.map((stateOption) => (
                    <option key={stateOption} value={stateOption}>
                      {stateOption}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.state}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  Country*
                  {selectedLocation && formData.country && (
                    <span className="text-blue-600 text-xs ml-1 sm:ml-2">📍 Auto-filled</span>
                  )}
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-3 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                    selectedLocation && formData.country ? 'bg-green-50 border-green-300' :
                    errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((countryOption) => (
                    <option key={countryOption} value={countryOption}>
                      {countryOption}
                    </option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.country}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  Pincode*
                  {selectedLocation && formData.pincode && (
                    <span className="text-blue-600 text-xs ml-1 sm:ml-2">📍 Auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Enter 6-digit pincode"
                  maxLength="6"
                  className={`w-full px-3 py-2 sm:py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] ${
                    selectedLocation && formData.pincode ? 'bg-green-50 border-green-300' :
                    errors.pincode ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2">⚠ {errors.pincode}</p>}
              </div>
            </div>

            {/* Address Type */}
            <div className="mt-4 sm:mt-6">
              <h3 className="text-sm sm:text-base text-gray-800 mb-2 sm:mb-3">Select Type</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {addressTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelected(type)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-full border transition-colors flex-1 sm:flex-none min-w-[70px] sm:min-w-[80px] ${
                      selected === type
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-6 sm:mt-8 px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white font-semibold text-base sm:text-lg rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors shadow-lg"
              id="save-address-button"
            >
              {localStorage.getItem('delivery_address') ? 'Update Address' : 'Save Address'}
            </button>
          </form>
        </div>
      </div>
      
      <FooterFood />
      
      {/* Scroll to Bottom Button */}
      <button
        onClick={() => {
          const saveButton = document.querySelector('button[type="submit"]');
          if (saveButton) {
            saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        className="fixed bottom-20 right-4 bg-blue-600 text-white p-1 rounded-full shadow-sm hover:bg-blue-700 transition-all duration-300 z-[9999] border border-white md:bottom-24 md:p-2"
        title="Scroll to Save Button"
        style={{ boxShadow: '0 1px 5px rgba(0,0,0,0.15)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </div>
  );
}

export default AddDeliveryAddressFood;