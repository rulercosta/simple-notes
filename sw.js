const CACHE_NAME = 'notes-app-v1';
const ASSETS = [
  '/simple-notes/',
  '/simple-notes/index.html',
  '/simple-notes/static/styles.css',
  '/simple-notes/static/script.js',
  '/simple-notes/static/components/EditorManager.js',
  '/simple-notes/static/components/Note.js',
  '/simple-notes/static/components/TouchManager.js',
  '/simple-notes/static/managers/ServiceManager.js',
  '/simple-notes/static/managers/ThemeManager.js',
  '/simple-notes/static/managers/ViewManager.js',
  '/simple-notes/static/services/NoteService.js',
  '/simple-notes/static/services/StorageManager.js',
  '/simple-notes/static/manifest.json',
  '/simple-notes/README.md',
  '/simple-notes/static/android-chrome-192x192.png',
  '/simple-notes/static/android-chrome-512x512.png',
  '/simple-notes/static/apple-touch-icon.png',
  '/simple-notes/static/favicon-32x32.png',
  '/simple-notes/static/favicon-16x16.png',
  '/simple-notes/static/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          ASSETS.map(asset =>
            cache.add(asset).catch(error => {
              console.warn(`Failed to cache asset: ${asset}`, error);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
          .then((fetchResponse) => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        return new Response('Offline content not available');
      })
  );
});
