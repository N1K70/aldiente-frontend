import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (!isFormData) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>)['Content-Type'] ||= 'application/json';
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config;
    const url = String(config?.url || '');

    if (status === 401 && !config?._retry && !/\/(login|register|auth\/refresh)/i.test(url)) {
      config._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        try {
          const { data } = await api.post('/api/auth/refresh', { refreshToken });
          const newToken = data?.token;
          if (newToken) {
            localStorage.setItem('authToken', newToken);
            config.headers.Authorization = `Bearer ${newToken}`;
            return api(config);
          }
        } catch {}
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authUser');
        window.dispatchEvent(new Event('auth:changed'));
        window.dispatchEvent(new Event('auth:expired'));
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
