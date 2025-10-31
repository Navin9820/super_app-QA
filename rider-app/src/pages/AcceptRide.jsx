import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TaxiMapView from '../components/TaxiMapView';
import { riderAPI } from '../config/superAppApi';

// Dynamic API URL configuration
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 
                    process.env.REACT_APP_SUPER_APP_API_URL?.replace('/api', '') || 
                    'http://localhost:5000';

const AcceptRide = () => {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State management
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState({
        pickup: null,
        dropoff: null
    });
    const [rideAccepted, setRideAccepted] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    // Get ride data from navigation state or fetch from backend
    useEffect(() => {
        const initializeRide = async () => {
            try {
                setLoading(true);
                
                // First try to get ride from navigation state
                if (location.state?.ride) {
                    setRide(location.state.ride);
                    
                    // If coordinates are already available, use them
                    if (location.state.ride.pickup?.coordinates && location.state.ride.dropoff?.coordinates) {
                        setCoordinates({
                            pickup: location.state.ride.pickup.coordinates,
                            dropoff: location.state.ride.dropoff.coordinates
                        });
                    }
                } else {
                    // Fetch ride data from backend using rideId
                    const response = await riderAPI.getAvailableOrders();
                    
                    if (response.success && response.data) {
                        const foundRide = response.data.find(order => 
                            (order._id || order.id) === rideId && order.type === 'taxi'
                        );
                        
                        if (foundRide) {
                            const transformedRide = {
                                id: foundRide._id || foundRide.id,
                                pickup: {
                                    address: foundRide.pickup_location?.address || foundRide.pickup || 'Pickup address not available',
                                    coordinates: foundRide.pickup_location?.coordinates || null
                                },
                                dropoff: {
                                    address: foundRide.dropoff_location?.address || foundRide.dropoff || 'Dropoff address not available',
                                    coordinates: foundRide.dropoff_location?.coordinates || null
                                },
                                fare: foundRide.fare || foundRide.total_price || 0,
                                vehicleType: foundRide.customer_vehicle_type || foundRide.vehicle_type || foundRide.vehicleType || foundRide.vehicle || 'Car',
                                status: foundRide.status || 'pending',
                                customer: foundRide.user?.name || foundRide.customer_name || 'Customer',
                                paymentMethod: foundRide.payment_method || 'cash'
                            };
                            
                            setRide(transformedRide);
                            
                            // Set coordinates if available
                            if (transformedRide.pickup.coordinates && transformedRide.dropoff.coordinates) {
                                setCoordinates({
                                    pickup: transformedRide.pickup.coordinates,
                                    dropoff: transformedRide.dropoff.coordinates
                                });
                            }
                        } else {
                            throw new Error('Ride not found');
                        }
                    } else {
                        throw new Error('Failed to fetch ride data');
                    }
                }
            } catch (error) {
                console.error('❌ Error initializing ride:', error);
                setError('Failed to load ride details');
            } finally {
                setLoading(false);
            }
        };

        initializeRide();
    }, [rideId, location.state]);

    // Geocode addresses if coordinates are missing
    useEffect(() => {
        const geocodeAddresses = async () => {
            if (!ride || (coordinates.pickup && coordinates.dropoff)) return;
            
            
            try {
                // Geocode pickup address
                if (!coordinates.pickup && ride.pickup.address) {
                    const pickupResponse = await fetch(`${API_BASE_URL}/api/geocode?address=${encodeURIComponent(ride.pickup.address)}`);
                    if (pickupResponse.ok) {
                                             const pickupData = await pickupResponse.json();
                     if (pickupData.success && pickupData.data) {
                       const coords = { lat: pickupData.data.lat, lng: pickupData.data.lng };
                       setCoordinates(prev => ({ ...prev, pickup: coords }));
                     } else {
                       console.error('❌ Pickup geocoding failed:', pickupData);
                     }
                    }
                }
                
                // Geocode dropoff address
                if (!coordinates.dropoff && ride.dropoff.address) {
                    const dropoffResponse = await fetch(`${API_BASE_URL}/api/geocode?address=${encodeURIComponent(ride.dropoff.address)}`);
                    if (dropoffResponse.ok) {
                                             const dropoffData = await dropoffResponse.json();
                     if (dropoffData.success && dropoffData.data) {
                       const coords = { lat: dropoffData.data.lat, lng: dropoffData.data.lng };
                       setCoordinates(prev => ({ ...prev, dropoff: coords }));
                     } else {
                       console.error('❌ Dropoff geocoding failed:', dropoffData);
                     }
                    }
                }
            } catch (error) {
                console.error('❌ Geocoding failed:', error);
            }
        };

        geocodeAddresses();
    }, [ride, coordinates.pickup, coordinates.dropoff]);

    // Handle ride acceptance
    const handleAcceptRide = async () => {
        try {
            
            // Call backend API to accept the ride
            const response = await riderAPI.acceptTaxiRide(ride.id);
            
            if (response.success) {
                
                // Update the ride status to 'accepted'
                setRide(prevRide => ({
                    ...prevRide,
                    status: 'accepted'
                }));
                
                // Update UI state
                setRideAccepted(true);
                setShowNotification(true);
                
                // Hide notification after 3 seconds
                setTimeout(() => setShowNotification(false), 3000);
            } else {
                throw new Error(response.message || 'Failed to accept ride');
            }
            
        } catch (error) {
            console.error('❌ Failed to accept ride:', error);
            // Show error notification
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        }
    };

    // Handle map events
    const handleMapLoaded = (mapInstance) => {
    };

    const handleRouteCalculated = (routeInfo) => {
    };

    const handleNavigateToDelivery = () => {
        navigate('/delivery-navigation-map', {
            state: {
                pickup: ride.pickup.address,
                dropoff: ride.dropoff.address,
                orderType: 'taxi',
                orderId: ride.id,
                payment: ride.fare,
                paymentMethod: ride.paymentMethod || 'cash',
                previousPage: 'accept-ride',
                // Taxi-specific data
                vehicleType: ride.vehicleType,
                customer: ride.customer,
                customerPhone: ride.customerPhone,
                // Mark as already accepted
                orderAccepted: true,
                trip: {
                    id: ride.id,
                    pickup: ride.pickup.address,
                    dropoff: ride.dropoff.address,
                    fare: ride.fare,
                    vehicle_type: ride.vehicleType,
                    customer: ride.customer,
                    customer_phone: ride.customerPhone,
                    payment_method: ride.paymentMethod,
                    status: 'accepted'
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading ride details...</p>
                </div>
            </div>
        );
    }

    if (error || !ride) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <p className="text-red-600 mb-4">{error || 'Ride not found'}</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* In-App Notification */}
            {showNotification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
                    rideAccepted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-xl">
                            {rideAccepted ? '✅' : '❌'}
                        </span>
                        <div>
                            <div className="font-semibold">
                                {rideAccepted ? 'Ride Accepted!' : 'Error'}
                            </div>
                            <div className="text-sm opacity-90">
                                {rideAccepted 
                                    ? 'You have successfully accepted this ride' 
                                    : 'Failed to accept ride. Please try again.'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">🚗 Accept Taxi Ride</h1>
                            <p className="text-gray-600">Review ride details and accept the trip</p>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Ride Details */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Ride Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <span className="text-green-500 mr-2">📍</span>
                                <div>
                                    <div className="font-medium text-gray-800">Pickup Location</div>
                                    <div className="text-sm text-gray-600">{ride.pickup.address}</div>
                                    {coordinates.pickup && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✅ Coordinates: {coordinates.pickup.lat.toFixed(4)}, {coordinates.pickup.lng.toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <span className="text-red-500 mr-2">🎯</span>
                                <div>
                                    <div className="font-medium text-gray-800">Dropoff Location</div>
                                    <div className="text-sm text-gray-600">{ride.dropoff.address}</div>
                                    {coordinates.dropoff && (
                                        <div className="text-xs text-green-600 mt-1">
                                            ✅ Coordinates: {coordinates.dropoff.lat.toFixed(4)}, {coordinates.dropoff.lng.toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <div className="font-medium text-gray-800">Customer</div>
                                <div className="text-sm text-gray-600">{ride.customer}</div>
                            </div>
                            
                            <div>
                                <div className="font-medium text-gray-800">Fare</div>
                                <div className="text-lg font-bold text-green-600">₹{ride.fare}</div>
                            </div>
                            
                            <div>
                                <div className="font-medium text-gray-800">Vehicle Type</div>
                                <div className="text-sm text-gray-600">{ride.vehicleType}</div>
                            </div>
                            
                            <div>
                                <div className="font-medium text-gray-800">Payment Method</div>
                                <div className="text-sm text-gray-600 capitalize">{ride.paymentMethod}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Accept Button */}
                    <div className="text-center">
                        {rideAccepted ? (
                            <div className="space-y-4">
                                <div className="px-8 py-3 bg-green-100 text-green-800 text-lg font-semibold rounded-lg border-2 border-green-300">
                                    ✅ Ride Accepted Successfully!
                                </div>
                                <button
                                    onClick={handleNavigateToDelivery}
                                    className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    🗺️ Navigate to Trip
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleAcceptRide}
                                className="px-8 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition-colors"
                            >
                                ✅ Accept This Ride
                            </button>
                        )}
                    </div>
                </div>

                {/* Map View */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {rideAccepted ? '🗺️ Active Ride Route' : '🗺️ Route Preview'}
                    </h2>
                    
                    {coordinates.pickup && coordinates.dropoff ? (
                        <div className="h-96 rounded-lg overflow-hidden">
                            <TaxiMapView
                                pickupLocation={ride.pickup.address}
                                dropoffLocation={ride.dropoff.address}
                                pickupCoords={coordinates.pickup}
                                dropoffCoords={coordinates.dropoff}
                                height="100%"
                                showRoute={true}
                                showMarkers={true}
                                onMapLoaded={handleMapLoaded}
                                onRouteCalculated={handleRouteCalculated}
                            />
                        </div>
                    ) : (
                        <div className="h-96 bg-yellow-50 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-yellow-500 text-6xl mb-4">🗺️</div>
                                <p className="text-yellow-700 font-medium">Map Loading...</p>
                                <p className="text-yellow-600 text-sm mt-2">
                                    Fetching coordinates for route visualization
                                </p>
                                <div className="mt-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcceptRide;
