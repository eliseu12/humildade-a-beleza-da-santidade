const CACHE_NAME = 'audio-player-v1';
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

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
