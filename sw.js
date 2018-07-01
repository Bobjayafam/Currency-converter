importScripts('./idb.js');

const filesToCache = [
  './',
  './index.html',
  './styles.css', 
  './main.js',
  './idb.js',
  './manifest.json'
];

const staticCache = 'cc-v1';


self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCache)
    .then((cache) => cache.addAll(filesToCache))
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
})

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== staticCache) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
});