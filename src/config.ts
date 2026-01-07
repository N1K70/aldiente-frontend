// URLs de los servicios - configuradas vía variables de entorno en Vercel
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const FILES_URL = import.meta.env.VITE_FILES_URL || 'http://localhost:3004';
export const CHAT_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3005';
