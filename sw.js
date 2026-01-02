const CACHE_NAME = "rituva-cache-v1";
const urlsToCache = ["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener("activate", event => { event.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", event => {
  event.respondWith(caches.match(event.request).then(resp=>resp||fetch(event.request)));
});
