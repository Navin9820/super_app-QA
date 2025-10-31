
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EcommerceGroceryHeader from '../../Components/EcommerceGroceryHeader';
import Footer from '../../Utility/Footer';
import { User, Package, Heart, Settings, ShoppingCart, Edit2, Camera, Check, X, MapPin } from "lucide-react";
import { profileService } from '../../services/profileService';

const tabs = [
    { id: "profile", label: "Your Profile", icon: <User size={16} />, path: "/home-clothes/profile" },
    { id: "order", label: "Your Order", icon: <Package size={16} />, path: "/home-clothes/order-list" },
    { id: "address", label: "Address", icon: <MapPin size={16} />, path: "/home-clothes/edit-all-addresses" },
    { id: "cart", label: "My Cart", icon: <ShoppingCart size={16} />, path: "/home-clothes/cart" },
    { id: "wishlist", label: "Wishlist", icon: <Heart size={16} />, path: "/home-clothes/wishlist" },
    { id: "settings", label: "Settings", icon: <Settings size={16} />, path: "/home-clothes/settings" },
];

function Account() {
    const [activeTab, setActiveTab] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [originalUserData, setOriginalUserData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar: '',
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar: '',
    });

    const [imageFile, setImageFile] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const loadProfileData = useCallback(() => {
        const unified = profileService.getProfile();
        const next = {
            name: unified.fullName || '',
            email: unified.email || '',
            phone: unified.phone || '',
            avatar: unified.profileImage && typeof unified.profileImage === 'string' && unified.profileImage.startsWith('data:image/')
                ? unified.profileImage
                : '',
        };
        setOriginalUserData(next);
        setFormData(next);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadProfileData();
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadProfileData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loadProfileData]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setStatusMessage({ type: 'error', text: 'Please upload a valid image (JPEG, PNG, GIF)' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setStatusMessage({ type: 'error', text: 'Image size must be less than 5MB' });
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setStatusMessage({ type: 'error', text: 'Name is required' });
            return;
        }
        if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
            setStatusMessage({ type: 'error', text: 'Invalid phone number' });
            return;
        }
        setStatusMessage({ type: 'loading', text: 'Saving profile...' });
        try {
            const { name, email, phone, avatar } = formData;
            profileService.saveProfile({ fullName: name, email, phone, profileImage: avatar });
            setOriginalUserData({ name, email, phone, avatar });
            setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
            setIsEditing(false);
            setImageFile(null);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setStatusMessage({ type: 'error', text: `Error saving profile: ${error.message}` });
        }
    };

    const handleCancel = () => {
        setFormData(originalUserData);
        setImageFile(null);
        setIsEditing(false);
        setStatusMessage({ type: '', text: '' });
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab.id);
        navigate(tab.path);
    };

    if (isLoading) {
        return <div className="text-center p-4 text-sm font-semibold">Loading profile...</div>;
    }

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <EcommerceGroceryHeader />
            <div className='pt-20 px-4'>
                {statusMessage.text && (
                    <div className={`p-3 mb-4 rounded-lg text-center text-sm font-semibold ${
                        statusMessage.type === 'success' ? 'bg-blue-100 text-blue-800' :
                        statusMessage.type === 'error' ? 'bg-red-100 text-red-800' :
                        statusMessage.type === 'loading' ? 'bg-blue-100 text-blue-800' : ''
                    }`}>
                        {statusMessage.text}
                    </div>
                )}

                <div className="mt-4 bg-white rounded-full p-2 border border-[#E1E1E1] flex items-center gap-3">
                    {formData.avatar ? (
                        <div className="relative">
                            <img
                                src={formData.avatar}
                                alt="Profile"
                                className="rounded-full"
                                style={{ width: "50px", height: "50px", objectFit: 'cover' }}
                                onError={(e) => {
                                    console.warn('Profile image failed to load, clearing state');
                                    setFormData(prev => ({ ...prev, avatar: '' }));
                                    e.target.style.display = 'none';
                                }}
                            />
                            {isEditing ? (
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
                                    aria-label="Upload profile picture"
                                >
                                    <Camera size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
                                    aria-label="Edit profile"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="rounded-full bg-gray-200 flex items-center justify-center" style={{ width: "50px", height: "50px" }}>
                                <User size={24} className="text-gray-400" />
                            </div>
                            {isEditing ? (
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
                                    aria-label="Upload profile picture"
                                >
                                    <Camera size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
                                    aria-label="Edit profile"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    )}
                    <div>
                        {/* <div className='text-sm font-semibold'>Your Account</div> */}
                        {isEditing ? (
                            <div className="flex-1 space-y-2">
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg text-sm font-semibold"
                                    placeholder="Full Name"
                                    aria-label="Full Name"
                                />
                                <input
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full p-2 border rounded-lg bg-gray-100 text-sm font-semibold"
                                    placeholder="Email (cannot be changed)"
                                    aria-label="Email (disabled)"
                                />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg text-sm font-semibold"
                                    placeholder="Phone Number"
                                    aria-label="Phone Number"
                                />
                            </div>
                        ) : (
                            <div>
                                <div className='text-sm font-semibold'>{formData.name || 'Add your name'}</div>
                                <p className="text-sm font-semibold text-gray-600">{formData.email || 'No email provided'}</p>
                                <p className="text-sm font-semibold text-gray-600">{formData.phone || 'No phone number provided'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="flex gap-2 justify-end mt-4">
                        <button
                            onClick={handleCancel}
                            className="flex items-center px-3 py-1 text-sm font-semibold border rounded-lg text-gray-600 hover:bg-gray-100"
                            aria-label="Cancel editing"
                        >
                            <X size={16} className="mr-1" /> Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center px-3 py-1 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            aria-label="Save profile changes"
                        >
                            <Check size={16} className="mr-1" /> Save
                        </button>
                    </div>
                )}

                <div className="mt-6 flex flex-col items-center">
                    <div className="w-full grid grid-cols-2 gap-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab)}
                                className={`flex items-center px-4 py-2 rounded-full transition-all text-sm font-semibold
                                    ${activeTab === tab.id
                                        ? "bg-[#5C3FFF] text-white"
                                        : "border border-[#E1E1E1] text-[#242424] bg-white"
                                    }`}
                                aria-label={`Navigate to ${tab.label}`}
                            >
                                {tab.icon}
                                <span className="ml-2">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Account;
