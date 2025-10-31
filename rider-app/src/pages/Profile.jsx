import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiCheckCircle, FiLogOut, FiEdit, FiSave, FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import authService from '../services/auth';
import { riderAPI } from '../config/superAppApi';

const Profile = React.memo(({ isOnline, toggleOnline }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errors, setErrors] = useState({});
  const [settings, setSettings] = useState({
    notifications: true,
    soundAlerts: true
  });

  // Helper to normalize possible backend field variants
  const normalizeProfile = useCallback((data) => {
    if (!data) return data;
    const normalized = { ...data };
    normalized.vehicle_type = normalized.vehicle_type || normalized.vehicleType || normalized.vehicle || normalized.vehicletype;
    normalized.vehicle_model = normalized.vehicle_model || normalized.vehicleModel || normalized.vehicle_model_name;
    normalized.vehicle_number = normalized.vehicle_number || normalized.vehicleNumber || normalized.vehicle_no;
    normalized.vehicle_color = normalized.vehicle_color || normalized.vehicleColor || normalized.vehicle_colour;
    return normalized;
  }, []);

  // Load profile data from backend
  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current user from auth service
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      // Load profile from backend
      const profileResponse = await riderAPI.getProfile();
      if (profileResponse.success) {
        const serverData = normalizeProfile(profileResponse.data);
        // Merge with local user for editable fields to survive eventual backend lag
        const localUser = normalizeProfile(user || {});
        const merged = {
          ...serverData,
          // Editable fields overlay
          name: localUser.name || serverData?.name,
          phone: localUser.phone || serverData?.phone,
          license_number: localUser.license_number || serverData?.license_number,
          vehicle_type: localUser.vehicle_type || serverData?.vehicle_type,
          vehicle_model: localUser.vehicle_model || serverData?.vehicle_model,
          vehicle_number: localUser.vehicle_number || serverData?.vehicle_number,
          vehicle_color: localUser.vehicle_color || serverData?.vehicle_color
        };
        setProfileData(merged);
      }


      // Load settings from localStorage
      const savedSettings = localStorage.getItem('profile_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Only keep the settings we want
        setSettings({
          notifications: parsedSettings.notifications !== undefined ? parsedSettings.notifications : true,
          soundAlerts: parsedSettings.soundAlerts !== undefined ? parsedSettings.soundAlerts : true
        });
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      // Fallback to local user data so edits persist across reloads offline or on API delays
      const user = authService.getCurrentUser();
      setProfileData(normalizeProfile(user || {}));
    } finally {
      setIsLoading(false);
    }
  }, [normalizeProfile]);

  // Save profile changes
  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);
      // Validate before saving
      const newErrors = {};
      const phoneRegex = /^\d{10}$/;
      const vehicleNumberRegex = /^[A-Za-z0-9\-\s]{4,}$/;

      if (activeTab === 'personal') {
        if (!editData.name || editData.name.trim().length < 2) {
          newErrors.name = 'Please enter your full name (min 2 characters).';
        }
        if (!editData.phone || !phoneRegex.test(String(editData.phone).trim())) {
          newErrors.phone = 'Enter a valid 10-digit phone number.';
        }
        if (editData.license_number && editData.license_number.trim().length < 5) {
          newErrors.license_number = 'License number looks too short.';
        }
      }

      if (activeTab === 'vehicle') {
        if (!editData.vehicle_type) newErrors.vehicle_type = 'Select a vehicle type.';
        if (!editData.vehicle_model || editData.vehicle_model.trim().length < 2) {
          newErrors.vehicle_model = 'Enter a valid model.';
        }
        if (!editData.vehicle_number || !vehicleNumberRegex.test(editData.vehicle_number.trim())) {
          newErrors.vehicle_number = 'Enter a valid vehicle number.';
        }
        if (!editData.vehicle_color) newErrors.vehicle_color = 'Select a vehicle color.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSaving(false);
        return;
      }
      setErrors({});
      
      const response = await riderAPI.updateProfile(editData);
      
      if (response.success) {
        // Merge previous data with server response and edited fields
        const merged = normalizeProfile({ ...(profileData || {}), ...(response.data || {}), ...editData });
        setProfileData(merged);
        setEditMode(false);
        setEditData({});
        
        // Update current user in auth service
        authService.updateCurrentUser(merged);
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [editData]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Start editing
  const startEdit = useCallback((section) => {
    setEditMode(true);
    setEditData(profileData || {});
  }, [profileData]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditData({});
  }, []);

  // Toggle setting
  const toggleSetting = useCallback((setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    setSettings(newSettings);
    localStorage.setItem('profile_settings', JSON.stringify(newSettings));
  }, [settings]);

  // Handle logout
  const handleLogout = useCallback(() => {
    authService.logout();
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      navigate('/');
      return;
    }

    loadProfileData();
  }, [navigate, loadProfileData]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>🔄</div>
          <div style={{ fontSize: 16, color: '#666' }}>Loading Profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px' }}>
      <Header 
        title="Profile" 
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
        rightAction={
          !editMode && (
            <button
              onClick={() => startEdit(activeTab)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                color: '#3B82F6'
              }}
              title="Edit"
            >
              <FiEdit />
            </button>
          )
        }
      />

      <div style={{ padding: '16px', paddingBottom: editMode ? '120px' : '16px' }}>
        {/* Profile Header */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 32,
            color: 'white'
          }}>
            {profileData?.name?.charAt(0) || currentUser?.name?.charAt(0) || 'R'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            {profileData?.name || currentUser?.name || 'Rider'}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {profileData?.vehicle_type || 'Bike'} • {profileData?.vehicle_model || 'Vehicle'}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: 12, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {['personal', 'vehicle', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: 8,
                  background: activeTab === tab ? '#3B82F6' : 'transparent',
                  color: activeTab === tab ? 'white' : '#666',
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: editMode ? 8 : 16 }}>
          {activeTab === 'personal' && (
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 16 
              }}>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>Personal Information</div>
                {!editMode && (
                  <button
                    onClick={() => startEdit('personal')}
                    style={{
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FiEdit />
                    Edit
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Full Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.name || currentUser?.name || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.name && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.name}</div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Email
                  </label>
                  <div style={{ fontSize: 16, color: '#666' }}>
                    {profileData?.email || currentUser?.email || 'Not set'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Phone Number
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.phone || currentUser?.phone || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.phone && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.phone}</div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    License Number
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.license_number || ''}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                      placeholder="Enter license number"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.license_number || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.license_number && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.license_number}</div>
                  )}
                </div>
              </div>
              
              {/* Save Button for Personal Information */}
              {editMode && (
                <div style={{ 
                  marginTop: 20, 
                  paddingTop: 16, 
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  gap: 12,
                  marginBottom: 0
                }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '14px 20px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#e5e7eb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#f3f4f6';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <FiX />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    style={{
                      flex: 2,
                      background: isSaving ? '#9ca3af' : '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px 20px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: isSaving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSaving) {
                        e.target.style.background = '#059669';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSaving) {
                        e.target.style.background = '#10B981';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                  >
                    <FiSave />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 16 
              }}>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>Vehicle Information</div>
                {!editMode && (
                  <button
                    onClick={() => startEdit('vehicle')}
                    style={{
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FiEdit />
                    Edit
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Vehicle Type
                  </label>
                  {editMode ? (
                    <select
                      value={editData.vehicle_type || ''}
                      onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16,
                        background: 'white'
                      }}
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="Bike">Bike</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Car">Car</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Bicycle">Bicycle</option>
                    </select>
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.vehicle_type || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.vehicle_type && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.vehicle_type}</div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Vehicle Model
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.vehicle_model || ''}
                      onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                      placeholder="Enter vehicle model"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.vehicle_model || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.vehicle_model && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.vehicle_model}</div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Vehicle Number
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.vehicle_number || ''}
                      onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                      placeholder="Enter vehicle number"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.vehicle_number || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.vehicle_number && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.vehicle_number}</div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, display: 'block' }}>
                    Vehicle Color
                  </label>
                  {editMode ? (
                    <select
                      value={editData.vehicle_color || ''}
                      onChange={(e) => handleInputChange('vehicle_color', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 16,
                        background: 'white'
                      }}
                    >
                      <option value="">Select Vehicle Color</option>
                      <option value="Black">Black</option>
                      <option value="White">White</option>
                      <option value="Red">Red</option>
                      <option value="Blue">Blue</option>
                      <option value="Green">Green</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Silver">Silver</option>
                      <option value="Gray">Gray</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div style={{ fontSize: 16, color: '#666' }}>
                      {profileData?.vehicle_color || 'Not set'}
                    </div>
                  )}
                  {editMode && errors.vehicle_color && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.vehicle_color}</div>
                  )}
                </div>
              </div>
              
              {/* Save Button for Vehicle Information */}
              {editMode && (
                <div style={{ 
                  marginTop: 20, 
                  paddingTop: 16, 
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  gap: 12,
                  marginBottom: 0
                }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      padding: '14px 20px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#e5e7eb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#f3f4f6';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <FiX />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    style={{
                      flex: 2,
                      background: isSaving ? '#9ca3af' : '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px 20px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: isSaving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSaving) {
                        e.target.style.background = '#059669';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSaving) {
                        e.target.style.background = '#10B981';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                  >
                    <FiSave />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}


          {activeTab === 'settings' && (
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Settings</div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Terms & Conditions */}
                <div 
                  style={{ 
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#333'
                  }}
                  onClick={() => navigate('/terms')}
                >
                  Terms & Conditions
                </div>

                {/* Privacy Policy */}
                <div 
                  style={{ 
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#333'
                  }}
                  onClick={() => navigate('/privacy')}
                >
                  Privacy Policy
                </div>

                {/* About */}
                <div 
                  style={{ 
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#333'
                  }}
                  onClick={() => navigate('/about')}
                >
                  About
                </div>

                {/* Sign Out */}
                <div 
                  style={{ 
                    padding: '16px 0',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#EF4444',
                    fontWeight: 'bold'
                  }}
                  onClick={handleLogout}
                >
                  Sign Out
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Success Message */}
      {showSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000,
          minWidth: '280px',
          textAlign: 'center',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 8
          }}>
            Profile Updated!
          </div>
          <div style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 16
          }}>
            Your profile has been updated successfully
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            OK
          </button>
        </div>
      )}

      {/* Overlay */}
      {showSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }} />
      )}
    </div>
  );
});

export default Profile;