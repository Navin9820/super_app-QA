import API_CONFIG from "../config/api.config.js";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bellIcon from "../Images/HomeScreen/bellIcon.png";

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
    const [filePreview, setFilePreview] = useState(null);

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
        
        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.license_number || !formData.module_type) {
            setError('Please fill all required fields.');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
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
            const response = await fetch(API_CONFIG.getUrl('/api/driver-registrations/register'), {
                method: 'POST',
                body: formDataToSend // Don't set Content-Type header for FormData
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                setError(data.message || 'Registration failed. Please try again.');
                setLoading(false);
                return;
            }
            
            // Success - show message and redirect
            setLoading(false);
            alert(data.message); // Show success message
            navigate('/login'); // Redirect to login
            
        } catch (err) {
            console.error('Driver registration error:', err);
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start bg-white">
            {/* Gradient Background */}
            <div className="w-full h-24 bg-gradient-to-b from-[#d6a1ef] to-white"></div>
            
            {/* Main Content Container */}
            <div className="w-full max-w-sm px-6 py-6 bg-white flex flex-col items-center -mt-8">
                {/* Bell Icon */}
                <img src={bellIcon} alt='Bell Icon' className="w-10" />
                
                {/* Form Title */}
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Driver Registration
                </h1>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {/* Module Type Selection - Radio Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            I want to register as a: *
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="module_type"
                                    value="taxi"
                                    checked={formData.module_type === 'taxi'}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#5C3FFF] border-gray-300 focus:ring-[#5C3FFF]"
                                />
                                <span className="text-gray-700">🚗 Taxi Driver</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="module_type"
                                    value="porter"
                                    checked={formData.module_type === 'porter'}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#5C3FFF] border-gray-300 focus:ring-[#5C3FFF]"
                                />
                                <span className="text-gray-700">📦 Porter Driver</span>
                            </label>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    {/* License Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Driver License Number *
                        </label>
                        <input
                            type="text"
                            name="license_number"
                            value={formData.license_number}
                            onChange={handleChange}
                            placeholder="Enter your license number"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password (min 6 characters)"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    {/* License File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Driver License *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#5C3FFF] transition-colors">
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="license-upload"
                            />
                            <label htmlFor="license-upload" className="cursor-pointer">
                                <div className="space-y-2">
                                    <div className="text-[#5C3FFF]">
                                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium text-[#5C3FFF]">Click to upload</span> or drag and drop
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        JPG, PNG, or PDF (max 5MB)
                                    </div>
                                </div>
                            </label>
                        </div>
                        
                        {/* File Preview */}
                        {filePreview && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-2">Selected file:</div>
                                {licenseFile?.type.startsWith('image/') ? (
                                    <img src={filePreview} alt="License preview" className="w-20 h-20 object-cover rounded-lg" />
                                ) : (
                                    <div className="flex items-center space-x-2 text-[#5C3FFF]">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>{licenseFile?.name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Info Message */}
                    <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm text-center">
                        <strong>Note:</strong> Your registration will be reviewed by our admin team. You'll receive a notification once approved.
                    </div>

                    {/* Login Link */}
                    <div className="w-full text-center mt-6 mb-20">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <span
                                className="text-[#5C3FFF] font-medium cursor-pointer hover:underline"
                                onClick={() => navigate('/login')}
                            >
                                Sign in here
                            </span>
                        </p>
                    </div>
                </form>
            </div>

            {/* Submit Button */}
            <div className="fixed left-0 right-0 bottom-8 px-6 z-10">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full max-w-sm h-14 bg-[#5C3FFF] text-white text-lg font-semibold rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-[#4A2FCC] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {loading ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                        </div>
                    ) : (
                        'Submit Registration'
                    )}
                </button>
            </div>
        </div>
    );
}

export default DriverRegister;
