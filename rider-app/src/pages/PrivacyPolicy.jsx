import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px' }}>
      <div style={{ padding: '16px' }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Back Arrow and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 16 }}>
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>
              Privacy Policy
            </div>
          </div>
          
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <div style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                1. Information We Collect
              </h3>
              <p style={{ marginBottom: 12 }}>
                We collect information you provide directly to us, such as when you create an account, request a ride, or contact us for support.
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Personal information (name, email, phone number)</li>
                <li>Driver's license and vehicle information</li>
                <li>Payment information</li>
                <li>Location data during rides</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                2. How We Use Your Information
              </h3>
              <p style={{ marginBottom: 12 }}>
                We use the information we collect to:
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Ensure safety and security of our platform</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                3. Location Information
              </h3>
              <p style={{ marginBottom: 12 }}>
                We collect precise location data when you use our app to provide ride services. This includes your location during active rides and may include background location data for safety purposes.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                4. Information Sharing
              </h3>
              <p style={{ marginBottom: 12 }}>
                We may share your information in the following circumstances:
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>With other users as necessary to provide our services</li>
                <li>With service providers who assist us in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                5. Data Security
              </h3>
              <p style={{ marginBottom: 12 }}>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                6. Your Rights
              </h3>
              <p style={{ marginBottom: 12 }}>
                You have the right to:
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                7. Contact Us
              </h3>
              <p style={{ marginBottom: 12 }}>
                If you have any questions about this Privacy Policy, please contact us at privacy@rideapp.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
