import axios from 'axios';
import { BACKEND_URL } from '../../config';

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  // Si es FormData, dejar que el browser ponga el boundary; si no, JSON
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isFormData) {
    delete (config.headers as any)['Content-Type'];
  } else {
    (config.headers as any)['Content-Type'] = (config.headers as any)['Content-Type'] || 'application/json';
  }
  // Evitar caching agresivo del navegador en GETs que podrían volver 304 sin cuerpo utilizable
  if ((config.method || 'get').toLowerCase() === 'get') {
    (config.headers as any)['Cache-Control'] = 'no-cache';
    // cache-buster opcional
    const params = new URLSearchParams(config.params as any);
    if (!params.has('_ts')) {
      params.set('_ts', String(Date.now()));
      config.params = Object.fromEntries(params.entries());
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const reqUrl = String(error?.config?.url || '');
    const originalRequest = error?.config;
    if (status === 401 && !originalRequest?._retry && !/\/api\/(login|register|auth\/refresh)/i.test(reqUrl)) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        return api
          .post('/api/auth/refresh', { refreshToken })
          .then((r) => {
            const newToken = (r?.data as any)?.token;
            if (newToken) {
              localStorage.setItem('authToken', newToken);
              // Actualizar header y reintentar
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
            return Promise.reject(error);
          })
          .catch((e) => {
            try {
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('mockUser');
            } catch {}
            try { window.dispatchEvent(new Event('auth:changed')); } catch {}
            try { window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason: 'expired' } })); } catch {}
            try {
              if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
                window.location.href = '/login';
              }
            } catch {}
            return Promise.reject(error);
          });
      } else {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('mockUser');
        } catch {}
        try { window.dispatchEvent(new Event('auth:changed')); } catch {}
        try { window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason: 'expired' } })); } catch {}
        try {
          if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
            window.location.href = '/login';
          }
        } catch {}
      }
    }
    return Promise.reject(error);
  }
);
