import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import profilepic from '../Clothes/Images/profilepic.svg';
import plus from "../Icons/plus.svg";
import { profileService } from '../services/profileService';
import { Car, Bed, ShoppingBasket, Utensils, Truck, Shirt, Edit, X, ArrowLeft, User } from 'lucide-react';

function UnifiedProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    country: '',
    profileImage: ''
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

  const [showEdit, setShowEdit] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const p = profileService.getProfile();
    setProfile(p);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    if (name === 'pincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }
    if (name === 'fullName' || name === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setProfile(prev => ({ ...prev, [name]: processedValue }));
    validateField(name, processedValue);
  };

  // Validate individual field
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'fullName') {
      if (!value.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (value.trim().length < 1) {
        newErrors.fullName = 'Full name must be at least 1 character';
      } else if (value.trim().length > 20) {
        newErrors.fullName = 'Full name must not exceed 20 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
        newErrors.fullName = 'Full name can only contain letters and spaces';
      } else {
        delete newErrors.fullName;
      }
    }

    if (name === 'phone') {
      if (!value.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(value.trim())) {
        newErrors.phone = 'Phone number must start with 6, 7, 8, or 9 and be 10 digits';
      } else {
        delete newErrors.phone;
      }
    }

    if (name === 'email') {
      const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
      const domain = value.trim().split('@')[1];
      if (!value.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (!validDomains.includes(domain)) {
        newErrors.email = 'Email must be from a valid provider (e.g., gmail.com, yahoo.com)';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'addressLine1') {
      if (!value.trim()) {
        newErrors.addressLine1 = 'Address is required';
      } else if (value.trim().length < 5) {
        newErrors.addressLine1 = 'Address must be at least 5 characters';
      } else {
        delete newErrors.addressLine1;
      }
    }

    if (name === 'city') {
      if (!value.trim()) {
        newErrors.city = 'City is required';
      } else if (value.trim().length < 2) {
        newErrors.city = 'City must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
        newErrors.city = 'City can only contain letters and spaces';
      } else {
        delete newErrors.city;
      }
    }

    if (name === 'state') {
      if (!value.trim()) {
        newErrors.state = 'Please select a state';
      } else if (!indianStates.includes(value)) {
        newErrors.state = 'Please select a valid state';
      } else {
        delete newErrors.state;
      }
    }

    if (name === 'country') {
      if (!value.trim()) {
        newErrors.country = 'Please select a country';
      } else if (!countries.includes(value)) {
        newErrors.country = 'Please select a valid country';
      } else {
        delete newErrors.country;
      }
    }

    if (name === 'pincode') {
      if (!value.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!/^[1-9][0-9]{5}$/.test(value.trim())) {
        newErrors.pincode = 'Please enter a valid 6-digit pincode';
      } else {
        delete newErrors.pincode;
      }
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profile.fullName.trim()) newErrors.fullName = 'Full name is required';
    else if (profile.fullName.trim().length < 1) newErrors.fullName = 'Full name must be at least 1 character';
    else if (profile.fullName.trim().length > 20) newErrors.fullName = 'Full name must not exceed 20 characters';
    else if (!/^[a-zA-Z\s]+$/.test(profile.fullName.trim())) newErrors.fullName = 'Full name can only contain letters and spaces';

    if (!profile.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(profile.phone.trim())) newErrors.phone = 'Phone number must start with 6, 7, 8, or 9 and be 10 digits';

    const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    const domain = profile.email.trim().split('@')[1];
    if (!profile.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) newErrors.email = 'Please enter a valid email address';
    else if (!validDomains.includes(domain)) newErrors.email = 'Email must be from a valid provider (e.g., gmail.com, yahoo.com)';

    if (!profile.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    else if (profile.addressLine1.trim().length < 5) newErrors.addressLine1 = 'Address must be at least 5 characters';

    if (!profile.city.trim()) newErrors.city = 'City is required';
    else if (profile.city.trim().length < 2) newErrors.city = 'City must be at least 2 characters';
    else if (!/^[a-zA-Z\s]+$/.test(profile.city.trim())) newErrors.city = 'City can only contain letters and spaces';

    if (!profile.state.trim()) newErrors.state = 'Please select a state';
    else if (!indianStates.includes(profile.state)) newErrors.state = 'Please select a valid state';

    if (!profile.country.trim()) newErrors.country = 'Please select a country';
    else if (!countries.includes(profile.country)) newErrors.country = 'Please select a valid country';

    if (!profile.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^[1-9][0-9]{5}$/.test(profile.pincode.trim())) newErrors.pincode = 'Please enter a valid 6-digit pincode';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const saved = await profileService.saveProfile(profile);
      setProfile(saved);
      
      if (profile.addressLine1 && profile.city && profile.state && profile.pincode) {
        profileService.syncAddressToAllModules();
        showToast('Profile and address updated successfully across all modules');
      } else {
        showToast('Profile updated successfully');
      }
      
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Failed to save profile. Please try again.', 'error');
    }
  };

  return (
    <div className='bg-[#F8F8F8] min-h-screen'>
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

      <div className='pt-6 pb-24 px-4 max-w-md mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <button
            onClick={() => navigate('/home')}
            className='p-2 rounded-full bg-white hover:bg-gray-50 transition-colors border border-[#E1E1E1]'
          >
            <ArrowLeft size={18} className='text-[#5C3FFF]' />
          </button>
          <div className='font-semibold text-base'>Profile</div>
          <button onClick={() => setShowEdit(v => !v)} className='flex items-center text-xs px-3 py-1 rounded-full bg-white border border-[#E1E1E1] text-[#5C3FFF]'>
            {showEdit ? <X size={14} className='mr-1' /> : <Edit size={14} className='mr-1' />} {showEdit ? 'Close' : 'Edit'}
          </button>
        </div>
        <div className="mt-3 bg-white rounded-xl p-3 border border-[#E1E1E1] flex items-center gap-3">
          <div className="relative w-[40px] h-[40px]">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="rounded-full w-full h-full object-cover" />
            ) : (
              <div className="rounded-full w-full h-full bg-purple-100 flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
            )}
            <label htmlFor="unified-profile-image-upload" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#5C3FFF] flex items-center justify-center cursor-pointer" style={{ height: '16px', width: '16px' }}>
              <img src={plus} alt="Plus" className="w-3 h-3" />
              <input
                id="unified-profile-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  if (!file.type.startsWith('image/')) {
                    showToast('Please select a valid image file', 'error');
                    return;
                  }
                  
                  if (file.size > 5 * 1024 * 1024) {
                    showToast('Image size should be less than 5MB', 'error');
                    return;
                  }
                  
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const imageDataUrl = reader.result || '';
                    
                    const img = new Image();
                    img.onload = async () => {
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
                      
                      const updatedProfile = { ...profile, profileImage: compressedDataUrl };
                      setProfile(updatedProfile);
                      
                      try {
                        await profileService.saveProfile(updatedProfile);
                        showToast('Profile image updated successfully');
                      } catch (error) {
                        console.error('Failed to save profile image:', error);
                        showToast('Failed to save image. Please try again.', 'error');
                      }
                    };
                    img.src = imageDataUrl;
                  };
                  reader.onerror = () => {
                    showToast('Failed to process image. Please try again.', 'error');
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
            </label>
          </div>
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-semibold truncate'>{profile.fullName || 'Add your name'}</div>
            <div className='text-[11px] text-gray-500 truncate'>{profile.email || '—'} • {profile.phone || '—'}</div>
          </div>
        </div>

        {showEdit && (
          <form onSubmit={handleSubmit} className='mt-4'>
            <label className="mt-2 block text-xs text-gray-600 w-full">
              Full name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              maxLength="20"
              className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] ${
                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              required
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.fullName}</p>}

            <div className='grid grid-cols-2 gap-3 mt-2'>
              <div>
                <label className="block text-xs text-gray-600">
                  Phone<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="10-digit phone (starts with 6-9)"
                  maxLength="10"
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-600">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="your@gmail.com"
                  maxLength="100"
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.email}</p>}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3 mt-2'>
              <div>
                <label className="block text-xs text-gray-600">
                  City<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter city"
                  maxLength="30"
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] ${
                    errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.city && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.city}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-600">
                  State<span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] text-sm min-h-[40px] ${
                    errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    fontSize: '14px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px',
                    paddingRight: '32px',
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
                {errors.state && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.state}</p>}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3 mt-2'>
              <div>
                <label className="block text-xs text-gray-600">
                  Pincode<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={profile.pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="6-digit pincode"
                  maxLength="6"
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] ${
                    errors.pincode ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.pincode}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-600">
                  Country<span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={profile.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] text-sm min-h-[40px] ${
                    errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    fontSize: '14px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px',
                    paddingRight: '32px',
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
                {errors.country && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.country}</p>}
              </div>
            </div>

            <label className="mt-2 block text-xs text-gray-600 w-full">
              Address Line 1<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="addressLine1"
              value={profile.addressLine1}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your address"
              maxLength="100"
              className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] ${
                errors.addressLine1 ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              required
            />
            {errors.addressLine1 && <p className="text-red-500 text-xs mt-1 ml-2"> {errors.addressLine1}</p>}

            <label className="mt-2 block text-xs text-gray-600 w-full">Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={profile.addressLine2}
              onChange={handleChange}
              placeholder="Additional address details (optional)"
              maxLength="100"
              className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] bg-white"
            />

            <button type="submit" className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-4">Save</button>
          </form>
        )}

        <div className='mt-6'>
          <div className='text-xs text-gray-500 mb-2'>Modules</div>
          <div className='grid grid-cols-2 gap-3'>
            <button onClick={() => navigate('/home-clothes/account')} className='bg-white border border-[#E1E1E1] rounded-xl p-3 flex items-center'>
              <div className='w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3'>
                <Shirt size={18} />
              </div>
              <div className='text-left'>
                <div className='text-sm font-medium'>Clothes</div>
                <div className='text-[11px] text-gray-500'>Account & orders</div>
              </div>
            </button>
            <button onClick={() => navigate('/home-grocery/account')} className='bg-white border border-[#E1E1E1] rounded-xl p-3 flex items-center'>
              <div className='w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3'>
                <ShoppingBasket size={18} />
              </div>
              <div className='text-left'>
                <div className='text-sm font-medium'>Grocery</div>
                <div className='text-[11px] text-gray-500'>Profile & orders</div>
              </div>
            </button>
            <button onClick={() => navigate('/home-food/account')} className='bg-white border border-[#E1E1E1] rounded-xl p-3 flex items-center'>
              <div className='w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3'>
                <Utensils size={18} />
              </div>
              <div className='text-left'>
                <div className='text-sm font-medium'>Food</div>
                <div className='text-[11px] text-gray-500'>Account & orders</div>
              </div>
            </button>
            <button onClick={() => navigate('/home-taxi/account')} className='bg-white border border-[#E1E1E1] rounded-xl p-3 flex items-center'>
              <div className='w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3'>
                <Car size={18} />
              </div>
              <div className='text-left'>
                <div className='text-sm font-medium'>Taxi</div>
                <div className='text-[11px] text-gray-500'>Profile & rides</div>
              </div>
            </button>
            <button onClick={() => navigate('/home-hotel/profile')} className='bg-white border border-[#E1E1E1] rounded-xl p-3 flex items-center'>
              <div className='w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mr-3'>
                <Bed size={18} />
              </div>
              <div className='text-left'>
                <div className='text-sm font-medium'>Hotel</div>
                <div className='text-[11px] text-gray-500'>Account & bookings</div>
              </div>
            </button>
            <button onClick={() => navigate('/porter/profile')} className='bg-white border border-[#E1E1E1] rounded-xl p-3 flex items-center'>
              <div className='w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3'>
                <Truck size={18} />
              </div>
              <div className='text-left'>
                <div className='text-sm font-medium'>Porter</div>
                <div className='text-[11px] text-gray-500'>Profile & history</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnifiedProfile;