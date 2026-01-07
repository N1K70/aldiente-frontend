import axios from 'axios';
import { FILES_URL } from '../../config';

export const filesApi = axios.create({
  baseURL: FILES_URL,
  timeout: 10000,
});

filesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isFormData) {
    delete (config.headers as any)['Content-Type'];
  } else {
    (config.headers as any)['Content-Type'] = (config.headers as any)['Content-Type'] || 'application/json';
  }
  return config;
});
