/* SVK Jugend-App – Service Worker: App-Hülle offline verfügbar, Daten immer live von Supabase. */
const CACHE = 'svk-jugend-v10';
const SHELL = [
  '/jugendapp/', '/jugendapp/index.html', '/jugendapp/app.css', '/jugendapp/app.js',
  '/jugendapp/manifest.webmanifest', '/jugendapp/icons/icon-192.png',
  '/assets/vendor/supabase-2.57.4.min.js', '/assets/js/supabase-config.js', '/data/jugend-spiele.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase & Co. nie cachen
  // Netzwerk zuerst (immer aktuelle Version), bei Offline aus dem Cache
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && SHELL.some(p => url.pathname === p || url.pathname.startsWith('/jugendapp/') || url.pathname === '/data/jugend-spiele.json')) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('/jugendapp/')))
  );
});

// ---- Push-Benachrichtigungen ----
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'SVK Jugend', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'SVK Jugend', {
    body: d.body || '', icon: '/jugendapp/icons/icon-192.png', badge: '/jugendapp/icons/icon-192.png',
    tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '/jugendapp/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/jugendapp/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.includes('/jugendapp/')) { c.postMessage({ typ: 'open', url }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
