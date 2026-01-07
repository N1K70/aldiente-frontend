// Service Worker para caching y mejora de rendimiento
const CACHE_NAME = 'aldiente-v1';
const RUNTIME_CACHE = 'aldiente-runtime-v1';

// Recursos críticos para cachear
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia de caching: Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Cachear respuestas exitosas
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache si la red falla
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no hay cache, intentar con el precache
            return caches.match('/index.html');
          });
        });
    })
  );
});
