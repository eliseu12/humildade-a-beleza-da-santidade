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

// 1) Instalação: pré-cacheia tudo (sem falhar se algum der erro)
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
            .catch(err => console.warn('Cache failed:', url, err))
        )
      )
    )
  );
});

// 2) Ativação: remove caches antigos
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

// 3) Fetch: tratamento de Range + navegação + outros recursos
self.addEventListener('fetch', event => {
  const req = event.request;

  // 3a) Se for pedido por byte-range, devolve um 206 parcial
  if (req.method === 'GET' && req.headers.has('range')) {
    event.respondWith(handleRangeRequest(req));
    return;
  }

  // 3b) Navegação (SPA): tenta network, cai em index.html se offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3c) Outros: cache-first, fallback network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});


// Essa função lê o MP3 inteiro do cache, fatiando só o intervalo pedido
async function handleRangeRequest(request) {
  const url = request.url;
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(url);
  if (!cachedResponse) {
    // não está no cache? deixa ir pro network
    return fetch(request);
  }

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const total = arrayBuffer.byteLength;

  const rangeHeader = request.headers.get('Range');
  const bytesPrefix = 'bytes=';
  if (!rangeHeader || !rangeHeader.startsWith(bytesPrefix)) {
    return new Response(null, { status: 416 });
  }

  // extrai início e fim: "bytes=start-end"
  const [startStr, endStr] = rangeHeader.substring(bytesPrefix.length).split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : total - 1;

  // fatiamento
  const chunk = arrayBuffer.slice(start, end + 1);

  // monta headers de Partial Content
  const headers = new Headers(cachedResponse.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', chunk.byteLength);

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers
  });
}
