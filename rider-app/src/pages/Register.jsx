import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { riderAPI } from '../config/superAppApi';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    license_number: '',
    vehicle_type: '',
    vehicle_number: '',
    vehicle_model: '',
    vehicle_color: '',
    module_type: ''
  });
  
  const [licenseFile, setLicenseFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDriverFields, setShowDriverFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Name validation - 1 to 20 characters, letters and spaces only
    if (name === 'name') {
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (!nameRegex.test(value) || value.length > 20) {
        return;
      }
    }
    
    // Phone number validation - allow only digits, max 10, first digit 6-9
    if (name === 'phone') {
      const digitRegex = /^\d*$/; // Allow only digits
      if (!digitRegex.test(value) || value.length > 10) {
        return; // Prevent non-digits or more than 10 digits
      }
      setForm({ ...form, [name]: value });
      
      if (value.length > 0) {
        const phoneRegex = /^[6-9]\d{0,9}$/;
        if (!phoneRegex.test(value)) {
          setPhoneError('Phone number must start with 6, 7, 8, or 9');
        } else if (value.length !== 10) {
          setPhoneError('Phone number must be exactly 10 digits');
        } else {
          setPhoneError('');
        }
      } else {
        setPhoneError('');
      }
      return;
    }
    
    // License number validation - alphanumeric
    if (name === 'license_number') {
      const licenseRegex = /^[a-zA-Z0-9]*$/;
      if (!licenseRegex.test(value)) {
        return;
      }
    }
    
    // Handle module type change
    if (name === 'module_type') {
      setShowDriverFields(value === 'rider' || value === 'taxi' || value === 'porter');
      setForm({ ...form, [name]: value });
      return;
    }
    
    setForm({ ...form, [name]: value });
    setError('');
  };

  const handleLicenseFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a JPG, PNG, or PDF file for your license.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setLicenseFile(file);
      setError('');
      
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreview(e.target.result);
          };
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            try {
              const fallbackUrl = URL.createObjectURL(file);
              setFilePreview(fallbackUrl);
            } catch (fallbackError) {
              console.error('Both FileReader and URL.createObjectURL failed:', fallbackError);
              setError('Error reading file. Please try again.');
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('FileReader not supported, using URL.createObjectURL:', error);
          try {
            const fallbackUrl = URL.createObjectURL(file);
            setFilePreview(fallbackUrl);
          } catch (fallbackError) {
            console.error('URL.createObjectURL also failed:', fallbackError);
            setError('File preview not supported in this browser.');
          }
        }
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic field validation
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword || !form.module_type || !form.license_number) {
      setError('All required fields must be filled');
      return;
    }

    // Name validation - 1-20 characters
    if (form.name.trim().length < 1 || form.name.trim().length > 20) {
      setError('Name must be between 1 and 20 characters long');
      return;
    }
    
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(form.name.trim())) {
      setError('Name can only contain letters and spaces');
      return;
    }
    
    // Email validation - specific domains
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com)$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('Please enter a valid email address (gmail.com, yahoo.com, hotmail.com, or outlook.com)');
      return;
    }
    
    // Phone validation - must start with 6-9 and be exactly 10 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      setError('Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits');
      return;
    }
    
    // Password validation
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // License number validation
    if (form.license_number.trim().length < 5) {
      setError('License number must be at least 5 characters long');
      return;
    }
    
    const licenseRegex = /^[a-zA-Z0-9]+$/;
    if (!licenseRegex.test(form.license_number.trim())) {
      setError('License number can only contain letters and numbers');
      return;
    }
    
    // Driver-specific validation
    if (showDriverFields) {
      if (!form.vehicle_type || !form.vehicle_number || !form.vehicle_model || !form.vehicle_color) {
        setError('All driver fields are required');
        return;
      }
      
      if (!licenseFile) {
        setError('Please upload your license document');
        return;
      }
    }
    
    if (form.module_type && (!form.vehicle_type || !form.vehicle_number || !form.vehicle_model || !form.vehicle_color)) {
      setError('All vehicle information fields are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let registrationData;
      
      if (showDriverFields || form.module_type === 'rider') {
        registrationData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          license_number: form.license_number,
          vehicle_type: form.vehicle_type,
          vehicle_number: form.vehicle_number,
          vehicle_model: form.vehicle_model,
          vehicle_color: form.vehicle_color,
          module_type: form.module_type
        };
        
        const formData = new FormData();
        Object.keys(registrationData).forEach(key => {
          formData.append(key, registrationData[key]);
        });
        formData.append('license_file', licenseFile);
        
        const apiBaseUrl = (process.env.REACT_APP_SUPER_APP_API_URL || 
          (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : 'https://super-app-0ofo.onrender.com/api')).replace(/\/api$/, '');
        const response = await fetch(`${apiBaseUrl}/api/driver-registrations/register`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          setSuccess(true);
          setLoading(false);
          
          const professionalType = form.module_type === 'porter' ? 'delivery' : 'rider';
          localStorage.setItem('professionalType', professionalType);
          
          try {
            const loginResponse = await fetch(`${process.env.REACT_APP_SUPER_APP_API_URL || 'http://localhost:5000/api'}/riders/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: form.email,
                password: form.password
              })
            });
            
            const loginData = await loginResponse.json();
            
            if (loginData.success) {
              localStorage.setItem('rider-token', loginData.token);
              localStorage.setItem('rider-user', JSON.stringify(loginData.data));
            } else {
              const userData = {
                id: result.data.user_id || result.data.driver_id,
                name: result.data.name,
                email: result.data.email,
                phone: result.data.phone,
                module_type: result.data.module_type,
                status: result.data.status,
                role: 'driver',
                vehicle_type: result.data.vehicle_type,
                vehicle_number: result.data.vehicle_number,
                vehicle_model: result.data.vehicle_model,
                vehicle_color: result.data.vehicle_color
              };
              
              localStorage.setItem('rider-user', JSON.stringify(userData));
              localStorage.setItem('rider-token', 'temp_token_' + Date.now());
            }
          } catch (loginError) {
            const userData = {
              id: result.data.user_id || result.data.driver_id,
              name: result.data.name,
              email: result.data.email,
              phone: result.data.phone,
              module_type: result.data.module_type,
              status: result.data.status,
              role: 'driver',
              vehicle_type: result.data.vehicle_type,
              vehicle_number: result.data.vehicle_number,
              vehicle_model: result.data.vehicle_model,
              vehicle_color: result.data.vehicle_color
            };
            
            localStorage.setItem('rider-user', JSON.stringify(userData));
            localStorage.setItem('rider-token', 'temp_token_' + Date.now());
          }
          
          localStorage.setItem('rider-session', JSON.stringify({
            token: localStorage.getItem('rider-token'),
            user: JSON.parse(localStorage.getItem('rider-user')),
            timestamp: Date.now()
          }));
          
          window.location.href = '/dashboard';
        } else {
          setError(result.message || 'Registration failed');
          setLoading(false);
        }
        
      } else {
        registrationData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          license_number: form.license_number,
          vehicle_type: form.vehicle_type,
          vehicle_number: form.vehicle_number,
          vehicle_model: form.vehicle_model,
          vehicle_color: form.vehicle_color
        };
        
        const response = await riderAPI.register(registrationData);
        
        if (response.success) {
          setSuccess(true);
          setLoading(false);
          localStorage.setItem('rider-token', response.token);
          localStorage.setItem('rider-user', JSON.stringify(response.data));
          localStorage.setItem('professionalType', 'rider');
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setError(response.message || 'Registration failed');
          setLoading(false);
        }
      }
      
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 24, width: 400, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, textAlign: 'center', color: '#2563eb' }}>Join DriveWithUs Pro</h2>
        <input name="name" placeholder="Full Name (1-20 characters)" value={form.name} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
        <input name="email" type="email" placeholder="Email Address (Gmail/Yahoo/Hotmail/Outlook)" value={form.email} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
        <div style={{ position: 'relative' }}>
          <input 
            name="phone" 
            type="tel"
            pattern="[0-9]*"
            maxLength="10"
            placeholder="Phone Number (starts with 6-9)" 
            value={form.phone} 
            onChange={handleChange} 
            style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16, width: '100%' }} 
          />
          {phoneError && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{phoneError}</div>}
        </div>
        <input name="license_number" placeholder="License Number (alphanumeric)" value={form.license_number} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
        
        <div style={{ position: 'relative' }}>
          <input 
            name="password" 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Password (min 6 characters)" 
            value={form.password} 
            onChange={handleChange} 
            style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16, width: '100%' }} 
          />
          <span 
            onClick={() => setShowPassword(!showPassword)} 
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>
        
        <div style={{ position: 'relative' }}>
          <input 
            name="confirmPassword" 
            type={showConfirmPassword ? 'text' : 'password'} 
            placeholder="Confirm Password" 
            value={form.confirmPassword} 
            onChange={handleChange} 
            style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16, width: '100%' }} 
          />
          <span 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
          >
            {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>
        
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, display: 'block' }}>
            Choose Service Type:
          </label>
          <select 
            name="module_type" 
            value={form.module_type} 
            onChange={handleChange}
            style={{ 
              padding: 10, 
              borderRadius: 6, 
              border: '1px solid #ddd', 
              fontSize: 16, 
              width: '100%',
              background: 'white'
            }}
          >
            <option value="">Select service type...</option>
            <option value="rider">General Delivery Rider</option>
            <option value="taxi">Taxi Driver</option>
            <option value="porter">Porter Driver</option>
          </select>
        </div>

        {form.module_type && (
          <div style={{ 
            borderTop: '1px solid #e5e7eb', 
            paddingTop: 16, 
            marginTop: 8,
            background: '#f9fafb',
            padding: 16,
            borderRadius: 8
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#374151', margin: '0 0 12px 0' }}>
              Vehicle Information
            </h3>
            
            <select 
              name="vehicle_type" 
              value={form.vehicle_type} 
              onChange={handleChange}
              style={{ 
                padding: 10, 
                borderRadius: 6, 
                border: '1px solid #ddd', 
                fontSize: 16, 
                width: '100%',
                background: 'white',
                marginBottom: 12
              }}
            >
              <option value="">Select Vehicle Type</option>
              <option value="Bike">Bike</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Car">Car</option>
              <option value="Auto">Auto</option>
              <option value="Scooter">Scooter</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Truck">Truck</option>
            </select>
            
            <input 
              name="vehicle_number" 
              placeholder="Vehicle Number" 
              value={form.vehicle_number} 
              onChange={handleChange} 
              style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16, marginBottom: 12 }} 
            />
            
            <input 
              name="vehicle_model" 
              placeholder="Vehicle Model" 
              value={form.vehicle_model} 
              onChange={handleChange} 
              style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16, marginBottom: 12 }} 
            />
            
            <input 
              name="vehicle_color" 
              placeholder="Vehicle Color" 
              value={form.vehicle_color} 
              onChange={handleChange} 
              style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16, marginBottom: 12 }} 
            />
          </div>
        )}
        
        {showDriverFields && (
          <div style={{ 
            borderTop: '1px solid #e5e7eb', 
            paddingTop: 16, 
            marginTop: 8,
            background: '#f9fafb',
            padding: 16,
            borderRadius: 8
          }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8, display: 'block' }}>
                Upload License Document:
              </label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={handleLicenseFileChange}
                style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  border: '1px solid #ddd', 
                  fontSize: 14, 
                  width: '100%'
                }}
              />
              {filePreview && (
                <div style={{ marginTop: 8, padding: 12, background: '#f9f9f9', borderRadius: 6 }}>
                  <div style={{ fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Selected file:</div>
                  {licenseFile?.type.startsWith('image/') ? (
                    <img 
                      src={filePreview} 
                      alt="License Preview" 
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb' }}>
                      <span>📄</span>
                      <span>{licenseFile?.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {error && <div style={{ color: 'red', fontSize: 14, textAlign: 'center' }}>{error}</div>}
        {success && (
          <div style={{ 
            background: '#22c55e', 
            color: '#fff', 
            fontSize: 14, 
            textAlign: 'center', 
            padding: 10, 
            borderRadius: 6, 
            fontWeight: 500 
          }}>
            Registration Successful! Redirecting to dashboard...
          </div>
        )}
        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          Already have an account? <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate('/')}>Login</span>
        </div>
      </form>
    </div>
  );
};

export default Register;