export function SvgWineGlass({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bowl */}
      <path
        d="M15 8 Q10 40 20 58 Q30 72 40 74 Q50 72 60 58 Q70 40 65 8 Z"
        fill="currentColor"
      />
      {/* Liquid fill inside bowl */}
      <path
        d="M22 42 Q25 58 40 64 Q55 58 58 42 Q48 48 40 48 Q32 48 22 42 Z"
        fill="currentColor" opacity="0.4"
      />
      {/* Stem */}
      <rect x="37" y="74" width="6" height="30" rx="3" fill="currentColor" />
      {/* Base */}
      <path d="M22 104 Q22 112 40 112 Q58 112 58 104 Q58 100 40 100 Q22 100 22 104 Z" fill="currentColor" />
      {/* Rim highlight */}
      <path d="M15 8 Q20 10 40 10 Q60 10 65 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function SvgGrapes({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stem */}
      <path d="M45 6 Q45 18 45 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M45 10 Q55 4 62 10 Q58 20 45 18 Q32 20 28 10 Q35 4 45 10 Z" fill="currentColor" opacity="0.6" />
      {/* Grape cluster — rows of circles */}
      {/* Row 1 (top) */}
      <circle cx="45" cy="30" r="9" fill="currentColor" />
      {/* Row 2 */}
      <circle cx="32" cy="44" r="9" fill="currentColor" />
      <circle cx="58" cy="44" r="9" fill="currentColor" />
      {/* Row 3 */}
      <circle cx="20" cy="58" r="9" fill="currentColor" />
      <circle cx="45" cy="58" r="9" fill="currentColor" />
      <circle cx="70" cy="58" r="9" fill="currentColor" />
      {/* Row 4 */}
      <circle cx="32" cy="72" r="9" fill="currentColor" />
      <circle cx="58" cy="72" r="9" fill="currentColor" />
      {/* Row 5 (bottom) */}
      <circle cx="45" cy="86" r="9" fill="currentColor" />
      {/* Shine dots */}
      <circle cx="42" cy="27" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="29" cy="41" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="55" cy="41" r="2.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function SvgBarrel({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Barrel body */}
      <path
        d="M18 28 Q10 55 18 82 Q50 92 82 82 Q90 55 82 28 Q50 18 18 28 Z"
        fill="currentColor"
      />
      {/* Top ellipse */}
      <ellipse cx="50" cy="28" rx="32" ry="10" fill="currentColor" opacity="0.7" />
      {/* Bottom ellipse */}
      <ellipse cx="50" cy="82" rx="32" ry="10" fill="currentColor" opacity="0.7" />
      {/* Hoops */}
      <path d="M14 42 Q50 50 86 42" stroke="currentColor" strokeWidth="3.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M14 68 Q50 60 86 68" stroke="currentColor" strokeWidth="3.5" fill="none" opacity="0.4" strokeLinecap="round" />
      {/* Center hoop */}
      <path d="M12 55 Q50 47 88 55" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.35" strokeLinecap="round" />
      {/* Wood grain lines */}
      <path d="M34 22 Q30 55 34 88" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
      <path d="M50 18 Q50 55 50 92" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
      <path d="M66 22 Q70 55 66 88" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
      {/* Bung hole */}
      <circle cx="50" cy="55" r="5" fill="currentColor" opacity="0.5" />
      <circle cx="50" cy="55" r="2.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function SvgBottle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 60 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Capsule / top */}
      <rect x="22" y="4" width="16" height="18" rx="4" fill="currentColor" opacity="0.9" />
      {/* Neck */}
      <path d="M22 22 L20 42 L40 42 L38 22 Z" fill="currentColor" />
      {/* Shoulder */}
      <path d="M20 42 Q10 50 10 58 L10 112 Q10 118 30 118 Q50 118 50 112 L50 58 Q50 50 40 42 Z" fill="currentColor" />
      {/* Label */}
      <rect x="14" y="68" width="32" height="34" rx="4" fill="currentColor" opacity="0.35" />
      <line x1="18" y1="76" x2="42" y2="76" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      <line x1="18" y1="82" x2="42" y2="82" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      <line x1="18" y1="88" x2="34" y2="88" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* Base */}
      <path d="M10 112 Q10 122 30 122 Q50 122 50 112" fill="currentColor" opacity="0.6" />
      {/* Punt (indentation at base) */}
      <ellipse cx="30" cy="118" rx="10" ry="4" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function SvgLeaf({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main leaf body — grape vine leaf shape */}
      <path
        d="M45 80 Q20 70 12 50 Q8 35 20 22 Q30 12 45 10 Q60 12 70 22 Q82 35 78 50 Q70 70 45 80 Z"
        fill="currentColor"
      />
      {/* Lobes — grape vine leaves have 5 lobes */}
      <path d="M45 10 Q38 2 28 6 Q22 12 26 20 Q34 14 45 10 Z" fill="currentColor" />
      <path d="M45 10 Q52 2 62 6 Q68 12 64 20 Q56 14 45 10 Z" fill="currentColor" />
      <path d="M12 50 Q4 44 4 32 Q8 22 16 22 Q14 34 20 42 Z" fill="currentColor" />
      <path d="M78 50 Q86 44 86 32 Q82 22 74 22 Q76 34 70 42 Z" fill="currentColor" />
      {/* Veins */}
      <path d="M45 78 L45 14" stroke="currentColor" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <path d="M45 40 Q30 30 18 24" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
      <path d="M45 40 Q60 30 72 24" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
      <path d="M45 55 Q28 50 14 50" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
      <path d="M45 55 Q62 50 76 50" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
      {/* Stem */}
      <path d="M45 80 Q42 88 40 92" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SvgCorkscrew({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="10" y="4" width="40" height="10" rx="5" fill="currentColor" />
      {/* Shaft */}
      <rect x="27" y="14" width="6" height="20" rx="3" fill="currentColor" />
      {/* Helix / spiral */}
      <path
        d="M30 34 Q42 40 42 50 Q42 60 30 64 Q18 68 18 78 Q18 88 30 92 Q42 96 42 104"
        stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
      />
    </svg>
  );
}
