import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { geoOrthographic, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';

// ─── Wine nations ─────────────────────────────────────────────────────────────
const WINE_NATIONS = {
  250: { name: 'France',       flag: '🇫🇷', rot: [-2.4,  -46.5], zoom: 1900 },
  380: { name: 'Italy',        flag: '🇮🇹', rot: [-12.5, -42.5], zoom: 1800 },
  724: { name: 'Spain',        flag: '🇪🇸', rot: [3.7,   -40.0], zoom: 1600 },
  276: { name: 'Germany',      flag: '🇩🇪', rot: [-10.5, -51.0], zoom: 2000 },
  620: { name: 'Portugal',     flag: '🇵🇹', rot: [8.0,   -39.5], zoom: 2800 },
  40:  { name: 'Austria',      flag: '🇦🇹', rot: [-14.0, -47.5], zoom: 2800 },
  300: { name: 'Greece',       flag: '🇬🇷', rot: [-22.0, -39.0], zoom: 2200 },
  348: { name: 'Hungary',      flag: '🇭🇺', rot: [-19.0, -47.0], zoom: 2800 },
  840: { name: 'USA',          flag: '🇺🇸', rot: [96.0,  -38.0], zoom:  550 },
  32:  { name: 'Argentina',    flag: '🇦🇷', rot: [63.5,  -34.0], zoom:  700 },
  152: { name: 'Chile',        flag: '🇨🇱', rot: [71.5,  -30.0], zoom: 1000 },
  710: { name: 'South Africa', flag: '🇿🇦', rot: [-25.0, -29.0], zoom: 1000 },
  36:  { name: 'Australia',    flag: '🇦🇺', rot: [-135,  -27.0], zoom:  500 },
  554: { name: 'New Zealand',  flag: '🇳🇿', rot: [-172,  -42.0], zoom: 1600 },
  124: { name: 'Canada',       flag: '🇨🇦', rot: [96.0,  -56.0], zoom:  400 },
  858: { name: 'Uruguay',      flag: '🇺🇾', rot: [56.0,  -33.0], zoom: 2200 },
  268: { name: 'Georgia',      flag: '🇬🇪', rot: [-43.5, -42.0], zoom: 3000 },
};

// ─── French wine regions as GeoJSON ──────────────────────────────────────────
// Coordinates converted from the SVG layout:
//   lon = x / 44.44 − 5   |   lat = 51.5 − y / 54.74
const FRANCE_REGIONS = [
  {
    id: 'bordeaux', name: 'Bordeaux', emoji: '🍷', fill: '#8B0030',
    grapes: 'Cabernet Sauvignon, Merlot, Cabernet Franc', colour: 'Red',
    style: "Full-bodied red blends among the world's most prestigious wines. Left Bank (Médoc) is Cab Sauv-dominant; Right Bank (Pomerol, Saint-Émilion) centres on Merlot.",
    serve: '17–18 °C', age: '5–25+ years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [-1.51,45.51],[0.51,45.62],[0.58,44.08],[-0.05,43.79],
      [-0.95,43.76],[-1.67,44.08],[-1.67,45.14],[-1.51,45.51],
    ]] } },
  },
  {
    id: 'loire', name: 'Loire Valley', emoji: '🏰', fill: '#1A5E8A',
    grapes: 'Sauvignon Blanc, Chenin Blanc, Cabernet Franc', colour: 'Red & White',
    style: "France's longest wine corridor. Sancerre for Sauvignon Blanc; Vouvray for Chenin Blanc; Chinon for elegant Cabernet Franc reds.",
    serve: '10–16 °C', age: '2–20 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [-1.47,48.00],[2.97,48.04],[3.01,46.97],[-1.47,46.94],[-1.47,48.00],
    ]] } },
  },
  {
    id: 'champagne', name: 'Champagne', emoji: '🥂', fill: '#B89A00',
    grapes: 'Chardonnay, Pinot Noir, Pinot Meunier', colour: 'Sparkling',
    style: "The world's most famous sparkling wine. Méthode traditionnelle — second fermentation in bottle. Blanc de Blancs vs. Blanc de Noirs.",
    serve: '8–10 °C', age: '3–15 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [3.03,49.96],[4.95,50.00],[4.99,48.50],[3.03,48.47],[3.03,49.96],
    ]] } },
  },
  {
    id: 'burgundy', name: 'Burgundy', emoji: '🏛️', fill: '#A0003A',
    grapes: 'Pinot Noir, Chardonnay', colour: 'Red & White',
    style: 'The benchmark for Pinot Noir and Chardonnay. Tiny plots classified Village → Premier Cru → Grand Cru. Romanée-Conti is the most coveted name in wine.',
    serve: '13–16 °C', age: '5–20 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [4.30,47.49],[5.49,47.52],[5.53,46.50],[4.30,46.46],[4.30,47.49],
    ]] } },
  },
  {
    id: 'beaujolais', name: 'Beaujolais', emoji: '🍒', fill: '#9B1B30',
    grapes: 'Gamay', colour: 'Red',
    style: 'Light, juicy Gamay reds with cherry and violet. The 10 Cru villages — Morgon, Moulin-à-Vent, Fleurie — produce wines that age beautifully.',
    serve: '13–15 °C', age: '1–12 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [4.18,46.46],[4.99,46.50],[5.04,45.51],[4.18,45.51],[4.18,46.46],
    ]] } },
  },
  {
    id: 'rhone', name: 'Rhône Valley', emoji: '🌶️', fill: '#7A2000',
    grapes: 'Syrah (North), Grenache (South), Viognier', colour: 'Red & White',
    style: 'Northern Rhône: pure Syrah — Hermitage, Côte-Rôtie. Southern Rhône: Grenache blends including the legendary Châteauneuf-du-Pape.',
    serve: '16–18 °C', age: '5–20 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [4.50,45.53],[5.49,45.53],[5.45,44.43],[4.48,44.40],[4.50,45.53],
    ]] } },
  },
  {
    id: 'alsace', name: 'Alsace', emoji: '🌿', fill: '#006830',
    grapes: 'Riesling, Gewürztraminer, Pinot Gris, Muscat', colour: 'White',
    style: 'On the German border, Alsace labels by grape — unique in France. Intensely aromatic whites, often off-dry. Grand Cru vineyards on the Vosges slopes.',
    serve: '10–12 °C', age: '3–15 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [7.07,48.87],[7.79,48.68],[7.72,47.47],[7.05,47.44],[7.07,48.87],
    ]] } },
  },
  {
    id: 'jura', name: 'Jura', emoji: '⭐', fill: '#7A6010',
    grapes: 'Savagnin, Chardonnay, Poulsard, Trousseau', colour: 'White & Red',
    style: 'Tiny, unique eastern region. Vin Jaune aged 6+ years under a yeast film — oxidative, walnut-scented, extraordinary.',
    serve: '12–16 °C', age: '3–30+ years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [5.51,47.49],[6.48,47.52],[6.52,46.50],[5.51,46.46],[5.51,47.49],
    ]] } },
  },
  {
    id: 'languedoc', name: 'Languedoc', emoji: '☀️', fill: '#C06000',
    grapes: 'Grenache, Syrah, Mourvèdre, Carignan', colour: 'Red & White',
    style: "France's largest wine region, now producing ambitious wines. Mediterranean climate with excellent value. Faugères, Saint-Chinian, Pic Saint-Loup lead the quality revolution.",
    serve: '15–18 °C', age: '2–15 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [1.93,44.00],[4.48,44.04],[4.50,42.57],[1.93,42.53],[1.93,44.00],
    ]] } },
  },
  {
    id: 'provence', name: 'Provence', emoji: '🌸', fill: '#C84090',
    grapes: 'Grenache, Cinsault, Mourvèdre', colour: 'Rosé & Red',
    style: "World capital of dry, pale rosé. Bone dry, pale salmon, and made for the table. Bandol produces the most serious Mourvèdre reds.",
    serve: '10–16 °C', age: '1–8 years',
    geo: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[
      [4.50,44.04],[7.47,44.07],[7.52,43.07],[4.50,43.04],[4.50,44.04],
    ]] } },
  },
];

// ─── French rivers as GeoJSON LineStrings ─────────────────────────────────────
const FRANCE_RIVERS = [
  { id: 'loire',   geo: { type: 'Feature', geometry: { type: 'LineString', coordinates:
    [[4.0,46.1],[3.0,47.0],[1.5,47.4],[0.5,47.5],[-1.0,47.3],[-1.8,47.2]] } } },
  { id: 'rhone',   geo: { type: 'Feature', geometry: { type: 'LineString', coordinates:
    [[6.1,46.3],[4.9,45.8],[4.8,44.5],[4.7,43.9],[4.7,43.4]] } } },
  { id: 'garonne', geo: { type: 'Feature', geometry: { type: 'LineString', coordinates:
    [[1.4,43.6],[0.0,44.0],[-0.5,44.8],[-0.8,45.5]] } } },
  { id: 'seine',   geo: { type: 'Feature', geometry: { type: 'LineString', coordinates:
    [[4.9,47.8],[3.5,48.2],[2.4,48.9],[0.1,49.5]] } } },
];

const W = 560, H = 560, R_DEFAULT = 255;
const SENSITIVITY = 0.38;
const WORLD_URL   = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function easeInOut(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}

export default function GlobeView() {
  const animRef   = useRef(null);
  const rotRef    = useRef([-10, -40]);
  const scaleRef  = useRef(R_DEFAULT);
  const dragRef   = useRef(null);
  const movedRef  = useRef(false);

  const [countries,      setCountries]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [rotation,       setRotation]       = useState([-10, -40]);
  const [scale,          setScale]          = useState(R_DEFAULT);
  const [hovered,        setHovered]        = useState(null);   // country id
  const [focused,        setFocused]        = useState(null);   // country id when zoomed
  const [animating,      setAnimating]      = useState(false);
  const [hoveredRegion,  setHoveredRegion]  = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => { rotRef.current  = rotation; }, [rotation]);
  useEffect(() => { scaleRef.current = scale;   }, [scale]);

  // ── Fetch world ────────────────────────────────────��───────────────────────
  useEffect(() => {
    fetch(WORLD_URL)
      .then(r => r.json())
      .then(world => { setCountries(feature(world, world.objects.countries).features); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Projection ─────────────────────────────────────────────────────────────
  const { pathGen, graticuleD, sphereD } = useMemo(() => {
    const proj = geoOrthographic().scale(scale).translate([W/2, H/2]).rotate(rotation).clipAngle(90);
    const pg   = geoPath().projection(proj);
    return { pathGen: pg, graticuleD: pg(geoGraticule()()), sphereD: pg({ type: 'Sphere' }) };
  }, [rotation, scale]);

  // ── Animate ────────────────────────────────────────────────────────────────
  const animateTo = useCallback((targetRot, targetScale, onDone) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const r0 = [...rotRef.current], s0 = scaleRef.current;
    const dur = 900, t0 = performance.now();
    setAnimating(true);

    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = easeInOut(p);
      const nr = [r0[0] + (targetRot[0] - r0[0]) * e, r0[1] + (targetRot[1] - r0[1]) * e];
      const ns = s0 + (targetScale - s0) * e;
      setRotation(nr); setScale(ns);
      rotRef.current = nr; scaleRef.current = ns;
      if (p < 1) { animRef.current = requestAnimationFrame(frame); }
      else { animRef.current = null; setAnimating(false); onDone?.(); }
    }
    animRef.current = requestAnimationFrame(frame);
  }, []);

  // ── Country click → zoom in ────────────────────────────────────────────────
  function handleCountryClick(feat) {
    if (movedRef.current || animating || focused) return;
    const id   = parseInt(feat.id, 10);
    const meta = WINE_NATIONS[id];
    if (!meta) return;
    animateTo(meta.rot, meta.zoom, () => setFocused(id));
  }

  // ── Back to globe ──────────────────────────────────────────────────────────
  function handleBack() {
    setFocused(null);
    setSelectedRegion(null);
    setHoveredRegion(null);
    animateTo([-10, -40], R_DEFAULT, null);
  }

  // ── Drag ───────────────────────────────────────────────────────────────────
  function onMouseDown(e) {
    if (e.button !== 0 || animating || focused) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, r0: [...rotation] };
    movedRef.current = false;
  }
  function onMouseMove(e) {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;
    setRotation([d.r0[0] - dx * SENSITIVITY, Math.max(-90, Math.min(90, d.r0[1] + dy * SENSITIVITY))]);
  }
  function onMouseUp() { dragRef.current = null; }

  function onTouchStart(e) {
    if (e.touches.length !== 1 || animating || focused) return;
    const t = e.touches[0];
    dragRef.current = { sx: t.clientX, sy: t.clientY, r0: [...rotation] };
    movedRef.current = false;
  }
  function onTouchMove(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const d = dragRef.current; if (!d) return;
    const t = e.touches[0];
    const dx = t.clientX - d.sx, dy = t.clientY - d.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    setRotation([d.r0[0] - dx * SENSITIVITY, Math.max(-90, Math.min(90, d.r0[1] + dy * SENSITIVITY))]);
  }
  function onTouchEnd() { dragRef.current = null; }

  function onWheel(e) {
    if (animating || focused) return;
    e.preventDefault();
    setScale(s => Math.min(800, Math.max(120, s * (e.deltaY > 0 ? 0.9 : 1.1))));
  }

  const VIEWS = [
    { label: '🍷 Europe',   rot: [-10, -45] },
    { label: '🌎 Americas', rot: [ 80, -35] },
    { label: '🦘 Oceania',  rot: [-145,-30] },
    { label: '🦁 Africa',   rot: [-25, -30] },
  ];

  const focusedMeta    = focused ? WINE_NATIONS[focused] : null;
  const selRegion      = FRANCE_REGIONS.find(r => r.id === selectedRegion);
  const showRegions    = focused === 250;  // only France has regions for now

  return (
    <div className="globe-fullpage">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="globe-topbar">
        {focused ? (
          <>
            <button className="globe-region-btn" onClick={handleBack}>← Globe</button>
            <span className="globe-topbar-title">
              {focusedMeta?.flag} {focusedMeta?.name}
            </span>
            {showRegions && <span className="globe-legend-hint">Hover · Click a region</span>}
          </>
        ) : (
          <>
            <span className="globe-topbar-title">🌍 Wine World</span>
            <div className="globe-region-btns">
              {VIEWS.map(v => (
                <button key={v.label} className="globe-region-btn"
                  onClick={() => !animating && animateTo(v.rot, R_DEFAULT, null)}>
                  {v.label}
                </button>
              ))}
            </div>
            <button className="globe-region-btn dim"
              onClick={() => !animating && animateTo([-10,-40], R_DEFAULT, null)}>
              ⌖ Reset
            </button>
          </>
        )}
      </div>

      {/* ── Globe SVG ────────────────────────────────────────────────────── */}
      <div className="globe-canvas"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}>

        <svg viewBox={`0 0 ${W} ${H}`} className="globe-svg" onWheel={onWheel}>
          <defs>
            <radialGradient id="oceanGrad" cx="38%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#0E2030" />
              <stop offset="100%" stopColor="#050D14" />
            </radialGradient>
          </defs>

          <path d={sphereD}    fill="url(#oceanGrad)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <path d={graticuleD} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

          {/* Countries */}
          {!loading && countries.map(feat => {
            const id   = parseInt(feat.id, 10);
            const wine = WINE_NATIONS[id];
            const isHov = hovered === id;
            const isFoc = focused === id;
            const d    = pathGen(feat);
            if (!d) return null;
            const fill = wine
              ? isFoc    ? '#D4A846'
              : isHov    ? '#C1003D'
              : '#8B0030'
              : '#1E2D3A';
            return (
              <path key={feat.id} d={d} fill={fill}
                stroke={isFoc ? '#F0CC7A' : wine ? 'rgba(232,82,122,0.25)' : 'rgba(255,255,255,0.07)'}
                strokeWidth={isFoc ? 1.5 : 0.5}
                style={{ cursor: wine && !animating && !focused ? 'pointer' : 'default', transition: 'fill 0.12s' }}
                onMouseEnter={() => wine && !animating && !focused && setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleCountryClick(feat)}
              />
            );
          })}

          {/* ── French wine regions (shown when zoomed into France) ── */}
          {showRegions && FRANCE_REGIONS.map(r => {
            const d = pathGen(r.geo);
            if (!d || d.length < 5) return null;
            const isHov = hoveredRegion === r.id;
            const isSel = selectedRegion === r.id;
            const centroid = pathGen.centroid(r.geo);
            const validCentroid = centroid && !isNaN(centroid[0]) && !isNaN(centroid[1]);
            return (
              <g key={r.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredRegion(r.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={e => { e.stopPropagation(); if (!movedRef.current) setSelectedRegion(p => p === r.id ? null : r.id); }}>
                <path d={d}
                  fill={isSel ? r.fill : isHov ? r.fill + 'CC' : r.fill + '77'}
                  stroke={isSel ? '#F0CC7A' : 'rgba(255,255,255,0.28)'}
                  strokeWidth={isSel ? 2 : 1}
                  style={{ transition: 'fill 0.12s' }}
                />
                {(isHov || isSel) && validCentroid && (
                  <text x={centroid[0]} y={centroid[1]}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="11" fontWeight="700" fill="white"
                    style={{ pointerEvents: 'none', filter: 'drop-shadow(0 1px 4px #000)' }}>
                    {r.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* French rivers */}
          {showRegions && FRANCE_RIVERS.map(rv => {
            const d = pathGen(rv.geo);
            if (!d) return null;
            return <path key={rv.id} d={d} fill="none"
              stroke="rgba(80,160,220,0.45)" strokeWidth="1.5"
              strokeLinecap="round" style={{ pointerEvents: 'none' }} />;
          })}

          {loading && (
            <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="14">
              Loading globe…
            </text>
          )}
        </svg>
      </div>

      {/* ── Region info panel ────────────────────────────────────────────── */}
      {selRegion && (
        <div className="globe-region-panel">
          <div className="globe-region-panel-top">
            <div>
              <div className="globe-region-panel-name">{selRegion.emoji} {selRegion.name}</div>
              <div className="globe-region-panel-grapes">{selRegion.grapes}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
              <div className={`explore-colour-tag colour-${selRegion.colour.split(' ')[0].toLowerCase()}`}>
                {selRegion.colour}
              </div>
              <button className="node-panel-close" onClick={() => setSelectedRegion(null)}>✕</button>
            </div>
          </div>
          <p className="globe-region-panel-body">{selRegion.style}</p>
          <div className="map-info-facts">
            <div className="region-fact">
              <div className="region-fact-label">Serve</div>
              <div className="region-fact-value">{selRegion.serve}</div>
            </div>
            <div className="region-fact">
              <div className="region-fact-label">Age</div>
              <div className="region-fact-value">{selRegion.age}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Legend / hint ────────────────────────────────────────────────── */}
      {!focused && (
        <div className="globe-legend">
          <span className="globe-legend-item">
            <span className="globe-legend-dot wine" />Wine nation
          </span>
          <span className="globe-legend-hint">
            {animating ? 'Zooming…' : 'Drag · Scroll · Click country'}
          </span>
        </div>
      )}

      {/* ── Country hover tooltip ─────────────────────────────────────────── */}
      {hovered && !focused && !animating && (
        <div className="globe-tooltip">
          {WINE_NATIONS[hovered]?.flag} {WINE_NATIONS[hovered]?.name}
        </div>
      )}
    </div>
  );
}
