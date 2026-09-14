# PWA Setup — Snooker Money Tracker Pro

This app is a full **Progressive Web App** that installs to home screen and works
offline-first. It deliberately does **not** use `next-pwa`; it ships a **manual,
App-Router-compatible service worker** placed in `public/` and registered client-side.
This keeps the classic Next.js build simple (no whole-app SW/webpack interception,
no `generateSW` timing issues with App Router) and gives full, readable control over the
cache strategy.

---

## 1. How the PWA is wired (no next-pwa)

Three public files make up the PWA:

| File | Purpose |
| ---- | ------- |
| `/public/sw.js` | Service worker (cache strategy + offline shell) |
| `/public/manifest.webmanifest` | Install manifest (name, colors, icons, shortcuts) |
| `/public/icon.svg`, `/public/icons/icon-192.png`, `/public/icons/icon-512.png`, `/public/apple-touch-icon.png` | Icon set |

`next.config.ts` stays minimal (`reactStrictMode: true`) — no `next-pwa` plugin
configuration is required or used.

### Registration

The service worker is registered in the **app shell** (`src/components/layout/app-shell.tsx`),
only in production so dev never caches stale assets:

```tsx
useEffect(() => {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker.register("/sw.js").catch(() => {});   // silent on failure
  }
}, []);
```

Because HTML pages are served by the Next.js server (not a static output), the worker
pre-caches the shell from `/`, the manifest, and the icon, then falls back to the network
and caches the responses it sees.

---

## 2. Service worker — `public/sw.js`

Cache name: `smoke-cache-v1`. When you ship breaking frontend changes, **bump the cache
version** (e.g. `smoke-cache-v2`) so the `activate` handler purges the old cache.

```js
const CACHE = "smoke-cache-v1";
const STATIC = ["/", "/manifest.webmanifest", "/icon.svg"];

// install: pre-cache the app shell, then take over immediately
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// activate: delete old caches, claim existing clients
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
```

### Cache strategy (`fetch` handler)

- **GET requests only** — POST/PUT/etc. are passed straight through (never cached).
- **Same-origin only** — cross-origin (Supabase API, fonts) is left untouched so realtime
  and CDN assets work normally.
- **App shell (`destination === "document"` | `"script"`): cache-first** with network
  fallback, and on network success the response is copied into cache. If both fail,
  fall back to the cached `/`.
- **Everything else (images, fonts): stale-while-revalidate** — serve cache instantly,
  fetch in the background, update the cache.

This gives an **offline-first** feel: the shell and icons load instantly and work offline;
live Supabase realtime simply stops (and the app degrades to local-only, exactly like when
`NEXT_PUBLIC_*` vars are empty).

---

## 3. Manifest — `public/manifest.webmanifest`

```json
{
  "name": "Snooker Money Tracker Pro",
  "short_name": "Snooker Money",
  "description": "Premium snooker scoring and money settlement for Thai players.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050505",
  "theme_color": "#050505",
  "orientation": "portrait",
  "lang": "en",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "Live match", "url": "/match", "description": "Open the live scoring board" }
  ]
}
```

Notes:
- `display: standalone` → launches full-screen without browser chrome.
- `purposе: "any maskable"` → safe for Android adaptive icons.
- **`/match` shortcut** → long-press/right-click the icon for a direct "Live match" launch.
- Theme/background `#050505` match the Emerald Noir brand so launch is seamless (no white flash).

---

## 4. Icons — generation (ImageMagick)

Icons are authored once as an SVG source (`public/icon.svg`) and rasterized with
**ImageMagick**. Producing the full set:

```bash
# SVG -> 192px and 512px PNG (manifest icons, "any maskable")
convert -background none public/icon.svg -resize 192x192 public/icons/icon-192.png
convert -background none public/icon.svg -resize 512x512 public/icons/icon-512.png

# 180px apple-touch-icon (iOS home screen)
convert -background none public/icon.svg -resize 180x180 public/apple-touch-icon.png
```

Use `-background none` to keep transparency; maskable icons should keep the core emblem
inside the safe-zone (≈ 80% of the canvas) so it isn't clipped by OS masking. Current
committed icons: `icon-192.png` (192×192), `icon-512.png` (512×512), `apple-touch-icon.png`
(180×180), plus the source `icon.svg`.

---

## 5. Install on iPhone (iOS Safari)

1. Open the deployed site in **Safari** (Safari only; no Chrome install on iOS).
2. Tap **Share** (bottom toolbar) → **Add to Home Screen** (or *Add to Home Screen*).
   - On iOS 16+ with PWA support, Safari may also show a banner to add the web app.
3. Rename if you like (defaults to `short_name` "Snooker Money"), then **Add**.
4. Launch from the home screen — it opens `standalone` full-screen, in **portrait**,
   using the `apple-touch-icon.png` for the launcher icon.
5. Emerald Noir `#050505` background makes the launch match the app chrome.

Requirements for iOS: **HTTPS** (served by Vercel by default), and the manifest + icons
served from the root path.

---

## 6. Install on Android (Chrome)

1. Open the deployed site in **Chrome** (or any Chromium browser).
2. Chrome automatically shows the **Add to Home Screen / Install app** prompt when it
   detects the manifest (standalone + valid icons).
3. If the prompt doesn't auto-appear: **Menu (⋮) → Add to Home screen → Install**.
4. The app launches standalone, portrait, with the adapted `192`/`512` icon.
5. Once installed, it remains available (app shell) **even offline** thanks to the
   service worker cache-first strategy.

Android requires: HTTPS, the manifest, and at least a valid 192px icon (we serve both
192 and 512).

---

## 7. Offline behavior

- **App shell offline**: after one successful visit, `/` and static JS/CSS are cached
  cache-first, so the app launches and the UI renders with no network.
- **Data stays local**: game state lives in the Zustand store (`src/store/gameStore.ts`)
  in-memory (this build is offline-first, not persistence-first). With no network, Supabase
  realtime just doesn't connect; the app continues as a fully local single player.
- **When back online**, you can reconfigure Supabase env (dedicated build) or reload without
  any service-worker error — stale-while-revalidate refreshes assets from the network.

## 8. Update flow

1. **Deploy** new code to Vercel (see [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)).
2. **Bump the SW cache** in `public/sw.js` (`smoke-cache-v1` → `smoke-cache-v2`) when you
   want to force a fresh shell. The `activate` handler deletes the old cache.
3. On next visit: `install` → `skipWaiting()` → `activate` → `clients.claim()`, so the new
   worker takes control. A single page reload finishes the swap.
4. **First install**: after `install` + `skipWaiting`, users may need one manual refresh
   on subsequent sessions to fully take over old tabs.

---

## 9. Verification / checklist

- [ ] Lighthouse → **PWA installable**: manifest present, icons `192` + `512`, SW served
      over HTTPS.
- [ ] `navigator.serviceWorker.controller` is set after first load (production).
- [ ] DevTools → **Application → Service Workers**: `sw.js` active, cache `smoke-cache-v1`
      populated.
- [ ] DevTools → **Network/offline**: reload → app shell still renders.
- [ ] iOS: Share → Add to Home Screen → launcher shows `apple-touch-icon.png`, opens
      standalone portrait.
- [ ] Android: install prompt appears; long-press icon shows "Live match" shortcut.