import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Ocultar loader cuando la app esté lista
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 300);
  }
};

// Registrar Service Worker para caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registrado:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registro falló:', error);
      });
  });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Ocultar loader después del primer render
setTimeout(hideLoader, 100);