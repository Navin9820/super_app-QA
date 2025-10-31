import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.jsx';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    identifier: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: enter identifier, 2: enter OTP, 3: enter new password
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  useEffect(() => {
    if (authService.isLoggedIn()) {
      const professionalType = localStorage.getItem('professionalType');
      if (professionalType) {
        navigate('/dashboard');
      } else {
        navigate('/select-profession');
      }
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // VALIDATION LOGIC FOR MAIN LOGIN FORM
  const validateLoginInputs = () => {
    if (!formData.identifier.trim()) {
      setError('Email or phone number is required');
      return false;
    }
    // Phone validation for OTP login
    if (loginMethod === 'otp') {
      const phone = formData.identifier.trim();
      if (!/^\d{10}$/.test(phone)) {
        setError('Phone number must be 10 digits');
        return false;
      }
      if (!formData.password.trim()) {
        setError('OTP is required');
        return false;
      }
    }
    if (loginMethod === 'password') {
      if (!formData.password.trim()) {
        setError('Password is required');
        return false;
      }
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!validateLoginInputs()) {
      setIsLoading(false);
      return;
    }
    try {
      const result = await authService.login(formData.identifier, formData.password);
      if (result.success) {
        const professionalType = localStorage.getItem('professionalType');
        if (professionalType) {
          navigate('/dashboard');
        } else {
          navigate('/select-profession');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      // Display professional error message from backend
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!validateLoginInputs()) {
      setIsLoading(false);
      return;
    }
    try {
      const result = await authService.forgotPassword(formData.identifier);
      if (result.success) {
        alert(`OTP sent! Demo OTP: ${result.otp}`);
        setLoginMethod('otp');
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD LOGIC
  const handleForgotPasswordInputChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setForgotPasswordError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!forgotPasswordData.identifier.trim()) {
      setForgotPasswordError('Email or phone number is required');
      return;
    }
    // If input is phone, check for 10 digits
    if (/^\d+$/.test(forgotPasswordData.identifier.trim()) &&
        forgotPasswordData.identifier.trim().length !== 10) {
      setForgotPasswordError('Phone number must be 10 digits');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      const result = await authService.forgotPassword(forgotPasswordData.identifier);
      if (result.success) {
        setForgotPasswordStep(2);
        setForgotPasswordSuccess(`OTP sent to ${forgotPasswordData.identifier}. Demo OTP: ${result.otp}`);
      } else {
        setForgotPasswordError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setForgotPasswordError(err.message || 'An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotPasswordData.otp.trim()) {
      setForgotPasswordError('OTP is required');
      return;
    }
    if (forgotPasswordData.otp.length !== 6) {
      setForgotPasswordError('OTP must be 6 digits');
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      const result = await authService.resetPassword(forgotPasswordData.otp, '');
      if (result.success) {
        setForgotPasswordStep(3);
        setForgotPasswordSuccess('OTP verified successfully! Please enter your new password.');
      } else {
        setForgotPasswordError(result.error || 'Invalid OTP');
      }
    } catch (err) {
      setForgotPasswordError(err.message || 'An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordData.newPassword || !forgotPasswordData.confirmPassword) {
      setForgotPasswordError('Please fill all fields');
      return;
    }
    if (forgotPasswordData.newPassword.length < 6) {
      setForgotPasswordError('Password must be at least 6 characters long');
      return;
    }
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setForgotPasswordError('Passwords do not match');
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      setTimeout(() => {
        setForgotPasswordSuccess('Password reset successfully! You can now login with your new password.');
        setForgotPasswordLoading(false);
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep(1);
          setForgotPasswordData({
            identifier: '',
            otp: '',
            newPassword: '',
            confirmPassword: ''
          });
          setForgotPasswordError('');
          setForgotPasswordSuccess('');
        }, 2000);
      }, 1000);
    } catch (err) {
      setForgotPasswordError(err.message || 'An error occurred. Please try again.');
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotPasswordData({
      identifier: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px 24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: 400
        }}>
          {/* Logo and Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32
            }}>
              🏍️
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 24, color: '#333', fontWeight: 'bold' }}>
              Login Page
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
              {loginMethod === 'password' ? 'Sign in to your account' : 'Enter OTP to continue'}
            </p>
          </div>
          {/* Login Form */}
          <form onSubmit={loginMethod === 'password' ? handleLogin : handleOtpLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 8
              }}>
                {loginMethod === 'password' ? 'Email or Phone Number' : 'Phone Number'}
              </label>
              <input
                type={loginMethod === 'password' ? 'text' : 'tel'}
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder={loginMethod === 'password' ? 'Enter email or phone' : 'Enter phone number'}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 12,
                  fontSize: 16,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 8
              }}>
                {loginMethod === 'password' ? 'Password' : 'OTP'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={loginMethod === 'password' && !showPassword ? 'password' : 'text'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={loginMethod === 'password' ? 'Enter password' : 'Enter 6-digit OTP'}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: loginMethod === 'password' ? '50px' : '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 12,
                    fontSize: 16,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s'
                  }}
                />
                {loginMethod === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      color: '#666'
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
            </div>
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 14,
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '16px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: 16
              }}
            >
              {isLoading ? 'Signing In...' : (loginMethod === 'password' ? 'Sign In' : 'Verify OTP')}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              Don’t have an account?{' '}
              <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/register')}>
                Register
              </span>
            </div>
            {loginMethod === 'password' && (
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: 14,
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '32px 24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: 400,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 24, color: '#333', fontWeight: 'bold' }}>
                {forgotPasswordStep === 1 && 'Reset Password'}
                {forgotPasswordStep === 2 && 'Verify OTP'}
                {forgotPasswordStep === 3 && 'Set New Password'}
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                {forgotPasswordStep === 1 && 'Enter your email or phone number to receive OTP'}
                {forgotPasswordStep === 2 && 'Enter the 6-digit OTP sent to your registered number'}
                {forgotPasswordStep === 3 && 'Enter your new password'}
              </p>
            </div>
            {forgotPasswordSuccess && (
              <div style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: '12px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 14,
                textAlign: 'center'
              }}>
                {forgotPasswordSuccess}
              </div>
            )}
            {forgotPasswordError && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 14,
                textAlign: 'center'
              }}>
                {forgotPasswordError}
              </div>
            )}
            {forgotPasswordStep === 1 && (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 8
                  }}>
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    value={forgotPasswordData.identifier}
                    onChange={handleForgotPasswordInputChange}
                    placeholder="Enter email or phone number"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  style={{
                    width: '100%',
                    background: forgotPasswordLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                    marginBottom: 16
                  }}
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}
            {forgotPasswordStep === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 8
                  }}>
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={forgotPasswordData.otp}
                    onChange={handleForgotPasswordInputChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      letterSpacing: '2px'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  style={{
                    width: '100%',
                    background: forgotPasswordLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                    marginBottom: 16
                  }}
                >
                  {forgotPasswordLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}
            {forgotPasswordStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 8
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={forgotPasswordData.newPassword}
                    onChange={handleForgotPasswordInputChange}
                    placeholder="Enter new password (min 6 characters)"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      marginBottom: 16
                    }}
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={forgotPasswordData.confirmPassword}
                    onChange={handleForgotPasswordInputChange}
                    placeholder="Confirm new password"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  style={{
                    width: '100%',
                    background: forgotPasswordLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                    marginBottom: 16
                  }}
                >
                  {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={closeForgotPasswordModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 14,
                  textDecoration: 'underline'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
