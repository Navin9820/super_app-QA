import API_CONFIG from "../config/api.config.js";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { otpService } from '../services/otpService';
import bellIcon from "../Images/HomeScreen/bellIcon.png";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    // Reset form fields on component mount
    useEffect(() => {
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setErrors({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        });
    }, []);

    // Validation functions
    const validateName = (name) => {
        if (!name.trim()) return 'Full name is required';
        if (name.trim().length < 1 || name.trim().length > 30) return 'Full name must be between 1 and 30 characters';
        if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Full name can only contain letters and spaces';
        return '';
    };

    const validateEmail = (email) => {
        if (!email.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@(gmail\.com|email\.com)$/;
        if (!emailRegex.test(email.trim())) return 'Email must be from @gmail.com or @email.com';
        return '';
    };

    const validatePhone = (phone) => {
        if (!phone.trim()) return 'Mobile number is required';
        if (!/^[6-9]\d{9}$/.test(phone.trim())) return 'Mobile number must be 10 digits, start with 6, 7, 8, or 9, and contain only numbers';
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        if (password.length > 20) return 'Password must be less than 20 characters';
        return '';
    };

    const validateConfirmPassword = (confirmPassword, password) => {
        if (!confirmPassword) return 'Confirm password is required';
        if (confirmPassword !== password) return 'Passwords do not match';
        return '';
    };

    const validateAllFields = () => {
        const nameError = validateName(name);
        const emailError = validateEmail(email);
        const phoneError = validatePhone(phone);
        const passwordError = validatePassword(password);
        const confirmPasswordError = validateConfirmPassword(confirmPassword, password);
        setErrors({
            name: nameError,
            email: emailError,
            phone: phoneError,
            password: passwordError,
            confirmPassword: confirmPasswordError,
        });
        return !(nameError || emailError || phoneError || passwordError || confirmPasswordError);
    };

    const handleBlur = (field, value) => {
        switch (field) {
            case 'name':
                setErrors((prev) => ({ ...prev, name: validateName(value) }));
                break;
            case 'email':
                setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
                break;
            case 'phone':
                setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
                break;
            case 'password':
                setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
                break;
            case 'confirmPassword':
                setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(value, password) }));
                break;
            default:
                break;
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Allow only digits
        if (value.length <= 10) {
            setPhone(value);
            setErrors((prev) => ({ ...prev, phone: '' }));
        }
    };

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'name':
                setName(value);
                setErrors((prev) => ({ ...prev, name: '' }));
                break;
            case 'email':
                setEmail(value);
                setErrors((prev) => ({ ...prev, email: '' }));
                break;
            case 'password':
                setPassword(value);
                setErrors((prev) => ({
                    ...prev,
                    password: '',
                    confirmPassword: validateConfirmPassword(confirmPassword, value),
                }));
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                break;
            default:
                break;
        }
    };

    const handleContinue = async () => {
        const isValid = validateAllFields();
        if (!isValid) return;

        setLoading(true);
        try {
            const res = await fetch(API_CONFIG.getUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    phone: phone.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setErrors((prev) => ({
                    ...prev,
                    general: data.message || 'Registration failed.',
                }));
                setLoading(false);
                return;
            }

            localStorage.setItem('pendingEmail', email.trim());
            localStorage.setItem('pendingPhone', phone.trim());
            const result = await otpService.generateOTP(email.trim(), phone.trim());
            setLoading(false);

            if (result.success) {
                navigate('/otp');
            } else {
                setErrors((prev) => ({
                    ...prev,
                    general: result.message || 'Failed to generate OTP. Please try again.',
                }));
            }
        } catch (err) {
            console.error('Registration error:', err);
            setErrors((prev) => ({
                ...prev,
                general: 'Network error. Please try again.',
            }));
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start bg-white">
            {/* Gradient Background */}
            <div className="w-full h-24 sm:h-32 md:h-40 bg-gradient-to-b from-[#d6a1ef] to-white"></div>

            {/* Main Content Container */}
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg px-4 sm:px-6 py-6 bg-white flex flex-col items-center -mt-8 sm:-mt-12 md:-mt-16 pb-20 sm:pb-24">
                {/* Bell Icon */}
                <img src={bellIcon} alt="Bell Icon" className="w-10 sm:w-12 md:w-14" />

                {/* Form Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
                    Create Account
                </h1>

                {/* Form Fields */}
                <div className="w-full space-y-4 sm:space-y-6">
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            onBlur={() => handleBlur('name', name)}
                            placeholder="Enter your full name (1-30 characters)"
                            className={`w-full p-3 sm:p-4 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200`}
                            maxLength="30"
                            autoComplete="off"
                            aria-describedby={errors.name ? 'name-error' : undefined}
                            required
                        />
                        {errors.name && (
                            <p id="name-error" className="text-xs sm:text-sm text-red-600 mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onBlur={() => handleBlur('email', email)}
                            placeholder="Enter your email (gmail.com or email.com)"
                            className={`w-full p-3 sm:p-4 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200`}
                            autoComplete="off"
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            required
                        />
                        {errors.email && (
                            <p id="email-error" className="text-xs sm:text-sm text-red-600 mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            onBlur={() => handleBlur('phone', phone)}
                            placeholder="Enter 10-digit mobile number (starts with 6, 7, 8, or 9)"
                            className={`w-full p-3 sm:p-4 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200`}
                            maxLength="10"
                            autoComplete="off"
                            aria-describedby={errors.phone ? 'phone-error' : undefined}
                            required
                        />
                        {errors.phone && (
                            <p id="phone-error" className="text-xs sm:text-sm text-red-600 mt-1">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                onBlur={() => handleBlur('password', password)}
                                placeholder="Create a password (6-20 characters)"
                                className={`w-full p-3 sm:p-4 pr-12 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200`}
                                maxLength="20"
                                autoComplete="new-password"
                                aria-describedby={errors.password ? 'password-error' : undefined}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="text-xs sm:text-sm text-red-600 mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                                placeholder="Confirm your password"
                                className={`w-full p-3 sm:p-4 pr-12 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] focus:border-transparent transition-all duration-200`}
                                maxLength="20"
                                autoComplete="new-password"
                                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p id="confirm-password-error" className="text-xs sm:text-sm text-red-600 mt-1">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>
                </div>

                {/* General Error Display */}
                {errors.general && (
                    <div className="w-full mt-4 sm:mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm sm:text-base text-center">
                        {errors.general}
                    </div>
                )}

                {/* Continue Button */}
                <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mt-6 sm:mt-8">
                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className="w-full h-12 sm:h-14 bg-[#5C3FFF] text-white text-base sm:text-lg font-semibold rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-[#4A2FCC] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Account...</span>
                            </div>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </div>

                {/* Sign In Link */}
                <div className="w-full text-center mt-4 sm:mt-6">
                    <p className="text-sm sm:text-base text-gray-600">
                        Already have an account?{' '}
                        <span
                            className="text-[#5C3FFF] font-medium cursor-pointer hover:underline"
                            onClick={() => navigate('/login')}
                        >
                            Sign in here
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;