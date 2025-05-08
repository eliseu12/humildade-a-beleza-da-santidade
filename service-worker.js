// service-worker.js

const CACHE_NAME = 'audio-player-v2';
const ASSETS = [
  '/', '/index.html', '/service-worker.js',
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

// URLs de áudio para detecção rápida
const AUDIO_REGEX = /\.MP3$/i;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS.map(url =>
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
              return cache.put(url, res);
            })
            .catch(err => console.warn('Cache falhou:', url, err))
        )
      )
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(old => caches.delete(old))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // 1) Rede-primeiro para arquivos MP3, com fallback em cache
  if (req.method === 'GET' && AUDIO_REGEX.test(req.url)) {
    event.respondWith(
      fetch(req).then(networkRes => {
        // atualiza o cache
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return networkRes;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 2) SPA navigation: network-first, fallback index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3) Demais recursos: cache-first, fallback network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
