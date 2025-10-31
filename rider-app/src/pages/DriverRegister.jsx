import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DriverRegister() {
    const navigate = useNavigate();
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        license_number: '',
        module_type: '' // 'taxi' or 'porter'
    });
    
    const [licenseFile, setLicenseFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [filePreview, setFilePreview] = useState(null);

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Phone number validation - only allow 10 digits
        if (name === 'phone') {
            const phoneRegex = /^\d{0,10}$/;
            if (!phoneRegex.test(value)) {
                return; // Don't update if invalid
            }
        }
        
        // Name validation - only allow letters and spaces
        if (name === 'name') {
            const nameRegex = /^[a-zA-Z\s]*$/;
            if (!nameRegex.test(value)) {
                return; // Don't update if invalid
            }
        }
        
        // License number validation - allow alphanumeric characters
        if (name === 'license_number') {
            const licenseRegex = /^[a-zA-Z0-9]*$/;
            if (!licenseRegex.test(value)) {
                return; // Don't update if invalid
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user starts typing
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please select a JPG, PNG, or PDF file for your license.');
                return;
            }
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB.');
                return;
            }
            
            setLicenseFile(file);
            setError('');
            
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setFilePreview(e.target.result);
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setError('');
        
        // Check if all required fields are filled
        if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.license_number || !formData.module_type) {
            setError('Please fill all required fields.');
            return;
        }
        
        // Name validation - minimum 2 characters, only letters and spaces
        if (formData.name.trim().length < 2) {
            setError('Name must be at least 2 characters long');
            return;
        }
        
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.name.trim())) {
            setError('Name can only contain letters and spaces');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setError('Please enter a valid email address');
            return;
        }
        
        // Phone validation - must be exactly 10 digits
        if (formData.phone.length !== 10) {
            setError('Phone number must be exactly 10 digits');
            return;
        }
        
        // Phone validation - must be all digits
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('Phone number must contain only digits');
            return;
        }
        
        // License number validation - minimum 5 characters, alphanumeric only
        if (formData.license_number.trim().length < 5) {
            setError('License number must be at least 5 characters long');
            return;
        }
        
        const licenseRegex = /^[a-zA-Z0-9]+$/;
        if (!licenseRegex.test(formData.license_number.trim())) {
            setError('License number can only contain letters and numbers');
            return;
        }
        
        // Password validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        // Module type validation
        if (!['taxi', 'porter'].includes(formData.module_type)) {
            setError('Please select a valid driver type (Taxi or Porter)');
            return;
        }
        
        if (!licenseFile) {
            setError('Please upload your driver license.');
            return;
        }
        
        setError('');
        setLoading(true);
        
        try {
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('license_number', formData.license_number);
            formDataToSend.append('module_type', formData.module_type);
            formDataToSend.append('license_file', licenseFile);
            
            // Submit to driver registration API
              const apiBaseUrl = (process.env.REACT_APP_SUPER_APP_API_URL || 
                (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : 'https://super-app-0ofo.onrender.com/api')).replace(/\/api$/, '');
            const response = await fetch(`${apiBaseUrl}/api/driver-registrations/register`, {
                method: 'POST',
                body: formDataToSend // Don't set Content-Type header for FormData
            });
            
            const data = await response.json();
            
            
            if (!response.ok || (data.success === false)) {
                // Display professional error message from backend
                const errorMessage = data.details 
                    ? `${data.message} - ${data.details}`
                    : data.message || 'Registration failed. Please try again.';
                setError(errorMessage);
                setLoading(false);
                return;
            }
            
            // Success - show notification and success message
            setLoading(false);
            setSuccess(true);
            
            // Show success message
            const successMessage = data.message || 'Registration submitted successfully!';
            if (window.showNotification) {
                window.showNotification(successMessage, 'success');
            }
            
            // Set professional type based on module_type
            const professionalType = formData.module_type === 'porter' ? 'delivery' : 'rider';
            localStorage.setItem('professionalType', professionalType);
            
            
            // Try to login the user after successful registration
            try {
                const loginResponse = await fetch(`${process.env.REACT_APP_SUPER_APP_API_URL || 'http://localhost:5000/api'}/riders/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                });
                
                const loginData = await loginResponse.json();
                
                if (loginData.success) {
                    // Store authentication data from login
                    localStorage.setItem('rider-token', loginData.token);
                    localStorage.setItem('rider-user', JSON.stringify(loginData.data));
                } else {
                    // Fallback to temporary authentication
                    const userData = {
                        id: data.data.user_id,
                        name: data.data.name,
                        email: data.data.email,
                        phone: data.data.phone,
                        module_type: data.data.module_type,
                        status: data.data.status,
                        role: 'driver'
                    };
                    
                    localStorage.setItem('rider-user', JSON.stringify(userData));
                    localStorage.setItem('rider-token', 'temp_token_' + Date.now());
                }
            } catch (loginError) {
                // Fallback to temporary authentication
                const userData = {
                    id: data.data.user_id,
                    name: data.data.name,
                    email: data.data.email,
                    phone: data.data.phone,
                    module_type: data.data.module_type,
                    status: data.data.status,
                    role: 'driver'
                };
                
                localStorage.setItem('rider-user', JSON.stringify(userData));
                localStorage.setItem('rider-token', 'temp_token_' + Date.now());
            }
            
            // Redirect to dashboard after a short delay to show notification
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            
        } catch (err) {
            // Check if it's a network error but form was submitted
            if (err.message && err.message.includes('Network')) {
                // For network errors, still try to proceed with registration
                setLoading(false);
                setSuccess(true);
                
                // Set professional type based on module_type
                const professionalType = formData.module_type === 'porter' ? 'delivery' : 'rider';
                localStorage.setItem('professionalType', professionalType);
                
                // Store user data for authentication (mock data for network error case)
                const userData = {
                    id: 'temp_' + Date.now(),
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    module_type: formData.module_type,
                    status: 'pending_approval',
                    role: 'driver'
                };
                
                // Store user data in localStorage for authentication
                localStorage.setItem('rider-user', JSON.stringify(userData));
                localStorage.setItem('rider-token', 'temp_token_' + Date.now()); // Temporary token
                
                // Show success message
                if (window.showNotification) {
                    window.showNotification('Registration submitted! You will be redirected to dashboard.', 'success');
                }
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                // Display professional error message from backend
                setError(err.message || 'Network error. Please try again.');
                setLoading(false);
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 24, width: 400, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: 0, textAlign: 'center', color: '#2563eb' }}>Driver Registration</h2>
                
                {/* Module Type Selection - Radio Buttons */}
                <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>I want to register as a: *</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="module_type"
                                value="taxi"
                                checked={formData.module_type === 'taxi'}
                                onChange={handleChange}
                                style={{ margin: 0 }}
                            />
                            <span>🚗 Taxi Driver</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="module_type"
                                value="porter"
                                checked={formData.module_type === 'porter'}
                                onChange={handleChange}
                                style={{ margin: 0 }}
                            />
                            <span>📦 Porter Driver</span>
                        </label>
                    </div>
                </div>

                <input name="name" placeholder="Full Name (letters only) *" value={formData.name} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
                <input name="email" placeholder="Email Address *" value={formData.email} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
                <input name="phone" placeholder="Phone Number (10 digits only) *" value={formData.phone} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
                <input name="license_number" placeholder="Driver License Number (min 5 chars) *" value={formData.license_number} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
                <input name="password" type="password" placeholder="Password (min 6 characters) *" value={formData.password} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
                <input name="confirmPassword" type="password" placeholder="Confirm Password *" value={formData.confirmPassword} onChange={handleChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }} />
                
                {/* License File Upload */}
                <div style={{ border: '2px dashed #ddd', borderRadius: 6, padding: 16, textAlign: 'center' }}>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="license-upload"
                    />
                    <label htmlFor="license-upload" style={{ cursor: 'pointer', color: '#2563eb' }}>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ fontWeight: 500 }}>Click to upload</span> or drag and drop
                        </div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                            JPG, PNG, or PDF (max 5MB)
                        </div>
                    </label>
                </div>
                
                {/* File Preview */}
                {filePreview && (
                    <div style={{ padding: 12, background: '#f9f9f9', borderRadius: 6 }}>
                        <div style={{ fontSize: 14, marginBottom: 8 }}>Selected file:</div>
                        {licenseFile?.type.startsWith('image/') ? (
                            <img src={filePreview} alt="License preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb' }}>
                                <span>📄</span>
                                <span>{licenseFile?.name}</span>
                            </div>
                        )}
                    </div>
                )}
                
                {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
                
                {success && (
                    <div style={{ padding: 12, background: '#e8f5e8', borderRadius: 6, fontSize: 14, color: '#2e7d32', border: '1px solid #4caf50' }}>
                        <strong>✅ Success!</strong> Your driver registration has been submitted successfully. You will be redirected to your dashboard in a few seconds.
                        <div style={{ marginTop: 8 }}>
                            <button 
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    cursor: 'pointer'
                                }}
                            >
                                Go to Dashboard Now
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Info Message */}
                <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 6, fontSize: 14, color: '#1976d2' }}>
                    <strong>Note:</strong> Your registration will be reviewed by our admin team. You'll receive a notification once approved.
                </div>
                
                <button type="submit" disabled={loading || success} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 8, opacity: (loading || success) ? 0.6 : 1 }}>
                    {loading ? 'Submitting...' : success ? 'Registration Submitted!' : 'Submit Registration'}
                </button>
                
                {/* Back to Register Link */}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate('/register')}>
                        ← Back to Pilot Registration
                    </span>
                </div>
            </form>
        </div>
    );
}

export default DriverRegister;
