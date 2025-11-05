import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from "../SubPages/Header";
import step1 from "../Images/step1.svg";
import gps from "../Images/gps.svg";
import AddressPicker from '../../Components/maps/AddressPicker';
import { profileService } from '../../services/profileService';

function Address() {
    const navigate = useNavigate();
    const location = useLocation();
    const { address: editAddress, index: editIndex } = location.state || {};

    const isEditing = editAddress !== undefined && editIndex !== undefined;

    const [selected, setSelected] = useState(editAddress?.selectedAddressType || "Home");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);

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

    const citiesByState = {
        'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Erode','Vellore','Dharmapuri'],
        'Karnataka': ['Bengaluru','Mysuru','Mangaluru','Hubballi'],
        'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode'],
        'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik'],
        'Delhi': ['New Delhi'],
        'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot'],
        'West Bengal': ['Kolkata','Howrah','Durgapur'],
        'Rajasthan': ['Jaipur','Jodhpur','Udaipur'],
        'Uttar Pradesh': ['Lucknow','Kanpur','Varanasi','Noida'],
        'Madhya Pradesh': ['Indore','Bhopal','Jabalpur'],
        'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur'],
        'Telangana': ['Hyderabad','Warangal']
    };

    const buttons = ["Home", "Office", "Others"];

    // Function to sync address to all modules (only for "Home" type)
    const syncAddressToAllModules = (addressData) => {
        try {
            const unifiedAddress = {
                fullName: addressData.fullName,
                phone: addressData.phone,
                addressLine1: addressData.houseNo,
                addressLine2: addressData.roadName || addressData.landmark,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                country: 'India'
            };

            const currentProfile = profileService.getProfile() || {};
            profileService.saveProfile({ ...currentProfile, ...unifiedAddress });
            console.log('✅ Address synced to profile');
        } catch (error) {
            console.error('❌ Failed to sync address:', error);
        }
    };

    const [formData, setFormData] = useState({
        fullName: editAddress?.fullName || '',
        phone: editAddress?.phoneNumber || '',
        altPhone: editAddress?.altPhoneNumber || '',
        houseNo: editAddress?.houseNo || '',
        roadName: editAddress?.roadName || '',
        landmark: editAddress?.landmark || '',
        city: editAddress?.city || '',
        state: editAddress?.state || '',
        pincode: editAddress?.pincode || ''
    });

    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Handle input changes with sanitization
    const handleInputChange = (field, value) => {
        let processedValue = value;

        if (field === 'phone' || field === 'altPhone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        } else if (field === 'pincode') {
            processedValue = value.replace(/\D/g, '').slice(0, 6);
        } else if (['fullName', 'city', 'state'].includes(field)) {
            processedValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim() || formData.fullName.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
            newErrors.fullName = 'Enter a valid full name';
        }
        if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Enter a valid 10-digit phone number';
        }
        if (formData.altPhone.trim() && !/^\d{10}$/.test(formData.altPhone.trim())) {
            newErrors.altPhone = 'Enter a valid 10-digit alternate number';
        }
        if (!formData.houseNo.trim() || formData.houseNo.trim().length < 5) {
            newErrors.houseNo = 'Enter complete address (min 5 characters)';
        }
        if (!formData.roadName.trim() || formData.roadName.trim().length < 3) {
            newErrors.roadName = 'Enter road/area name (min 3 characters)';
        }
        if (formData.landmark.trim() && formData.landmark.trim().length < 3) {
            newErrors.landmark = 'Landmark must be at least 3 characters';
        }
        if (!formData.city.trim() || formData.city.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(formData.city.trim())) {
            newErrors.city = 'Enter a valid city';
        }
        if (!formData.state.trim() || formData.state.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(formData.state.trim())) {
            newErrors.state = 'Enter a valid state';
        }
        if (!formData.pincode.trim() || !/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
            newErrors.pincode = 'Enter a valid 6-digit pincode';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle map selection
    const handleLocationSelect = (location) => {
        if (!location) return;
        setSelectedLocation(location);

        const fullAddress = location.address || '';
        let roadName = '', landmark = '', city = '', state = '', pincode = '';

        if (location.components) {
            const comps = location.components;
            const route = comps.find(c => c.types?.includes('route'))?.long_name || '';
            const sublocality = comps.find(c => c.types?.includes('sublocality'))?.long_name || '';
            const locality = comps.find(c => c.types?.includes('locality'))?.long_name || '';
            const adminArea = comps.find(c => c.types?.includes('administrative_area_level_1'))?.long_name || '';
            const postal = comps.find(c => c.types?.includes('postal_code'))?.long_name || '';

            roadName = route || sublocality || locality;
            landmark = sublocality || locality;
            city = locality || adminArea;
            state = adminArea;
            pincode = postal;
        }

        setFormData(prev => ({
            ...prev,
            houseNo: fullAddress,
            roadName,
            landmark,
            city,
            state,
            pincode
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const newAddress = {
            fullName: formData.fullName,
            phoneNumber: formData.phone,
            altPhoneNumber: formData.altPhone,
            houseNo: formData.houseNo,
            roadName: formData.roadName,
            landmark: formData.landmark,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            selectedAddressType: selected
        };

        const existingAddresses = JSON.parse(localStorage.getItem('userAddresses')) || [];

        if (isEditing) {
            existingAddresses[editIndex] = newAddress;
        } else {
            existingAddresses.push(newAddress);
        }

        localStorage.setItem('userAddresses', JSON.stringify(existingAddresses));

        // Sync to profile only if it's "Home"
        if (selected === 'Home') {
            syncAddressToAllModules({
                ...newAddress,
                phone: formData.phone
            });
        }

        window.dispatchEvent(new CustomEvent('addressUpdated'));

        showToast('Address saved successfully!', 'success');

        if (isEditing) {
            navigate('/home-grocery/edit-all-addresses', { replace: true });
        } else {
            navigate('/home-grocery/payment-enhanced', { replace: true });
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
                    toast.type === 'success' ? 'bg-blue-600' : 'bg-red-500'
                }`}>
                    <div className="flex items-center space-x-2">
                        <span>{toast.message}</span>
                        <button onClick={() => setToast({ show: false, message: '', type: 'success' })}>×</button>
                    </div>
                </div>
            )}

            <Header />
            <div className='border border-[#E1E1E1] py-4'>
                <img src={step1} alt="" className='w-full mt-20 px-6' />
            </div>

            <div className="flex justify-between items-center px-4 pt-2">
                <h2 className="text-sm font-semibold">
                    {isEditing ? 'Edit delivery address' : 'Add delivery address'}
                </h2>
                <div className="flex items-center gap-2">
                    <span className='text-[#888888] text-xs font-normal'>Add Location</span>
                    <button
                        onClick={() => setShowMapPicker(!showMapPicker)}
                        className="cursor-pointer w-8 h-8 flex items-center justify-center"
                    >
                        <img src={gps} alt="GPS" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className='px-4 pb-16'>
                {showMapPicker && (
                    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="text-lg font-semibold mb-3">📍 Select Delivery Location</h3>
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
                            <span>✅</span>
                            <span className="font-semibold text-green-800">Location Selected</span>
                        </div>
                        <p className="text-green-700 text-sm">{selectedLocation.address}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold">Full name*</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.fullName}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold">Phone number*</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.phone}</p>}
                    </div>

                    {/* Alt Phone */}
                    <div>
                        <label className="block text-sm font-semibold">Alternative phone number</label>
                        <input
                            type="tel"
                            value={formData.altPhone}
                            onChange={(e) => handleInputChange('altPhone', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
                        />
                        {errors.altPhone && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.altPhone}</p>}
                    </div>

                    {/* Complete Address */}
                    <div>
                        <label className="block text-sm font-semibold">
                            Complete Address*
                            {selectedLocation && formData.houseNo && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.houseNo}
                            onChange={(e) => handleInputChange('houseNo', e.target.value)}
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                selectedLocation && formData.houseNo
                                    ? 'bg-green-50 border-green-300'
                                    : errors.houseNo
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.houseNo && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.houseNo}</p>}
                    </div>

                    {/* Road Name */}
                    <div>
                        <label className="block text-sm font-semibold">
                            Road name, Area, Colony*
                            {selectedLocation && formData.roadName && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.roadName}
                            onChange={(e) => handleInputChange('roadName', e.target.value)}
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                selectedLocation && formData.roadName
                                    ? 'bg-green-50 border-green-300'
                                    : errors.roadName
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.roadName && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.roadName}</p>}
                    </div>

                    {/* Landmark */}
                    <div>
                        <label className="block text-sm font-semibold">
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
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                selectedLocation && formData.landmark
                                    ? 'bg-green-50 border-green-300'
                                    : errors.landmark
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                            }`}
                        />
                        {errors.landmark && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.landmark}</p>}
                    </div>

                    {/* City & State */}
                    <div className="flex gap-x-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-semibold">City*</label>
                            <input
                                list="grocery-city-list"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                    selectedLocation && formData.city
                                        ? 'bg-green-50 border-green-300'
                                        : errors.city
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                }`}
                                required
                            />
                            <datalist id="grocery-city-list">
                                {(citiesByState[formData.state] || []).map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                            {errors.city && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.city}</p>}
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-semibold">State*</label>
                            <select
                                value={formData.state}
                                onChange={(e) => {
                                    handleInputChange('state', e.target.value);
                                    if (!citiesByState[e.target.value]?.includes(formData.city)) {
                                        setFormData(prev => ({ ...prev, city: '' }));
                                    }
                                }}
                                className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 text-base min-h-[44px] ${
                                    selectedLocation && formData.state
                                        ? 'bg-green-50 border-green-300'
                                        : errors.state
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
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
                                    paddingRight: '40px'
                                }}
                                required
                            >
                                <option value="">Select State</option>
                                {indianStates.map(stateOption => (
                                    <option key={stateOption} value={stateOption}>
                                        {stateOption}
                                    </option>
                                ))}
                            </select>
                            {errors.state && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.state}</p>}
                        </div>
                    </div>

                    {/* Pincode */}
                    <div>
                        <label className="block text-sm font-semibold">
                            Pincode*
                            {selectedLocation && formData.pincode && (
                                <span className="text-green-600 text-xs ml-2">📍 Auto-filled</span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                            className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 ${
                                selectedLocation && formData.pincode
                                    ? 'bg-green-50 border-green-300'
                                    : errors.pincode
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.pincode && <p className="text-red-500 text-xs mt-1 ml-2">⚠️ {errors.pincode}</p>}
                    </div>

                    {/* Address Type */}
                    <div className='font-semibold text-sm pt-4'>Select Type</div>
                    <div className="flex space-x-2 pt-2">
                        {buttons.map((btn) => (
                            <button
                                key={btn}
                                type="button"
                                onClick={() => setSelected(btn)}
                                className={`px-4 py-1 rounded-full border ${
                                    selected === btn
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-black border-gray-300"
                                }`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold mt-6 hover:bg-blue-700"
                    >
                        {isEditing ? 'Save Changes' : 'Continue to Payment'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Address;