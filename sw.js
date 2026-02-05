const CACHE_NAME = "rituva-weather-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = event.request.url;
  if(url.startsWith("https://api.open-meteo.com/") ||
     url.startsWith("https://air-quality-api.open-meteo.com/") ||
     url.startsWith("https://geocoding-api.open-meteo.com/")){
    event.respondWith(
      fetch(event.request).then(resp=>{
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request, clone));
        return resp;
      }).catch(()=>caches.match(event.request))
    );
  } else {
    event.respondWith(caches.match(event.request).then(resp=>resp || fetch(event.request)));
  }
});
