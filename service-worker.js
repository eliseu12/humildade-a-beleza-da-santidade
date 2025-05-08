// service-worker.js

const CACHE_NAME = 'audio-player-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/service-worker.js',
  'https://archive.org/download/6_20250430_20250430/1.MP3',
  'https://archive.org/download/6_20250430_20250430/2.MP3',
  'https://archive.org/download/6_20250430_20250430/3.MP3',
  'https://archive.org/download/6_20250430_20250430/4.MP3',
  'https://archive.org/download/6_20250430_20250430/5.MP3',
  'https://archive.org/download/6_20250430_20250430/6.MP3',
  'https://archive.org/download/6_20250430_20250430/7.MP3',
  'https://archive.org/download/6_20250430_20250430/8.MP3',
  'https://archive.org/download/6_20250430_20250430/9.MP3',
  'https://archive.org/download/6_20250430_20250430/10.MP3',
  'https://archive.org/download/6_20250430_20250430/11.MP3',
  'https://archive.org/download/6_20250430_20250430/12.MP3',
  'https://archive.org/download/6_20250430_20250430/13.MP3'
];

// Durante a instalação, tentamos adicionar tudo — mas não falhamos o install se algum asset der erro.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS.map(url =>
          fetch(url)
            .then(response => {
              if (!response.ok) throw new Error(`Status ${response.status} em ${url}`);
              return cache.put(url, response);
            })
            .catch(err => {
              console.warn('Falha ao cachear', url, err);
              // continua mesmo que este asset específico falhe
            })
        )
      )
    )
  );
});

// Ao ativar, removemos caches com nome diferente do atual
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(oldKey => caches.delete(oldKey))
      )
    )
  );
});

// Intercepta requisições:
// 1) Se for navegação (modo 'navigate'), tenta pelo network e cai para index.html offline.
// 2) Caso contrário, tenta cache primeiro, depois network.
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => 
        cached || fetch(event.request)
      )
    );
  }
});
