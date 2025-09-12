const CACHE_NAME = "my-site-cache-v2";
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
  "/icon-512.png",
  "/offline.html"  // Add an offline fallback page
];

// Install phase - cache all pages and assets
self.addEventListener("install", event => {
  self.skipWaiting(); // Force activation immediately
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache all specified resources
      return cache.addAll(urlsToCache).catch(err => {
        console.log("Failed to cache some resources:", err);
      });
    })
  );
});

// Activate phase - clear old caches and claim clients
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
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event with enhanced offline handling
self.addEventListener("fetch", event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // For HTML pages: try network first, then cache
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest version
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page if nothing in cache
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // For other resources: cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Update cache in background
          fetch(event.request)
            .then(response => {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, response));
            })
            .catch(() => { /* Ignore update errors */ });
          return cachedResponse;
        }
        
        // Not in cache, try network
        return fetch(event.request)
          .then(response => {
            // Cache new resource
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
            return response;
          })
          .catch(() => {
            // Return appropriate fallback based on file type
            if (event.request.url.includes('.css')) {
              return new Response('body { background: #f0f0f0; }', { headers: { 'Content-Type': 'text/css' } });
            }
            if (event.request.url.includes('.js')) {
              return new Response('console.log("Offline mode");', { headers: { 'Content-Type': 'text/javascript' } });
            }
            if (event.request.url.includes('.png') || event.request.url.includes('.jpg')) {
              // Return a transparent pixel for missing images
              return new Response('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', { 
                headers: { 'Content-Type': 'image/gif' } 
              });
            }
            return new Response('Offline content not available');
          });
      })
  );
});
