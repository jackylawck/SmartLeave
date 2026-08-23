/**
 * SmartLeave Service Worker
 * Version: 2.3.0
 */

const CACHE_NAME = 'smartleave-v230';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './js/config.js',
    './js/i18n.js',
    './js/api.js',
    './js/app.js',
    './SmartLeaveicon-192.png',
    './SmartLeaveicon-512.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
