const CACHE_NAME = "rituva-cache-v3";
const urlsToCache = ["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache)));
});

self.addEventListener("activate", e=>e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);
  if(url.hostname.includes("open-meteo.com")){
    e.respondWith(
      caches.open(CACHE_NAME).then(cache=>
        fetch(e.request).then(resp=>{
          cache.put(e.request, resp.clone());
          return resp;
        }).catch(()=>cache.match(e.request))
      )
    );
  } else {
    e.respondWith(caches.match(e.request).then(resp=>resp||fetch(e.request)));
  }
});
