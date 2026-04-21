/**
 * Plays a UFC-style end-of-round bell: three sharp metallic strikes.
 *
 * Each strike layers four sine oscillators at harmonically related
 * frequencies to simulate the metallic overtone structure of a real
 * fight bell. Gain decays exponentially so the tone has the
 * characteristic "ring-then-fade" shape.
 */
export function playBell() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Resume in case the context was suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    /**
     * One metallic bell strike.
     * @param {number} startDelay  - seconds from now to start this strike
     */
    const strike = (startDelay) => {
      // Four harmonics that give the bell its metallic character
      const partials = [
        { freq: 880,  gain: 0.55 },  // fundamental
        { freq: 1760, gain: 0.30 },  // 2nd harmonic
        { freq: 2640, gain: 0.12 },  // 3rd harmonic
        { freq: 3520, gain: 0.06 },  // 4th harmonic
      ];

      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      const t0 = ctx.currentTime + startDelay;
      const duration = 1.4; // how long each strike rings

      // Master envelope: near-instant attack, exponential decay
      masterGain.gain.setValueAtTime(0, t0);
      masterGain.gain.linearRampToValueAtTime(1, t0 + 0.005); // 5ms attack
      masterGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

      partials.forEach(({ freq, gain }) => {
        const osc = ctx.createOscillator();
        const partialGain = ctx.createGain();

        osc.type = 'sine';
        // Slight pitch drop for realism (bell sharpness decays)
        osc.frequency.setValueAtTime(freq, t0);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.97, t0 + duration);

        partialGain.gain.setValueAtTime(gain, t0);

        osc.connect(partialGain);
        partialGain.connect(masterGain);

        osc.start(t0);
        osc.stop(t0 + duration);
      });
    };

    // Three rapid strikes — classic UFC end-of-round cadence
    strike(0.0);
    strike(0.38);
    strike(0.76);

    // Clean up the AudioContext after all audio has finished
    setTimeout(() => ctx.close(), 3000);
  } catch (err) {
    // Audio is non-critical — silently ignore if it fails
    console.warn('Bell sound failed:', err);
  }
}

/**
 * Request Notification permission if not already granted/denied.
 * Call this early (e.g. on workout start) so the prompt isn't jarring
 * when the first timer fires.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

/**
 * Show a system notification (only if permission is granted).
 */
export function showTimerNotification() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification('Rest Over — Get Back to Work! 🥊', {
      body: 'Your rest timer has finished.',
      icon: '/icons/icon-512.png',
      silent: true, // we handle our own sound
    });

    // Auto-close the notification after 6 seconds
    setTimeout(() => n.close(), 6000);
  } catch (err) {
    console.warn('Notification failed:', err);
  }
}
