import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../SubPages/Header';
import Footer from '../SubPages/Footer';
import plus from '../../Icons/plus.svg';
import edit from '../../Icons/editicon.svg';
import trash from '../../Icons/image.png'; // Add a trash icon

function EditAllAddress() {
    const [addresses, setAddresses] = useState([]);
    const navigate = useNavigate();

    const loadAddresses = () => {
        const saved = JSON.parse(localStorage.getItem('userAddresses')) || [];
        setAddresses(saved);
    };

    useEffect(() => {
        loadAddresses();
        const handler = () => loadAddresses();
        window.addEventListener('addressUpdated', handler);
        window.addEventListener('focus', handler);
        return () => {
            window.removeEventListener('addressUpdated', handler);
            window.removeEventListener('focus', handler);
        };
    }, []);

    const handleDelete = (index) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            const updated = addresses.filter((_, i) => i !== index);
            localStorage.setItem('userAddresses', JSON.stringify(updated));
            setAddresses(updated);

            // If deleted address was "Home", sync first "Home" or first address to profile
            const homeAddr = updated.find(a => a.selectedAddressType === 'Home');
            if (homeAddr) {
                syncToProfile(homeAddr);
            } else if (updated.length > 0) {
                syncToProfile(updated[0]);
            }
        }
    };

    const syncToProfile = (addr) => {
        const { profileService } = require('../../services/profileService');
        const profile = profileService.getProfile() || {};
        profileService.saveProfile({
            ...profile,
            fullName: addr.fullName,
            phone: addr.phoneNumber,
            addressLine1: addr.houseNo,
            addressLine2: addr.roadName,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
        });
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen flex flex-col'>
            <Header />
            <div className="flex justify-between items-center px-4 pt-24">
                <h2 className="text-base font-medium">Delivery addresses</h2>
                <div className="flex items-center gap-2">
                    <img
                        src={plus}
                        alt="Add address"
                        className="cursor-pointer w-8 h-8"
                        onClick={() => navigate('/home-grocery/address')}
                        aria-label="Add new address"
                    />
                </div>
            </div>
            <div className="mt-2 px-4 pb-16 flex-1">
                {addresses.length > 0 ? (
                    <div className="space-y-3">
                        {addresses.map((addr, index) => (
                            <div key={index} className="bg-white border border-gray-300 rounded-[20px] p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">{addr.fullName}</div>
                                        <span className="bg-[#544C4A] px-2 py-1 rounded-full text-white text-xs mt-1 inline-block">
                                            {addr.selectedAddressType}
                                        </span>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => navigate('/home-grocery/address', { state: { address: addr, index } })}
                                            className="flex items-center space-x-1 text-[#5C3FFF]"
                                        >
                                            <img src={edit} alt="Edit" className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="flex items-center space-x-1 text-red-500"
                                        >
                                            <img src={trash} alt="Delete" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-700">
                                    {addr.houseNo && <div>{addr.houseNo}</div>}
                                    {addr.roadName && <div>{addr.roadName}</div>}
                                    <div>
                                        {addr.city}, {addr.state} - {addr.pincode}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="mb-4 text-sm font-semibold">No addresses added yet.</div>
                        <button
                            type="button"
                            onClick={() => navigate('/home-grocery/address')}
                            className="text-[#5C3FFF] underline"
                        >
                            Add your first address
                        </button>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default EditAllAddress;