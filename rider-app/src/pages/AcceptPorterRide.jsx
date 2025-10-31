import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PorterMapView from '../components/PorterMapView';
import { riderAPI } from '../config/superAppApi';

const AcceptPorterRide = () => {
  const { rideId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState(null);
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rideAccepted, setRideAccepted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Dynamic API base URL
  const API_BASE_URL = process.env.REACT_APP_SUPER_APP_API_URL || 
                      process.env.REACT_APP_BACKEND_URL || 
                      'http://localhost:5000';

  useEffect(() => {
    // Get ride data from navigation state or fetch from backend
    if (location.state?.rideData) {
      setRide(location.state.rideData);
      setIsLoading(false);
    } else {
      // Fetch ride data from backend if not passed in state
      fetchRideData();
    }
  }, [location.state, rideId]);

  const fetchRideData = async () => {
    try {
      // This would be implemented when we have a backend endpoint
      // For now, we'll use the rideId from params
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch ride data');
      setIsLoading(false);
    }
  };

  const geocodeAddresses = async () => {
    if (!ride) return;

    try {
      console.log('🗺️ Geocoding addresses for porter ride:', rideId);

      // Geocode pickup address
      const pickupResponse = await fetch(`${API_BASE_URL}/api/geocode?address=${encodeURIComponent(ride.pickup)}`);
      const pickupData = await pickupResponse.json();
      
      if (pickupData.success && pickupData.data) {
        const pickupCoords = {
          lat: pickupData.data.lat,
          lng: pickupData.data.lng,
          address: ride.pickup
        };
        setPickupCoordinates(pickupCoords);
        console.log('✅ Pickup coordinates fetched:', pickupCoords);
      } else {
        console.error('❌ Failed to geocode pickup address:', pickupData);
      }

      // Geocode dropoff address
      const dropoffResponse = await fetch(`${API_BASE_URL}/api/geocode?address=${encodeURIComponent(ride.dropoff)}`);
      const dropoffData = await dropoffResponse.json();
      
      if (dropoffData.success && dropoffData.data) {
        const dropoffCoords = {
          lat: dropoffData.data.lat,
          lng: dropoffData.data.lng,
          address: ride.dropoff
        };
        setDropoffCoordinates(dropoffCoords);
        console.log('✅ Dropoff coordinates fetched:', dropoffCoords);
      } else {
        console.error('❌ Failed to geocode dropoff address:', dropoffData);
      }

    } catch (err) {
      console.error('❌ Error geocoding addresses:', err);
      setError('Failed to geocode addresses');
    }
  };

  useEffect(() => {
    if (ride) {
      geocodeAddresses();
    }
  }, [ride]);


  const handleAcceptRide = async () => {
    // Check ride status before attempting to accept
    if (ride.status === 'assigned' || ride.status === 'accepted' || ride.status === 'completed' || ride.status === 'cancelled') {
      console.warn('Ride is no longer available for acceptance. Status:', ride.status);
      setError(`This ride is no longer available. Status: ${ride.status}`);
      return;
    }

    try {
      const response = await riderAPI.acceptPorterRide(ride.id);
      if (response.success) {
        console.log('✅ Porter ride accepted successfully:', response.data);
        // Update the ride status to 'accepted'
        setRide(prevRide => ({
          ...prevRide,
          status: 'accepted'
        }));
        setRideAccepted(true);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        throw new Error(response.message || 'Failed to accept porter ride');
      }
    } catch (error) {
      console.error('❌ Failed to accept porter ride:', error);
      setError(error.message || 'Failed to accept porter ride');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handleNavigateNow = () => {
    navigate('/delivery-navigation-map', {
      state: {
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        orderType: 'porter',
        orderId: ride.id,
        payment: ride.fare,
        paymentMethod: 'cod', // Porter deliveries are typically COD
        previousPage: 'accept-porter',
        // Porter-specific data
        vehicleType: ride.vehicleType,
        item_description: ride.item_description,
        special_instructions: ride.special_instructions,
        // Mark as already accepted
        orderAccepted: true,
        trip: {
          id: ride.id,
          pickup: ride.pickup,
          dropoff: ride.dropoff,
          fare: ride.fare,
          vehicle_type: ride.vehicleType,
          item_description: ride.item_description,
          special_instructions: ride.special_instructions,
          status: 'accepted'
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading porter ride details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error: {error}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-lg font-semibold">No ride data found</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {rideAccepted ? 'Porter Ride Accepted!' : 'Accept Porter Ride'}
              </h1>
              <p className="text-gray-600 mt-1">
                {rideAccepted ? 'You are now assigned to this delivery' : 'Review details and accept this delivery request'}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ride Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {ride.pickup}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {ride.dropoff}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.vehicleType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fare</label>
                    <p className="mt-1 text-sm text-gray-900">₹{ride.fare}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      ride.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      ride.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      ride.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ride.status?.charAt(0).toUpperCase() + ride.status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                </div>

                {ride.item_description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Description</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.item_description}</p>
                  </div>
                )}

                {ride.special_instructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Accept Button */}
              {!rideAccepted && (
                <div className="mt-6">
                  {ride.status === 'pending' ? (
                    <button
                      onClick={handleAcceptRide}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Accept This Delivery
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold cursor-not-allowed"
                    >
                      {ride.status === 'assigned' ? 'Already Assigned' :
                       ride.status === 'accepted' ? 'Already Accepted' :
                       ride.status === 'completed' ? 'Completed' :
                       ride.status === 'cancelled' ? 'Cancelled' :
                       'Not Available'}
                    </button>
                  )}
                </div>
              )}

              {/* Accepted Status */}
              {rideAccepted && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Delivery Accepted Successfully!
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={handleNavigateNow}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                      Navigate to Delivery
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Route</h2>
              
              {pickupCoordinates && dropoffCoordinates ? (
                                 <PorterMapView
                   pickupLocation={pickupCoordinates}
                   dropoffLocation={dropoffCoordinates}
                   pickupCoords={{ lat: pickupCoordinates.lat, lng: pickupCoordinates.lng }}
                   dropoffCoords={{ lat: dropoffCoordinates.lat, lng: dropoffCoordinates.lng }}
                   height="600px"
                   showRoute={true}
                   showMarkers={true}
                 />
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                    <p>Loading route...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Porter ride accepted successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptPorterRide;
