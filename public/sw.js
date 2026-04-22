// StrongStreak Service Worker
// Handles scheduled background notifications for rest timer and exercise timer

const scheduledTimers = {};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { tag, title, body, delayMs } = data;

    // Cancel any existing timer with the same tag before scheduling a new one
    if (scheduledTimers[tag]) {
      clearTimeout(scheduledTimers[tag]);
      delete scheduledTimers[tag];
    }

    scheduledTimers[tag] = setTimeout(async () => {
      delete scheduledTimers[tag];
      try {
        await self.registration.showNotification(title, {
          body,
          icon: '/icons/icon-512.png',
          badge: '/icons/icon-512.png',
          tag,
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: false,
          silent: false,
        });
      } catch (e) {
        // Notification permission may have been revoked
      }
    }, delayMs);
  }

  if (data.type === 'CANCEL_NOTIFICATION') {
    const { tag } = data;
    if (scheduledTimers[tag]) {
      clearTimeout(scheduledTimers[tag]);
      delete scheduledTimers[tag];
    }
  }
});

// When user taps the notification, bring the app to front
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing workout window if open
      const workoutClient = clients.find((c) => c.url.includes('/workout'));
      if (workoutClient) return workoutClient.focus();
      // Otherwise focus any open window
      const anyClient = clients.find((c) => 'focus' in c);
      if (anyClient) return anyClient.focus();
      // Otherwise open a new window
      return self.clients.openWindow('/');
    })
  );
});
