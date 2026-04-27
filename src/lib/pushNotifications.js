import { base44 } from '@/api/base44Client';

const isNative =
  typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.() === true;

function PN() {
  return window.Capacitor?.Plugins?.PushNotifications;
}

async function registerTokenWithBackend(token) {
  try {
    await base44.functions.invoke('registerPushToken', { token, platform: 'ios' });
  } catch (e) {
    console.warn('[Push] Failed to register token with backend:', e);
  }
}

export async function initPushNotifications() {
  if (!isNative) return;
  const pn = PN();
  if (!pn) return;

  // Ask iOS for permission
  const { receive } = await pn.requestPermissions();
  if (receive !== 'granted') return;

  // Register with APNs — the token arrives via the 'registration' event
  await pn.register();

  pn.addListener('registration', ({ value: token }) => {
    registerTokenWithBackend(token);
  });

  pn.addListener('registrationError', (err) => {
    console.warn('[Push] APNs registration failed:', err);
  });

  // Notification received while app is in foreground — just log it for now
  pn.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Foreground notification:', notification);
  });

  // User tapped a notification — deep-link if a url is in the payload
  pn.addListener('pushNotificationActionPerformed', (action) => {
    const url = action.notification?.data?.url;
    if (url) window.location.href = url;
  });
}
