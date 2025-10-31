import API_CONFIG from "../../config/api.config.js";
import React, { useEffect, useState } from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";
import greenLocation from "../ImagesTaxi/gpsgreen.svg";
import axios from 'axios';
import { taxiRideStorage } from '../../services/taxiRideStorageService';
import { getOtpCode, hasOtp } from '../../utils/otpUtils';

function MyRidesTaxi() {
    const [rides, setRides] = useState([]);
    const [apiError, setApiError] = useState('');
    const [revealedOtps, setRevealedOtps] = useState(new Set());

    const toggleOtpVisibility = (key) => {
        setRevealedOtps(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    useEffect(() => {
        // Debug current state
        taxiRideStorage.debug();
        
        // Check if user has changed - if so, force use localStorage only
        const userChanged = taxiRideStorage.hasUserChanged();
        if (userChanged) {
            console.log('🔍 MyRidesTaxi: User changed detected, using localStorage only');
            const localRides = taxiRideStorage.getRides();
            setRides(localRides);
            return;
        }
        
        // First try localStorage, then API as fallback
        console.log('🔍 MyRidesTaxi: Loading rides from localStorage first');
        const localRides = taxiRideStorage.getRides();
        
        // Update any "delivered" rides to "completed" for better UX
        const updatedRides = localRides.map(ride => {
            if (ride.status === 'delivered') {
                return { ...ride, status: 'completed' };
            }
            return ride;
        });
        
        // Save updated rides back to storage if any were changed
        if (updatedRides.some((ride, index) => ride.status !== localRides[index]?.status)) {
            taxiRideStorage.saveRides(updatedRides);
            console.log('🔍 MyRidesTaxi: Updated delivered rides to completed status');
        }
        
        setRides(updatedRides);
        
        // Also try to fetch from API as fallback
        async function fetchRides() {
            setApiError('');
            try {
                const token = localStorage.getItem('token') || 'demo-token';
                console.log('🔍 MyRidesTaxi: Fetching from API with token:', token);
                console.log('🔍 MyRidesTaxi: API URL:', API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.MY_RIDES));
                
                const res = await axios.get(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.MY_RIDES), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log('🔍 MyRidesTaxi: API Response:', res.data);
                
                if (res.data && res.data.success && Array.isArray(res.data.data)) {
                    console.log('🔍 MyRidesTaxi: API returned rides, merging with localStorage');
                    // Merge API rides with localStorage rides (avoid duplicates)
                    const apiRides = res.data.data;
                    const existingRides = taxiRideStorage.getRides();
                    const mergedRides = [...apiRides, ...existingRides.filter(localRide => 
                        !apiRides.some(apiRide => apiRide.id === localRide.id || apiRide._id === localRide.id)
                    )];
                    setRides(mergedRides);
                    // Save merged rides back to localStorage
                    taxiRideStorage.saveRides(mergedRides);
                } else {
                    console.log('🔍 MyRidesTaxi: API response invalid, using localStorage only');
                    setApiError('API returned no rides, using local data.');
                }
            } catch (err) {
                console.log('🔍 MyRidesTaxi: API failed, using localStorage only:', err.message);
                setApiError('Failed to fetch rides from API, using local data.');
            }
        }
        fetchRides();
    }, []);

    const handleCancelRide = (idx) => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) return;
        setRides(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], status: 'cancelled' };
            taxiRideStorage.saveRides(updated);
            return updated;
        });
    };

    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideTaxi />
            <div className='px-4 pt-20 pb-20'>
                <div className='flex justify-between items-center mb-2'>
                    <div className='font-medium text-base'>My Rides</div>
                    <button 
                        onClick={() => {
                            taxiRideStorage.manualClear();
                            setRides([]);
                        }}
                        className='text-xs bg-red-500 text-white px-2 py-1 rounded'
                    >
                        Clear All
                    </button>
                </div>
                {apiError && <div style={{ color: 'orange', fontSize: 14 }}>{apiError}</div>}
                {rides.length === 0 ? (
                    <div className='bg-white border border-[#E1E1E1] rounded-[20px] p-6 mt-4 text-center text-gray-500'>
                        No rides found. Book a ride to see it here!
                    </div>
                ) : (
                    rides.map((ride, idx) => (
                        <div key={idx} className='bg-white border border-[#E1E1E1] rounded-[20px] p-4 mt-2'>
                            <div className='flex items-center gap-3 mb-2'>
                                <div className='text-left'>
                                    <div className='font-semibold text-lg'>{'Your Captain'}</div>
                                    <div className='text-xs text-gray-500'>{ride.driver?.vehicle || ''} {ride.driver?.vehicleNumber ? '• ' + ride.driver.vehicleNumber : ''}</div>
                                </div>
                                <div className={`ml-auto rounded-full px-4 py-2 text-xs font-medium flex items-center justify-center ${ride.status === 'completed' || ride.status === 'delivered' ? 'bg-[#5C3FFF] text-white' : ride.status === 'cancelled' ? 'bg-[#FB3E3E] text-white' : 'bg-gray-300 text-gray-700'}`}>
                                    {ride.status === 'delivered' ? 'completed' : (ride.status || 'completed')}
                                </div>
                                {/* Cancel icon for active rides */}
                                {ride.status !== 'completed' && ride.status !== 'delivered' && ride.status !== 'cancelled' && (
                                    <button
                                        className='ml-2 text-red-500 hover:text-red-700 p-1 rounded-full transition-colors'
                                        title='Cancel Ride'
                                        onClick={() => handleCancelRide(idx)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div className='mb-2 text-left'>
                                <div><span className='font-semibold'>From:</span> {ride.pickup_location?.address || 'N/A'}</div>
                                <div><span className='font-semibold'>To:</span> {ride.dropoff_location?.address || 'N/A'}</div>
                                <div><span className='font-semibold'>Date:</span> {ride.completed_at ? new Date(ride.completed_at).toLocaleString() : (ride.createdAt ? new Date(ride.createdAt).toLocaleString() : 'N/A')}</div>
                                <div><span className='font-semibold'>Payment:</span> {ride.payment_method ? ride.payment_method.charAt(0).toUpperCase() + ride.payment_method.slice(1) : 'N/A'}</div>
                            </div>
                            <div className='flex justify-between items-center'>
                                <div className='text-xs text-gray-500'>{ride.date}</div>
                                <div className='text-base text-[#1E293B] font-bold'>₹{ride.totalFare || ride.fare || 'N/A'}</div>
                            </div>

                            {/* Ride OTP (if available) */}
                            {hasOtp(ride) && (
                                <div className='mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm'>
                                    <div
                                        className='flex items-center justify-between cursor-pointer hover:bg-yellow-100 rounded-md p-2 -m-2 transition-colors'
                                        onClick={() => toggleOtpVisibility(ride.id || ride._id || idx)}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <span className='text-sm font-medium text-yellow-800'>🔐 Ride OTP</span>
                                            <span className='text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full'>
                                                {revealedOtps.has(ride.id || ride._id || idx) ? 'Hide' : 'Click to reveal'}
                                            </span>
                                        </div>
                                        <div className='text-yellow-700'>
                                            {revealedOtps.has(ride.id || ride._id || idx) ? '👁️' : '👁️‍🗨️'}
                                        </div>
                                    </div>
                                    {revealedOtps.has(ride.id || ride._id || idx) ? (
                                        <div className='mt-2 text-center'>
                                            <div className='text-2xl font-mono font-bold text-yellow-900 tracking-widest'>
                                                {getOtpCode(ride)}
                                            </div>
                                            <div className='text-xs text-yellow-700 mt-1'>Share this OTP with your driver</div>
                                        </div>
                                    ) : (
                                        <div className='mt-2 text-center'>
                                            <div className='text-2xl font-mono font-bold text-yellow-600 tracking-widest'>
                                                ••••••
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <FooterTaxi />
        </div>
    );
}

export default MyRidesTaxi