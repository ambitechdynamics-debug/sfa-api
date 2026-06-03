/* Studio Flyer AI — service worker (app shell + offline fallback). */
/* eslint-disable no-restricted-globals */

const VERSION = "sfa-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const IMAGE_CACHE = `${VERSION}-images`;

const SHELL_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll is atomic — if one URL fails, the install fails. Use individual
      // puts so a missing /offline page doesn't block install.
      await Promise.all(
        SHELL_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res && res.ok) await cache.put(url, res.clone());
          } catch {
            /* ignore individual shell URL failures */
          }
        })
      );
      // Don't auto-skipWaiting — the UI controls it via SKIP_WAITING message
      // so the user can be prompted to reload.
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older versions.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ─── Routing ─────────────────────────────────────────────────────────────── */
function isApiRequest(url) {
  return url.pathname.startsWith("/api/") || url.hostname.endsWith(".onrender.com") || url.hostname.endsWith(".fly.dev");
}
function isNextStatic(url) {
  return url.pathname.startsWith("/_next/static/");
}
function isImage(req, url) {
  return req.destination === "image" || url.hostname.endsWith("res.cloudinary.com");
}
function isHTMLNav(req) {
  return req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type !== "opaque") cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

async function networkFirstHTML(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(PAGES_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const shell = await caches.open(SHELL_CACHE);
    const offline = await shell.match("/offline");
    if (offline) return offline;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Never touch the API — auth tokens / freshness matter.
  if (isApiRequest(url)) return;

  // Bypass Clerk telemetry & cross-origin auth endpoints.
  if (url.hostname.endsWith("clerk.com") || url.hostname.endsWith("clerk.accounts.dev")) return;

  // Cache-first for hashed static assets.
  if (isNextStatic(url)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Cache-first for our own icons.
  if (url.origin === self.location.origin && url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // SWR for images (generated posters from Cloudinary etc.).
  if (isImage(req, url)) {
    event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE));
    return;
  }

  // HTML navigations: network-first, fall back to last cached page, then /offline.
  if (isHTMLNav(req)) {
    event.respondWith(networkFirstHTML(req));
    return;
  }
});
