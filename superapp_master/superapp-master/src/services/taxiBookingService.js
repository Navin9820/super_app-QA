// Service for taxi booking and driver assignment
import API_CONFIG from "../config/api.config.js";
import axios from 'axios';

const DRIVERS_URL = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TAXI_DRIVERS);
const RIDES_URL = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TAXI_RIDES);
const TAXI_REQUESTS_URL = `${API_CONFIG.BASE_URL}/api/taxi-requests`;

export async function getAvailableDrivers() {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(DRIVERS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data || [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Fetch drivers API failed:', err);
    return null;
  }
}

export async function getSmartDriverAssignment() {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.get(`${DRIVERS_URL}/available/assign`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('🚕 Smart driver assignment response:', res.data);
    return res.data.data || null;
  } catch (err) {
    console.warn('Smart driver assignment failed:', err);
    return null;
  }
}

export async function createRide(rideData) {
  try {
    // Ensure vehicle_type is included in the payload
    const payload = {
      ...rideData,
      vehicle_type: rideData.vehicle_type || rideData.vehicleType || 'Auto'
    };
    
    console.log('🚕 Creating ride with payload:', payload);
    
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.post(RIDES_URL, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Create ride API failed:', err);
    return null;
  }
}

// ✅ NEW: Taxi Request Functions
export async function createTaxiRequest(requestData) {
  try {
    const token = localStorage.getItem('token') || 'demo-token';
    const res = await axios.post(TAXI_REQUESTS_URL, requestData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('🚕 Taxi request created:', res.data);
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