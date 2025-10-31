import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import ClothesHeader from '../Header/ClothesHeader';
import profilepic from '../Images/profilepic.svg';
import plus from "../../Icons/plus.svg";
import { useNavigate } from 'react-router-dom';
import Footer from '../../Utility/Footer';
import TopBannerSection from '../../Components/TopBannerSection.jsx';
import axios from 'axios';
import { profileService } from '../../services/profileService';

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
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

  // List of all countries
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Democratic Republic)', 'Congo (Republic)',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
    'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
    'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
    'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
    'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
    'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
    'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
    'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
    'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
    'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  // Cities mapped by state
  const citiesByState = {
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore', 'Dharmapuri'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
    'Delhi': ['New Delhi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Noida'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur'],
    'Telangana': ['Hyderabad', 'Warangal']
  };

  const cityOptions = citiesByState[profile.state] || [];

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  // Custom toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profileEndpoint = API_CONFIG.ENDPOINTS.PROFILE;
        if (!profileEndpoint) {
          throw new Error('Profile endpoint not configured');
        }

        const response = await axios.get(API_CONFIG.getUrl(profileEndpoint), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const {
          name, phone, email, address_line1, address_line2,
          city, state, country, pincode, profile_picture
        } = response.data.data;

        setProfile({
          name, phone, email, address_line1, address_line2,
          city, state, country, pincode
        });

        if (profile_picture) {
          setPreviewUrl(API_CONFIG.getUrl(`/${profile_picture}`));
        }
      } catch (error) {
        // Fallback to unified profile
        const unified = profileService.getProfile();
        console.log('Loading profile data from unified service:', unified);
        console.log('Address data from unified profile:', {
          addressLine1: unified.addressLine1,
          addressLine2: unified.addressLine2,
          city: unified.city,
          state: unified.state,
          pincode: unified.pincode
        });
        setProfile({
          name: unified.fullName || '',
          phone: unified.phone || '',
          email: unified.email || '',
          address_line1: unified.addressLine1 || '',
          address_line2: unified.addressLine2 || '',
          city: unified.city || '',
          state: unified.state || '',
          country: unified.country || 'India', // Default to India
          pincode: unified.pincode || ''
        });

        // Load saved image from localStorage
        if (unified.profileImage) {
          setPreviewUrl(unified.profileImage);
        } else {
          const savedImage = localStorage.getItem('userProfileImage');
          if (savedImage) {
            setPreviewUrl(savedImage);
          }
        }
      }
    }

    fetchProfile();

    // Reload profile data when page comes into focus
    const handleFocus = () => {
      fetchProfile();
    };

    const handleAddressUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('addressUpdated', handleAddressUpdate);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('addressUpdated', handleAddressUpdate);
    };
  }, [token]);

  // Handle form data changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'pincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    if (name === 'name' || name === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setProfile((prev) => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Comprehensive validation function
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!profile.name.trim()) {
      newErrors.name = 'Please enter your full name';
    } else if (profile.name.trim().length < 1) {
      newErrors.name = 'Name must be at least 1 character';
    } else if (profile.name.trim().length > 20) {
      newErrors.name = 'Name must not exceed 20 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(profile.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    // Phone validation
    if (!profile.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(profile.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number (starts with 6-9)';
    }

    // Email validation
    const validDomains = ['gmail.com', 'email.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    const domain = profile.email.trim().split('@')[1];
    if (!profile.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!validDomains.includes(domain)) {
      newErrors.email = 'Email must be from a valid provider (e.g., gmail.com, email.com)';
    }

    // Address Line 1 validation
    if (!profile.address_line1.trim()) {
      newErrors.address_line1 = 'Address Line 1 is required';
    } else if (profile.address_line1.trim().length < 5) {
      newErrors.address_line1 = 'Address must be at least 5 characters';
    }

    // City validation
    if (!profile.city.trim()) {
      newErrors.city = 'City name is required';
    } else if (profile.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(profile.city.trim())) {
      newErrors.city = 'City can only contain letters and spaces';
    }

    // State validation
    if (!profile.state.trim()) {
      newErrors.state = 'Please select a state';
    } else if (!indianStates.includes(profile.state)) {
      newErrors.state = 'Please select a valid state';
    }

    // Country validation
    if (!profile.country.trim()) {
      newErrors.country = 'Please select a country';
    } else if (!countries.includes(profile.country)) {
      newErrors.country = 'Please select a valid country';
    }

    // Pincode validation
    if (!profile.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(profile.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode (cannot start with 0)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUrl = reader.result || '';

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = 300;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreviewUrl(compressedDataUrl);
      };
      img.src = imageDataUrl;
    };
    reader.onerror = () => {
      showToast('Failed to process image. Please try again.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please correct the errors in the form.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      for (const key in profile) {
        formData.append(key, profile[key]);
      }
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const profileEndpoint = API_CONFIG.ENDPOINTS.PROFILE;
      if (!profileEndpoint) {
        throw new Error('Profile endpoint not configured');
      }

      await axios.put(API_CONFIG.getUrl(profileEndpoint), formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const unified = {
        fullName: profile.name,
        phone: profile.phone,
        email: profile.email,
        addressLine1: profile.address_line1,
        addressLine2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        pincode: profile.pincode,
        profileImage: previewUrl
      };
      await profileService.saveProfile(unified);

      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
              const maxSize = 300;
              let { width, height } = img;

              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              localStorage.setItem('userProfileImage', compressedDataUrl);
            };

            img.src = e.target.result;
          } catch (error) {
            console.warn('Failed to compress image, saving original:', error);
            localStorage.setItem('userProfileImage', e.target.result);
          }
        };
        reader.readAsDataURL(selectedFile);
      }

      showToast('Profile updated successfully! 🎉');
      navigate('/home');
    } catch (error) {
      console.error("Profile update failed:", error);

      if (error.message && error.message.includes('endpoint not configured')) {
        showToast('Configuration error: Profile endpoint not found', 'error');
        return;
      }

      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        showToast('Network error: Please check your connection', 'error');
        return;
      }

      const unified = {
        fullName: profile.name,
        phone: profile.phone,
        email: profile.email,
        addressLine1: profile.address_line1,
        addressLine2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        pincode: profile.pincode,
        profileImage: previewUrl
      };
      await profileService.saveProfile(unified);

      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
              const maxSize = 300;
              let { width, height } = img;

              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              localStorage.setItem('userProfileImage', compressedDataUrl);
            };

            img.src = e.target.result;
          } catch (error) {
            console.warn('Failed to compress image, saving original:', error);
            localStorage.setItem('userProfileImage', e.target.result);
          }
        };
        reader.readAsDataURL(selectedFile);
      }

      showToast('Profile saved locally (API failed) 💾', 'error');
      navigate('/home');
    }
  };

  return (
    <div className='bg-[#F8F8F8] min-h-screen'>
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success'  
            ? 'bg-green-500 text-white'  
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
      
      <ClothesHeader />
      <div className='pt-20 pb-28 px-4'>
        <div className='mb-4'>
          <TopBannerSection heightClass="h-32" roundedClass="rounded-xl" />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <div className='font-medium text-base'>Your Profile</div>
        </div>

        <div className="mt-2 bg-white rounded-full p-2 border border-[#E1E1E1] flex items-center gap-3 relative w-fit">
          <div className="relative w-[50px] h-[50px]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              <div className="rounded-full w-full h-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <label htmlFor="file-upload">
              <img
                src={plus}
                alt="Plus"
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full p-0.5 cursor-pointer"
                style={{ height: '18px', width: '18px' }}
              />
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div>
            <div className='text-xs font-medium'>Your Account</div>
            <div className='text-base font-semibold'>{profile.name || 'Add your name'}</div>
          </div>
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Full name*</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="e.g., Jane Doe"
            maxLength="20"
            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
              errors.name  
                ? 'border-red-300 bg-red-50'  
                : 'border-gray-300 bg-white'
            }`}
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.name}</p>}
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Phone number*</label>
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            placeholder="e.g., 9876543210"
            maxLength="10"
            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
              errors.phone  
                ? 'border-red-300 bg-red-50'  
                : 'border-gray-300 bg-white'
            }`}
            required
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.phone}</p>}
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Email ID*</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            placeholder="e.g., jane.doe@gmail.com"
            maxLength="100"
            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
              errors.email  
                ? 'border-red-300 bg-red-50'  
                : 'border-gray-300 bg-white'
            }`}
            required
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.email}</p>}
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Address Line 1*</label>
          <input
            type="text"
            name="address_line1"
            value={profile.address_line1}
            onChange={handleChange}
            placeholder="e.g., House No./Building Name"
            maxLength="100"
            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
              errors.address_line1  
                ? 'border-red-300 bg-red-50'  
                : 'border-gray-300 bg-white'
            }`}
            required
          />
          {errors.address_line1 && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.address_line1}</p>}
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Address Line 2 (Optional)</label>
          <input
            type="text"
            name="address_line2"
            value={profile.address_line2}
            onChange={handleChange}
            placeholder="e.g., Street/Area/Landmark"
            maxLength="100"
            className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 bg-white"
          />
        </div>

        <div className="flex gap-x-4 mt-4">
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-gray-600">City*</label>
            <input
              list="clothes-city-list"
              name="city"
              value={profile.city}
              onChange={handleChange}
              placeholder="Select or type city/district"
              className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.city  
                  ? 'border-red-300 bg-red-50'  
                  : 'border-gray-300 bg-white'
              }`}
              required
            />
            <datalist id="clothes-city-list">
              {cityOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.city}</p>}
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-gray-600">State*</label>
            <select
              name="state"
              value={profile.state}
              onChange={(e) => {
                handleChange(e);
                const nextState = e.target.value;
                const nextCities = citiesByState[nextState] || [];
                if (!nextCities.includes(profile.city)) {
                  setProfile(prev => ({ ...prev, city: '' }));
                }
              }}
              className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 text-base min-h-[44px] ${
                errors.state  
                  ? 'border-red-300 bg-red-50'  
                  : 'border-gray-300 bg-white'
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
                maxHeight: '150px',
                overflowY: 'auto'
              }}
              required
            >
              <option value="">Select State</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.state}</p>}
          </div>
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Country*</label>
          <select
            name="country"
            value={profile.country}
            onChange={handleChange}
            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 text-base min-h-[44px] ${
              errors.country  
                ? 'border-red-300 bg-red-50'  
                : 'border-gray-300 bg-white'
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
              maxHeight: '150px',
              overflowY: 'auto'
            }}
            required
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.country}</p>}
        </div>

        <div>
          <label className="mt-4 block text-sm font-semibold text-gray-600">Pincode*</label>
          <input
            type="text"
            name="pincode"
            value={profile.pincode}
            onChange={handleChange}
            placeholder="e.g., 400001"
            maxLength="6"
            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
              errors.pincode  
                ? 'border-red-300 bg-red-50'  
                : 'border-gray-300 bg-white'
            }`}
            required
          />
          {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.pincode}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6 font-semibold"
        >
          Submit
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;