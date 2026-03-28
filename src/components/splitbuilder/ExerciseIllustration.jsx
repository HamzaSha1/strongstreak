// Distinct muscle group icons — each clearly different shape/symbol

const illustrations = {
  Chest: (
    // Two pec arcs + center line
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 22 Q8 10 20 12 Q32 10 36 22" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M4 22 Q6 32 12 32 Q18 30 20 24" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M36 22 Q34 32 28 32 Q22 30 20 24" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <line x1="20" y1="12" x2="20" y2="24" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),

  Shoulders: (
    // Wide V shape — deltoids
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="12" r="4" fill="#f59e0b" opacity="0.8"/>
      <path d="M6 14 Q10 20 16 22" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M34 14 Q30 20 24 22" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round"/>
      <ellipse cx="8" cy="12" rx="5" ry="4" fill="#f59e0b" opacity="0.5"/>
      <ellipse cx="32" cy="12" rx="5" ry="4" fill="#f59e0b" opacity="0.5"/>
      <line x1="16" y1="22" x2="24" y2="22" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),

  Triceps: (
    // Horseshoe shape (classic tricep symbol)
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 10 L12 26 Q12 34 20 34 Q28 34 28 26 L28 10" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="12" y1="10" x2="28" y2="10" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="20" y1="6" x2="20" y2="10" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),

  Back: (
    // Wide trapezoid — lat spread
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10 L34 10 L28 32 L12 32 Z" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" fill="#f59e0b" fillOpacity="0.15"/>
      <line x1="20" y1="10" x2="20" y2="32" stroke="#f59e0b" strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
      <path d="M6 10 Q4 6 8 5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M34 10 Q36 6 32 5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),

  Biceps: (
    // Flexed arm / mountain peak shape
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 30 Q8 18 16 12 Q20 8 24 12 Q32 18 34 30" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M16 12 Q20 14 24 12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="6" y1="30" x2="34" y2="30" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),

  Legs: (
    // Two parallel leg columns
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="6" width="10" height="24" rx="5" stroke="#f59e0b" strokeWidth="3" fill="#f59e0b" fillOpacity="0.15"/>
      <rect x="22" y="6" width="10" height="24" rx="5" stroke="#f59e0b" strokeWidth="3" fill="#f59e0b" fillOpacity="0.15"/>
      <line x1="13" y1="30" x2="11" y2="36" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
      <line x1="27" y1="30" x2="29" y2="36" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),

  Glutes: (
    // Two round arcs = glutes shape
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 26 Q4 12 20 12 Q36 12 36 26" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M4 26 Q4 34 12 34 Q20 34 20 26" stroke="#f59e0b" strokeWidth="3" fill="#f59e0b" fillOpacity="0.2" strokeLinecap="round"/>
      <path d="M36 26 Q36 34 28 34 Q20 34 20 26" stroke="#f59e0b" strokeWidth="3" fill="#f59e0b" fillOpacity="0.2" strokeLinecap="round"/>
    </svg>
  ),

  Core: (
    // Six-pack grid
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="6" width="9" height="8" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.2"/>
      <rect x="22" y="6" width="9" height="8" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.2"/>
      <rect x="9" y="16" width="9" height="8" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.2"/>
      <rect x="22" y="16" width="9" height="8" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.2"/>
      <rect x="9" y="26" width="9" height="8" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.2"/>
      <rect x="22" y="26" width="9" height="8" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.2"/>
    </svg>
  ),

  Cardio: (
    // Heartbeat / pulse line
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="2,22 10,22 14,10 18,32 22,16 26,26 30,22 38,22" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

export default function ExerciseIllustration({ muscle, size = 'md', className = '' }) {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-16 h-16', lg: 'w-24 h-24' };
  const svg = illustrations[muscle] || illustrations['Core'];
  return (
    <div className={`${sizeMap[size]} ${className}`}>
      {svg}
    </div>
  );
}