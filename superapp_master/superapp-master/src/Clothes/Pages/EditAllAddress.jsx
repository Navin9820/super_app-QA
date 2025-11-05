import React from 'react';
import { useState, useEffect } from "react";
import ClothesHeader from "../Header/ClothesHeader";
import step1 from "../Images/step1.svg"; // Not used, but kept for context
import gps from "../Images/gps.svg"; // Not used, but kept for context
import { useNavigate } from 'react-router-dom';
import plus from "../../Icons/plus.svg";
import edit from "../../Icons/editicon.svg";
import { profileService } from '../../services/profileService';
// Assuming your Footer component is located at this path
import Footer from '../../Utility/Footer'; // <--- New Import

function EditAllAddress() {
    const [addresses, setAddresses] = useState([]);
    const [profile, setProfile] = useState({
        fullName: '',
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        selected: 'Home'
    });

    const navigate = useNavigate();

    // Load addresses and profile data on component mount
    useEffect(() => {
        loadAddresses();
        loadProfile();
        
        // Listen for address updates
        const handleAddressUpdate = () => {
            console.log('🔄 Address update event received, reloading addresses...');
            loadAddresses();
        };
        
        window.addEventListener('addressUpdated', handleAddressUpdate);
        return () => {
            window.removeEventListener('addressUpdated', handleAddressUpdate);
        };
    }, []);

    const loadAddresses = () => {
        try {
            const savedAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
            console.log('📋 Loaded addresses:', savedAddresses);
            setAddresses(savedAddresses);
        } catch (error) {
            console.error('Error loading addresses:', error);
            setAddresses([]);
        }
    };

    const loadProfile = () => {
        try {
            const userProfile = profileService.getProfile();
            if (userProfile) {
                setProfile(userProfile);
            }
        } catch (error) {
            console.warn('Failed to load profile data:', error);
            setProfile({
                fullName: '',
                addressLine1: '',
                city: '',
                state: '',
                country: '',
                pincode: '',
                selected: 'Home'
            });
        }
    };

    const handleDeleteAddress = (index) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
                addresses.splice(index, 1);
                localStorage.setItem('userAddresses', JSON.stringify(addresses));
                
                // Update the addresses state
                setAddresses(addresses);
                
                // Trigger address update event
                window.dispatchEvent(new CustomEvent('addressUpdated'));
                
                console.log('✅ Address deleted successfully');
            } catch (error) {
                console.error('Error deleting address:', error);
            }
        }
    };


    return (
        <div className='bg-[#F8F8F8] min-h-screen relative'>
            <ClothesHeader />
            
            <div className='px-4 pt-24 pb-20'> {/* Added pb-20 for footer spacing */}
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-medium">Delivery address</h2>
                        <span className="text-sm text-gray-500">({addresses.length} saved)</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <img 
  src={plus} 
  alt="plus" 
  className="cursor-pointer w-8 h-8" 
  onClick={() => {
    // Always go to NEW address form (not edit)
    navigate('/home-clothes/address');
  }} 
/>
                    </div>
                </div>

                {/* Address Cards */}
                {addresses.length === 0 ? (
                    <div className="mt-6 text-center py-8">
                        <div className="text-gray-500 text-sm mb-4">No addresses saved yet</div>
                        <div className="text-gray-400 text-xs">Tap the + icon to create your first address</div>
                    </div>
                ) : (
                    <div className="mt-3 space-y-3">
                        {addresses.map((address, index) => (
                            <div key={index} className="bg-white border border-gray-300 rounded-[20px] p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-sm">
                                                {address.fullName || address.name || 'Unnamed Address'}
                                            </span>
                                            <span className="bg-[#544C4A] px-2 py-1 rounded-full text-white font-normal text-xs">
                                                {address.selectedAddressType || address.addressType || 'Home'}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-700 leading-relaxed">
                                            {address.houseNo || address.address_line1 || address.address || 'No address'}<br />
                                            {address.roadName && `${address.roadName}, `}
                                            {address.landmark && `${address.landmark}, `}
                                            {address.city && address.state ? `${address.city}, ${address.state}` : 
                                                address.city || address.state || ''}<br />
                                            {address.country && address.pincode ? `${address.country} - ${address.pincode}` : 
                                                address.country || address.pincode || ''}
                                        </div>

                                        {address.phoneNumber && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                📞 {address.phoneNumber}
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit button */}
                                    <div className="ml-4">
                                        <div 
                                            className="flex items-center space-x-1 cursor-pointer" 
                                            onClick={() => navigate(`/home-clothes/edit-address-values?index=${index}`)}
                                        >
                                            <img src={edit} alt="edit" className="w-4 h-4" />
                                            <span className='text-sm font-semibold text-[#5C3FFF]'>Edit</span> 
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Delete button at bottom */}
                                <div className="flex justify-end pt-1 border-t border-gray-100">
                                    <div 
                                        className="flex items-center space-x-1 cursor-pointer" 
                                        onClick={() => handleDeleteAddress(index)}
                                    >
                                        <span className="text-red-500 text-lg">🗑️</span>
                                        <span className='text-sm font-semibold text-red-500'>Delete</span> 
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
            
            {/* Footer Component */}
            <Footer /> {/* <--- New Component */}
        </div>
    )
}

export default EditAllAddress;