import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
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
              Terms & Conditions
            </div>
          </div>
          
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <div style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                1. Acceptance of Terms
              </h3>
              <p style={{ marginBottom: 12 }}>
                By accessing and using this ride-sharing application, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                2. Use License
              </h3>
              <p style={{ marginBottom: 12 }}>
                Permission is granted to temporarily download one copy of the materials on this app for personal, non-commercial transitory viewing only.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                3. Driver Responsibilities
              </h3>
              <p style={{ marginBottom: 12 }}>
                As a driver, you agree to:
              </p>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Maintain a valid driver's license and insurance</li>
                <li>Provide safe and reliable transportation services</li>
                <li>Treat all passengers with respect and professionalism</li>
                <li>Follow all applicable traffic laws and regulations</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                4. Safety Requirements
              </h3>
              <p style={{ marginBottom: 12 }}>
                All drivers must maintain a clean driving record and pass background checks. Any violations of safety protocols may result in immediate suspension or termination of your account.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                5. Payment Terms
              </h3>
              <p style={{ marginBottom: 12 }}>
                Payment processing is handled securely through our payment partners. Drivers will receive payments according to the agreed-upon schedule and rates.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                6. Privacy Policy
              </h3>
              <p style={{ marginBottom: 12 }}>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the application.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                7. Contact Information
              </h3>
              <p style={{ marginBottom: 12 }}>
                If you have any questions about these Terms & Conditions, please contact us at support@rideapp.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
