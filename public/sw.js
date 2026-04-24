// StrongStreak Service Worker
// Notification scheduling is handled by Capacitor on native platforms.
// This service worker is retained only for web/PWA installs.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// When user taps a web notification, bring the app to front
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const workoutClient = clients.find((c) => c.url.includes('/workout'));
      if (workoutClient) return workoutClient.focus();
      const anyClient = clients.find((c) => 'focus' in c);
      if (anyClient) return anyClient.focus();
      return self.clients.openWindow('/');
    })
  );
});
