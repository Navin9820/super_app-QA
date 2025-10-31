import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from "../SubPages/Header";
import step1 from "../Images/step1.svg";
import gps from "../Images/gps.svg";
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';

function EditAddressValues() {
    const [selected, setSelected] = useState("Home");
    const navigate = useNavigate();
    const location = useLocation();
    const { address, index } = location.state || {};

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

    // State variables for form fields, initialized with address data
    const [fullName, setFullName] = useState(address?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(address?.phoneNumber || '');
    const [altPhoneNumber, setAltPhoneNumber] = useState(address?.altPhoneNumber || '');
    const [houseNo, setHouseNo] = useState(address?.houseNo || '');
    const [roadName, setRoadName] = useState(address?.roadName || '');
    const [landmark, setLandmark] = useState(address?.landmark || '');
    const [city, setCity] = useState(address?.city || '');
    const [state, setState] = useState(address?.state || '');
    const [pincode, setPincode] = useState(address?.pincode || '');
    const [pincodeError, setPincodeError] = useState('');
    const [cityError, setCityError] = useState('');
    const [roadNameError, setRoadNameError] = useState('');
    const [stateError, setStateError] = useState('');
    const [landmarkError, setLandmarkError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [houseNoError, setHouseNoError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [altPhoneError, setAltPhoneError] = useState('');

    const sanitizePincode = (value) => value.replace(/\D/g, '').slice(0, 6);
    const validatePincode = (value) => /^\d{6}$/.test(value);

    // Function to sync address to all modules
    const syncAddressToAllModules = (addressData) => {
        try {
            // Create unified address format for profileService
            const unifiedAddress = {
                fullName: addressData.fullName,
                phone: addressData.phoneNumber,
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

            console.log('✅ Address synced to all modules from Grocery Edit');
        } catch (error) {
            console.error('❌ Failed to sync address to all modules:', error);
        }
    };

    const sanitizeCity = (value) => value.replace(/[^a-zA-Z\s]/g, '');
    const validateCity = (value) => /^[A-Za-z][A-Za-z\s]{1,49}$/.test(value.trim());

    const sanitizeRoadName = (value) => value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    const validateRoadName = (value) => /[A-Za-z0-9]{3,}/.test(value.trim());

    const sanitizeState = (value) => value.replace(/[^a-zA-Z\s]/g, '');
    const validateState = (value) => /^[A-Za-z][A-Za-z\s]{1,49}$/.test(value.trim());

    const sanitizeLandmark = (value) => value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    const validateLandmark = (value) => /[A-Za-z0-9]{3,}/.test(value.trim());

    const sanitizeFullName = (value) => value.replace(/[^a-zA-Z\s]/g, '');
    const validateFullName = (value) => /^[A-Za-z][A-Za-z\s]{1,49}$/.test(value.trim());

    const sanitizeHouseNo = (value) => value.replace(/[^a-zA-Z0-9\s#\/.-]/g, '');
    const validateHouseNo = (value) => /[A-Za-z0-9]{1,}/.test(value.trim());

    const sanitizePhone = (value) => value.replace(/\D/g, '').slice(0, 10);
    const validatePhone = (value) => /^\d{10}$/.test(value);

    useEffect(() => {
        if (address?.selectedAddressType) {
            setSelected(address.selectedAddressType);
        }
    }, [address]);

    const handleUpdate = () => {
        const isPinOk = validatePincode(pincode);
        const isCityOk = validateCity(city);
        const isRoadOk = validateRoadName(roadName);
        const isStateOk = validateState(state);
        const isFullNameOk = validateFullName(fullName);
        const isHouseOk = validateHouseNo(houseNo);
        const isPhoneOk = validatePhone(phoneNumber);
        const isAltPhoneOk = !altPhoneNumber || validatePhone(altPhoneNumber);
        const isLandmarkOk = !landmark || validateLandmark(landmark);

        setPincodeError(isPinOk ? '' : 'Enter a valid 6-digit pincode');
        setCityError(isCityOk ? '' : 'Enter a valid city name (letters only)');
        setRoadNameError(isRoadOk ? '' : 'Enter a detailed road/area name');
        setStateError(isStateOk ? '' : 'Enter a valid state name (letters only)');
        setFullNameError(isFullNameOk ? '' : 'Enter your full name (letters only)');
        setHouseNoError(isHouseOk ? '' : 'Enter house/building identifier');
        setPhoneError(isPhoneOk ? '' : 'Enter a valid 10-digit mobile number');
        setAltPhoneError(isAltPhoneOk ? '' : 'Enter a valid 10-digit alternate number');
        setLandmarkError(isLandmarkOk ? '' : 'Enter a valid landmark (min 3 letters/numbers) if provided');

        if (!isPinOk || !isCityOk || !isRoadOk || !isStateOk || !isFullNameOk || !isHouseOk || !isPhoneOk || !isAltPhoneOk || !isLandmarkOk) {
            return;
        }
        const updatedAddress = {
            fullName,
            phoneNumber,
            altPhoneNumber,
            houseNo,
            roadName,
            landmark,
            city,
            state,
            pincode,
            selectedAddressType: selected
        };

        const existingAddresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
        existingAddresses[index] = updatedAddress;
        localStorage.setItem('userAddresses', JSON.stringify(existingAddresses));

        // Sync address to all modules (hotel, food, clothes, taxi, etc.)
        syncAddressToAllModules(updatedAddress);
        
        // Trigger custom event to notify profile components to refresh
        window.dispatchEvent(new CustomEvent('addressUpdated', { 
            detail: { addressData: updatedAddress } 
        }));

        navigate('/home-grocery/edit-all-addresses', { replace: true });
    };

    const buttons = ["Home", "Office", "Others"];

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <Header />
            {/* <div className='border border-[#E1E1E1] py-4'>
                <img src={step1} alt="" className='w-full mt-20 px-6' />
            </div > */}
            <div className="flex justify-between items-center px-4 pt-24">
                <h2 className="text-base font-medium">Edit delivery address</h2>
                <div className="flex items-center gap-2"> {/* Added flex, items-center & gap */}
                    <span className='text-[#888888] text-xs font-normal'>Add Location</span>
                    <img src={gps} alt="Close" className="cursor-pointer w-8 h-8" />
                </div>
            </div>
            <div className='px-4 pb-16'>
                <div className='pt-2'>
                    <label className="mt-4 block text-sm text-gray-600 w-full">Full name<span className="text-gray-600">*</span></label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                            const val = sanitizeFullName(e.target.value);
                            setFullName(val);
                            setFullNameError(validateFullName(val) ? '' : 'Enter your full name (letters only)');
                        }}
                        required
                        className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${fullNameError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {fullNameError && (
                        <p className="text-red-600 text-xs mt-1">{fullNameError}</p>
                    )}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Phone number<span className="text-gray-600">*</span></label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phoneNumber}
                        onChange={(e) => {
                            const val = sanitizePhone(e.target.value);
                            setPhoneNumber(val);
                            setPhoneError(validatePhone(val) ? '' : 'Enter a valid 10-digit mobile number');
                        }}
                        required
                        className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${phoneError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {phoneError && (
                        <p className="text-red-600 text-xs mt-1">{phoneError}</p>
                    )}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Alternative phone number</label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={altPhoneNumber}
                        onChange={(e) => {
                            const val = sanitizePhone(e.target.value);
                            setAltPhoneNumber(val);
                            setAltPhoneError(!val || validatePhone(val) ? '' : 'Enter a valid 10-digit alternate number');
                        }}
                        className={` bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${altPhoneError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {altPhoneError && (
                        <p className="text-red-600 text-xs mt-1">{altPhoneError}</p>
                    )}

                    <label className="mt-4 block text-sm text-gray-600 w-full">House no, Building name*</label>
                    <input
                        type="text"
                        value={houseNo}
                        onChange={(e) => {
                            const val = sanitizeHouseNo(e.target.value);
                            setHouseNo(val);
                            setHouseNoError(validateHouseNo(val) ? '' : 'Enter house/building identifier');
                        }}
                        className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${houseNoError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {houseNoError && (
                        <p className="text-red-600 text-xs mt-1">{houseNoError}</p>
                    )}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Road name, Area, Colony*</label>
                    <input
                        type="text"
                        value={roadName}
                        onChange={(e) => {
                            const val = sanitizeRoadName(e.target.value);
                            setRoadName(val);
                            setRoadNameError(validateRoadName(val) ? '' : 'Enter a detailed road/area name');
                        }}
                        className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${roadNameError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {roadNameError && (
                        <p className="text-red-600 text-xs mt-1">{roadNameError}</p>
                    )}

                    <label className="mt-4 block text-sm text-gray-600 w-full">Near by landmark
                        <span className="text-gray-500 text-sm ml-1">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={landmark}
                        onChange={(e) => {
                            const val = sanitizeLandmark(e.target.value);
                            setLandmark(val);
                            setLandmarkError(!val || validateLandmark(val) ? '' : 'Enter a valid landmark (min 3 letters/numbers) if provided');
                        }}
                        placeholder="Enter nearby landmark (optional)"
                        className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${landmarkError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {landmarkError && (
                        <p className="text-red-600 text-xs mt-1">{landmarkError}</p>
                    )}

                    <div className="flex gap-x-4 mt-4">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">City*</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => {
                                    const val = sanitizeCity(e.target.value);
                                    setCity(val);
                                    setCityError(validateCity(val) ? '' : 'Enter a valid city name (letters only)');
                                }}
                                className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${cityError ? 'border-red-500 border' : 'border border-gray-300'}`}
                            />
                            {cityError && (
                                <p className="text-red-600 text-xs mt-1">{cityError}</p>
                            )}
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">State*</label>
                            <select
                                value={state}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setState(val);
                                    setStateError(val ? '' : 'Please select a state');
                                }}
                                className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 text-base min-h-[44px] ${stateError ? 'border-red-500 border' : 'border border-gray-300'}`}
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
                            {stateError && (
                                <p className="text-red-600 text-xs mt-1">{stateError}</p>
                            )}
                        </div>
                    </div>

                    <label className="mt-4 block text-sm text-gray-600 w-full">Pincode*</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => {
                            const val = sanitizePincode(e.target.value);
                            setPincode(val);
                            setPincodeError(validatePincode(val) ? '' : 'Enter a valid 6-digit pincode');
                        }}
                        className={`bg-white w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1 ${pincodeError ? 'border-red-500 border' : 'border border-gray-300'}`}
                    />
                    {pincodeError && (
                        <p className="text-red-600 text-xs mt-1">{pincodeError}</p>
                    )}
                </div>

                <div className='font-medium text-base  pt-4'>Select Type</div>

                <div className="flex space-x-2  pt-2">
                    {buttons.map((btn) => (
                        <button
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
                <button
                    onClick={handleUpdate}
                    disabled={Boolean(pincodeError || cityError || roadNameError || stateError || fullNameError || houseNoError || phoneError || altPhoneError || landmarkError) ||
                        !validatePincode(pincode) ||
                        !validateCity(city) ||
                        !validateRoadName(roadName) ||
                        !validateState(state) ||
                        !validateFullName(fullName) ||
                        !validateHouseNo(houseNo) ||
                        !validatePhone(phoneNumber) ||
                        !validateLandmark(landmark) ||
                        (altPhoneNumber ? !validatePhone(altPhoneNumber) : false)}
                    className={`w-full px-4 py-2 text-white rounded-[50px] mt-6 ${Boolean(pincodeError || cityError || roadNameError || stateError || fullNameError || houseNoError || phoneError || altPhoneError || landmarkError) ||
                        !validatePincode(pincode) || !validateCity(city) || !validateRoadName(roadName) || !validateState(state) || !validateFullName(fullName) || !validateHouseNo(houseNo) || !validatePhone(phoneNumber) || !validateLandmark(landmark) || (altPhoneNumber ? !validatePhone(altPhoneNumber) : false)
                        ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#5C3FFF]'}`} >
                    Save Changes
                </button>
            </div>
        </div>
    )
}

export default EditAddressValues;