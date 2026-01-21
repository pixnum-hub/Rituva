const CACHE="rituva-v1";
const ASSETS=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||
      fetch(e.request).then(n=>{
        if(e.request.url.startsWith("http")){
          const c=n.clone();
          caches.open(CACHE).then(cache=>cache.put(e.request,c));
        }
        return n;
      }).catch(()=>r)
    )
  );
});
