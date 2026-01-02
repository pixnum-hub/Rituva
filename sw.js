const CACHE_NAME = 'rituva-cache-v1';
const ASSETS = ['.','index.html','style.css','script.js','manifest.json','icons/icon-192.png','icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key!==CACHE_NAME?caches.delete(key):null))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).catch(()=>caches.match('.'))));
});
