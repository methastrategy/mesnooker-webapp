/* Mesnooker — offline-first service worker (App Router compatible) */
/* v1: mesnooker-cache-v1 for production release; network-first for navigations;
   cache-first for versioned static chunks; stale-while-revalidate for assets.
   Purges legacy smoke-cache-* caches on activate. */
const CACHE = "mesnooker-cache-v1";
const STATIC = [
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/assets/mascot/sticker_snooker_cue.png",
];

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

  if (request.destination === "document") {
    // Navigation: NETWORK-FIRST. Fresh HTML is the source of truth — chunk
    // hashes change every deploy, so a cached shell can reference purged
    // files and hang the App Router on its Loading screen. Fall back to the
    // cache only when offline, so installed users still get a page instead
    // of an error while the network is down.
    e.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/")))
    );
    return;
  }

  // Hashed static assets (chunks, css, fonts): cache-first. Files under
  // /_next/static/ are name-hashed and effectively immutable; serving them
  // from cache is safe and fast on repeat loads.
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return resp;
          })
      )
    );
    return;
  }

  // Everything else (images, fonts, icons): stale-while-revalidate.
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
