import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import ClothesHeader from "../Header/ClothesHeader";
import step1 from "../Images/step1.svg";
import gps from "../Images/gps.svg";
import AddressPicker from '../../Components/maps/AddressPicker';
import { profileService } from '../../services/profileService';

function Address() {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const editId = urlParams.get('edit');

    const [isEditing, setIsEditing] = useState(false);
    const [addressesList, setAddressesList] = useState([]);

    const [selected, setSelected] = useState("Home");
    const [customAddressType, setCustomAddressType] = useState('');
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
    const buttons = ["Home", "Office", "Others"];

    // Sync address to profile (optional)
    const syncAddressToAllModules = (addressData) => {
        try {
            const unifiedAddress = {
                fullName: addressData.fullName,
                phone: addressData.phone,
                addressLine1: addressData.houseNo,
                addressLine2: addressData.roadName,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                country: 'India'
            };

            const currentProfile = profileService.getProfile();
            const updatedProfile = { ...currentProfile, ...unifiedAddress };
            profileService.saveProfile(updatedProfile);
            console.log('✅ Address synced to all modules from Clothes');
        } catch (error) {
            console.error('❌ Failed to sync address:', error);
        }
    };

    // Load user profile for name/phone
    useEffect(() => {
        try {
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
                const profile = JSON.parse(userProfile);
                setFormData(prev => ({
                    ...prev,
                    fullName: prev.fullName || profile.name || '',
                    phone: prev.phone || profile.phone || ''
                }));
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }, []);

    // Load all addresses & handle edit mode
    useEffect(() => {
        const savedAddresses = JSON.parse(localStorage.getItem('delivery_addresses') || '[]');
        setAddressesList(savedAddresses);

        if (editId) {
            const addressToEdit = savedAddresses.find(addr => String(addr.id) === String(editId));
            if (addressToEdit) {
                setIsEditing(true);
                setFormData({
                    fullName: addressToEdit.fullName || '',
                    phone: addressToEdit.phone || '',
                    altPhone: addressToEdit.altPhone || '',
                    houseNo: addressToEdit.houseNo || '',
                    roadName: addressToEdit.roadName || '',
                    landmark: addressToEdit.landmark || '',
                    city: addressToEdit.city || '',
                    state: addressToEdit.state || '',
                    pincode: addressToEdit.pincode || ''
                });
                setSelected(addressToEdit.type || 'Home');
                if (addressToEdit.type === 'Others') {
                    setCustomAddressType(addressToEdit.customLabel || '');
                }
                setSelectedLocation(addressToEdit.location || null);
            }
        }
    }, [editId]);

    const handleInputChange = (field, value) => {
        let processedValue = value;
        if (field === 'phone' || field === 'altPhone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }
        if (field === 'pincode') {
            processedValue = value.replace(/\D/g, '').slice(0, 6);
        }
        if (['fullName', 'city', 'state'].includes(field)) {
            processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        }
        setFormData(prev => ({ ...prev, [field]: processedValue }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
            newErrors.fullName = 'Name can only contain letters and spaces';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        if (formData.altPhone.trim() && !/^\d{10}$/.test(formData.altPhone.trim())) {
            newErrors.altPhone = 'Please enter a valid 10-digit phone number';
        }

        if (!formData.houseNo.trim()) {
            newErrors.houseNo = 'Complete address is required';
        } else if (formData.houseNo.trim().length < 10) {
            newErrors.houseNo = 'Please enter a complete address (at least 10 characters)';
        }

        if (!formData.roadName.trim()) {
            newErrors.roadName = 'Road name is required';
        } else if (formData.roadName.trim().length < 3) {
            newErrors.roadName = 'Road name must be at least 3 characters';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        } else if (formData.city.trim().length < 2) {
            newErrors.city = 'City must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.city.trim())) {
            newErrors.city = 'City can only contain letters and spaces';
        }

        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        } else if (formData.state.trim().length < 2) {
            newErrors.state = 'State must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.state.trim())) {
            newErrors.state = 'State can only contain letters and spaces';
        }

        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLocationSelect = (location) => {
        if (!location) return;
        setSelectedLocation(location);
        const fullAddress = location.address || location.name || '';
        let roadName = '', landmark = '', city = '', state = '', pincode = '';

        if (location.components?.length > 0) {
            const comps = location.components;
            const route = comps.find(c => c.types?.includes('route'))?.long_name || '';
            const sublocality = comps.find(c => c.types?.includes('sublocality'))?.long_name || '';
            const locality = comps.find(c => c.types?.includes('locality'))?.long_name || '';
            const adminArea = comps.find(c => c.types?.includes('administrative_area_level_1'))?.long_name || '';
            const postal = comps.find(c => c.types?.includes('postal_code'))?.long_name || '';

            roadName = route || sublocality || locality || '';
            landmark = sublocality || locality || '';
            city = locality || adminArea || '';
            state = adminArea || '';
            pincode = postal || '';
        } else if (location.address) {
            const parts = location.address.split(', ');
            roadName = parts[1] || parts[0] || '';
            landmark = parts[2] || parts[1] || '';
            city = parts[parts.length - 3] || parts[parts.length - 2] || '';
            state = parts[parts.length - 2] || '';
            pincode = parts[parts.length - 1]?.match(/\d{6}/)?.[0] || '';
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const addressTypeLabel = selected === "Others"
            ? (customAddressType.trim() || "Others")
            : selected;

        const newAddress = {
            id: isEditing ? editId : Date.now(),
            type: selected,
            fullName: formData.fullName,
            phone: formData.phone,
            altPhone: formData.altPhone,
            houseNo: formData.houseNo,
            roadName: formData.roadName,
            landmark: formData.landmark,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: 'India',
            location: selectedLocation,
            addressType: addressTypeLabel,
            customLabel: selected === "Others" ? customAddressType.trim() : undefined
        };

        try {
            const existing = JSON.parse(localStorage.getItem('delivery_addresses') || '[]');
            let updated;

            if (isEditing) {
                updated = existing.map(addr =>
                    String(addr.id) === String(editId) ? newAddress : addr
                );
            } else {
                updated = [...existing, newAddress];
                // Auto-select first address as default
                if (existing.length === 0) {
                    localStorage.setItem('selected_delivery_address_id', String(newAddress.id));
                }
            }

            localStorage.setItem('delivery_addresses', JSON.stringify(updated));
            syncAddressToAllModules(newAddress);
            window.dispatchEvent(new CustomEvent('addressUpdated'));

            navigate('/home-clothes/cart'); // Go back to cart to see changes
        } catch (error) {
            console.error('❌ Failed to save address:', error);
        }
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            {/* <ClothesHeader /> */}
            <div className='border border-[#E1E1E1] py-4'>
                <img src={step1} alt="" className="w-full mt-20 px-6" />
            </div>

            {/* 👇 SAVED ADDRESSES LIST */}
            {addressesList.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Saved Addresses ({addressesList.length})
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {addressesList.map((addr) => (
                                <div key={addr.id} className="border rounded p-3 bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{addr.fullName}</div>
                                            <div className="text-sm text-gray-600">
                                                {addr.houseNo}, {addr.roadName}<br />
                                                {addr.city}, {addr.state} - {addr.pincode}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Type: {addr.addressType || addr.type}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/home-clothes/address?edit=${addr.id}`)}
                                                className="text-blue-600 text-xs underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    localStorage.setItem('selected_delivery_address_id', String(addr.id));
                                                    window.dispatchEvent(new CustomEvent('addressUpdated'));
                                                    alert('Default address updated!');
                                                }}
                                                className="text-green-600 text-xs underline"
                                            >
                                                Set Default
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center px-4 pt-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-base font-medium">
                        {isEditing ? 'Edit delivery address' : 'Add delivery address'}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className='text-[#888888] text-xs font-normal'>Add Location</span>
                    <button
                        onClick={() => setShowMapPicker(!showMapPicker)}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center"
                    >
                        <img src={gps} alt="Map" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className='px-4 pb-16'>
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

                {selectedLocation && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">✅</span>
                            <span className="font-medium text-green-800">Location Selected - Address Auto-Filled</span>
                        </div>
                        <p className="text-green-700 text-sm mb-2">{selectedLocation.address}</p>
                        <p className="text-green-600 text-xs">📍 Complete address has been filled in the "Complete Address" field below</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* ... (all your existing form fields remain unchanged) */}
                    <div>
                        <label className="block text-sm text-gray-600 w-full">Full name</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            maxLength="50"
                            className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                            required
                        />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.fullName}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 w-full">Phone number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter 10-digit phone number"
                            maxLength="10"
                            className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                            required
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.phone}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 w-full">Alternative phone number</label>
                        <input
                            type="tel"
                            value={formData.altPhone}
                            onChange={(e) => handleInputChange('altPhone', e.target.value)}
                            placeholder="Enter alternative phone (optional)"
                            maxLength="10"
                            className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                        />
                        {errors.altPhone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.altPhone}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 w-full">
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
                                    : 'bg-white border-gray-300'
                            }`}
                            required
                        />
                        {errors.houseNo && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.houseNo}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 w-full">
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
                                    : 'bg-white border-gray-300'
                            }`}
                            required
                        />
                        {errors.roadName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.roadName}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 w-full">
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
                                    : 'bg-white border-gray-300'
                            }`}
                        />
                        {errors.landmark && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.landmark}</p>}
                    </div>

                    <div className="flex gap-x-4">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">
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
                                        : 'bg-white border-gray-300'
                                }`}
                                required
                            />
                            {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.city}</p>}
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">
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
                                            : 'bg-white border-gray-300'
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

                    <div>
                        <label className="block text-sm text-gray-600 w-full">
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
                                    : 'bg-white border-gray-300'
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
                                onClick={() => {
                                    setSelected(btn);
                                    if (btn !== "Others") {
                                        setCustomAddressType('');
                                    }
                                }}
                                className={`px-4 py-1 rounded-full border ${selected === btn
                                    ? "bg-[#5C3FFF] text-white"
                                    : "bg-white text-black border-gray-300"
                                    }`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>

                    {selected === "Others" && (
                        <div className="mt-3">
                            <label className="block text-sm text-gray-600 w-full">
                                Specify address type (e.g., Gym, Friend's House)
                            </label>
                            <input
                                type="text"
                                value={customAddressType}
                                onChange={(e) => setCustomAddressType(e.target.value.trimStart())}
                                placeholder="Enter custom label"
                                maxLength="20"
                                className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 bg-white"
                            />
                            {customAddressType && !/^[a-zA-Z\s]{2,20}$/.test(customAddressType) && (
                                <p className="text-red-500 text-xs mt-1 ml-2">
                                    ⚠️ Must be 2–20 letters and spaces only
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#5C3FFF] text-white py-3 rounded-full font-medium mt-6 hover:bg-[#4A2FCC]"
                    >
                        {isEditing ? 'Update Address' : 'Add Address'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Address;