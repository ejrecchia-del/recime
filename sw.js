// ReciMe service worker — offline-first for the app shell, network-first for data
const CACHE = 'recime-20260803-0330';
const SHELL = [
  './', './index.html', './app.css', './app.webmanifest',
  './js/app.js', './js/store.js', './js/ui.js', './js/util.js',
  './js/shopping.js', './js/suggest.js', './js/planner.js',
  './js/healthify.js', './js/chat.js', './js/parse.js',
  './js/views/recipes.js', './js/views/detail.js', './js/views/plan.js',
  './js/views/shop.js', './js/views/chat.js', './js/views/settings.js',
  './js/views/cook.js', './js/views/import.js',
  './data/recipes.js', './data/prices.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache API traffic (Supabase, Instacart, anything cross-origin)
  if (url.origin !== self.location.origin) return;

  // Network-first: always take a fresh copy when there's signal, so a new
  // deploy shows up on the next launch instead of a stale one. Cache is the
  // fallback, which is what makes the app work in the store with no bars.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, {
      ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('index.html'),
    }).then((hit) => hit || caches.match('./index.html')))
  );
});

// Tapping a notification should land you in the app, not a fresh tab.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.includes(self.location.origin)) return c.focus();
    }
    return self.clients.openWindow('./#/recipes');
  })());
});
