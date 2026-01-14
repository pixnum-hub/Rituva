const CACHE_NAME = 'rituva-v3-polar-safe';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js'
];

/* INSTALL */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

/* ACTIVATE */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* FETCH STRATEGY */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* 🚫 NEVER cache live scientific data */
  if (
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('air-quality-api') ||
    url.hostname.includes('openstreetmap.org')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  /* ✅ Cache-first only for static assets */
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    }).catch(() => caches.match('./index.html'))
  );
});
