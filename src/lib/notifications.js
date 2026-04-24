// No @capacitor/* imports — Vite can't resolve them in a web build.
// On native, window.Capacitor and window.Capacitor.Plugins are injected by
// the Capacitor bridge before any JS runs, so we access the plugin directly.

const isNative =
  typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.() === true;

function LN() {
  return window.Capacitor?.Plugins?.LocalNotifications;
}

// Numeric IDs required by Capacitor — map string tags to integers
const TAG_ID = {
  'rest-timer':      1,
  'weight-reminder': 2,
  'exercise-timer':  3,
};

// Deep-link URL each notification should open when tapped (null = no deep link)
const TAG_URL = {
  'weight-reminder': '/progress',
  'rest-timer':      null,
  'exercise-timer':  null,
};

// ── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (isNative) {
    const { display } = await LN().requestPermissions();
    return display === 'granted';
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notificationsGranted() {
  if (isNative) return true;
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

// ── Scheduling ───────────────────────────────────────────────────────────────

const webTimers = {};

export async function scheduleNotification({ tag, title, body, delayMs }) {
  if (isNative) {
    const id = TAG_ID[tag];
    if (id === undefined) return;
    await LN().cancel({ notifications: [{ id }] }).catch(() => {});
    await LN().schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: new Date(Date.now() + delayMs) },
        sound: undefined,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#f97316',
      }],
    });
    return;
  }

  // Web fallback
  if (!notificationsGranted()) return;
  if (webTimers[tag]) {
    clearTimeout(webTimers[tag]);
    delete webTimers[tag];
  }
  webTimers[tag] = setTimeout(async () => {
    delete webTimers[tag];
    const url = TAG_URL[tag] || null;
    // Use registration.showNotification() so the SW handles the tap and can
    // deep-link via notificationclick — plain new Notification() cannot do this.
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/icons/icon-512.png',
          tag,
          data: url ? { url } : undefined,
        });
        return;
      }
    } catch {}
    // Final fallback for browsers without SW support
    try { new Notification(title, { body, icon: '/icons/icon-512.png' }); } catch {}
  }, delayMs);
}

export async function cancelNotification(tag) {
  if (isNative) {
    const id = TAG_ID[tag];
    if (id === undefined) return;
    await LN().cancel({ notifications: [{ id }] }).catch(() => {});
    return;
  }

  if (webTimers[tag]) {
    clearTimeout(webTimers[tag]);
    delete webTimers[tag];
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initNotifications() {
  if (isNative) return true;
  if (!('serviceWorker' in navigator)) return false;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return true;
  } catch (e) {
    console.warn('[StrongStreak] SW registration failed:', e);
    return false;
  }
}

// ── Daily weight / progress reminder ─────────────────────────────────────────

const REMINDER_ENABLED_KEY  = 'ss_reminder_enabled';
const REMINDER_TIME_KEY     = 'ss_reminder_time';
const DEFAULT_REMINDER_TIME = '08:00';

export function getReminderEnabled() {
  return localStorage.getItem(REMINDER_ENABLED_KEY) !== 'false';
}

export function getReminderTime() {
  return localStorage.getItem(REMINDER_TIME_KEY) || DEFAULT_REMINDER_TIME;
}

export function setReminderEnabled(val) {
  localStorage.setItem(REMINDER_ENABLED_KEY, String(val));
}

export function setReminderTime(val) {
  localStorage.setItem(REMINDER_TIME_KEY, val);
}

export async function scheduleWeightReminder(timeStr) {
  if (!notificationsGranted()) return;

  const [hours, minutes] = (timeStr || DEFAULT_REMINDER_TIME).split(':').map(Number);
  const now  = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  if (isNative) {
    await LN().cancel({ notifications: [{ id: TAG_ID['weight-reminder'] }] }).catch(() => {});
    await LN().schedule({
      notifications: [{
        id: TAG_ID['weight-reminder'],
        title: '📸 Log your progress!',
        body:  'Time to weigh in and snap a progress photo. Keep the streak going! 💪',
        schedule: { at: next, repeats: true, every: 'day' },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#f97316',
        extra: { url: '/progress' },
      }],
    });
    return;
  }

  const delayMs = next.getTime() - now.getTime();
  await scheduleNotification({
    tag:     'weight-reminder',
    title:   '📸 Log your progress!',
    body:    'Time to weigh in and snap a progress photo. Keep the streak going! 💪',
    delayMs,
  });
}

export async function cancelWeightReminder() {
  await cancelNotification('weight-reminder');
}
