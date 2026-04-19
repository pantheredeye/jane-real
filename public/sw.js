// RouteFast service worker. Push notification receipt only — no fetch caching.
// The app is SSR and needs connectivity; offline support is intentionally out of scope.

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'RouteFast', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/route/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/route/';
  event.waitUntil(clients.openWindow(url));
});
