import API_CONFIG from '../config/api.config';
import axios from 'axios';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const warehouseService = {
  list: async (status) => {
    const res = await api.get('/api/warehouses', { params: { status } });
    return res.data?.data || [];
  },
  get: async (id) => {
    const res = await api.get(`/api/warehouses/${id}`);
    return res.data?.data;
  },
  create: async (payload) => {
    const res = await api.post('/api/warehouses', payload);
    return res.data?.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/api/warehouses/${id}`, payload);
    return res.data?.data;
  },
  toggleStatus: async (id) => {
    const res = await api.patch(`/api/warehouses/${id}/toggle-status`);
    return res.data?.data;
  },
  setDefault: async (id) => {
    const res = await api.patch(`/api/warehouses/${id}/set-default`);
    return res.data?.data;
  }
};

export default warehouseService;


