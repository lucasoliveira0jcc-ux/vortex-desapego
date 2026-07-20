// Service Worker do Vortex Desapego (PWA).
// Estratégias:
//  - App shell: precache no install (funciona offline para abrir o app).
//  - Navegação (HTML): network-first -> cache -> offline.html.
//  - Assets estáticos (css/js/ícones): stale-while-revalidate.
//  - Imagens externas (Unsplash): cache-first (mostra offline o que já carregou).
//  - API (GET /api/...): network-first com cache de fallback -> BÔNUS de
//    visualização offline dos dados já carregados.
const VERSION = 'v1.0.0';
const SHELL_CACHE = `vortex-shell-${VERSION}`;
const RUNTIME_CACHE = `vortex-runtime-${VERSION}`;
const API_CACHE = `vortex-api-${VERSION}`;
const IMG_CACHE = `vortex-img-${VERSION}`;

// Arquivos essenciais para o app abrir mesmo sem rede.
const SHELL_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/config.js',
  './js/api.js',
  './js/session.js',
  './js/ui.js',
  './js/nav.js',
  './js/views.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![SHELL_CACHE, RUNTIME_CACHE, API_CACHE, IMG_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Permite que a página force a atualização do SW.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isApi(url) {
  return url.pathname.includes('/api/');
}

function isImage(request, url) {
  return request.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // POST/PUT/DELETE sempre vão à rede

  const url = new URL(request.url);

  // 1) Navegação (documentos HTML) -> network-first com fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(async () => {
          return (await caches.match('./index.html')) || (await caches.match('./offline.html'));
        })
    );
    return;
  }

  // 2) API GET -> network-first, cai para o cache se estiver offline.
  if (isApi(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(API_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: 'offline', items: [], count: 0 }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
          );
        })
    );
    return;
  }

  // 3) Imagens -> cache-first (stale-while-revalidate).
  if (isImage(request, url)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // 4) Demais assets estáticos -> stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
