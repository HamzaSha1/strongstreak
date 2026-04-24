// StrongStreak Service Worker
// Notification scheduling is handled by Capacitor on native platforms.
// This service worker is retained only for web/PWA installs.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// When the user taps a web notification, navigate to the URL stored in
// notification.data.url (e.g. '/progress' for the weight reminder).
// Falls back to '/' if no URL is present.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  const targetHref = new URL(url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Navigate an existing open window rather than opening a second tab
      const existing = clients.find((c) => 'focus' in c);
      if (existing) {
        return existing.navigate(targetHref).then((c) => c?.focus());
      }
      return self.clients.openWindow(targetHref);
    })
  );
});
