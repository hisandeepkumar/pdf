const CACHE_NAME = "my-site-cache-v2"; // version bump karo jab assets change ho
const urlsToCache = [
  "/index.html",
  "/add-page-numbers.html",
  "/add-signature.html",
  "/add-watermark.html",
  "/background.css",
  "/extract-pages.html",
  "/image-to-pdf.html",
  "/merge-pdf.html",
  "/pdf-letterhead.html",
  "/pdf-to-image.html",
  "/replace-pages.html",
  "/rotate_pages.html",
  "/text-letterhead.html",
  "/delete-pages.html",
  "/reorder-pages.html",
  "/images/background.jpg",
  "/app.js",
  "/icon-192.png",
  "/icon-512.png"
];

// Install - pre-cache everything
self.addEventListener("install", event => {
  self.skipWaiting(); // immediately move to activate
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate - cleanup old caches and take control
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: safe cache put (only for successful GET responses)
async function safeCachePut(cacheName, request, response) {
  if (!response || !response.ok || request.method !== "GET") return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

// Fetch handler:
// - Navigation/HTML requests: network-first -> update cache -> fallback to cache if network fails
// - Other resources (css/js/images): cache-first, but update cache in background (stale-while-revalidate)
self.addEventListener("fetch", event => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  const acceptHeader = req.headers.get("accept") || "";

  // Treat navigation or HTML requests as "pages"
  const isNavigation = req.mode === "navigate" || acceptHeader.includes("text/html");

  if (isNavigation) {
    // Network-first for pages: try network, cache it, fallback to cache when offline
    event.respondWith(
      fetch(req)
        .then(networkResponse => {
          // update cache in background (but return network response immediately)
          event.waitUntil(safeCachePut(CACHE_NAME, req, networkResponse));
          return networkResponse;
        })
        .catch(async () => {
          // network failed -> return cached version if available
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(req);
          if (cachedResponse) return cachedResponse;

          // If requested page not in cache, fallback to index.html (useful for SPA) or return generic offline page
          const fallback = await cache.match("/index.html");
          if (fallback) return fallback;

          return new Response("You are offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // For non-navigation requests (static assets): try cache first, then network.
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      const networkFetch = fetch(req)
        .then(networkResponse => {
          // update cache in background
          event.waitUntil(safeCachePut(CACHE_NAME, req, networkResponse));
          return networkResponse;
        })
        .catch(() => {
          // network failed; if no cache, the promise will resolve to undefined
          return undefined;
        });

      // If we have cached response, return it immediately (makes offline refresh seamless).
      // Meanwhile networkFetch will update the cache for next time.
      return cachedResponse || networkFetch;
    })
  );
});
