const CACHE="rituva-v1";
self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll([
      "./","./index.html","./manifest.json"
    ]))
  );
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin.includes("open-meteo.com")){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
