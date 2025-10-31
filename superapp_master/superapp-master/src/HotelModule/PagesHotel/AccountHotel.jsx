import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FooterHotel from '../ComponentsHotel/FooterHotel';
import { User, Home, HelpCircle, LogOut, Edit2, Camera, Check, X, ChevronLeft, Heart, Trash2 } from "lucide-react";
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';
import EcommerceGroceryHeader from '../../Components/EcommerceGroceryHeader';

const tabs = [
    // { id: "favourites", label: "Favourites", icon: <Heart size={16} />, path: "/hotel-favourites" },
    { id: "address", label: "Address", icon: <Home size={16} />, path: "/hotel-addresses" },
    { id: "support", label: "Support", icon: <HelpCircle size={16} />, path: "/hotel-support" },
];

const AccountHotel = () => {
    const [activeTab, setActiveTab] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        avatar: ''
    });
    
    const [originalUserData, setOriginalUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        avatar: ''
    });
    
    const [favourites, setFavourites] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isImageUploading, setIsImageUploading] = useState(false);

    useEffect(() => {
        const unified = profileService.getProfile();
        const next = {
            firstName: unified.fullName?.split(' ')[0] || '',
            lastName: unified.fullName?.split(' ').slice(1).join(' ') || '',
            email: unified.email || '',
            phone: unified.phone || '',
            avatar: unified.profileImage || ''
        };
        setOriginalUserData(next);
        setFormData(next);
        const favs = JSON.parse(localStorage.getItem('hotelFavourites') || '[]');
        setFavourites(favs);
    }, []);

    const handleBack = () => {
        navigate(-1);
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/home-hotel');
        } catch (error) {
            console.error('Logout failed:', error);
            setStatusMessage({ type: 'error', text: 'Logout failed. Please try again.' });
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let { width, height } = img;
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(resolve, 'image/jpeg', 0.8);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setStatusMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, GIF)' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setStatusMessage({ type: 'error', text: 'Image size should be less than 5MB' });
            return;
        }
        setIsImageUploading(true);
        try {
            const compressedBlob = await compressImage(file);
            const reader = new FileReader();
            reader.onloadend = async () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
                setIsImageUploading(false);
                try {
                    await profileService.saveProfile({ profileImage: reader.result });
                } catch (error) {
                    console.error('Failed to save profile image:', error);
                    setStatusMessage({ type: 'error', text: 'Failed to save image' });
                }
            };
            reader.onerror = () => {
                setIsImageUploading(false);
                setStatusMessage({ type: 'error', text: 'Failed to process image' });
            };
            reader.readAsDataURL(compressedBlob);
        } catch (error) {
            setIsImageUploading(false);
            setStatusMessage({ type: 'error', text: `Failed to process image: ${error.message}` });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setStatusMessage({ type: 'loading', text: 'Saving profile...' });
        try {
            const { firstName, lastName, email, phone, avatar } = formData;
            const fullName = `${firstName || ''} ${lastName || ''}`.trim();
            profileService.saveProfile({ fullName, email, phone, profileImage: avatar });
            setOriginalUserData({ firstName, lastName, email, phone, avatar });
            setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
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

    const handleRemoveFavourite = (id) => {
        const updated = favourites.filter(hotel => hotel.id !== id);
        setFavourites(updated);
        localStorage.setItem('hotelFavourites', JSON.stringify(updated));
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab.id);
        navigate(tab.path);
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <EcommerceGroceryHeader />
            <div className='pt-20 px-4'>
                <div className="flex items-center mb-4">
                    <h1 className="text-xl font-semibold">My Account</h1>
                </div>

                {statusMessage.text && (
                    <div className={`p-3 mb-4 rounded-lg text-center text-base font-medium ${
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
                            />
                            {isImageUploading ? (
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            ) : isEditing ? (
                                <button 
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
                                >
                                    <Camera size={14} />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
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
                            {isImageUploading ? (
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            ) : isEditing ? (
                                <button 
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
                                >
                                    <Camera size={14} />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full"
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
                        {/* <div className='text-xs font-medium'>Your Account</div> */}
                        {isEditing ? (
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-1/2 p-2 border rounded-lg"
                                        placeholder="First Name"
                                    />
                                    <input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-1/2 p-2 border rounded-lg"
                                        placeholder="Last Name"
                                    />
                                </div>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Email Address"
                                />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Phone Number"
                                />
                            </div>
                        ) : (
                            <div>
                                <div className='text-base font-medium'>
                                    {(formData.firstName || formData.lastName) ? `${formData.firstName} ${formData.lastName}`.trim() : formData.phone || 'Add your name'}
                                </div>
                                <p className="text-sm text-gray-600">{formData.email || 'Add your email'}</p>
                                <p className="text-sm text-gray-600">{formData.phone || 'Add your phone'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="flex gap-2 justify-end mt-4">
                        <button 
                            onClick={handleCancel}
                            className="flex items-center px-3 py-1 text-base font-medium border rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            <X size={16} className="mr-1" /> Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex items-center px-3 py-1 text-base font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
                                className={`flex items-center px-4 py-2 rounded-full transition-all 
                                    ${activeTab === tab.id
                                        ? "bg-[#5C3FFF] text-white font-medium text-base"
                                        : "border border-[#E1E1E1] text-[#242424] bg-white font-medium text-base"
                                    }`}
                            >
                                {tab.icon}
                                <span className="ml-2">{tab.label}</span>
                            </button>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 rounded-full transition-all border border-[#E1E1E1] text-red-500 bg-white font-medium text-base hover:bg-red-50"
                        >
                            <LogOut size={16} className="mr-2" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
            <FooterHotel />
        </div>
    );
};

export default AccountHotel;