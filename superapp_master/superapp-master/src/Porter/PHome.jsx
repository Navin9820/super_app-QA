import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from './Footer';
import PorterMapView from './PorterMapView';
import { createPorterRequest, calculateRoute, geocodeAddress, getPlaceAutocomplete, getPlaceDetails } from '../services/porterService';
import paymentService from '../services/paymentService';
import { profileService } from '../services/profileService';
import { useNotifications } from '../Utility/NotificationContext';

const vehicleOptions = [
  { type: "Bike", rate: 15 },
  { type: "Auto", rate: 25 },
  { type: "Mini-Truck", rate: 40 },
];

// Google Maps API Key is now handled by backend proxy

function LocationAutocomplete({ label, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (text) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // Use backend proxy to avoid CORS issues
      const suggestions = await getPlaceAutocomplete(text.trim());
      if (!suggestions) return;
      
      // Get place details for each suggestion
      const detailedSuggestions = await Promise.all(
        suggestions.slice(0, 5).map(async (prediction) => {
          try {
            const details = await getPlaceDetails(prediction.place_id);
            if (!details || !details.geometry) return null;
            
            return {
              properties: {
                label: details.formatted_address,
                coordinates: [
                  details.geometry.location.lng,
                  details.geometry.location.lat
                ]
              },
              place_id: prediction.place_id
            };
          } catch (error) {
            console.error('Error fetching place details:', error);
            return null;
          }
        })
      );
      
      setSuggestions(detailedSuggestions.filter(Boolean));
    } catch (e) {
      console.error('Error fetching suggestions:', e);
      setSuggestions([]);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <label className="block font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={e => {
          onChange(e.target.value);
          fetchSuggestions(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        className="w-full p-2 border border-gray-300 rounded"
        placeholder={label}
        autoComplete="off"
        required
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-20 bg-white border border-gray-200 w-full mt-1 rounded shadow max-h-48 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
              onMouseDown={() => {
                onChange(s.properties.label);
                onSelect && onSelect(s);
                setShowDropdown(false);
              }}
            >
              {s.properties.label}
            </li>
          ))}
        </ul>
      )}
      {loading && <div className="absolute right-2 top-2 text-xs text-gray-400">Loading...</div>}
    </div>
  );
}

const PHome = () => {
  const navigate = useNavigate();
  const { addOrderSuccessNotification, addPaymentSuccessNotification } = useNotifications();
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [bookingData, setBookingData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [userProfile, setUserProfile] = useState({ fullName: '', phone: '', email: '' });

  // Load user profile data
  useEffect(() => {
    const profile = profileService.getProfile();
    setUserProfile({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      email: profile.email || ''
    });
  }, []);

  // Custom toast notification (same as e-commerce)
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Calculate distance when coordinates change
  React.useEffect(() => {
    const fetchDistance = async () => {
      if (!pickupCoords || !dropCoords) {
        setDistance(null);
        setFare(null);
        return;
      }
      
      console.log('Calculating distance between:', pickupCoords, 'and', dropCoords);
      setLoadingDistance(true);
      try {
        // Use backend proxy to avoid CORS issues
        const routeData = await calculateRoute(
          { lat: pickupCoords[1], lng: pickupCoords[0] },
          { lat: dropCoords[1], lng: dropCoords[0] }
        );
        
        if (routeData && routeData.distance && routeData.duration) {
          const km = parseFloat(routeData.distance.replace(' km', ''));
          const minutes = parseFloat(routeData.duration.replace(' min', ''));
          setDistance(km);
          console.log(`✅ Route calculated: ${km.toFixed(2)} km, ${minutes} min`);
        } else {
          throw new Error('No route found');
        }
      } catch (e) {
        console.warn('Google Maps API failed, using fallback calculation:', e.message);
        // Fallback: Simple distance calculation using coordinates
        const lat1 = pickupCoords[1];
        const lon1 = pickupCoords[0];
        const lat2 = dropCoords[1];
        const lon2 = dropCoords[0];
        
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const fallbackDistance = Math.round(R * c * 100) / 100;
        setDistance(fallbackDistance);
        console.log(`⚠️ Fallback distance: ${fallbackDistance.toFixed(2)} km`);
      }
      setLoadingDistance(false);
    };
    fetchDistance();
  }, [pickupCoords, dropCoords]);

  // Calculate fare when distance or vehicle changes
  React.useEffect(() => {
    if (distance && selectedVehicle) {
      // Base fare + per km rate
      const baseFares = {
        "Bike": 50,
        "Auto": 80,
        "Mini-Truck": 150
      };
      const baseFare = baseFares[selectedVehicle.type] || 100;
      const perKmFare = Math.ceil(distance) * selectedVehicle.rate;
      const totalFare = baseFare + perKmFare;
      // Limit fare to reasonable amount (max ₹2000 for testing)
      const limitedFare = Math.min(totalFare, 2000);
      setFare(limitedFare);
    } else {
      setFare(null);
    }
  }, [distance, selectedVehicle]);

  // Show map when both locations are set
  useEffect(() => {
    if (pickupCoords && dropCoords) {
      setShowMap(true);
    }
  }, [pickupCoords, dropCoords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingBooking(true);
    try {
      // If coordinates aren't set, use default coordinates for testing
      let finalPickupCoords = pickupCoords;
      let finalDropCoords = dropCoords;
      
      // Calculate distance if not already calculated
      if (!distance && selectedVehicle) {
        if (!pickupCoords && pickupLocation) {
          // Default coordinates for Hosur (approximate)
          finalPickupCoords = [77.8256, 12.7396];
          console.log('Using default coordinates for pickup:', finalPickupCoords);
        }
        
        if (!dropCoords && dropLocation) {
          // Default coordinates for Chennai (approximate)
          finalDropCoords = [80.2707, 13.0827];
          console.log('Using default coordinates for drop:', finalDropCoords);
        }
        
        // Calculate distance manually
        if (finalPickupCoords && finalDropCoords) {
          const lat1 = finalPickupCoords[1];
          const lon1 = finalPickupCoords[0];
          const lat2 = finalDropCoords[1];
          const lon2 = finalDropCoords[0];
          
          // Haversine formula for distance calculation
          const R = 6371; // Earth's radius in km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const calculatedDistance = Math.round(R * c * 100) / 100;
          console.log('Manual distance calculation:', calculatedDistance, 'km');
          setDistance(calculatedDistance);
          
          // Calculate fare immediately
          const baseFares = {
            "Bike": 50,
            "Auto": 80,
            "Mini-Truck": 150
          };
          const baseFare = baseFares[selectedVehicle.type] || 100;
          const perKmFare = Math.ceil(calculatedDistance) * selectedVehicle.rate;
          const totalFare = baseFare + perKmFare;
          const limitedFare = Math.min(totalFare, 2000);
          
          console.log('Manual fare calculation:', limitedFare, 'rupees');
          setFare(limitedFare);
        }
      }
      
      if (!pickupCoords && pickupLocation) {
        // Default coordinates for Hosur (approximate)
        finalPickupCoords = [77.8256, 12.7396];
        console.log('Using default coordinates for pickup:', finalPickupCoords);
      }
      
      if (!dropCoords && dropLocation) {
        // Default coordinates for Chennai (approximate)
        finalDropCoords = [80.2707, 13.0827];
        console.log('Using default coordinates for drop:', finalDropCoords);
      }
      
      const bookingPayload = {
        pickup_location: {
          address: pickupLocation,
          latitude: finalPickupCoords ? finalPickupCoords[1] : undefined,
          longitude: finalPickupCoords ? finalPickupCoords[0] : undefined,
        },
        dropoff_location: {
          address: dropLocation,
          latitude: finalDropCoords ? finalDropCoords[1] : undefined,
          longitude: finalDropCoords ? finalDropCoords[0] : undefined,
        },
        vehicle_type: selectedVehicle?.type,
        distance: distance ? Number(distance.toFixed(2)) : null,
        fare: fare || null,
        // User information
        user_name: userProfile.fullName,
        user_phone: userProfile.phone,
        user_email: userProfile.email,
        // Optionally: item_description, item_weight, special_instructions
      };
      console.log('Submitting booking with payload:', bookingPayload);
      
      // Create porter request directly (like taxi pattern)
      try {
        const res = await createPorterRequest(bookingPayload);
        console.log('🔍 PHome.jsx - Porter request response:', res);
        console.log('🔍 PHome.jsx - OTP in response:', res?.delivery_otp);
        
        if (res && res._id) {
          // Store booking data in localStorage for fallback
          const bookingData = { 
            ...res, 
            status: 'pending',
            requestId: res._id,
            pickup_location: bookingPayload.pickup_location,
            dropoff_location: bookingPayload.dropoff_location,
            vehicle_type: bookingPayload.vehicle_type,
            distance: bookingPayload.distance,
            fare: bookingPayload.fare,
            delivery_otp: res.delivery_otp // Explicitly include OTP
          };
          localStorage.setItem('lastPorterBooking', JSON.stringify(bookingData));
          
          // Add order success notification
          addOrderSuccessNotification({
            orderId: res._id || `PORTER-${Date.now()}`,
            totalAmount: `₹${bookingPayload.fare}`,
            restaurantName: 'Porter Service',
            estimatedDelivery: '30-45 minutes'
          });
          
          showToast('Porter request confirmed!', 'success');
          navigate('/porter/confirmation', { 
            state: bookingData
          });
        } else {
          showToast('Request creation failed. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Request creation error:', err);
        showToast('Request creation failed. Please try again.', 'error');
      }
      setLoadingBooking(false);
    } catch (err) {
      console.error('Booking error:', err);
      showToast('Booking failed. Please try again.', 'error');
      setLoadingBooking(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      showToast('Please select a payment method.', 'error');
      return;
    }

    if (selectedPaymentMethod === 'razorpay') {
      try {
        console.log('📦 Starting Razorpay payment for porter request...');
        const paymentData = {
          amount: fare || 100,
          currency: 'INR',
          order_model: 'PorterRequest',
          order_data: {
            user_id: '507f1f77bcf86cd799439011', // Default user ID
            pickup_location: bookingData.pickup_location,
            dropoff_location: bookingData.dropoff_location,
            vehicle_type: bookingData.vehicle_type,
            distance: bookingData.distance || 0,
            fare: bookingData.fare || 100,
            user_name: userProfile.fullName,
            user_phone: userProfile.phone,
            user_email: userProfile.email
          },
          email: userProfile.email || 'user@example.com',
          contact: userProfile.phone || '9999999999'
        };

        await paymentService.processPayment(paymentData, {
          onSuccess: async (successData) => {
            console.log('✅ Porter payment successful:', successData);
            
            try {
              // Create porter request after successful payment
              const porterRequest = await createPorterRequest(bookingData);
              console.log('✅ Porter request created:', porterRequest);
              console.log('🔍 PHome.jsx - Payment flow OTP:', porterRequest?.delivery_otp);
              
              // Store booking data in localStorage for fallback
              const finalBookingData = { 
                ...bookingData, 
                payment_method: 'Razorpay',
                payment_id: successData.payment_id,
                status: 'assigned',
                requestId: porterRequest._id,
                _id: porterRequest._id,
                delivery_otp: porterRequest.delivery_otp // Include OTP
              };
              localStorage.setItem('lastPorterBooking', JSON.stringify(finalBookingData));
              
              // Add order success notification
              addOrderSuccessNotification({
                orderId: porterRequest._id || `PORTER-${Date.now()}`,
                totalAmount: `₹${bookingData.fare}`,
                restaurantName: 'Porter Service',
                estimatedDelivery: '30-45 minutes'
              });
              
              // Add payment success notification
              addPaymentSuccessNotification({
                orderId: porterRequest._id || `PORTER-${Date.now()}`,
                amount: `₹${bookingData.fare}`,
                paymentMethod: 'Online Payment'
              });
              
              showToast('Payment successful! Request confirmed.', 'success');
              navigate('/porter/tracking', { 
                state: finalBookingData
              });
            } catch (error) {
              console.error('❌ Error creating porter request:', error);
              showToast('Payment successful but request creation failed. Please contact support.', 'error');
            }
          },
          onError: (error) => {
            console.error('❌ Porter payment failed:', error);
            showToast('Payment failed: ' + error.message, 'error');
          },
          onCancel: () => {
            console.log('🚫 Porter payment cancelled');
            showToast('Payment was cancelled', 'error');
          }
        });
      } catch (error) {
        console.error('❌ Porter payment error:', error);
        showToast('Payment error: ' + error.message, 'error');
      }
    } else {
      // For other payment methods, create request directly
      try {
        const res = await createPorterRequest(bookingData);
        if (res && res._id) {
          // Store booking data in localStorage for fallback
          const finalBookingData = { 
            ...res, 
            payment_method: selectedPaymentMethod,
            status: 'assigned',
            _id: res._id
          };
          localStorage.setItem('lastPorterBooking', JSON.stringify(finalBookingData));
          
          // Add order success notification
          addOrderSuccessNotification({
            orderId: res._id || `PORTER-${Date.now()}`,
            totalAmount: `₹${bookingData.fare}`,
            restaurantName: 'Porter Service',
            estimatedDelivery: '30-45 minutes'
          });
          
          showToast('Request confirmed!', 'success');
          navigate('/porter/tracking', { 
            state: finalBookingData
          });
        } else {
          showToast('Request creation failed. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Request creation error:', err);
        showToast('Request creation failed. Please try again.', 'error');
      }
    }
  };

  // Handle route calculation from Google Maps
  const handleRouteCalculated = (routeData) => {
    if (routeData && routeData.distance) {
      const km = parseFloat(routeData.distance.replace(' km', ''));
      setDistance(km);
      console.log(`✅ Google Maps route calculated: ${km.toFixed(2)} km`);
    }
  };

  // Convert coordinates format for Google Maps component
  const getPickupLocationForMap = () => {
    if (!pickupCoords) return null;
    return {
      lat: pickupCoords[1],
      lng: pickupCoords[0],
      address: pickupLocation
    };
  };

  const getDropoffLocationForMap = () => {
    if (!dropCoords) return null;
    return {
      lat: dropCoords[1],
      lng: dropCoords[0],
      address: dropLocation
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20">
      {/* Custom Toast Notification */}
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Header with Back Button */}
      <div className="relative">
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Banner */}
      <img
        src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80"
        alt="Banner"
        className="w-full object-cover h-64"
      />

      <div className="max-w-md mx-auto p-4 bg-white mt-[-40px] rounded-2xl shadow-lg relative z-10 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Book Your Delivery
        </h2>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          {/* Pickup Location */}
          <LocationAutocomplete
            label="Pickup Location"
            value={pickupLocation}
            onChange={setPickupLocation}
            onSelect={feature => setPickupCoords(feature.properties.coordinates)}
          />

          {/* Drop Location */}
          <LocationAutocomplete
            label="Drop Location"
            value={dropLocation}
            onChange={setDropLocation}
            onSelect={feature => setDropCoords(feature.properties.coordinates)}
          />

          {/* Vehicle Selection */}
          <div>
            <label className="block font-medium mb-3">Select Vehicle</label>
            <div className="flex gap-2 flex-wrap">
              {vehicleOptions.map((v, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedVehicle(v)}
                  className={`flex-1 min-w-0 px-3 py-3 border rounded-lg transition-colors duration-150 text-sm font-medium ${
                    selectedVehicle?.type === v.type
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {v.type}
                </button>
              ))}
            </div>
          </div>

          {/* Distance & Fare Estimate */}
          <div>
            <label className="block font-medium mb-2">Distance & Estimated Fare</label>
            <div className="text-lg font-semibold text-gray-800 min-h-[1.5rem]">
              {loadingDistance && "Calculating..."}
              {!loadingDistance && distance && selectedVehicle && (
                <>
                  {distance.toFixed(2)} km &nbsp;|&nbsp; ₹{fare}
                </>
              )}
              {!loadingDistance && (!distance || !selectedVehicle) && "-"}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!pickupCoords || !dropCoords || !selectedVehicle || loadingDistance || loadingBooking}
          >
            {loadingBooking ? 'Booking...' : 'Continue Booking'}
          </button>
        </form>
      </div>

      {/* Google Maps Integration */}
      {showMap && (
        <div className="max-w-md mx-auto p-4 mt-6 mb-8">
          <PorterMapView
            pickupLocation={getPickupLocationForMap()}
            dropoffLocation={getDropoffLocationForMap()}
            onRouteCalculated={handleRouteCalculated}
            style={{ height: '300px', width: '100%' }}
            className="bg-white rounded-2xl shadow-lg p-4"
            showMap={true}
            showRoute={true}
            showTraffic={false}
          />
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-11/12 max-w-sm mx-auto animate-bounceIn">
            <h2 className="text-lg font-bold mb-4 text-center">Select Payment Method</h2>
            <div className="flex flex-col gap-3 mb-4">
              <button
                className={`w-full px-4 py-3 rounded-lg border text-base font-semibold transition-colors ${selectedPaymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-blue-50'}`}
                onClick={() => setSelectedPaymentMethod('cash')}
              >
                Cash
              </button>
              <button
                className={`w-full px-4 py-3 rounded-lg border text-base font-semibold transition-colors ${selectedPaymentMethod === 'card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-blue-50'}`}
                onClick={() => setSelectedPaymentMethod('card')}
              >
                Card
              </button>
              <button
                className={`w-full px-4 py-3 rounded-lg border text-base font-semibold transition-colors ${selectedPaymentMethod === 'upi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-blue-50'}`}
                onClick={() => setSelectedPaymentMethod('upi')}
              >
                UPI
              </button>
              <button
                className={`w-full px-4 py-3 rounded-lg border text-base font-semibold transition-colors ${selectedPaymentMethod === 'razorpay' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-blue-50'}`}
                onClick={() => setSelectedPaymentMethod('razorpay')}
              >
                Razorpay
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={handlePayment}
                disabled={!selectedPaymentMethod}
              >
                Confirm & Pay ₹{fare || 0}
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PHome;