// Simple, clean SVG exercise illustrations — inline, no external dependencies

const illustrations = {
  Chest: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bench press illustration */}
      <rect x="10" y="70" width="100" height="8" rx="4" fill="#f59e0b" opacity="0.3"/>
      <rect x="5" y="68" width="8" height="30" rx="3" fill="#f59e0b" opacity="0.4"/>
      <rect x="107" y="68" width="8" height="30" rx="3" fill="#f59e0b" opacity="0.4"/>
      {/* Barbell */}
      <rect x="15" y="44" width="90" height="7" rx="3.5" fill="#f59e0b" opacity="0.8"/>
      <rect x="8" y="40" width="14" height="15" rx="4" fill="#f59e0b"/>
      <rect x="98" y="40" width="14" height="15" rx="4" fill="#f59e0b"/>
      {/* Person lying */}
      <ellipse cx="60" cy="64" rx="14" ry="9" fill="currentColor" opacity="0.9"/>
      <circle cx="60" cy="50" r="9" fill="currentColor" opacity="0.9"/>
      {/* Arms up */}
      <path d="M46 55 Q30 50 22 47" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M74 55 Q90 50 98 47" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      {/* Legs */}
      <path d="M50 73 L44 90 L40 95" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
      <path d="M70 73 L76 90 L80 95" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),

  Shoulders: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Overhead press */}
      <rect x="15" y="28" width="90" height="7" rx="3.5" fill="#f59e0b" opacity="0.8"/>
      <rect x="8" y="24" width="14" height="15" rx="4" fill="#f59e0b"/>
      <rect x="98" y="24" width="14" height="15" rx="4" fill="#f59e0b"/>
      {/* Body */}
      <circle cx="60" cy="52" r="10" fill="currentColor" opacity="0.9"/>
      <rect x="48" y="62" width="24" height="28" rx="8" fill="currentColor" opacity="0.9"/>
      {/* Arms raised */}
      <path d="M48 66 Q30 55 22 35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M72 66 Q90 55 98 35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      {/* Legs */}
      <path d="M52 90 L48 110" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M68 90 L72 110" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),

  Triceps: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pushdown cable */}
      <rect x="54" y="10" width="12" height="35" rx="4" fill="#f59e0b" opacity="0.5"/>
      <rect x="42" y="42" width="36" height="8" rx="4" fill="#f59e0b" opacity="0.9"/>
      {/* Body */}
      <circle cx="60" cy="60" r="10" fill="currentColor" opacity="0.9"/>
      <rect x="48" y="70" width="24" height="22" rx="8" fill="currentColor" opacity="0.9"/>
      {/* Arms down pressing */}
      <path d="M48 72 Q35 70 30 90" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M72 72 Q85 70 90 90" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <rect x="22" y="87" width="18" height="7" rx="3.5" fill="#f59e0b" opacity="0.7"/>
      <rect x="80" y="87" width="18" height="7" rx="3.5" fill="#f59e0b" opacity="0.7"/>
      {/* Legs */}
      <path d="M52 92 L50 112" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M68 92 L70 112" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),

  Back: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pull-up bar */}
      <rect x="10" y="14" width="100" height="8" rx="4" fill="#f59e0b" opacity="0.8"/>
      <rect x="28" y="8" width="8" height="14" rx="3" fill="#f59e0b" opacity="0.6"/>
      <rect x="84" y="8" width="8" height="14" rx="3" fill="#f59e0b" opacity="0.6"/>
      {/* Body */}
      <circle cx="60" cy="50" r="10" fill="currentColor" opacity="0.9"/>
      <rect x="48" y="60" width="24" height="26" rx="8" fill="currentColor" opacity="0.9"/>
      {/* Arms up to bar */}
      <path d="M48 63 Q30 45 32 22" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M72 63 Q90 45 88 22" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      {/* Legs hanging */}
      <path d="M54 86 L50 108" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M66 86 L70 108" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),

  Biceps: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dumbbell curl */}
      {/* Body */}
      <circle cx="60" cy="44" r="10" fill="currentColor" opacity="0.9"/>
      <rect x="48" y="54" width="24" height="26" rx="8" fill="currentColor" opacity="0.9"/>
      {/* Left arm curling */}
      <path d="M48 60 Q28 58 22 72" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <rect x="10" y="68" width="18" height="7" rx="3.5" fill="#f59e0b" opacity="0.9"/>
      <rect x="7" y="65" width="8" height="13" rx="3" fill="#f59e0b"/>
      <rect x="22" y="65" width="8" height="13" rx="3" fill="#f59e0b"/>
      {/* Right arm down */}
      <path d="M72 60 Q88 62 92 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <rect x="84" y="76" width="18" height="7" rx="3.5" fill="#f59e0b" opacity="0.9"/>
      <rect x="81" y="73" width="8" height="13" rx="3" fill="#f59e0b"/>
      <rect x="96" y="73" width="8" height="13" rx="3" fill="#f59e0b"/>
      {/* Legs */}
      <path d="M52 80 L48 105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M68 80 L72 105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),

  Legs: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Barbell squat */}
      <rect x="15" y="38" width="90" height="7" rx="3.5" fill="#f59e0b" opacity="0.8"/>
      <rect x="8" y="34" width="14" height="15" rx="4" fill="#f59e0b"/>
      <rect x="98" y="34" width="14" height="15" rx="4" fill="#f59e0b"/>
      {/* Body squatting */}
      <circle cx="60" cy="30" r="9" fill="currentColor" opacity="0.9"/>
      <rect x="50" y="40" width="20" height="18" rx="6" fill="currentColor" opacity="0.9"/>
      {/* Arms out holding bar */}
      <path d="M50 44 L20 44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
      <path d="M70 44 L100 44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
      {/* Squatting legs */}
      <path d="M52 58 Q38 72 34 90" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      <path d="M68 58 Q82 72 86 90" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      <path d="M34 90 L30 105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M86 90 L90 105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
    </svg>
  ),

  Glutes: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hip thrust */}
      <rect x="8" y="82" width="104" height="10" rx="5" fill="#f59e0b" opacity="0.3"/>
      <rect x="5" y="80" width="8" height="28" rx="3" fill="#f59e0b" opacity="0.4"/>
      <rect x="107" y="80" width="8" height="28" rx="3" fill="#f59e0b" opacity="0.4"/>
      {/* Barbell on hips */}
      <rect x="25" y="66" width="70" height="7" rx="3.5" fill="#f59e0b" opacity="0.8"/>
      <rect x="18" y="62" width="14" height="15" rx="4" fill="#f59e0b"/>
      <rect x="88" y="62" width="14" height="15" rx="4" fill="#f59e0b"/>
      {/* Body thrusting up */}
      <ellipse cx="60" cy="68" rx="16" ry="9" fill="currentColor" opacity="0.9"/>
      <path d="M44 72 Q36 80 32 82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M76 72 Q84 80 88 82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      {/* Upper body leaning on bench */}
      <path d="M44 65 Q30 55 20 50" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      <circle cx="16" cy="47" r="8" fill="currentColor" opacity="0.9"/>
    </svg>
  ),

  Core: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Plank */}
      {/* Body planking */}
      <circle cx="25" cy="52" r="9" fill="currentColor" opacity="0.9"/>
      <rect x="32" y="56" width="58" height="12" rx="6" fill="currentColor" opacity="0.9"/>
      {/* Arms */}
      <rect x="28" y="65" width="8" height="22" rx="4" fill="currentColor" opacity="0.9"/>
      <rect x="46" y="65" width="8" height="22" rx="4" fill="currentColor" opacity="0.9"/>
      {/* Legs */}
      <rect x="84" y="65" width="8" height="28" rx="4" fill="currentColor" opacity="0.9"/>
      <rect x="100" y="65" width="8" height="28" rx="4" fill="currentColor" opacity="0.9"/>
      {/* Ground line */}
      <line x1="20" y1="87" x2="115" y2="87" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      {/* Core highlight */}
      <ellipse cx="63" cy="62" rx="16" ry="5" fill="#f59e0b" opacity="0.25"/>
    </svg>
  ),

  Cardio: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Running figure */}
      <circle cx="72" cy="22" r="10" fill="currentColor" opacity="0.9"/>
      {/* Body */}
      <path d="M72 32 Q66 50 60 60" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      {/* Arms swinging */}
      <path d="M68 40 Q50 38 40 28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
      <path d="M64 48 Q75 55 85 65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
      {/* Legs running */}
      <path d="M60 60 Q50 72 35 80" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      <path d="M35 80 Q28 85 25 95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      <path d="M60 60 Q68 76 72 92" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      <path d="M72 92 Q74 100 80 105" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9"/>
      {/* Motion lines */}
      <line x1="18" y1="50" x2="38" y2="50" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      <line x1="12" y1="62" x2="32" y2="62" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <line x1="18" y1="74" x2="34" y2="74" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),
};

export default function ExerciseIllustration({ muscle, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-full h-full',
    lg: 'w-20 h-20',
  };

  const svg = illustrations[muscle] || illustrations['Core'];

  return (
    <div className={`${sizeClasses[size]} text-foreground ${className}`}>
      {svg}
    </div>
  );
}