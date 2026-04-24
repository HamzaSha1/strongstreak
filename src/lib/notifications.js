import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Numeric IDs required by Capacitor — map string tags to integers
const TAG_ID = {
  'rest-timer':      1,
  'weight-reminder': 2,
  'exercise-timer':  3,
};

const isNative = Capacitor.isNativePlatform();

// ── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (isNative) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notificationsGranted() {
  if (isNative) return true; // permission was checked at runtime; assume granted if we reach here
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

// ── Scheduling ───────────────────────────────────────────────────────────────

// Web fallback: browser Notification + setTimeout (screen-on only, but fine for web)
const webTimers = {};

export async function scheduleNotification({ tag, title, body, delayMs }) {
  if (isNative) {
    const id = TAG_ID[tag];
    if (id === undefined) return;
    // Cancel any existing notification with this ID before rescheduling
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});
    await LocalNotifications.schedule({
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
  webTimers[tag] = setTimeout(() => {
    delete webTimers[tag];
    try { new Notification(title, { body, icon: '/icons/icon-512.png' }); } catch {}
  }, delayMs);
}

export async function cancelNotification(tag) {
  if (isNative) {
    const id = TAG_ID[tag];
    if (id === undefined) return;
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});
    return;
  }

  // Web fallback
  if (webTimers[tag]) {
    clearTimeout(webTimers[tag]);
    delete webTimers[tag];
  }
}

// ── Init (no-op on native — Capacitor needs no SW registration) ──────────────

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

// ── Daily weight / progress reminder ────────────────────────────────────────

const REMINDER_ENABLED_KEY = 'ss_reminder_enabled';
const REMINDER_TIME_KEY    = 'ss_reminder_time';
const DEFAULT_REMINDER_TIME = '08:00';

export function getReminderEnabled() {
  return localStorage.getItem(REMINDER_ENABLED_KEY) !== 'false'; // default true
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
    // Use Capacitor repeating schedule for daily reminders
    await LocalNotifications.cancel({ notifications: [{ id: TAG_ID['weight-reminder'] }] }).catch(() => {});
    await LocalNotifications.schedule({
      notifications: [{
        id: TAG_ID['weight-reminder'],
        title: '📸 Log your progress!',
        body:  'Time to weigh in and snap a progress photo. Keep the streak going! 💪',
        schedule: { at: next, repeats: true, every: 'day' },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#f97316',
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
