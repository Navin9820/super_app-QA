import API_CONFIG from '../config/api.config';
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  console.log('🔑 Auth token from localStorage:', token ? 'Present' : 'Missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Authorization header set');
  } else {
    console.warn('⚠️ No auth token found, request may fail');
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Return the whole response object if it's successful
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const brandService = {
  // Get all brands
  getAllBrands: async () => {
    try {
      console.log('🔍 Fetching brands from:', '/api/admin/get_all_brand');
      console.log('🔍 Base URL:', API_CONFIG.BASE_URL);
      console.log('🔍 Full URL:', `${API_CONFIG.BASE_URL}/api/admin/get_all_brand`);
      
      const response = await api.get('/api/admin/get_all_brand');
      console.log('📊 Raw response:', response);
      console.log('📊 Response status:', response.status);
      console.log('📊 Response data:', response.data);
      
      // Handle the response data structure properly
      let brands = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          brands = response.data;
          console.log('✅ Direct array response detected');
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested data object with array
          brands = response.data.data;
          console.log('✅ Nested data object response detected');
        } else if (response.data.success && response.data.data) {
          // Success object with data array
          brands = response.data.data;
          console.log('✅ Success object response detected');
        } else {
          console.warn('⚠️ Unexpected response structure:', response.data);
        }
      } else {
        console.warn('⚠️ No data in response');
      }
      
      console.log('✅ Final processed brands:', brands);
      console.log('✅ Brands count:', brands.length);
      return brands;
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },

  // Create brand
  createBrand: async (brandData) => {
    try {
      console.log('Creating brand with data in brandService.js:');
      for (let [key, value] of brandData.entries()) {
        console.log(`${key}:`, value);
      }
      const response = await api.post('/api/admin/save_brand', brandData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Create brand response:', response);
      return response.data;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },

  // Update brand
  updateBrand: async (id, brandData) => {
    try {
      console.log('Updating brand with id in brandService.js:', id, 'data:');
      for (let [key, value] of brandData.entries()) {
        console.log(`${key}:`, value);
      }
      const response = await api.put(`/api/admin/update_brand_by_id/${id}`, brandData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Update brand response:', response);
      return response.data;
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  },

  // Delete brand
  deleteBrand: async (id) => {
    try {
      console.log('Deleting brand with id:', id);
      const response = await api.delete(`/api/admin/delete_brand_by_id/${id}`);
      console.log('Delete brand response:', response);
      return response.data;
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  },

  // Bulk delete brands
  bulkDeleteBrands: async (ids) => {
    try {
      console.log('Bulk deleting brands with ids:', ids);
      const response = await api.delete('/api/admin/bulk_delete_brands', { data: { ids } });
      console.log('Bulk delete brands response:', response);
      return response.data;
    } catch (error) {
      console.error('Error bulk deleting brands:', error);
      throw error;
    }
  }
};

export default brandService; 