import { useState } from 'react';

// ─── Coordinate system ────────────────────────────────────────────────────────
// viewBox: 0 0 600 520
// x = (lon + 5) × 44.44   (lon range –5 to 8.5)
// y = (51.5 – lat) × 54.74  (lat range 42 to 51.5, y increases downward)

// ─── France outline ───────────────────────────────────────────────────────────
const FRANCE_PATH =
  'M 305,30 L 329,27 L 397,55 L 481,109 L 565,159 L 559,214 ' +
  'L 492,283 L 519,344 L 543,426 L 461,456 L 355,481 ' +
  'L 255,492 L 146,446 L 173,381 L 173,326 L 169,290 ' +
  'L 124,235 L 44,191 L 13,191 L 22,169 L 47,153 ' +
  'L 96,164 L 133,158 L 151,98 L 226,109 L 293,36 Z';

// ─── Rivers (decorative) ─────────────────────────────────────────────────────
const RIVERS = [
  // Loire: Nevers → Tours → Nantes
  { id: 'loire',   d: 'M 358,244 C 318,236 280,228 254,221 C 215,213 180,218 155,232' },
  // Rhône: Geneva → Lyon → Avignon → sea
  { id: 'rhone',   d: 'M 492,283 C 458,297 441,308 433,320 C 432,355 435,385 436,420' },
  // Garonne/Gironde: Toulouse → Bordeaux → Atlantic
  { id: 'garonne', d: 'M 283,438 C 255,415 228,393 204,372 C 190,351 177,334 173,325' },
  // Seine: near Dijon → Paris → Le Havre
  { id: 'seine',   d: 'M 432,208 C 392,184 358,164 328,148 C 288,128 256,114 226,109' },
];

// ─── City reference dots ──────────────────────────────────────────────────────
const CITIES = [
  { name: 'Paris',      cx: 321, cy: 140 },
  { name: 'Lyon',       cx: 445, cy: 312 },
  { name: 'Marseille',  cx: 460, cy: 450, hide: true },
];

// ─── Wine regions ─────────────────────────────────────────────────────────────
const WINE_REGIONS = [
  {
    id: 'bordeaux', name: 'Bordeaux', emoji: '🍷',
    // Roughly lat 44–45.5, lon –1.5 to 0.5
    points: '155,328 245,322 248,406 220,422 180,424 148,406 148,348',
    cx: 198, cy: 375,
    fill: '#8B0030',
    grapes: 'Cabernet Sauvignon, Merlot, Cabernet Franc',
    colour: 'Red',
    style: "Full-bodied red blends among the world's most prestigious wines. Left Bank (Médoc) is Cabernet Sauvignon-dominant; Right Bank (Pomerol, Saint-Émilion) centres on Merlot. White Bordeaux from Sémillon and Sauvignon Blanc is equally world-class.",
    serve: '17–18 °C', age: '5–25+ years',
  },
  {
    id: 'loire', name: 'Loire Valley', emoji: '🏰',
    // Roughly lat 47–48, lon –1.5 to 3
    points: '157,192 354,190 356,248 157,250',
    cx: 256, cy: 220,
    fill: '#1A5E8A',
    grapes: 'Sauvignon Blanc, Chenin Blanc, Cabernet Franc',
    colour: 'Red & White',
    style: "France's longest wine region spans 1,000 km of the Loire river. Sancerre and Pouilly-Fumé produce world-class Sauvignon Blanc; Vouvray showcases Chenin Blanc in styles from bone-dry to luscious sweet; Chinon and Bourgueil make elegant Cabernet Franc reds.",
    serve: '10–16 °C', age: '2–20 years',
  },
  {
    id: 'champagne', name: 'Champagne', emoji: '🥂',
    // Roughly lat 48.5–50, lon 3–5
    points: '357,84 442,82 444,164 357,166',
    cx: 401, cy: 124,
    fill: '#B89A00',
    grapes: 'Chardonnay, Pinot Noir, Pinot Meunier',
    colour: 'Sparkling',
    style: "The world's most famous sparkling wine, made via méthode traditionnelle — a second fermentation in the bottle creates the bubbles. Blanc de Blancs is 100% Chardonnay; Blanc de Noirs uses only red grapes. Prestige cuvées like Dom Pérignon and Krug command thousands.",
    serve: '8–10 °C', age: '3–15 years',
  },
  {
    id: 'burgundy', name: 'Burgundy', emoji: '🏛️',
    // Roughly lat 46.5–47.5, lon 4.3–5.5
    points: '413,220 466,218 468,274 413,276',
    cx: 441, cy: 247,
    fill: '#A0003A',
    grapes: 'Pinot Noir, Chardonnay',
    colour: 'Red & White',
    style: 'The global benchmark for Pinot Noir and Chardonnay. Tiny vineyard plots are classified Village → Premier Cru → Grand Cru. The same grape from one row of vines to the next can produce radically different wine. Romanée-Conti is the most coveted name in all of wine.',
    serve: '13–16 °C', age: '5–20 years',
  },
  {
    id: 'beaujolais', name: 'Beaujolais', emoji: '🍒',
    // Roughly lat 45.5–46.5, lon 4.2–5
    points: '408,276 444,274 446,328 408,328',
    cx: 427, cy: 301,
    fill: '#9B1B30',
    grapes: 'Gamay',
    colour: 'Red',
    style: 'Home of Gamay, producing light, juicy reds bursting with cherry and violet. Beaujolais Nouveau launches every third Thursday of November. The ten Cru villages — Morgon, Moulin-à-Vent, Fleurie — produce structured wines that rival good Burgundy and can age 5–15 years.',
    serve: '13–15 °C', age: '1–12 years',
  },
  {
    id: 'rhone', name: 'Rhône Valley', emoji: '🌶️',
    // Roughly lat 44.5–45.5, lon 4.5–5.5
    points: '422,328 466,328 464,386 421,388',
    cx: 444, cy: 358,
    fill: '#7A2000',
    grapes: 'Syrah (North), Grenache (South), Viognier',
    colour: 'Red & White',
    style: 'Northern Rhône: pure Syrah — Hermitage, Côte-Rôtie, and Cornas are icons. Southern Rhône: GSM blends rule, led by the legendary Châteauneuf-du-Pape. Viognier in Condrieu produces exotic, heady white wines with apricot and blossom aromas.',
    serve: '16–18 °C', age: '5–20 years',
  },
  {
    id: 'alsace', name: 'Alsace', emoji: '🌿',
    // Roughly lat 47.4–48.8, lon 7.2–7.8 (thin eastern strip)
    points: '536,144 568,154 565,220 535,222',
    cx: 551, cy: 183,
    fill: '#006830',
    grapes: 'Riesling, Gewürztraminer, Pinot Gris, Muscat',
    colour: 'White',
    style: 'On the German border under the shadow of the Vosges mountains, Alsace labels wine by grape variety — unique in France. Produces intensely aromatic, complex whites, often off-dry. Riesling here is fuller and more spicy than in Germany; Gewürztraminer is lychee and rose in a glass.',
    serve: '10–12 °C', age: '3–15 years',
  },
  {
    id: 'jura', name: 'Jura', emoji: '⭐',
    // Roughly lat 46.5–47.5, lon 5.5–6.5
    points: '467,220 510,218 512,274 467,276',
    cx: 490, cy: 247,
    fill: '#7A6010',
    grapes: 'Savagnin, Chardonnay, Poulsard, Trousseau',
    colour: 'White & Red',
    style: 'Tiny, remote eastern region producing some of France\'s most unusual wines. Vin Jaune is aged for 6+ years under a yeast film (voile) — oxidative, walnut-scented, and extraordinary. Crémant du Jura is an excellent sparkling alternative to Champagne.',
    serve: '12–16 °C', age: '3–30+ years',
  },
  {
    id: 'languedoc', name: 'Languedoc', emoji: '☀️',
    // Roughly lat 42.7–44, lon 2–4.5
    points: '308,410 421,408 422,488 308,490',
    cx: 365, cy: 449,
    fill: '#C06000',
    grapes: 'Grenache, Syrah, Mourvèdre, Carignan',
    colour: 'Red & White',
    style: "France's largest wine region by volume has transformed into a source of excellent quality. Sun-drenched Mediterranean climate with warm days and cool nights. Faugères, Saint-Chinian, and Pic Saint-Loup lead the quality revolution. Exceptional value across the board.",
    serve: '15–18 °C', age: '2–15 years',
  },
  {
    id: 'provence', name: 'Provence', emoji: '🌸',
    // Roughly lat 43–44, lon 4.5–7.5
    points: '422,408 554,406 556,460 422,462',
    cx: 488, cy: 435,
    fill: '#C84090',
    grapes: 'Grenache, Cinsault, Mourvèdre',
    colour: 'Rosé & Red',
    style: 'The world capital of dry, pale rosé — 90% of production is rosé. Provence rosé is pale salmon-pink, bone dry, and made for the table. Bandol produces France\'s most serious Mourvèdre reds: powerful, tannic, and ageable for 20+ years.',
    serve: '10–16 °C', age: '1–8 years',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function FranceWineMap() {
  const [hovered,      setHovered]      = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [quizMode,     setQuizMode]     = useState(false);
  const [quizTarget,   setQuizTarget]   = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(null);   // null | 'correct' | 'wrong'
  const [quizClicked,  setQuizClicked]  = useState(null);
  const [quizScore,    setQuizScore]    = useState({ correct: 0, total: 0 });

  function pickQuestion(excludeId) {
    const pool = WINE_REGIONS.filter(r => r.id !== excludeId);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setQuizTarget(next.id);
    setQuizAnswered(null);
    setQuizClicked(null);
  }

  function startQuiz() {
    setQuizMode(true);
    setSelected(null);
    setQuizScore({ correct: 0, total: 0 });
    pickQuestion(null);
  }

  function endQuiz() {
    setQuizMode(false);
    setQuizTarget(null);
    setQuizAnswered(null);
    setQuizClicked(null);
  }

  function handleRegionClick(id) {
    if (quizMode) {
      if (quizAnswered) return;
      const correct = id === quizTarget;
      setQuizAnswered(correct ? 'correct' : 'wrong');
      setQuizClicked(id);
      setQuizScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    } else {
      setSelected(prev => prev === id ? null : id);
    }
  }

  const targetRegion   = WINE_REGIONS.find(r => r.id === quizTarget);
  const selectedRegion = WINE_REGIONS.find(r => r.id === selected);

  function regionFill(r) {
    if (quizMode) {
      if (quizAnswered) {
        if (r.id === quizTarget)                          return r.fill;
        if (r.id === quizClicked && r.id !== quizTarget) return 'rgba(193,0,61,0.45)';
        return 'rgba(255,255,255,0.04)';
      }
      return r.id === hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)';
    }
    if (r.id === selected) return r.fill;
    if (r.id === hovered)  return r.fill + 'BB';
    return r.fill + '55';
  }

  function regionStroke(r) {
    if (!quizMode && r.id === selected)             return r.fill;
    if (quizAnswered && r.id === quizTarget)        return r.fill;
    if (quizAnswered && r.id === quizClicked && r.id !== quizTarget) return '#E8527A';
    return 'rgba(255,255,255,0.18)';
  }

  // Show label when: explore mode and (hovered or selected) OR quiz mode after answering
  function showLabel(r) {
    if (quizMode) return quizAnswered && (r.id === quizTarget || r.id === quizClicked);
    return r.id === hovered || r.id === selected;
  }

  return (
    <div className="france-map-wrapper">

      {/* ── Top bar ── */}
      <div className="map-topbar">
        {quizMode ? (
          <>
            <div className="map-quiz-q">
              {quizAnswered ? (
                <span className={`map-quiz-verdict ${quizAnswered}`}>
                  {quizAnswered === 'correct'
                    ? '✓ Correct!'
                    : `✗ That was ${targetRegion?.name}`}
                </span>
              ) : (
                <span>Click on <strong className="map-quiz-target">{targetRegion?.name}</strong></span>
              )}
            </div>
            <div className="map-quiz-score">{quizScore.correct} / {quizScore.total}</div>
            {quizAnswered && (
              <button className="map-btn" onClick={() => pickQuestion(quizTarget)}>Next →</button>
            )}
            <button className="map-btn ghost" onClick={endQuiz}>End</button>
          </>
        ) : (
          <>
            <span className="map-title">🇫🇷 France Wine Map</span>
            <span className="map-hint">Hover · Click for info</span>
            <button className="map-btn" onClick={startQuiz}>🎯 Quiz</button>
          </>
        )}
      </div>

      {/* ── SVG Map ── */}
      <svg viewBox="0 0 600 520" className="france-svg"
        onMouseLeave={() => setHovered(null)}>

        {/* Ambient glow */}
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3A0818" />
            <stop offset="100%" stopColor="#0D0308" />
          </radialGradient>
        </defs>
        <rect width="600" height="520" fill="url(#mapGlow)" rx="12" />

        {/* France land */}
        <path d={FRANCE_PATH} fill="#1C0810" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />

        {/* Wine region polygons */}
        {WINE_REGIONS.map(r => (
          <g key={r.id}
            onMouseEnter={() => setHovered(r.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleRegionClick(r.id)}
            style={{ cursor: quizMode && quizAnswered ? 'default' : 'pointer' }}>
            <polygon
              points={r.points}
              fill={regionFill(r)}
              stroke={regionStroke(r)}
              strokeWidth={r.id === selected || (quizAnswered && r.id === quizTarget) ? 2 : 1}
              style={{ transition: 'fill 0.15s, stroke 0.15s' }}
            />
            {showLabel(r) && (
              <text x={r.cx} y={r.cy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9.5" fontWeight="700" fill="white"
                style={{ pointerEvents: 'none', filter: 'drop-shadow(0 1px 4px #000)' }}>
                {r.name}
              </text>
            )}
          </g>
        ))}

        {/* Rivers */}
        {RIVERS.map(rv => (
          <path key={rv.id} d={rv.d}
            fill="none" stroke="rgba(80,160,220,0.38)" strokeWidth="1.5"
            strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        ))}

        {/* City dots + labels */}
        {CITIES.map(c => (
          <g key={c.name} style={{ pointerEvents: 'none' }}>
            <circle cx={c.cx} cy={c.cy} r="2.5" fill="rgba(255,255,255,0.45)" />
            {!c.hide && (
              <text x={c.cx + 5} y={c.cy - 4}
                fontSize="7.5" fill="rgba(255,255,255,0.35)" fontStyle="italic">
                {c.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* ── Info panel (explore mode) ── */}
      {!quizMode && selectedRegion && (
        <div className="map-info-panel">
          <div className="map-info-top">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="map-info-name">{selectedRegion.emoji} {selectedRegion.name}</div>
              <div className="map-info-grapes">{selectedRegion.grapes}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
              <div className={`explore-colour-tag colour-${selectedRegion.colour.split(' ')[0].toLowerCase()}`}>
                {selectedRegion.colour}
              </div>
              <button className="node-panel-close" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
          <p className="map-info-body">{selectedRegion.style}</p>
          <div className="map-info-facts">
            <div className="region-fact">
              <div className="region-fact-label">Serve</div>
              <div className="region-fact-value">{selectedRegion.serve}</div>
            </div>
            <div className="region-fact">
              <div className="region-fact-label">Age</div>
              <div className="region-fact-value">{selectedRegion.age}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Region legend (explore mode) ── */}
      {!quizMode && (
        <div className="map-legend">
          {WINE_REGIONS.map(r => (
            <button key={r.id}
              className={`map-legend-item ${selected === r.id ? 'active' : ''}`}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleRegionClick(r.id)}>
              <span className="map-legend-dot" style={{ background: r.fill }} />
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
