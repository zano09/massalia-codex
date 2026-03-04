const CACHE_NAME = 'massalia-v1';

// 1. Installation du Service Worker
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installé');
    self.skipWaiting();
});

// 2. Activation
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activé');
    return self.clients.claim();
});

// 3. Interception des requêtes (Fetch)
self.addEventListener('fetch', (e) => {
    // Pour l'instant, on laisse tout passer par le réseau (pas de cache strict)
    // Cela évite les bugs pendant que tu développes.
    e.respondWith(fetch(e.request));
});