import React, { useState, useEffect } from 'react';
import Header from '../SubPages/Header';
import profilepic from '../Images/profilepic.svg';
import plus from '../../Icons/plus.svg';
import { useNavigate } from 'react-router-dom';
import Footer from '../SubPages/Footer';
import { profileService } from '../../services/profileService';

function Profile() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('Home');
  const buttons = ['Home', 'Office', 'Others'];

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

  // State variables for form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load profile data from unified service on mount
  useEffect(() => {
    const unified = profileService.getProfile();
    console.log('Loading profile data:', unified);
    console.log('Address data from unified profile:', {
      addressLine1: unified.addressLine1,
      addressLine2: unified.addressLine2,
      city: unified.city,
      state: unified.state,
      pincode: unified.pincode,
      country: unified.country,
    });
    console.log('Full unified profile:', unified);
    setFullName(unified.fullName || '');
    setPhoneNumber(unified.phone || '');
    setEmailId(unified.email || '');
    setAddressLine1(unified.addressLine1 || '');
    setAddressLine2(unified.addressLine2 || '');
    setCity(unified.city || '');
    setState(unified.state || '');
    setPincode(unified.pincode || '');
    setCountry(unified.country || 'India');

    // Handle profile image with better validation
    if (unified.profileImage && typeof unified.profileImage === 'string' && unified.profileImage.startsWith('data:image/')) {
      console.log('Loading profile image from unified profile');
      setProfileImage(unified.profileImage);
    } else {
      const directImage = localStorage.getItem('userProfileImage');
      if (directImage && directImage.startsWith('data:image/')) {
        console.log('Loading profile image from localStorage fallback');
        setProfileImage(directImage);
      } else {
        console.log('No valid profile image found');
        setProfileImage(null);
      }
    }

    // Reload profile data when page comes into focus (after address updates)
    const handleFocus = () => {
      const unified = profileService.getProfile();
      console.log('Refreshing profile data:', unified);
      setFullName(unified.fullName || '');
      setPhoneNumber(unified.phone || '');
      setEmailId(unified.email || '');
      setAddressLine1(unified.addressLine1 || '');
      setAddressLine2(unified.addressLine2 || '');
      setCity(unified.city || '');
      setState(unified.state || '');
      setPincode(unified.pincode || '');
      setCountry(unified.country || 'India');
    };

    const handleAddressUpdate = () => {
      const unified = profileService.getProfile();
      console.log('Address updated, refreshing profile data:', unified);
      console.log('Address fields being set:', {
        addressLine1: unified.addressLine1,
        addressLine2: unified.addressLine2,
        city: unified.city,
        state: unified.state,
        pincode: unified.pincode,
        country: unified.country,
      });
      setFullName(unified.fullName || '');
      setPhoneNumber(unified.phone || '');
      setEmailId(unified.email || '');
      setAddressLine1(unified.addressLine1 || '');
      setAddressLine2(unified.addressLine2 || '');
      setCity(unified.city || '');
      setState(unified.state || '');
      setPincode(unified.pincode || '');
      setCountry(unified.country || 'India');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('addressUpdated', handleAddressUpdate);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('addressUpdated', handleAddressUpdate);
    };
  }, []);

  // Custom toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Handle input changes with formatting and validation
  const handleInputChange = (field, value) => {
    let processedValue = value;

    if (field === 'phoneNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    if (field === 'pincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    if (field === 'fullName' || field === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    if (field === 'addressLine1' || field === 'addressLine2') {
      processedValue = value.replace(/[^a-zA-Z0-9\s\-,.#/]/g, '');
    }

    switch (field) {
      case 'fullName':
        setFullName(processedValue);
        break;
      case 'phoneNumber':
        setPhoneNumber(processedValue);
        break;
      case 'emailId':
        setEmailId(value);
        break;
      case 'addressLine1':
        setAddressLine1(processedValue);
        break;
      case 'addressLine2':
        setAddressLine2(processedValue);
        break;
      case 'city':
        setCity(processedValue);
        break;
      case 'state':
        setState(processedValue);
        break;
      case 'pincode':
        setPincode(processedValue);
        break;
      case 'country':
        setCountry(value);
        break;
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Comprehensive validation function
  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 1) {
      newErrors.fullName = 'Name must be at least 1 character';
    } else if (fullName.trim().length > 20) {
      newErrors.fullName = 'Name must not exceed 20 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      newErrors.fullName = 'Name can only contain letters and spaces';
    }

    // Phone validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be 10 digits and start with 6, 7, 8, or 9';
    }

    // Email validation
    const validDomains = ['email.com', 'gmail.com'];
    const domain = emailId.trim().split('@')[1];
    if (!emailId.trim()) {
      newErrors.emailId = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
      newErrors.emailId = 'Please enter a valid email address';
    } else if (!validDomains.includes(domain)) {
      newErrors.emailId = 'Email must be from email.com or gmail.com';
    }

    // Address Line 1 validation
    if (!addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    } else if (addressLine1.trim().length < 5) {
      newErrors.addressLine1 = 'Address must be at least 5 characters';
    }

    // Address Line 2 validation (optional but if provided, should be valid)
    if (addressLine2.trim() && addressLine2.trim().length < 3) {
      newErrors.addressLine2 = 'Address line 2 must be at least 3 characters if provided';
    }

    // City validation
    if (!city.trim()) {
      newErrors.city = 'City is required';
    } else if (city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
      newErrors.city = 'City can only contain letters and spaces';
    }

    // State validation
    if (!state.trim()) {
      newErrors.state = 'State is required';
    } else if (!indianStates.includes(state) && country === 'India') {
      newErrors.state = 'Please select a valid state';
    }

    // Pincode validation
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(pincode.trim()) && country === 'India') {
      newErrors.pincode = 'Please enter a valid 6-digit pincode (cannot start with 0)';
    }

    // Country validation
    if (!country.trim()) {
      newErrors.country = 'Country is required';
    } else if (!countries.includes(country)) {
      newErrors.country = 'Please select a valid country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfileImage(dataUrl);

          try {
            localStorage.setItem('userProfileImage', dataUrl);
            console.log('Profile image saved to localStorage backup');
          } catch (error) {
            console.warn('Failed to save image to localStorage backup:', error);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const unified = {
      fullName,
      phone: phoneNumber,
      email: emailId,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      profileImage,
    };

    console.log('Saving profile with address data:', unified);
    await profileService.saveProfile(unified);
    console.log('Profile saved successfully, address should be synced to all modules');

    const updatedUnified = profileService.getProfile();
    setFullName(updatedUnified.fullName || '');
    setPhoneNumber(updatedUnified.phone || '');
    setEmailId(updatedUnified.email || '');
    setAddressLine1(updatedUnified.addressLine1 || '');
    setAddressLine2(updatedUnified.addressLine2 || '');
    setCity(updatedUnified.city || '');
    setState(updatedUnified.state || '');
    setPincode(updatedUnified.pincode || '');
    setCountry(updatedUnified.country || 'India');

    if (profileImage) {
      try {
        localStorage.setItem('userProfileImage', profileImage);
        console.log('Profile image saved to localStorage during submit');
      } catch (error) {
        console.warn('Failed to save image to localStorage during submit:', error);
      }
    }

    showToast('Profile updated successfully');
    navigate('/home-grocery/account', { replace: true });
  };

  return (
    <div className="bg-[#F8F8F8] min-h-screen">
      {toast.show && (
        <div
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
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

      <Header />
      <div className="pt-20 pb-28 px-4">
        <div className="font-medium text-base pt-4">Your Profile</div>
        <div className="mt-2 bg-white rounded-full p-2 border border-[#E1E1E1] flex items-center gap-3">
          <div className="relative w-[50px] h-[50px]">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="rounded-full w-full h-full object-cover"
                onError={(e) => {
                  console.warn('Profile image failed to load, clearing state');
                  setProfileImage(null);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="rounded-full w-full h-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
            <label
              htmlFor="profile-image-upload"
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#5C3FFF] flex items-center justify-center cursor-pointer"
              style={{ height: '18px', width: '18px' }}
            >
              <img src={plus} alt="Plus" className="w-3 h-3" />
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <div className="text-xs font-medium">Your Account</div>
            <div className="text-sm font-semibold">{fullName || 'Add your name'}</div>
          </div>
        </div>
        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Full name*</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          placeholder="Enter your full name (1-20 characters)"
          maxLength="20"
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
            errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          required
        />
        {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.fullName}</p>}

        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Phone number*</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          placeholder="Enter 10-digit phone number (starts with 6, 7, 8, or 9)"
          maxLength="10"
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
            errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          required
        />
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.phoneNumber}</p>}

        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Email ID*</label>
        <input
          type="email"
          value={emailId}
          onChange={(e) => handleInputChange('emailId', e.target.value)}
          placeholder="Enter your email (e.g., user@gmail.com)"
          maxLength="100"
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
            errors.emailId ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          required
        />
        {errors.emailId && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.emailId}</p>}

        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Address Line 1*</label>
        <input
          type="text"
          value={addressLine1}
          onChange={(e) => handleInputChange('addressLine1', e.target.value)}
          placeholder="Enter your address (e.g., House number, Street name)"
          maxLength="100"
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
            errors.addressLine1 ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          required
        />
        {errors.addressLine1 && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.addressLine1}</p>}

        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Address Line 2</label>
        <input
          type="text"
          value={addressLine2}
          onChange={(e) => handleInputChange('addressLine2', e.target.value)}
          placeholder="Enter additional address details (optional)"
          maxLength="100"
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
            errors.addressLine2 ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.addressLine2 && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.addressLine2}</p>}

        <div className="flex gap-x-4 mt-4">
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-gray-600">City*</label>
            <input
              type="text"
              value={city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city name"
              maxLength="30"
              className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              required
            />
            {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.city}</p>}
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-gray-600">State*</label>
            <select
              value={state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 text-base min-h-[44px] ${
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
            {errors.state && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.state}</p>}
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Country*</label>
        <select
          value={country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 text-base min-h-[44px] ${
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
        {errors.country && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.country}</p>}

        <label className="mt-4 block text-sm font-semibold text-gray-600 w-full">Pincode*</label>
        <input
          type="text"
          value={pincode}
          onChange={(e) => handleInputChange('pincode', e.target.value)}
          placeholder="Enter 6-digit pincode"
          maxLength="6"
          className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
            errors.pincode ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          required
        />
        {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.pincode}</p>}

        <button
          onClick={handleSubmit}
          className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6"
        >
          Submit
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;