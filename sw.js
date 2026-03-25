const CACHE = 'shift-calendar-v1';
const ASSETS = [
  './shift-calendar.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=DM+Serif+Display&display=swap'
];

// 安裝：快取所有靜態資源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // 字型可能因跨域失敗，用 try 跳過
      return cache.addAll(['./shift-calendar.html', './manifest.json']).then(() => {
        return cache.add(new Request(
          'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=DM+Serif+Display&display=swap',
          { mode: 'no-cors' }
        )).catch(() => {});
      });
    })
  );
  self.skipWaiting();
});

// 啟動：刪除舊快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 攔截請求：優先用快取，無網路時也能用
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // 只快取成功的同源或 no-cors 請求
        if (resp && (resp.status === 200 || resp.type === 'opaque')) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached || new Response('離線中，請稍後再試', { status: 503 }));
    })
  );
});
