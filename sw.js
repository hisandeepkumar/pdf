const CACHE_NAME = "my-site-cache-v1";
const urlsToCache = [
 "/pdf/",              
  "/pdf/index.html",    
  "/pdf/add-page-numbers.html",    
  "/pdf/add-signature.html",  
  "/pdf/add-watermark.html", 
  "/pdf/background.css",
  "/pdf/extract-pages.html",
  "/pdf/image-to-pdf.html",
  "/pdf/merge-pdf.html",
  "/pdf/pdf-letterhead.html",
  "/pdf/pdf-to-image.html",
  "/pdf/replace-pages.html",
  "/pdf/rotate_pages.html",
  "/pdf/text-letterhead.html",
  "/pdf/delete-pages.html",
  "/pdf/reorder-pages.html",
  "/pdf/images/background.jpg",
  "/pdf/app.js",        
  "/pdf/icon-192.png",
  "/pdf/icon-512.png"
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
