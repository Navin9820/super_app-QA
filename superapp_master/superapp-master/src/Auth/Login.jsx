import API_CONFIG from "../config/api.config.js";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../Images/Logo/E-STORE.svg";
import { otpService } from '../services/otpService';
import bellIcon from "../Images/HomeScreen/bellIcon.png";

function Login({ onSuccess }) {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const navigate = useNavigate();

    // Email validation regex for specific domains
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|email\.com)$/;

    // Phone validation regex - must start with 6-9 and be 10 digits
    const phoneRegex = /^[6-9]\d{0,9}$/;

    // Validate email field
    const validateEmail = (value) => {
        if (!value) {
            return 'Email is required';
        }
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address (gmail.com or email.com)';
        }
        return '';
    };

    // Validate phone field
    const validatePhone = (value) => {
        if (!value) {
            return 'Phone number is required';
        }
        if (!/^[6-9]\d{9}$/.test(value)) {
            return 'Phone number must start with 6-9 and be exactly 10 digits';
        }
        return '';
    };

    // Handle email input change
    const handleEmailChange = (e) => {
        const value = e.target.value.trim();
        setEmail(value);
        setEmailError(validateEmail(value));
    };

    // Handle phone input change
    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (phoneRegex.test(value) || value === '') {
            setPhone(value);
            setPhoneError(validatePhone(value));
        }
    };

    // Handle blur for email
    const handleEmailBlur = () => {
        setEmailError(validateEmail(email));
    };

    // Handle blur for phone
    const handlePhoneBlur = () => {
        setPhoneError(validatePhone(phone));
    };

    const handleSendOtp = async () => {
        setGeneralError('');
        
        // Validate fields before sending OTP
        const emailValidation = validateEmail(email);
        const phoneValidation = validatePhone(phone);

        setEmailError(emailValidation);
        setPhoneError(phoneValidation);

        if (emailValidation || phoneValidation) {
            setGeneralError('Please correct the errors above');
            return;
        }

        setIsLoading(true);
        try {
            console.log('🔧 Login: Starting OTP generation...');
            console.log('🔧 Login: Form data:', { email, phone });
            console.log('🔧 Login: API base URL:', API_CONFIG.BASE_URL);
            console.log('🔧 Login: Debug info:', API_CONFIG.DEBUG);
            console.log('🔧 Login: Environment variable:', process.env.REACT_APP_API_URL);
            console.log('🔧 Login: Window location:', window.location.href);
            console.log('🔧 Login: Hostname:', window.location.hostname);
            
            // Test connectivity first
            console.log('🔧 Login: Testing connectivity to backend...');
            const testUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH);
            console.log('🔧 Login: Test URL:', testUrl);
            
            try {
                const testResponse = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                console.log('🔧 Login: Connectivity test response status:', testResponse.status);
                console.log('🔧 Login: Connectivity test response headers:', testResponse.headers);
            } catch (connectivityError) {
                console.error('🔧 Login: Connectivity test failed:', connectivityError);
                console.error('🔧 Login: Test URL that failed:', testUrl);
                setGeneralError('Cannot connect to server. Please check your internet connection.');
                setIsLoading(false);
                return;
            }
            
            const result = await otpService.generateOTP(email, phone);
            console.log('Login: OTP generation result:', result);

            if (result.success) {
                console.log('Login: OTP generated successfully, navigating to OTP page');
                localStorage.setItem('pendingEmail', email);
                localStorage.setItem('pendingPhone', phone);
                localStorage.setItem('generated_otp', result.otp);
                navigate('/otp');
            } else {
                console.error('Login: OTP generation failed:', result.message);
                setGeneralError(result.message || 'Failed to generate OTP. Please try again.');
            }
        } catch (error) {
            console.error('Login: Unexpected error during OTP generation:', error);
            setGeneralError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-start">
            {/* Gradient Background */}
            <div className="w-full h-40 bg-gradient-to-b from-[#d6a1ef] to-white"></div>
            {/* Logo */}
            <img src={bellIcon} alt='E-STORE' className="w-10 mt-4" />
            {/* Form Fields */}
            <div className="w-full max-w-sm px-4 py-8 bg-white flex flex-col items-center">
                <label className="mt-4 block text-sm text-gray-600 w-full">Enter your email ID</label>
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`w-full p-3 border ${emailError ? 'border-red-300' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1`}
                    placeholder="Enter email (Gmail/email)"
                />
                {emailError && (
                    <p className="w-full text-sm text-red-600 mt-1">{emailError}</p>
                )}
                <label className="mt-4 block text-sm text-gray-600 w-full">Enter your mobile number</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    className={`w-full p-3 border ${phoneError ? 'border-red-300' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1`}
                    maxLength="10"
                    placeholder="Enter 10-digit number (starts with 6-9)"
                />
                {phoneError && (
                    <p className="w-full text-sm text-red-600 mt-1">{phoneError}</p>
                )}
                {generalError && (
                    <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{generalError}</p>
                    </div>
                )}
                {/* Send OTP Button */}
                <div className="w-full mt-6">
                    <button
                        onClick={handleSendOtp}
                        disabled={isLoading || emailError || phoneError}
                        className="w-full h-12 bg-[#5C3FFF] text-white text-lg font-semibold rounded-full flex items-center justify-center transition duration-300 hover:bg-[#4A2FCC] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </div>
                {/* Sign Up Link */}
                <div className="w-full text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <span className="text-[#5C3FFF] cursor-pointer" onClick={() => navigate('/register')}>
                            Sign up
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;