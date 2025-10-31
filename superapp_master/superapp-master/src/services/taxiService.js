// Service for taxi requests and Google Maps integration via backend proxy
import API_CONFIG from "../config/api.config.js";
import axios from 'axios';

const TAXI_REQUESTS_URL = `${API_CONFIG.BASE_URL}/api/taxi-requests`;

// ✅ NEW: Taxi Request Functions
export async function createTaxiRequest(requestData) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.post(TAXI_REQUESTS_URL, requestData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('🚗 Taxi request created:', res.data);
    return res.data.data;
  } catch (err) {
    console.warn('Create taxi request API failed:', err);
    throw err;
  }
}

export async function getUserTaxiRequests() {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(TAXI_REQUESTS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data || [];
  } catch (err) {
    console.warn('Fetch user taxi requests API failed:', err);
    return [];
  }
}

export async function getTaxiRequest(requestId) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${TAXI_REQUESTS_URL}/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.data.data;
  } catch (err) {
    console.warn('Fetch taxi request API failed:', err);
    return null;
  }
}

export async function updateTaxiRequestStatus(requestId, status) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.put(`${TAXI_REQUESTS_URL}/${requestId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Update taxi request status API failed:', err);
    throw err;
  }
}

export async function cancelTaxiRequest(requestId, reason) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.put(`${TAXI_REQUESTS_URL}/${requestId}/cancel`, { cancellation_reason: reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Cancel taxi request API failed:', err);
    throw err;
  }
}

export async function rateTaxiRequest(requestId, rating, review) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.put(`${TAXI_REQUESTS_URL}/${requestId}/rate`, { rating, review }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Rate taxi request API failed:', err);
    throw err;
  }
}

// ✅ BACKEND PROXY FUNCTIONS: No CORS issues, domain-agnostic
// These functions route all Google Maps API calls through our backend

export async function geocodeAddress(address) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/geocode`, {
      params: { address },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Geocode address API failed:', err);
    return null;
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/maps/reverse-geocode`, {
      params: { lat, lng },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Reverse geocode API failed:', err);
    return null;
  }
}

export async function calculateRoute(fromLocation, toLocation) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.post(`${API_CONFIG.BASE_URL}/api/distance-matrix`, {
      origins: [fromLocation],
      destinations: [toLocation]
    }, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Calculate route API failed:', err);
    return null;
  }
}

// ✅ GOOGLE PLACES FUNCTIONS: Via backend proxy
export async function getPlaceAutocomplete(query) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/maps/places/autocomplete`, {
      params: { input: query }, // Fixed: backend expects 'input', not 'query'
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Place autocomplete API failed:', err);
    return null;
  }
}

export async function getPlaceDetails(placeId) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/maps/places/details`, {
      params: { place_id: placeId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Place details API failed:', err);
    return null;
  }
}

