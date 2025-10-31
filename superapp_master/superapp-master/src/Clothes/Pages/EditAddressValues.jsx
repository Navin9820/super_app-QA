import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClothesHeader from '../Header/ClothesHeader';
import step1 from '../Images/step1.svg';
import gps from '../Images/gps.svg';
import AddressPicker from '../../Components/maps/AddressPicker';
import { profileService } from '../../services/profileService';

function EditAddressValues() {
  const [selected, setSelected] = useState('Home');
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
    pincode: '',
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // List of all Indian states and union territories
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  ];

  const buttons = ['Home', 'Office', 'Others'];
  const navigate = useNavigate();
  const location = useLocation();

  // Load address data on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const index = urlParams.get('index');

    if (index !== null) {
      setIsEditing(true);
      setEditIndex(parseInt(index));
      loadAddressForEdit(parseInt(index));
    } else {
      loadProfileData();
    }
  }, [location]);

  const loadAddressForEdit = (index) => {
    try {
      const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
      if (addresses[index]) {
        const address = addresses[index];
        setFormData({
          fullName: address.fullName || '',
          phone: address.phoneNumber || '',
          altPhone: address.altPhoneNumber || '',
          houseNo: address.houseNo || '',
          roadName: address.roadName || '',
          landmark: address.landmark || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
        });
        const addressType = address.selectedAddressType || address.addressType || 'Home';
        if (!['Home', 'Office'].includes(addressType)) {
          setSelected('Others');
          setCustomAddressType(addressType);
        } else {
          setSelected(addressType);
          setCustomAddressType('');
        }
      }
    } catch (error) {
      console.error('Error loading address for edit:', error);
    }
  };

  const loadProfileData = () => {
    const profile = profileService.getProfile();
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        altPhone: '',
        houseNo: profile.addressLine1 || '',
        roadName: profile.addressLine2 || '',
        landmark: '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
      });
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    let processedValue = value;

    if (field === 'phone' || field === 'altPhone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    if (field === 'pincode') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }
    if (field === 'fullName' || field === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle custom address type input
  const handleCustomAddressTypeChange = (value) => {
    setCustomAddressType(value);
    if (errors.selectedAddressType) {
      setErrors((prev) => ({ ...prev, selectedAddressType: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 1) {
      newErrors.fullName = 'Name must be at least 1 character';
    } else if (formData.fullName.trim().length > 20) {
      newErrors.fullName = 'Name must not exceed 20 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Name can only contain letters and spaces';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be 10 digits and start with 6, 7, 8, or 9';
    }

    if (formData.altPhone.trim() && !/^[6-9]\d{9}$/.test(formData.altPhone.trim())) {
      newErrors.altPhone = 'Alternative phone number must be 10 digits and start with 6, 7, 8, or 9';
    }

    if (!formData.houseNo.trim()) {
      newErrors.houseNo = 'Address is required';
    } else if (formData.houseNo.trim().length < 5) {
      newErrors.houseNo = 'Address must be at least 5 characters';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.city.trim())) {
      newErrors.city = 'City can only contain letters and spaces';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9]\d{5}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be a valid 6-digit number (cannot start with 0)';
    }

    if (formData.landmark.trim() && formData.landmark.trim().length < 3) {
      newErrors.landmark = 'Landmark must be at least 3 characters if provided';
    }

    if (selected === 'Others' && !customAddressType.trim()) {
      newErrors.selectedAddressType = 'Custom address type is required when "Others" is selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const addressData = {
      selectedAddressType: selected === 'Others' ? customAddressType : selected,
      fullName: formData.fullName,
      phoneNumber: formData.phone,
      altPhoneNumber: formData.altPhone,
      houseNo: formData.houseNo,
      roadName: formData.roadName,
      landmark: formData.landmark,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: 'India',
      location: selectedLocation,
    };

    try {
      const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');

      if (isEditing && editIndex !== null) {
        addresses[editIndex] = addressData;
        console.log('✅ Updated address at index:', editIndex);
      } else {
        addresses.push(addressData);
        console.log('✅ Added new address');
      }

      localStorage.setItem('userAddresses', JSON.stringify(addresses));

      syncAddressToAllModules(addressData);

      window.dispatchEvent(new CustomEvent('addressUpdated'));

      navigate('/home-clothes/edit-all-addresses');
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  // Function to sync address to all modules
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
        country: 'India',
      };

      const currentProfile = profileService.getProfile();
      const updatedProfile = {
        ...currentProfile,
        ...unifiedAddress,
      };

      profileService.saveProfile(updatedProfile);

      console.log('✅ Address synced to all modules from Clothes Edit');
    } catch (error) {
      console.error('❌ Failed to sync address to all modules:', error);
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (location) => {
    if (!location) {
      console.warn('Location is null or undefined');
      return;
    }

    setSelectedLocation(location);
    if (location.city) {
      setFormData((prev) => ({ ...prev, city: location.city }));
    }
    if (location.state) {
      setFormData((prev) => ({ ...prev, state: location.state }));
    }
    if (location.pincode) {
      setFormData((prev) => ({ ...prev, pincode: location.pincode }));
    }
  };

  return (
    <div className="bg-[#F8F8F8] min-h-screen">
      <ClothesHeader />
      <div className="flex justify-between items-center px-4 pt-24">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium">
            {isEditing ? 'Edit delivery address' : 'Add delivery address'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888888] text-xs font-normal">Add Location</span>
          <button
            onClick={() => setShowMapPicker(!showMapPicker)}
            className="cursor-pointer w-8 h-8 flex items-center justify-center"
          >
            <img src={gps} alt="GPS Location" className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-16">
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
              <span className="font-medium text-green-800">Location Selected</span>
            </div>
            <p className="text-green-700 text-sm">{selectedLocation.address}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pt-2 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 w-full">
              Full name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your full name (1-20 characters)"
              maxLength="20"
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 w-full">
              Phone number<span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number (starts with 6, 7, 8, or 9)"
              maxLength="10"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 w-full">Alternative phone number</label>
            <input
              type="tel"
              value={formData.altPhone}
              onChange={(e) => handleInputChange('altPhone', e.target.value)}
              className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.altPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter alternative phone number (starts with 6, 7, 8, or 9)"
              maxLength="10"
            />
            {errors.altPhone && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.altPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 w-full">
              House no, Building name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.houseNo}
              onChange={(e) => handleInputChange('houseNo', e.target.value)}
              className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.houseNo ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter house number and building name"
              maxLength="100"
            />
            {errors.houseNo && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.houseNo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 w-full">Road name, Area, Colony</label>
            <input
              type="text"
              value={formData.roadName}
              onChange={(e) => handleInputChange('roadName', e.target.value)}
              className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
              placeholder="Enter road name, area, colony"
              maxLength="100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 w-full">
              Near by landmark
              <span className="text-gray-500 text-sm ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => handleInputChange('landmark', e.target.value)}
              className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.landmark ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter nearby landmark (optional)"
              maxLength="50"
            />
            {errors.landmark && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.landmark}</p>
            )}
          </div>

          <div className="flex gap-x-4 mt-4">
            <div className="w-1/2">
              <label className="block text-sm text-gray-600">
                City<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                  errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter city"
                maxLength="50"
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.city}</p>
              )}
            </div>
            <div className="w-1/2">
              <label className="block text-sm text-gray-600">
                State<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                  errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                style={{
                  fontSize: '16px',
                  minHeight: '44px',
                  appearance: 'none',
                  backgroundImage:
                    'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.state}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 w-full">
              Pincode<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                errors.pincode ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter pincode"
              maxLength="6"
            />
            {errors.pincode && (
              <p className="text-red-500 text-xs mt-1 ml-2">{errors.pincode}</p>
            )}
          </div>

          <div className="font-medium text-base pt-4">Select Type</div>

          <div className="flex space-x-2 pt-2">
            {buttons.map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  setSelected(btn);
                  if (btn !== 'Others') {
                    setCustomAddressType('');
                    setErrors((prev) => ({ ...prev, selectedAddressType: '' }));
                  }
                }}
                className={`px-4 py-1 rounded-full border ${
                  selected === btn
                    ? 'bg-[#5C3FFF] text-white'
                    : 'bg-white text-black border-gray-300'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>

          {selected === 'Others' && (
            <div className="mt-4">
              <label className="block text-sm text-gray-600 w-full">
                Custom Address Type<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customAddressType}
                onChange={(e) => handleCustomAddressTypeChange(e.target.value)}
                className={`bg-white w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${
                  errors.selectedAddressType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter custom address type (e.g., Shop, Guest House)"
                maxLength="50"
              />
              {errors.selectedAddressType && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.selectedAddressType}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6"
          >
            {isEditing ? 'Update Address' : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditAddressValues;