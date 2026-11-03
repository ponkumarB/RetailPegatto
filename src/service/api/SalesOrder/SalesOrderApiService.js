import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const getSalesOrders = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const createSalesOrder = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.post('/api-path-placeholder', dataOrParams);
  return res.data;
};

export const updateSalesOrder = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.put('/api-path-placeholder', dataOrParams);
  return res.data;
};

export const deleteSalesOrder = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.delete('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const filterSalesOrders = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.post('/api-path-placeholder', dataOrParams);
  return res.data;
};

export const getPriceBooks = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const getOffersDropdown = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const getQuotations = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const getAccounts = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const updateOfferStatus = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.put('/api-path-placeholder', dataOrParams);
  return res.data;
};

export const getTransactionSeries = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const lazySearchSalesOrders = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

export const getSalesOrderListsWithoutPage = async (dataOrParams) => {
  // Auto-generated generic endpoint
  const res = await apiClient.get('/api-path-placeholder', { params: dataOrParams });
  return res.data;
};

