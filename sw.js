const CACHE_NAME = 'massalia-v2'; // On change le nom pour forcer la mise à jour

// Liste de tous les fichiers nécessaires au fonctionnement de l'app
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // CSS
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/motus.css',
  './css/quiz.css',
  // JS
  './js/main.js',
  './js/accueil.js',
  './js/chrono.js',
  './js/epreuves.js',
  './js/quiz.js',
  './js/motus.js',
  './js/profil.js',
  './js/parametres.js',
  './js/enregistrement.js',
  // DATA (Indispensable pour le mode hors-ligne)
  './data/anecdotes.json',
  './data/recettes.json',
  './data/quiz.json',
  './data/dictionnaire.json',
  './data/marseillais.json',
  './data/citations.json',
  // POLICES
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap'
];

// Installation : Mise en cache immédiate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Mise en cache des archives...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Force l'activation de la nouvelle version
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Stratégie : Répondre avec le cache, sinon chercher sur le réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});