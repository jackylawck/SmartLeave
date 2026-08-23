/**
 * SmartLeave Service Worker - Enterprise Cache Engine
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

// 安裝階段：預先快取所有核心靜態資源
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

// 啟用階段：清除舊版本快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// 攔截請求：靜態資源快取優先，外部 API 走網絡
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 外部 API 請求不走 Service Worker 快取，直接連網
    if (url.origin !== self.location.origin) {
        return;
    }

    // 本地靜態資源：Cache First，若無快取才連網
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        })
    );
});
