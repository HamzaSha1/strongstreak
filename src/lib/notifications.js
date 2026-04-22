// StrongStreak Notification Service
// Schedules and cancels background push notifications via the service worker

let swReg = null;

/**
 * Register the service worker. Call once on app startup.
 */
export async function initNotifications() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return true;
  } catch (e) {
    console.warn('[StrongStreak] SW registration failed:', e);
    return false;
  }
}

/**
 * Ask the user for notification permission.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Returns true if notifications are currently allowed */
export function notificationsGranted() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

/** Get the active service worker (or null if unavailable) */
async function getActiveSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = swReg ?? (await navigator.serviceWorker.ready);
    return reg?.active ?? null;
  } catch {
    return null;
  }
}

/**
 * Tell the service worker to fire a notification after delayMs milliseconds.
 * The tag is used to cancel/replace the notification.
 */
export async function scheduleNotification({ tag, title, body, delayMs }) {
  if (!notificationsGranted()) return;
  const sw = await getActiveSW();
  if (!sw) return;
  sw.postMessage({ type: 'SCHEDULE_NOTIFICATION', tag, title, body, delayMs });
}

/**
 * Cancel a previously scheduled notification by tag.
 */
export async function cancelNotification(tag) {
  const sw = await getActiveSW();
  if (!sw) return;
  sw.postMessage({ type: 'CANCEL_NOTIFICATION', tag });
}
