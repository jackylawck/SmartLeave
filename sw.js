/**
 * SmartLeave Service Worker - Offline Engine
 * Version: 2.2.0
 */

const CACHE_NAME = 'smartleave-v220';
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
    if (event.request.url.includes('http')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    }
});
