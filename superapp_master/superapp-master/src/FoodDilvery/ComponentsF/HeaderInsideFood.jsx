import React, { useState, useEffect } from "react";
import location from "../../Images/HomeScreen/location.svg";
import leftarrow from "../../Icons/arrow-left.svg";
import { useNavigate } from "react-router-dom";
import API_CONFIG from "../../config/api.config";

function HeaderInsideFood() {
    const navigate = useNavigate();
    const [locationAddress, setLocationAddress] = useState('Set your location');
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        const savedAddress = localStorage.getItem('userAddress');
        
        if (savedAddress && !savedAddress.includes('Location (')) {
            setLocationAddress(savedAddress);
        } else if (savedAddress && savedAddress.includes('Location (')) {
            // Clear coordinate-based saved addresses
            localStorage.removeItem('userAddress');
            getCurrentLocation();
        } else {
            // If no saved location, try to detect current location
            getCurrentLocation();
        }
    }, []);

    // Helper function to get city name from coordinates
    const getCityNameFromCoords = async (lat, lng) => {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            if (response.ok) {
                const data = await response.json();
                if (data.city) {
                    return data.city;
                } else if (data.principalSubdivision) {
                    return data.principalSubdivision;
                } else if (data.countryName) {
                    return data.countryName;
                }
            }
        } catch (error) {
            console.log('Alternative geocoding failed:', error);
        }
        return null;
    };

    // Function to detect current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationAddress('Location not supported');
            return;
        }

        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                
                try {
                    // Try backend proxy first
                    const response = await fetch(API_CONFIG.getUrl(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`));
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.success && data.data) {
                            const d = data.data;
                            let readableAddress = 'Location detected';
                            
                            if (d.area && d.city) {
                                readableAddress = `${d.area}, ${d.city}`;
                            } else if (d.city) {
                                readableAddress = d.city;
                            } else if (d.state) {
                                readableAddress = d.state;
                            } else if (d.country) {
                                readableAddress = d.country;
                            }
                            
                            setLocationAddress(readableAddress);
                            localStorage.setItem('userAddress', readableAddress);
                        } else {
                            // Try alternative approach
                            const cityName = await getCityNameFromCoords(latitude, longitude);
                            if (cityName) {
                                setLocationAddress(cityName);
                                localStorage.setItem('userAddress', cityName);
                            } else {
                                setLocationAddress('Current Location');
                                localStorage.setItem('userAddress', 'Current Location');
                            }
                        }
                    } else {
                        // Try alternative approach
                        const cityName = await getCityNameFromCoords(latitude, longitude);
                        if (cityName) {
                            setLocationAddress(cityName);
                            localStorage.setItem('userAddress', cityName);
                        } else {
                            setLocationAddress('Current Location');
                            localStorage.setItem('userAddress', 'Current Location');
                        }
                    }
                } catch (error) {
                    console.log('Geocoding failed, trying alternative:', error.message);
                    const cityName = await getCityNameFromCoords(latitude, longitude);
                    if (cityName) {
                        setLocationAddress(cityName);
                        localStorage.setItem('userAddress', cityName);
                    } else {
                        setLocationAddress('Current Location');
                        localStorage.setItem('userAddress', 'Current Location');
                    }
                } finally {
                    setLoadingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationAddress('Location not available');
                setLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    return (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex flex-row items-center justify-between pt-8 px-4 pb-2 z-50">
            <div className="flex items-center gap-2 min-w-0">
                <img src={leftarrow} alt="arrow" className="w-6 h-6 cursor-pointer flex-shrink-0" onClick={()=> navigate(-1)}/> 
                <h1 className="text-base font-extrabold tracking-wide text-[var(--city-bell-color)] ml-1">City Bell</h1>
            </div>
            <div className="flex flex-col items-end min-w-0 relative max-w-[60vw] justify-end">
                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">Current Location</span>
                <div className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-semibold text-black truncate max-w-[180px]">
                        {loadingLocation ? 'Getting location...' : locationAddress}
                    </span>
                    <img src={location} alt="Location" className="w-4 h-4 flex-shrink-0 cursor-pointer" onClick={getCurrentLocation} />
                </div>
            </div>
        </div>
    );
}

export default HeaderInsideFood;
