// sw.js

const STATIC_CACHE_NAME = "pro-toolbox-static-v1"; // For the app shell
const DYNAMIC_CACHE_NAME = "pro-toolbox-dynamic-v1"; // For dynamic content

// A list of all the static files we want to cache for offline access
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Work+Sans:wght@400;500;600&display=swap",
];

// --- 1. INSTALLATION ---
// This runs when the service worker is first installed.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("Opened static cache and caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
});

// --- 2. ACTIVATION ---
// This runs after the installation and is a good place to clean up old caches.
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// --- 3. FETCH ---
// This runs for every network request made by the page.
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy: Stale-While-Revalidate for tools.json
  if (requestUrl.pathname.endsWith("/tools.json")) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // If we get a valid response, update the cache.
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });

          // Return the cached response immediately if available, otherwise wait for the network.
          return cachedResponse || fetchPromise;
        });
      })
    );
    return; // End execution for this specific case
  }

  // Strategy: Cache-First for all other requests (app shell)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If a cached version is found, return it.
      // Otherwise, go to the network to fetch the resource.
      return response || fetch(event.request);
    })
  );
});
