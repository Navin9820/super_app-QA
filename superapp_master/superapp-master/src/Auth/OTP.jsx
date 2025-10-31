import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { otpService } from '../services/otpService';
import { profileService } from '../services/profileService';
import notificationService from '../services/notificationService';

function OTP() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [showOtpDisplay, setShowOtpDisplay] = useState(true);
    const [devOtp, setDevOtp] = useState('');
    const inputRefs = useRef([]);

    const pendingEmail = localStorage.getItem('pendingEmail');
    const pendingPhone = localStorage.getItem('pendingPhone');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    useEffect(() => {
        let timer;
        if (resendCountdown > 0) {
            timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
        } else {
            setResendDisabled(false);
        }
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    useEffect(() => {
        if (isLoggedIn === 'true') {
            console.log('OTP: User already logged in, redirecting to home');
            navigate('/home');
            return;
        }
        if (!pendingEmail || !pendingPhone) {
            console.log('OTP: No pending OTP data found, redirecting to login');
            if (window.location.pathname === '/otp') {
                alert('No OTP session found. Please go back to login.');
                navigate('/login');
            }
        } else {
            console.log('OTP: Pending data found, proceeding with OTP verification');
        }
    }, [pendingEmail, pendingPhone, isLoggedIn, navigate]);

    useEffect(() => {
        const fetchDevOtp = async () => {
            if (pendingEmail || pendingPhone) {
                const result = await otpService.getLatestOTP(pendingEmail, pendingPhone);
                if (result.success) setDevOtp(result.otp);
            }
        };
        fetchDevOtp();
    }, [pendingEmail, pendingPhone]);

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async (otpValue) => {
        if (!pendingEmail || !pendingPhone) {
            setError('No OTP session found. Please request a new OTP.');
            return;
        }
        if (!otpValue || otpValue.length !== 6) {
            setError('Please enter OTP');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await otpService.verifyOTP(pendingEmail, pendingPhone, otpValue);
            if (result.success) {
                console.log('OTP verified successfully, setting up authentication...');
                
                // Check if this is a new user or existing user
                const existingProfile = profileService.getProfile();
                const isNewUser = !existingProfile || 
                                 (!existingProfile.fullName && !existingProfile.email && !existingProfile.phone) ||
                                 (existingProfile.email !== pendingEmail);
                
                if (isNewUser) {
                    console.log('New user detected, clearing profile data');
                    // Clear old profile data for new user
                    profileService.clearProfileDataForNewUser();
                    // Clear old notifications for new user
                    notificationService.clearForNewUser();
                } else {
                    console.log('Existing user detected, preserving profile data and notifications');
                    // Preserve both profile data and notifications for existing users
                    // Don't clear anything for existing users
                }
                
                localStorage.setItem('token', 'demo-token');
                console.log('Demo token stored for API access');
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', pendingEmail);
                localStorage.setItem('userPhone', pendingPhone);
                const userData = {
                    email: pendingEmail,
                    phone: pendingPhone,
                    isLoggedIn: true,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('userData', JSON.stringify(userData));
                localStorage.removeItem('pendingEmail');
                localStorage.removeItem('pendingPhone');
                console.log('User authenticated with demo token, proceeding to home page');
                navigate('/home');
            } else {
                setError('Invalid OTP. Please try again.');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            setError('Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!pendingEmail || !pendingPhone) {
            alert('No user data found. Please go back to login.');
            navigate('/login');
            return;
        }
        setResendDisabled(true);
        setResendCountdown(30);
        setError('');
        try {
            const result = await otpService.generateOTP(pendingEmail, pendingPhone);
            if (result.success) {
                setShowOtpDisplay(true);
                const latest = await otpService.getLatestOTP(pendingEmail, pendingPhone);
                if (latest.success) setDevOtp(latest.otp);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                setError(result.message || 'Failed to resend OTP.');
                setResendDisabled(false);
                setResendCountdown(0);
            }
        } catch (error) {
            setError('Failed to resend OTP. Please try again.');
            setResendDisabled(false);
            setResendCountdown(0);
        }
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    };

    const copyOtpToClipboard = () => {
        if (devOtp) {
            navigator.clipboard.writeText(devOtp).then(() => {
                alert('OTP copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy OTP. Please copy manually: ' + devOtp);
            });
        }
    };

    if (window.location.pathname !== '/otp') {
        return null;
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start">
            {/* Gradient Background */}
            <div className="w-full h-32 sm:h-40 md:h-48 bg-gradient-to-b from-[#d6a1ef] to-white"></div>
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md px-4 py-6 sm:py-8 bg-white flex flex-col items-center">
                {/* Logo */}
                <h1 className="mt-2 sm:mt-4 text-lg sm:text-xl font-extrabold tracking-wide text-purple-700">City Bell</h1>
                {/* OTP Display - Persistent and copyable (dev only) */}
                {showOtpDisplay && devOtp && (
                    <div className="w-full mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-green-700 font-medium">Your OTP:</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-800 tracking-wider">{devOtp}</p>
                            </div>
                            {/* <button
                                onClick={copyOtpToClipboard}
                                className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700"
                            >
                                Copy
                            </button> */}
                        </div>
                        <button
                            onClick={() => setShowOtpDisplay(false)}
                            className="text-xs sm:text-sm text-green-600 mt-2 hover:underline"
                        >
                            Hide OTP
                        </button>
                    </div>
                )}
                {/* OTP Instruction */}
                <p className="text-xs sm:text-sm text-gray-600 text-left mt-4 sm:mt-6">
                    Please enter the verification code we've sent to your <br />
                    Mobile Number <span className="text-[#5C3FFF]">{formatPhone(pendingPhone)}</span>
                </p>
                {/* Error Message */}
                {error && (
                    <div className="w-full mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-600">{error}</p>
                    </div>
                )}
                {/* OTP Input Fields - Now 6 digits */}
                <div className="flex space-x-1 sm:space-x-2 mt-4 sm:mt-6">
                    {Array(6).fill(0).map((_, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            maxLength="1"
                            value={otp[index]}
                            onChange={e => handleOtpChange(index, e.target.value)}
                            onKeyDown={e => handleKeyDown(index, e)}
                            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-center text-base sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] disabled:opacity-50"
                            disabled={isLoading}
                        />
                    ))}
                </div>
                {/* Resend OTP */}
                <div className="w-full text-right mt-3 sm:mt-4">
                    <button
                        onClick={handleResendOtp}
                        disabled={resendDisabled || isLoading}
                        className="text-xs sm:text-sm text-[#5C3FFF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resendDisabled 
                            ? `Resend in ${resendCountdown}s` 
                            : 'Resend OTP'
                        }
                    </button>
                </div>
                {/* Confirm Button */}
                <div className='w-full mt-4 sm:mt-6'>
                    <button
                        onClick={() => handleVerifyOtp(otp.join(''))}
                        disabled={isLoading}
                        className="w-full h-10 sm:h-12 bg-[#5C3FFF] text-white text-base sm:text-lg font-semibold rounded-full flex items-center justify-center transition duration-300 hover:bg-[#4A2FCC] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'Confirm'}
                    </button>
                </div>
                {/* Back to Login */}
                <div className="w-full text-center mt-3 sm:mt-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-xs sm:text-sm text-gray-500 cursor-pointer"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OTP;