import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';

export default function SplashPreview() {
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <SplashScreen key={key} onDone={() => {}} />
      <button
        onClick={() => setKey(k => k + 1)}
        className="fixed bottom-8 z-[99999] bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm shadow-lg"
      >
        Replay Splash
      </button>
    </div>
  );
}