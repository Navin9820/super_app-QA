import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaxiMapView from '../components/TaxiMapView';

const TestTaxiMap = () => {
  const navigate = useNavigate();
  
  // Test coordinates for Chennai
  const [pickupLocation, setPickupLocation] = useState({
    lat: 13.0827,
    lng: 80.2707,
    address: 'Chennai Central'
  });
  
  const [dropoffLocation, setDropoffLocation] = useState({
    lat: 13.0418,
    lng: 80.2337,
    address: 'T Nagar'
  });

  const handleRouteCalculated = (routeData) => {
    console.log('✅ Test: Route calculated successfully:', routeData);
  };

  const handleMapClick = (location) => {
    console.log('✅ Test: Map clicked at:', location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">🧪 Test Taxi Map</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Test Controls</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location
              </label>
              <input
                type="text"
                value={pickupLocation.address}
                onChange={(e) => setPickupLocation(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pickup address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropoff Location
              </label>
              <input
                type="text"
                value={dropoffLocation.address}
                onChange={(e) => setDropoffLocation(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dropoff address"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg m-4 shadow-lg overflow-hidden">
          <TaxiMapView
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            onRouteCalculated={handleRouteCalculated}
            onMapClick={handleMapClick}
            style={{ height: '400px', width: '100%' }}
            showMap={true}
          />
        </div>
      </div>

      {/* Test Info */}
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Test Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Map should load with Google Maps</li>
            <li>• Green "P" marker for pickup location</li>
            <li>• Red "D" marker for dropoff location</li>
            <li>• Route should calculate automatically</li>
            <li>• Click map to test location selection</li>
            <li>• Check console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestTaxiMap;
