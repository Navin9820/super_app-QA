// Service for porter requests and driver assignment
import API_CONFIG from "../config/api.config.js";
import axios from 'axios';

const PORTER_REQUESTS_URL = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PORTER_REQUESTS);

// ✅ NEW: Porter Request Functions
export async function createPorterRequest(requestData) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.post(PORTER_REQUESTS_URL, requestData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('🚚 Porter request created:', res.data);
    return res.data.data;
  } catch (err) {
    console.warn('Create porter request API failed:', err);
    throw err;
  }
}

export async function getUserPorterRequests() {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(PORTER_REQUESTS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data || [];
  } catch (err) {
    console.warn('Fetch user porter requests API failed:', err);
    return [];
  }
}

export async function getPorterRequest(requestId) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${PORTER_REQUESTS_URL}/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Fetch porter request API failed:', err);
    return null;
  }
}

export async function updatePorterRequestStatus(requestId, status) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.put(`${PORTER_REQUESTS_URL}/${requestId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Update porter request status API failed:', err);
    throw err;
  }
}

export async function cancelPorterRequest(requestId, reason) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.put(`${PORTER_REQUESTS_URL}/${requestId}/cancel`, { cancellation_reason: reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Cancel porter request API failed:', err);
    throw err;
  }
}

export async function ratePorterRequest(requestId, rating, review) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.put(`${PORTER_REQUESTS_URL}/${requestId}/rate`, { rating, review }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Rate porter request API failed:', err);
    throw err;
  }
}

// Google Maps Integration Functions
export async function calculateRoute(fromLocation, toLocation) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/maps/directions`, {
      params: {
        from: `${fromLocation.lat},${fromLocation.lng}`,
        to: `${toLocation.lat},${toLocation.lng}`
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    console.warn('Calculate route API failed:', err);
    return null;
  }
}

export async function geocodeAddress(address) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/maps/geocode`, {
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

// ✅ NEW: Google Places API Functions via Backend Proxy
export async function getPlaceAutocomplete(query) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/maps/places/autocomplete`, {
      params: { input: query }, // Fixed: backend expects 'input', not 'query'
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data || [];
  } catch (err) {
    console.warn('Place autocomplete API failed:', err);
    return [];
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

// ✅ COMPATIBILITY FUNCTIONS: For existing Porter components
// These functions maintain backward compatibility with the old booking system

export async function getUserBookings() {
  // Alias for getUserPorterRequests to maintain compatibility
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(PORTER_REQUESTS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err) {
    console.warn('Fetch user bookings API failed:', err);
    return { success: false, data: [] };
  }
}

export async function getBookingById(bookingId) {
  // Alias for getPorterRequest to maintain compatibility
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${PORTER_REQUESTS_URL}/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Ensure consistent response format
    return {
      success: true,
      data: res.data.data || res.data
    };
  } catch (err) {
    console.warn('Fetch booking by ID API failed:', err);
    return { success: false, data: null };
  }
} 