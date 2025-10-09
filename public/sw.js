const CACHE_NAME = 'pajo-pharma-v2';
const urlsToCache = [
  '/',
  '/static/css/',
  '/static/js/',
  '/_next/static/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne JAMAIS mettre en cache les APIs ou les requêtes JSON/Next data
  const isApi = url.pathname.startsWith('/api/');
  const isNextData = url.pathname.startsWith('/_next/data');
  const acceptsJson = request.headers.get('accept')?.includes('application/json');
  const isGET = request.method === 'GET';

  if (isApi || isNextData || acceptsJson) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first pour assets statiques et navigations GET uniquement
  if (!isGET) {
    return; // ne pas interférer avec les autres méthodes
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        // Mettre en cache uniquement les réponses basiques 200
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});