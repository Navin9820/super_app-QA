
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../SubPages/Header';
import Footer from '../SubPages/Footer'; // Added Footer import
import plus from '../../Icons/plus.svg';
import edit from '../../Icons/editicon.svg';
import { profileService } from '../../services/profileService';

function EditAllAddress() {
    const [profileAddress, setProfileAddress] = useState(null);
    const navigate = useNavigate();

    const loadProfileAddress = useCallback(() => {
        const profile = profileService.getProfile();
        if (profile && (profile.addressLine1 || profile.city || profile.state)) {
            const profileAddr = {
                fullName: profile.fullName || 'User',
                addressLine1: profile.addressLine1 || '',
                addressLine2: profile.addressLine2 || '',
                city: profile.city || '',
                state: profile.state || '',
                pincode: profile.pincode || '',
                selectedAddressType: 'Home',
                isFromProfile: true,
            };
            setProfileAddress(profileAddr);
        } else {
            setProfileAddress(null);
        }
    }, []);

    useEffect(() => {
        loadProfileAddress();
        window.addEventListener('focus', loadProfileAddress);
        return () => {
            window.removeEventListener('focus', loadProfileAddress);
        };
    }, [loadProfileAddress]);

    return (
        <div className='bg-[#F8F8F8] min-h-screen flex flex-col'>
            <Header />
            <div className="flex justify-between items-center px-4 pt-24">
                <h2 className="text-base font-medium">Delivery address</h2>
                <div className="flex items-center gap-2">
                    <img
                        src={plus}
                        alt="Add address"
                        className="cursor-pointer w-8 h-8"
                        onClick={() => navigate('/home-grocery/profile', { replace: true })}
                        aria-label="Add new address"
                    />
                </div>
            </div>
            <div className="mt-2 px-4 pb-16 flex-1">
                {profileAddress ? (
                    <div className="mt-3 bg-white border border-gray-300 rounded-[20px] p-1 flex flex-col justify-between h-full">
                        <div className="mt-2 p-2 rounded-lg">
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    {profileAddress.fullName},
                                    <span className="bg-[#544C4A] px-2 py-1 rounded-full text-white font-normal text-sm ml-2">
                                        {profileAddress.selectedAddressType}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="flex items-center space-x-1 cursor-pointer"
                                        onClick={() => navigate('/home-grocery/profile', { replace: true })}
                                        aria-label="Edit address"
                                    >
                                        <img src={edit} alt="Edit" className="w-4 h-4" />
                                        <span className="text-[#5C3FFF] font-semibold text-sm">Edit</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2">
                                {profileAddress.addressLine1 && (
                                    <div>{profileAddress.addressLine1}</div>
                                )}
                                {profileAddress.addressLine2 && (
                                    <div>{profileAddress.addressLine2}</div>
                                )}
                                <div>
                                    {profileAddress.city}, {profileAddress.state},<br />
                                    {profileAddress.pincode}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="mb-4 text-sm font-semibold">No address added yet.</div>
                        <div className="text-sm">Click the + icon to add your address in profile.</div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default EditAllAddress;
