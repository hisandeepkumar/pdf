const CACHE_NAME = "my-site-cache-v1";
const urlsToCache = [
  "/",              // Home
  "/index.html",    // Main page
  "add-page-numbers.html",    // About page
  "add-signature.html",  // Contact page
  "add-watermark.html", 
"background.css",
"extract-pages.html",
"image-to-pdf.html",
  "merge-pdf.html",
"pdf-letterhead.html",
"pdf-to-image.html",
"replace-pages.html",
"rotate_pages.html",
"text-letterhead.html",
"delete-pages.html",
"reorder-pages.html",
"/images/background.jpg",




   // CSS
  "/app.js",        // JS
  "/icon-192.png",
  "/icon-512.png"
];

// Install phase - cache all pages
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate phase - clear old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - serve cached files when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      });
    })
  );
});
