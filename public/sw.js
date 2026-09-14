/* Snooker Money Tracker Pro — offline-first service worker (App Router compatible) */
const CACHE = "smoke-cache-v1";
const STATIC = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // App shell / static assets: cache-first
  if (request.destination === "document" || request.destination === "script") {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((resp) => {
              const copy = resp.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
              return resp;
            })
            .catch(() => caches.match("/"))
      )
    );
    return;
  }

  // Everything else (images, fonts): stale-while-revalidate
  e.respondWith(
    caches.match(request).then((cached) => {
      const networked = fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});