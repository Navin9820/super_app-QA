import React from 'react';
import { useNavigate } from 'react-router-dom';

const About = () => {
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
              About Captain Pro
            </div>
          </div>
          
          <div style={{ fontSize: 16, color: '#333', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                Our Mission
              </h3>
              <p style={{ marginBottom: 12 }}>
                Captain Pro is dedicated to providing safe, reliable, and efficient ride-sharing services. We connect drivers with passengers to create a seamless transportation experience.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                What We Offer
              </h3>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Safe and reliable ride-sharing services</li>
                <li>Real-time tracking and navigation</li>
                <li>Secure payment processing</li>
                <li>24/7 customer support</li>
                <li>Driver safety features and emergency tools</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                Driver Features
              </h3>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Easy ride acceptance and management</li>
                <li>Real-time earnings tracking</li>
                <li>Safety tools and emergency features</li>
                <li>Performance analytics and insights</li>
                <li>Flexible working hours</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                Safety First
              </h3>
              <p style={{ marginBottom: 12 }}>
                Your safety is our top priority. We implement comprehensive safety measures including background checks, vehicle inspections, real-time monitoring, and emergency response systems.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                Technology
              </h3>
              <p style={{ marginBottom: 12 }}>
                Our app uses cutting-edge technology to provide the best experience for both drivers and passengers, including GPS tracking, secure payments, and intelligent matching algorithms.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                Version Information
              </h3>
              <p style={{ marginBottom: 12 }}>
                <strong>App Version:</strong> 1.0.0<br/>
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}<br/>
                <strong>Platform:</strong> React Native
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>
                Contact Support
              </h3>
              <p style={{ marginBottom: 12 }}>
                Need help? Our support team is available 24/7 to assist you with any questions or concerns.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>Email:</strong> support@captainpro.com<br/>
                <strong>Phone:</strong> +1 (555) 123-4567<br/>
                <strong>Hours:</strong> 24/7 Support
              </p>
            </div>

            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: '#f8f9fa', 
              borderRadius: 8,
              border: '1px solid #e9ecef'
            }}>
              <p style={{ fontSize: 14, color: '#666', margin: 0, textAlign: 'center' }}>
                © 2024 Captain Pro. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
