import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FooterNav from "./Footer";
import { profileService } from "../services/profileService";
import { Edit2, Camera, Check, X, User } from "lucide-react";
import backIcon from '../Icons/arrow-left.svg';

const PorterProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', phone: '', email: '', avatar: '' });
  const [originalUser, setOriginalUser] = useState({ name: '', phone: '', email: '', avatar: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unified = profileService.getProfile();
    const userData = {
      name: unified.fullName || '',
      phone: unified.phone || '',
      email: unified.email || '',
      avatar: unified.profileImage || ''
    };
    setUser(userData);
    setOriginalUser(userData);
  }, []);

  // Handle input changes with formatting and validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Phone number formatting - only allow digits
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    // Name fields - only allow letters and spaces
    if (name === 'name') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    
    setUser(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Comprehensive validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!user.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (user.name.trim().length < 1) {
      newErrors.name = 'Name must be at least 1 character';
    } else if (user.name.trim().length > 20) {
      newErrors.name = 'Name must not exceed 20 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(user.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }
    
    // Phone validation
    if (!user.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(user.phone.trim())) {
      newErrors.phone = 'Phone number must be 10 digits and start with 6, 7, 8, or 9';
    }
    
    // Email validation
    const validDomains = ['gmail.com', 'email.com'];
    const domain = user.email.trim().split('@')[1];
    if (!user.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!validDomains.includes(domain)) {
      newErrors.email = 'Email must be from gmail.com or email.com';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      setStatusMessage({ type: 'error' });
      return;
    }
    
    setStatusMessage({ type: 'loading', text: 'Saving profile...' });
    
    try {
      // Save to unified profile
      profileService.saveProfile({ 
        fullName: user.name, 
        email: user.email, 
        phone: user.phone, 
        profileImage: user.avatar 
      });
      
      // Update original data
      setOriginalUser(user);
      
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setStatusMessage({ type: 'error', text: `Error saving profile: ${error.message}` });
    }
  };

  const handleCancel = () => {
    setUser(originalUser);
    setIsEditing(false);
    setStatusMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 mt-8">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <img src={backIcon} alt="Back" className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Profile Settings</h2>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-blue-200 shadow mb-4"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-blue-200 shadow mb-4 bg-gray-200 flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
            {isEditing ? (
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
              >
                <Camera size={16} />
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {isEditing ? (
            <div>
              <input
                name="name"
                value={user.name}
                onChange={handleInputChange}
                placeholder="Enter your name (1-20 characters)"
                maxLength="20"
                className={`text-2xl font-bold text-gray-800 mb-1 text-center border rounded px-2 py-1 ${
                  errors.name 
                    ? 'bg-red-50 border-red-300' 
                    : 'bg-gray-100 border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 text-center">⚠️ {errors.name}</p>}
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.name || 'Add your name'}</h2>
          )}
          <div className="text-gray-500 mb-2">Porter User</div>
          
          {statusMessage.text && (
            <div className={`p-3 mb-4 rounded-lg text-center text-sm w-full ${
              statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
              statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 
              statusMessage.type === 'loading' ? 'bg-blue-100 text-blue-800' : ''
            }`}>
              {statusMessage.text}
            </div>
          )}
          
          <div className="w-full mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Phone:</span>
              {isEditing ? (
                <div>
                  <input
                    name="phone"
                    value={user.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number (starts with 6, 7, 8, or 9)"
                    maxLength="10"
                    className={`text-gray-600 border rounded px-2 py-1 ${
                      errors.phone 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">⚠️ {errors.phone}</p>}
                </div>
              ) : (
                <span className="text-gray-600">{user.phone}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Email:</span>
              {isEditing ? (
                <div>
                  <input
                    name="email"
                    value={user.email}
                    onChange={handleInputChange}
                    placeholder="Enter email (e.g., user@gmail.com)"
                    maxLength="100"
                    className={`text-gray-600 border rounded px-2 py-1 ${
                      errors.email 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">⚠️ {errors.email}</p>}
                </div>
              ) : (
                <span className="text-gray-600">{user.email}</span>
              )}
            </div>
          </div>
          {isEditing ? (
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold shadow hover:bg-gray-600 transition flex items-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Check size={16} /> Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>
      <FooterNav />
    </div>
  );
};

export default PorterProfile;