import React from 'react';
import { useState } from "react";
import step1 from "../../Clothes/Images/step1.svg";
import gps from "../../Clothes/Images/gps.svg";
import { useNavigate } from 'react-router-dom';
import HeaderInsideFood from '../ComponentsF/HeaderInsideFood';
import AddressPicker from '../../Components/maps/AddressPicker';

function EditDilveryAddressFood() {
    const [selected, setSelected] = useState("Home");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);

    const buttons = ["Home", "Office", "Others"];
    const navigate = useNavigate();

    // Handle location selection from map
    const handleLocationSelect = (location) => {
        // Check if location is valid
        if (!location) {
            console.warn('Location is null or undefined');
            return;
        }
        
        setSelectedLocation(location);
        // You can add auto-fill logic here if needed
    };
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideFood />
            {/* <div className='border border-[#E1E1E1] py-4'>
                <img src={step1} alt="" className='w-full mt-20 px-6' />
            </div > */}
            <div className=" flex justify-between items-center px-4 pt-24">
                <h2 className="text-base font-medium">Add delivery address</h2>
                <div className="flex items-center gap-2"> {/* Added flex, items-center & gap */}
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
                    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-orange-200">
                        <h3 className="text-lg font-semibold mb-3 text-orange-800">
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
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-orange-600">✅</span>
                            <span className="font-medium text-orange-800">Location Selected</span>
                        </div>
                        <p className="text-orange-700 text-sm">{selectedLocation.address}</p>
                    </div>
                )}

                <div className='pt-2'>
                    <label className="mt-4 block text-sm text-gray-600 w-full">Full name</label>
                    <input
                        type="text"
                        className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />

                    <label className="mt-4 block text-sm text-gray-600 w-full">Phone number</label>
                    <input
                        type="number"
                        className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />

                    <label className="mt-4 block text-sm text-gray-600 w-full">Alternative phone number</label>
                    <input
                        type="number"
                        className=" bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />

                    <label className="mt-4 block text-sm text-gray-600 w-full">House no, Building name*</label>
                    <input
                        type="text"
                        className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />

                    <label className="mt-4 block text-sm text-gray-600 w-full">Road name, Area, Colony*</label>
                    <input
                        type="text"
                        className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />

                    <label className="mt-4 block text-sm text-gray-600 w-full">Near by landmark*</label>
                    <input
                        type="text"
                        className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />

                    <div className="flex gap-x-4 mt-4">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">City*</label>
                            <input
                                type="text"
                                className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-600">State*</label>
                            <input
                                type="text"
                                className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                            />
                        </div>
                    </div>

                    <label className="mt-4 block text-sm text-gray-600 w-full">Pincode*</label>
                    <input
                        type="text"
                        className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                    />
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
                    onClick={() => navigate('/home-food/edit-option-all-address')}
                    className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6" >
                    Dropping Place
                </button>
            </div>
        </div>
    )
}

export default EditDilveryAddressFood;