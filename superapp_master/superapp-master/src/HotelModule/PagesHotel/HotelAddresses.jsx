import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function HotelAddresses() {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);

    const loadAddresses = () => {
        const storedAddresses = JSON.parse(localStorage.getItem('hotelUserAddresses') || '[]');
        setAddresses(storedAddresses);
        console.log('Hotel addresses loaded:', storedAddresses);
    };

    useEffect(() => {
        loadAddresses();
        // Reload addresses when page comes into focus
        window.addEventListener('focus', loadAddresses);
        return () => {
            window.removeEventListener('focus', loadAddresses);
        };
    }, []);

    const handleDeleteAddress = (indexToDelete) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            const updatedAddresses = addresses.filter((_, index) => index !== indexToDelete);
            localStorage.setItem('hotelUserAddresses', JSON.stringify(updatedAddresses));
            setAddresses(updatedAddresses);
        }
    };

    const handleEditAddress = (address, index) => {
        navigate('/hotel-address-form', { 
            state: { address, index } 
        });
    };

    const handleAddAddress = () => {
        navigate('/hotel-address-form');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 p-4">
                <div className="relative flex items-center justify-center max-w-2xl mx-auto px-4">
                    <button onClick={() => navigate('/home-hotel/profile')} className="absolute left-0">
                        <ArrowLeft size={24} className="text-gray-700 hover:text-sky-600" />
                    </button>
                    <h1 className="text-sm font-semibold text-sky-600">My Addresses</h1>
                </div>
            </header>

            <div className="pt-20 px-4 pb-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header with Add Button */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-semibold text-gray-800">Saved Addresses</h2>
                        <button
                            onClick={handleAddAddress}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                        >
                            <Plus size={20} />
                            <span className="text-sm font-semibold">Add Address</span>
                        </button>
                    </div>

                    {/* Addresses List */}
                    {addresses.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                            <p className="text-sm font-semibold text-gray-500 mb-2">No addresses added yet.</p>
                            <p className="text-sm font-semibold text-gray-400 mb-4">You can add and manage your hotel booking addresses here.</p>
                            <button
                                onClick={handleAddAddress}
                                className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                            >
                                <span className="text-sm font-semibold">Add Your First Address</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {addresses.map((address, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-semibold text-gray-800">{address.fullName}</h3>
                                            <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                {address.selectedAddressType}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditAddress(address, index)}
                                                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 transition-colors"
                                            >
                                                <Edit size={16} />
                                                <span className="text-sm font-semibold">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAddress(index)}
                                                className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                                <span className="text-sm font-semibold">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1 text-gray-600">
                                        <p className="text-sm font-semibold">{address.contactNumber}</p>
                                        <div className="text-sm font-semibold">
                                            <p>{address.houseNo}, {address.roadName}</p>
                                            <p>{address.city}, {address.state} - {address.pincode}</p>
                                            {address.landmark && (
                                                <p className="text-gray-500 text-sm font-semibold">Near {address.landmark}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HotelAddresses;