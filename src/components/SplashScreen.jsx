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
        backgroundColor: '#212C5C',
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
        src="https://media.base44.com/images/public/69c726762a424892bc419135/41fb24274_Gemini_Generated_Image_8jcamv8jcamv8jca1.png"
        alt="StrongStreak"
        style={{
          width: 200,
          height: 200,
          objectFit: 'contain',
          transition: 'transform 0.4s ease',
          transform: fading ? 'scale(1.05)' : 'scale(1)',
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