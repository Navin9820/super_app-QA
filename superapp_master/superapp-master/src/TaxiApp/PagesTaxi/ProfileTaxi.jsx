import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import ProfileImageUpload from '../ComponentsTaxi/ProfileImageUpload';
import axios from 'axios';
import { profileService } from '../../services/profileService';

function ProfileTaxi() {
    const navigate = useNavigate();
    
    // State for profile fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('India');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [selected, setSelected] = useState('Home');
    const [apiError, setApiError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [profileImage, setProfileImage] = useState('');
    const [errors, setErrors] = useState({});
    const buttons = ["Home", "Office", "Others"];

    // City options for dropdown
    const cityOptions = [
        'Dharmapuri', 'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 
        'Erode', 'Tirunelveli', 'Vellore', 'Hosur', 'Bengaluru', 'Hyderabad', 
        'Mumbai', 'Pune', 'Delhi'
    ];

    // State options for dropdown
    const stateOptions = [
        'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 
        'Maharashtra', 'Gujarat', 'Delhi', 'West Bengal', 'Rajasthan', 
        'Uttar Pradesh', 'Madhya Pradesh'
    ];

    // Country options for dropdown
    const countryOptions = [
        'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
        'France', 'Japan', 'China', 'Brazil', 'Russia', 'South Africa', 'Mexico',
        'Italy', 'Spain', 'South Korea', 'Indonesia', 'Netherlands', 'Switzerland',
        'Sweden', 'Singapore', 'Malaysia', 'Thailand', 'United Arab Emirates', 'Saudi Arabia'
    ];

    // Custom toast notification
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Handle image change
    const handleImageChange = (newImage) => {
        setProfileImage(newImage);
        showToast('Image uploaded successfully!', 'success');
    };

    // Handle image upload error
    const handleImageError = (errorMessage) => {
        showToast(errorMessage, 'error');
    };

    // Handle input changes with formatting and validation
    const handleInputChange = (field, value) => {
        let processedValue = value;
        
        // Phone number formatting - only allow digits, max 10 digits
        if (field === 'phone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }
        
        // Pincode formatting - only allow digits, max 6 digits
        if (field === 'pincode') {
            processedValue = value.replace(/\D/g, '').slice(0, 6);
        }
        
        // Name fields - only allow letters and spaces
        if (field === 'fullName' || field === 'city') {
            processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        }
        
        // Address field - allow letters, numbers, spaces, and common address characters
        if (field === 'address') {
            processedValue = value.replace(/[^a-zA-Z0-9\s\-,./#]/g, '');
        }
        
        // Update the appropriate state
        switch (field) {
            case 'fullName':
                setFullName(processedValue);
                break;
            case 'phone':
                setPhone(processedValue);
                break;
            case 'email':
                setEmail(value);
                break;
            case 'city':
                setCity(processedValue);
                break;
            case 'state':
                setState(value);
                break;
            case 'country':
                setCountry(value);
                break;
            case 'pincode':
                setPincode(processedValue);
                break;
            case 'address':
                setAddress(processedValue);
                break;
        }
        
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
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
            newErrors.fullName = 'Full name must be at least 1 character';
        } else if (fullName.trim().length > 20) {
            newErrors.fullName = 'Full name must not exceed 20 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
            newErrors.fullName = 'Full name can only contain letters and spaces';
        }
        
        // Phone validation
        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[6-9]\d{9}$/.test(phone.trim())) {
            newErrors.phone = 'Phone number must be 10 digits and start with 6, 7, 8, or 9';
        }
        
        // Email validation
        const validDomains = ['gmail.com', 'email.com'];
        const domain = email.trim().split('@')[1];
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Please enter a valid email address';
        } else if (!validDomains.includes(domain)) {
            newErrors.email = 'Email must be from gmail.com or email.com';
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
        } else if (!stateOptions.includes(state)) {
            newErrors.state = 'Please select a valid state';
        }

        // Country validation
        if (!country.trim()) {
            newErrors.country = 'Country is required';
        } else if (!countryOptions.includes(country)) {
            newErrors.country = 'Please select a valid country';
        }
        
        // Pincode validation
        if (!pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (country === 'India' && !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode (cannot start with 0)';
        }
        
        // Address validation
        if (!address.trim()) {
            newErrors.address = 'Address is required';
        } else if (address.trim().length < 5) {
            newErrors.address = 'Address must be at least 5 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Load profile from API on mount, fallback to unified service/localStorage
    useEffect(() => {
        async function fetchProfile() {
            setApiError('');
            try {
                const token = localStorage.getItem('token') || 'demo-token';
                const res = await axios.get(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USER_PROFILE), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = res.data;
                setFullName(data?.user?.name || '');
                setPhone(data?.user?.phone || '');
                setEmail(data?.user?.email || '');
                setCity(data?.city || '');
                setState(data?.state || '');
                setCountry(data?.country || 'India');
                setPincode(data?.pincode || '');
                setAddress(data?.address || '');
                setSelected('Home');
                if (data?.user?.profile_picture) {
                    setProfileImage(data.user.profile_picture);
                }
            } catch (err) {
                const unified = profileService.getProfile();
                setFullName(unified.fullName || '');
                setPhone(unified.phone || '');
                setEmail(unified.email || '');
                setCity(unified.city || '');
                setState(unified.state || '');
                setCountry(unified.country || 'India');
                setPincode(unified.pincode || '');
                const combinedAddress = [unified.addressLine1, unified.addressLine2].filter(Boolean).join(', ');
                setAddress(combinedAddress || '');
                setSelected(unified.selected || 'Home');
                setProfileImage(unified.profileImage || '');
            }
        }
        fetchProfile();
        
        // Listen for address updates from other components
        const handleAddressUpdate = () => {
            const unified = profileService.getProfile();
            setFullName(unified.fullName || '');
            setPhone(unified.phone || '');
            setEmail(unified.email || '');
            setCity(unified.city || '');
            setState(unified.state || '');
            setCountry(unified.country || 'India');
            setPincode(unified.pincode || '');
            const combinedAddress = [unified.addressLine1, unified.addressLine2].filter(Boolean).join(', ');
            setAddress(combinedAddress || '');
            setProfileImage(unified.profileImage || '');
        };
        
        window.addEventListener('addressUpdated', handleAddressUpdate);
        return () => {
            window.removeEventListener('addressUpdated', handleAddressUpdate);
        };
    }, []);

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }
        
        setApiError('');
        const profile = { fullName, phone, email, city, state, country, pincode, address, selected, profileImage };
        try {
            const token = localStorage.getItem('token') || 'demo-token';
            await axios.put(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USER_PROFILE), {
                city, state, country, pincode, phone, email, address, profile_picture: profileImage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Always sync to unified profile for consistency across modules
            profileService.saveProfile({ fullName, phone, email, city, state, country, pincode, address, selected, profileImage });
            
            showToast('Profile updated successfully!', 'success');
            navigate('/home-taxi/account', { replace: true });
        } catch (err) {
            setApiError('Profile update failed, saving to unified profile.');
            profileService.saveProfile({ fullName, phone, email, city, state, country, pincode, address, selected, profileImage });
            showToast('Profile updated locally (API failed).', 'success');
            navigate('/home-taxi/account', { replace: true });
        }
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            {/* Custom Toast Notification */}
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
            
            <HeaderInsideTaxi />
            <div className='pt-20 pb-20 px-4'>
                <div className='font-medium text-base pt-4'>Your ProfileTaxi</div>
                <div className="mt-2 bg-white rounded-full p-2 border border-[#E1E1E1] flex items-center gap-3">
                    <ProfileImageUpload
                        currentImage={profileImage}
                        onImageChange={handleImageChange}
                        onError={handleImageError}
                        size="50px"
                        showUploadButton={true}
                    />
                    <div>
                        <div className='text-xs font-medium'>Your Account</div>
                        <div className='text-base font-semibold'>{fullName || 'Add your name'}</div>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <label className="mt-4 block text-sm text-gray-600 w-full">Full name*</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={e => handleInputChange('fullName', e.target.value)}
                        placeholder="Enter your full name (1-20 characters)"
                        maxLength="20"
                        className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                            errors.fullName 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300 bg-white'
                        }`}
                        required
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.fullName}</p>}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Phone number*</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        placeholder="Enter 10-digit phone number (starts with 6, 7, 8, or 9)"
                        maxLength="10"
                        className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                            errors.phone 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300 bg-white'
                        }`}
                        required
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.phone}</p>}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Email ID*</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email (e.g., user@gmail.com)"
                        maxLength="100"
                        className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                            errors.email 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300 bg-white'
                        }`}
                        required
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.email}</p>}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Address*</label>
                    <input
                        type="text"
                        value={address}
                        onChange={e => handleInputChange('address', e.target.value)}
                        placeholder="Enter your complete address"
                        maxLength="200"
                        className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                            errors.address 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300 bg-white'
                        }`}
                        required
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.address}</p>}

                    <div className="flex gap-x-4 mt-4">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">City*</label>
                            <input
                                list="taxi-city-list"
                                value={city}
                                onChange={e => handleInputChange('city', e.target.value)}
                                placeholder="Select or type city/district"
                                className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                    errors.city 
                                        ? 'border-red-300 bg-red-50' 
                                        : 'border-gray-300 bg-white'
                                }`}
                                required
                            />
                            <datalist id="taxi-city-list">
                                {cityOptions.map((opt) => (
                                    <option key={opt} value={opt} />
                                ))}
                            </datalist>
                            {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.city}</p>}
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">State*</label>
                            <select
                                value={state}
                                onChange={e => handleInputChange('state', e.target.value)}
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
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}
                                required
                            >
                                <option value="">Select state</option>
                                {stateOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {errors.state && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.state}</p>}
                        </div>
                    </div>
                    <label className="mt-4 block text-sm text-gray-600 w-full">Country*</label>
                    <select
                        value={country}
                        onChange={e => handleInputChange('country', e.target.value)}
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
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}
                        required
                    >
                        <option value="">Select country</option>
                        {countryOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {errors.country && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.country}</p>}
                    <label className="mt-4 block text-sm text-gray-600 w-full">Pincode*</label>
                    <input
                        type="text"
                        value={pincode}
                        onChange={e => handleInputChange('pincode', e.target.value)}
                        placeholder="Enter 6-digit pincode"
                        maxLength="6"
                        className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                            errors.pincode 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300 bg-white'
                        }`}
                        required
                    />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.pincode}</p>}
                    <div className='font-medium text-base pt-4'>Select Type</div>
                    <div className="flex space-x-2 pt-2">
                        {buttons.map((btn) => (
                            <button
                                type="button"
                                key={btn}
                                onClick={() => setSelected(btn)}
                                className={`px-4 py-1 rounded-full border ${selected === btn
                                    ? "bg-[#5C3FFF] text-white"
                                    : "bg-white text-black border-gray-300"
                                    }`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>
                    {apiError && <div style={{ color: 'red', fontSize: 12 }}>{apiError}</div>}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6"
                    >
                        Submit
                    </button>
                </form>
            </div>
            <FooterTaxi />
        </div>
    );
}

export default ProfileTaxi;