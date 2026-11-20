import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('restro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginUser = (credentials) =>
  api.post('/auth/login', credentials).then((r) => r.data);

export const registerUser = (userData) =>
  api.post('/auth/register', userData).then((r) => r.data);

export const getCurrentUser = () =>
  api.get('/auth/me').then((r) => r.data);

export const seedDemoUsers = () =>
  api.post('/auth/seed-demo').then((r) => r.data);

// Menu
export const getMenuItems = (category) =>
  api.get('/menu', { params: category && category !== 'all' ? { category } : {} }).then((r) => r.data);

export const createMenuItem = (itemData) =>
  api.post('/menu', itemData).then((r) => r.data);

export const toggleMenuItemAvailability = (id) =>
  api.patch(`/menu/${id}/toggle`).then((r) => r.data);

export const deleteMenuItem = (id) =>
  api.delete(`/menu/${id}`).then((r) => r.data);

// Orders
export const getOrders = (params = {}) => {
  const query = typeof params === 'string' ? { status: params } : params;
  return api.get('/orders', { params: query }).then((r) => r.data);
};

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data);

export const createOrder = (data) =>
  api.post('/orders', data).then((r) => r.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

export const cancelOrder = (id) =>
  api.delete(`/orders/${id}`).then((r) => r.data);

// Tables
export const getTables = () =>
  api.get('/tables').then((r) => r.data);

export const updateTableStatus = (id, status) =>
  api.patch(`/tables/${id}/status`, { status }).then((r) => r.data);

export default api;
