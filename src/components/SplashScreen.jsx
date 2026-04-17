import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out after 1.4 seconds
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    // Remove from DOM after fade completes (0.5s transition)
    const doneTimer = setTimeout(() => onDone(), 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#11141C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Try local icon first, fall back to the logo shown in Base44 App Settings */}
      <img
        src="/icons/icon-512.png"
        alt="StrongStreak"
        style={{
          width: 140,
          height: 140,
          borderRadius: 32,
          transition: 'transform 0.4s ease',
          transform: fading ? 'scale(1.05)' : 'scale(1)',
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://cdn.base44.com/apps/strongstreak/icon.png';
          e.target.onerror = (e2) => {
            e2.target.style.display = 'none';
            e2.target.nextSibling.style.display = 'block';
          };
        }}
      />
      {/* Text fallback if all image sources fail */}
      <span
        style={{
          display: 'none',
          color: '#F59E0B',
          fontSize: 36,
          fontWeight: 700,
          fontFamily: 'Space Grotesk, sans-serif',
          letterSpacing: '-0.5px',
        }}
      >
        StrongStreak
      </span>
    </div>
  );
}