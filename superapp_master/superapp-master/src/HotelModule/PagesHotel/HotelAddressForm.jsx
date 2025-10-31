import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_CONFIG from '../../config/api.config';
import AddressPicker from '../../Components/maps/AddressPicker';
import { profileService } from '../../services/profileService';

// Import images
import step1 from "../../Clothes/Images/step1.svg";
import gps from "../../Clothes/Images/gps.svg";

function HotelAddressForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const editingAddress = location.state?.address;
    const editingIndex = location.state?.index;
    const returnTo = location.state?.returnTo;
    const returnState = location.state?.returnState;
    const isEditing = !!editingAddress;

    const [selected, setSelected] = useState("Home");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        altPhone: '',
        houseNo: '',
        roadName: '',
        landmark: '',
        city: '',
        state: '',
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

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const buttons = ["Home", "Office", "Others"];

    // Function to sync address to all modules
    const syncAddressToAllModules = (addressData) => {
        try {
            // Create unified address format for profileService
            const unifiedAddress = {
                fullName: addressData.fullName,
                phone: addressData.phone,
                addressLine1: addressData.houseNo, // Complete address
                addressLine2: addressData.roadName,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                country: 'India'
            };

            // Get current profile and update with new address
            const currentProfile = profileService.getProfile();
            const updatedProfile = {
                ...currentProfile,
                ...unifiedAddress
            };

            // Save updated profile
            profileService.saveProfile(updatedProfile);

            console.log('✅ Address synced to all modules');
        } catch (error) {
            console.error('❌ Failed to sync address to all modules:', error);
        }
    };

    // Auto-fill form with saved address data
    useEffect(() => {
        const loadSavedAddress = () => {
            try {
                // Check for saved hotel addresses first
                const hotelAddresses = JSON.parse(localStorage.getItem('hotelUserAddresses') || '[]');
                if (hotelAddresses.length > 0) {
                    const lastAddress = hotelAddresses[hotelAddresses.length - 1];
                    console.log('📍 Loading saved hotel address:', lastAddress);
                    
                    // Auto-fill form with saved data
                    setFormData({
                        fullName: lastAddress.fullName || '',
                        phone: lastAddress.contactNumber || '',
                        altPhone: lastAddress.altPhone || '',
                        houseNo: lastAddress.houseNo || '',
                        roadName: lastAddress.roadName || '',
                        landmark: lastAddress.landmark || '',
                        city: lastAddress.city || '',
                        state: lastAddress.state || '',
                        pincode: lastAddress.pincode || ''
                    });
                    
                    // Set address type if available
                    if (lastAddress.selectedAddressType && buttons.includes(lastAddress.selectedAddressType)) {
                        setSelected(lastAddress.selectedAddressType);
                    }
                } else {
                    // Fallback: Check for saved delivery address
                    const savedAddress = localStorage.getItem('delivery_address');
                    if (savedAddress) {
                        const addressData = JSON.parse(savedAddress);
                        console.log('📍 Loading saved delivery address:', addressData);
                        
                        // Auto-fill form with saved data
                        setFormData({
                            fullName: addressData.fullName || '',
                            phone: addressData.phone || '',
                            altPhone: addressData.altPhone || '',
                            houseNo: addressData.address_line1 || '',
                            roadName: addressData.roadName || '',
                            landmark: addressData.landmark || '',
                            city: addressData.city || '',
                            state: addressData.state || '',
                            pincode: addressData.pincode || ''
                        });
                        
                        // Set address type if available
                        if (addressData.type && buttons.includes(addressData.type)) {
                            setSelected(addressData.type);
                        }
                        
                        // Set location if available
                        if (addressData.location) {
                            setSelectedLocation(addressData.location);
                        }
                    }
                }
                
                // Also check for user profile data
                const userProfile = localStorage.getItem('userProfile');
                if (userProfile) {
                    const profile = JSON.parse(userProfile);
                    console.log('👤 Loading user profile:', profile);
                    
                    // Auto-fill name and phone if not already filled
                    setFormData(prev => ({
                        ...prev,
                        fullName: prev.fullName || profile.name || '',
                        phone: prev.phone || profile.phone || ''
                    }));
                }
            } catch (error) {
                console.error('❌ Error loading saved address:', error);
            }
        };
        
        if (isEditing && editingAddress) {
            // Map the editing address fields to form data structure
            setFormData({
                fullName: editingAddress.fullName || '',
                phone: editingAddress.contactNumber || '',
                altPhone: editingAddress.altPhone || '',
                houseNo: editingAddress.houseNo || '',
                roadName: editingAddress.roadName || '',
                landmark: editingAddress.landmark || '',
                city: editingAddress.city || '',
                state: editingAddress.state || '',
                pincode: editingAddress.pincode || ''
            });
            
            // Set address type if available
            if (editingAddress.selectedAddressType && buttons.includes(editingAddress.selectedAddressType)) {
                setSelected(editingAddress.selectedAddressType);
            }
        } else {
            loadSavedAddress();
        }
    }, [isEditing, editingAddress]);

    // Custom toast notification
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Comprehensive validation function
    const validateForm = () => {
        const newErrors = {};
        
        // Full Name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
            newErrors.fullName = 'Name can only contain letters and spaces';
        }
        
        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
        
        // Alternative phone validation (if provided)
        if (formData.altPhone.trim() && !/^\d{10}$/.test(formData.altPhone.trim())) {
            newErrors.altPhone = 'Please enter a valid 10-digit phone number';
        }
        
        // Complete Address validation
        if (!formData.houseNo.trim()) {
            newErrors.houseNo = 'Complete address is required';
        } else if (formData.houseNo.trim().length < 10) {
            newErrors.houseNo = 'Please enter a complete address (at least 10 characters)';
        }
        
        // Road Name validation
        if (!formData.roadName.trim()) {
            newErrors.roadName = 'Road name is required';
        } else if (formData.roadName.trim().length < 3) {
            newErrors.roadName = 'Road name must be at least 3 characters';
        }
        
        // Landmark validation (optional)
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
        } else if (formData.state.trim().length < 2) {
            newErrors.state = 'State must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.state.trim())) {
            newErrors.state = 'State can only contain letters and spaces';
        }
        
        // Pincode validation
        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form data changes with validation and formatting
    const handleInputChange = (field, value) => {
        let processedValue = value;
        
        // Phone number formatting - only allow digits
        if (field === 'phone' || field === 'altPhone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }
        
        // Pincode formatting - only allow digits, max 6 digits, first digit cannot be 0
        if (field === 'pincode') {
            processedValue = value.replace(/\D/g, '').slice(0, 6);
        }
        
        // Name fields - only allow letters and spaces
        if (field === 'fullName' || field === 'city' || field === 'state') {
            processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: processedValue
        }));
        
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle location selection from map
    const handleLocationSelect = (location) => {
        // Check if location is valid
        if (!location) {
            console.warn('Location is null or undefined');
            return;
        }
        
        setSelectedLocation(location);
        
        // Auto-fill the full address in the houseNo field
        const fullAddress = location.address || location.name || '';
        
        // Also auto-fill individual address components if available
        let roadName = '';
        let landmark = '';
        let city = '';
        let state = '';
        let pincode = '';
        
        if (location.components && location.components.length > 0) {
            const components = location.components;
            
            // Extract address components
            const route = components.find(c => c.types && c.types.includes('route'))?.long_name || '';
            const sublocality = components.find(c => c.types && c.types.includes('sublocality'))?.long_name || '';
            const locality = components.find(c => c.types && c.types.includes('locality'))?.long_name || '';
            const administrativeArea = components.find(c => c.types && c.types.includes('administrative_area_level_1'))?.long_name || '';
            const postalCode = components.find(c => c.types && c.types.includes('postal_code'))?.long_name || '';
            
            roadName = route || sublocality || locality || '';
            landmark = sublocality || locality || '';
            city = locality || administrativeArea || '';
            state = administrativeArea || '';
            pincode = postalCode || '';
        } else if (location.address) {
            // Fallback: Parse the full address string if components are not available
            const addressParts = location.address.split(', ');
            
            // Try to intelligently parse the address
            roadName = addressParts[1] || addressParts[0] || '';
            landmark = addressParts[2] || addressParts[1] || '';
            city = addressParts[addressParts.length - 3] || addressParts[addressParts.length - 2] || '';
            state = addressParts[addressParts.length - 2] || '';
            pincode = addressParts[addressParts.length - 1]?.match(/\d{6}/)?.[0] || '';
        }
        
        setFormData(prev => ({
            ...prev,
            houseNo: fullAddress,
            roadName: roadName,
            landmark: landmark,
            city: city,
            state: state,
            pincode: pincode
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);

        try {
            // Create complete address object in unified format
            const addressData = {
                type: selected,
                fullName: formData.fullName,
                phone: formData.phone,
                altPhone: formData.altPhone,
                address_line1: formData.houseNo, // This now contains the complete address
                landmark: formData.landmark,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: 'India',
                location: selectedLocation
            };

            console.log('✅ Saving address data:', addressData);
            
            // Save address to localStorage in unified format
            localStorage.setItem('delivery_address', JSON.stringify(addressData));
            
            // Also save to hotelUserAddresses for backward compatibility
            // Always replace the existing address instead of adding multiple
            const hotelAddress = {
                fullName: formData.fullName,
                contactNumber: formData.phone,
                selectedAddressType: selected,
                houseNo: formData.houseNo,
                roadName: formData.roadName,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                landmark: formData.landmark
            };
            
            // Always save as a single address (replace any existing ones)
            localStorage.setItem('hotelUserAddresses', JSON.stringify([hotelAddress]));
            
            // Sync address to all modules (food, grocery, clothes, taxi, etc.)
            syncAddressToAllModules(addressData);
            
            // Trigger custom event to notify profile components to refresh
            window.dispatchEvent(new CustomEvent('addressUpdated', { 
                detail: { addressData } 
            }));
            
            showToast('Address saved successfully');
            
            // Navigate back to the appropriate page
            if (returnTo) {
                navigate(returnTo, { state: returnState });
            } else {
                navigate('/hotel-addresses');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            setErrors({ submit: 'Failed to save address. Please try again.' });
        } finally {
            setLoading(false);
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
            
            {/* Header */}
            <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 p-4">
                <div className="relative flex items-center justify-center max-w-2xl mx-auto px-4">
                    <button onClick={() => navigate(-1)} className="absolute left-0">
                        <ArrowLeft size={24} className="text-gray-700 hover:text-sky-600" />
                    </button>
                    <h1 className="text-lg font-bold text-sky-600">
                        {isEditing ? 'Edit Address' : 'Add New Address'}
                    </h1>
                </div>
            </header>

            <div className="flex justify-between items-center px-4 pt-12 mt-12">
                <h2 className="text-base font-medium">Add delivery address</h2>
                <div className="flex items-center gap-2">
                    <span className='text-[#888888] text-xs font-normal'>Add Location</span>
                    <button
                        onClick={() => setShowMapPicker(!showMapPicker)}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center"
                    >
                        <img src={gps} alt="GPS Location" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className='px-4 pb-16'>
                {/* Map-based Address Picker */}
                {showMapPicker && (
                    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">
                            📍 Select Delivery Location
                        </h3>
                        <AddressPicker
                            onChange={handleLocationSelect}
                            onLocationSelect={handleLocationSelect}
                            placeholder="Search for your delivery address..."
                            showMap={true}
                            mapHeight="250px"
                            className="w-full"
                        />
                    </div>
                )}

                {/* Selected Location Display */}
                {selectedLocation && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">✅</span>
                            <span className="font-medium text-green-800">Location Selected</span>
                        </div>
                        <p className="text-green-700 text-sm">{selectedLocation.address}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className="block text-base font-medium text-gray-600 w-full">Full name*</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            maxLength="50"
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                errors.fullName 
                                    ? 'border-red-300 bg-red-50' 
                                    : 'border-gray-300 bg-white'
                            }`}
                            required
                        />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.fullName}</p>}
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-600 w-full">Phone number*</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter 10-digit phone number"
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
                        <label className="block text-base font-medium text-gray-600 w-full">Alternative phone number</label>
                        <input
                            type="tel"
                            value={formData.altPhone}
                            onChange={(e) => handleInputChange('altPhone', e.target.value)}
                            placeholder="Enter alternative phone (optional)"
                            maxLength="10"
                            className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 bg-white"
                        />
                        {errors.altPhone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.altPhone}</p>}
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-600 w-full">
                            Complete Address*
                            {selectedLocation && formData.houseNo && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled from selected location</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.houseNo}
                            onChange={(e) => handleInputChange('houseNo', e.target.value)}
                            placeholder="Enter complete address or select from map above"
                            maxLength="200"
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                selectedLocation && formData.houseNo 
                                    ? 'bg-green-50 border-green-300' 
                                    : errors.houseNo
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white'
                            }`}
                            required
                        />
                        {errors.houseNo && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.houseNo}</p>}
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-600 w-full">
                            Road name, Area, Colony*
                            {selectedLocation && formData.roadName && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.roadName}
                            onChange={(e) => handleInputChange('roadName', e.target.value)}
                            placeholder="Enter road name, area, or colony"
                            maxLength="50"
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                selectedLocation && formData.roadName 
                                    ? 'bg-green-50 border-green-300' 
                                    : errors.roadName
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white'
                            }`}
                            required
                        />
                        {errors.roadName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.roadName}</p>}
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-600 w-full">
                            Near by landmark
                            <span className="text-gray-500 text-sm ml-1">(optional)</span>
                            {selectedLocation && formData.landmark && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.landmark}
                            onChange={(e) => handleInputChange('landmark', e.target.value)}
                            placeholder="Enter nearby landmark (optional)"
                            maxLength="50"
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                selectedLocation && formData.landmark 
                                    ? 'bg-green-50 border-green-300' 
                                    : errors.landmark
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white'
                            }`}
                        />
                        {errors.landmark && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.landmark}</p>}
                    </div>

                    <div className="flex gap-x-4">
                        <div className="w-1/2">
                            <label className="block text-base font-medium text-gray-600">
                                City*
                                {selectedLocation && formData.city && (
                                    <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                placeholder="Enter city name"
                                maxLength="30"
                                className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                    selectedLocation && formData.city 
                                        ? 'bg-green-50 border-green-300' 
                                        : errors.city
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 bg-white'
                                }`}
                                required
                            />
                            {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.city}</p>}
                        </div>
                        <div className="w-1/2">
                            <label className="block text-base font-medium text-gray-600">
                                State*
                                {selectedLocation && formData.state && (
                                    <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                                )}
                            </label>
                            <select
                                value={formData.state}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 text-base min-h-[44px] ${
                                    selectedLocation && formData.state 
                                        ? 'bg-green-50 border-green-300' 
                                        : errors.state
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300 bg-white'
                                }`}
                                style={{
                                    fontSize: '16px', // Prevents zoom on iOS
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '16px',
                                    paddingRight: '40px',
                                    maxHeight: '200px', // Limit dropdown height
                                    overflowY: 'auto' // Enable scrolling within dropdown
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

                    <div>
                        <label className="block text-base font-medium text-gray-600 w-full">
                            Pincode*
                            {selectedLocation && formData.pincode && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                            placeholder="Enter 6-digit pincode"
                            maxLength="6"
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                                selectedLocation && formData.pincode 
                                    ? 'bg-green-50 border-green-300' 
                                    : errors.pincode
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white'
                            }`}
                            required
                        />
                        {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.pincode}</p>}
                    </div>

                    <div className='font-medium text-base pt-4'>Select Type</div>

                    <div className="flex space-x-2 pt-2">
                        {buttons.map((btn) => (
                            <button
                                key={btn}
                                type="button"
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

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="text-red-500 text-sm text-center">{errors.submit}</div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5C3FFF] text-white py-3 rounded-full font-medium mt-6 hover:bg-[#4A2FCC] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Address' : 'Save Address')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default HotelAddressForm;