import { useState, useRef, useEffect, useMemo } from 'react';
import { TREE, QUIZZES, INFO } from '../data/wineTree';

const PASS_SCORE  = 8;
const TOTAL_Q     = 15;
const STORAGE_KEY = 'learntasty_progress';
const REVIEW_KEY  = 'learntasty_review';

// ── Review system constants ───────────────────────────────────────────────────
const INTERVALS = { 1: 3, 2: 7, 3: 21, 4: 60 }; // days per strength level

const STRENGTH_COLORS = {
  1: '#4080C0',  // New      — steel blue
  2: '#2E9E60',  // Learning — bright green
  3: '#C87820',  // Strong   — warm amber
  4: '#F0CC7A',  // Mastered — bright gold
};

const STRENGTH_LABELS = { 1: 'New', 2: 'Learning', 3: 'Strong', 4: 'Mastered' };

function todayDate() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n); return d;
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function isNodeDue(rd) {
  if (!rd) return true;
  return todayDate() >= addDays(rd.lastReviewed, INTERVALS[rd.strength] || 3);
}
function nextReviewText(rd) {
  if (!rd) return 'Due now 🔔';
  const interval = INTERVALS[rd.strength] || 3;
  const next = addDays(rd.lastReviewed, interval);
  const diff = Math.round((next - todayDate()) / 86400000);
  if (diff <= 0) return 'Due now 🔔';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff} days`;
}
function lastReviewedText(rd) {
  if (!rd) return 'Never';
  const diff = Math.round((todayDate() - new Date(rd.lastReviewed)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

// ── Persistence ───────────────────────────────────────────────────────────────
function loadProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); }
  catch { return new Set(); }
}
function saveProgress(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}
function loadReviewData() {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY)) || {}; }
  catch { return {}; }
}
function saveReviewData(d) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(d));
}

// Decay: if overdue by more than one full interval, drop strength by 1
function applyDecay(reviewData) {
  const t = todayDate();
  const updated = { ...reviewData };
  let changed = false;
  for (const [id, rd] of Object.entries(reviewData)) {
    if (!rd || rd.strength <= 1) continue;
    const interval = INTERVALS[rd.strength] || 3;
    const due = addDays(rd.lastReviewed, interval);
    const overdueDays = Math.round((t - due) / 86400000);
    if (overdueDays >= interval) {
      updated[id] = { ...rd, strength: Math.max(1, rd.strength - 1) };
      changed = true;
    }
  }
  return changed ? updated : reviewData;
}

// ── Radial tree layout ────────────────────────────────────────────────────────
const CX = 650, CY = 650;
const RADII = [0, 220, 420, 630];

function countLeaves(id) {
  const ch = TREE.filter(n => n.parent === id);
  return ch.length ? ch.reduce((s, c) => s + countLeaves(c.id), 0) : 1;
}
function computeLayout() {
  const pos = {};
  function place(id, a0, a1, depth) {
    const mid = (a0 + a1) / 2;
    const r = RADII[depth] ?? depth * 145;
    pos[id] = { x: CX + r * Math.cos(mid - Math.PI / 2), y: CY + r * Math.sin(mid - Math.PI / 2), depth };
    const children = TREE.filter(n => n.parent === id);
    if (!children.length) return;
    const total = children.reduce((s, c) => s + countLeaves(c.id), 0);
    let cur = a0;
    for (const ch of children) {
      const span = (countLeaves(ch.id) / total) * (a1 - a0);
      place(ch.id, cur, cur + span, depth + 1);
      cur += span;
    }
  }
  place('wine', 0, 2 * Math.PI, 0);
  return pos;
}
const LAYOUT = computeLayout();

const NODE_R  = [38, 24, 20, 16];
const FONT_SZ = [11, 8.5, 7.5, 7];
const ICON_SZ = [18, 12, 10, 9];

function nodeStatus(id, progress) {
  if (id === 'wine') return 'root';
  if (progress.has(id)) return 'done';
  const parent = TREE.find(n => n.id === id)?.parent;
  if (parent === 'wine' || (parent && progress.has(parent))) return 'available';
  return 'locked';
}

// ── Quiz Modal ────────────────────────────────────────────────────────────────
function QuizModal({ nodeId, onClose, onPass }) {
  const node = TREE.find(n => n.id === nodeId);
  const questions = QUIZZES[nodeId] || [];
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function pick(idx) {
    if (chosen !== null) return;
    setChosen(idx);
    if (idx === questions[qi].a) setScore(s => s + 1);
  }
  function next() {
    if (qi + 1 >= TOTAL_Q) { setDone(true); }
    else { setQi(q => q + 1); setChosen(null); }
  }

  const passed = score >= PASS_SCORE;
  const q = questions[qi];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal quiz-modal" onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="quiz-header">
              <div className="quiz-node-title">{node?.icon} {node?.label}</div>
              <div className="quiz-progress">{qi + 1} / {TOTAL_Q}</div>
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${(qi / TOTAL_Q) * 100}%` }} />
            </div>
            <div className="quiz-question">{q?.q}</div>
            <div className="quiz-options">
              {q?.opts.map((opt, i) => {
                let cls = 'quiz-opt';
                if (chosen !== null) {
                  if (i === q.a) cls += ' correct';
                  else if (i === chosen) cls += ' wrong';
                  else cls += ' dim';
                }
                return <button key={i} className={cls} onClick={() => pick(i)}>{opt}</button>;
              })}
            </div>
            {chosen !== null && (
              <button className="btn-primary quiz-next" onClick={next}>
                {qi + 1 >= TOTAL_Q ? 'See results →' : 'Next →'}
              </button>
            )}
          </>
        ) : (
          <div className="quiz-result">
            <div className={`quiz-result-icon ${passed ? 'pass' : 'fail'}`}>
              {passed ? '🏆' : '📚'}
            </div>
            <h2 className="quiz-result-title">{passed ? 'Passed!' : 'Not quite'}</h2>
            <div className="quiz-score">{score} / {TOTAL_Q}</div>
            <div className="quiz-score-label">
              {passed ? `${node?.label} unlocked!` : `Need ${PASS_SCORE} to pass. Try again!`}
            </div>
            <div className="modal-footer" style={{ marginTop: 24 }}>
              <button className="btn-ghost" onClick={onClose}>Close</button>
              {passed
                ? <button className="btn-primary" onClick={() => { onPass(nodeId); onClose(); }}>Continue →</button>
                : <button className="btn-primary" onClick={() => { setQi(0); setChosen(null); setScore(0); setDone(false); }}>Retry</button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Learn() {
  const [progress,   setProgress]   = useState(loadProgress);
  const [reviewData, setReviewData] = useState(() => applyDecay(loadReviewData()));
  const [selected,   setSelected]   = useState(null);
  const [quiz,       setQuiz]       = useState(null);
  const [tfm,        setTfm]        = useState({ x: 0, y: 0, scale: 1 });
  const [reviewMode, setReviewMode] = useState(false);

  const svgRef   = useRef();
  const gRef     = useRef();
  const dragRef  = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => { saveProgress(progress);   }, [progress]);
  useEffect(() => { saveReviewData(reviewData); }, [reviewData]);

  // Due nodes
  const dueNodes = useMemo(
    () => [...progress].filter(id => isNodeDue(reviewData[id])),
    [progress, reviewData]
  );

  // ── zoom ──────────────────────────────────────────────────────
  function onWheel(e) {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const factor = 1300 / rect.width;
    const mx = (e.clientX - rect.left) * factor;
    const my = (e.clientY - rect.top) * factor;
    const delta = e.deltaY > 0 ? 0.88 : 1.14;
    setTfm(t => {
      const newScale = Math.min(3.5, Math.max(0.28, t.scale * delta));
      const newX = mx - (mx - t.x) * newScale / t.scale;
      const newY = my - (my - t.y) * newScale / t.scale;
      return { x: newX, y: newY, scale: newScale };
    });
  }

  // ── mouse drag ────────────────────────────────────────────────
  function onMouseDown(e) {
    if (e.button !== 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    dragRef.current = {
      sx: e.clientX, sy: e.clientY,
      tx: tfm.x, ty: tfm.y,
      scale: tfm.scale,
      factor: 1300 / rect.width,
      lx: tfm.x, ly: tfm.y,
    };
    movedRef.current = false;
  }
  function onMouseMove(e) {
    const d = dragRef.current; if (!d) return;
    const dx = (e.clientX - d.sx) * d.factor;
    const dy = (e.clientY - d.sy) * d.factor;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    const newX = d.tx + dx, newY = d.ty + dy;
    dragRef.current.lx = newX; dragRef.current.ly = newY;
    if (gRef.current) gRef.current.setAttribute('transform', `translate(${newX},${newY}) scale(${d.scale})`);
  }
  function onMouseUp() {
    if (dragRef.current) { const { lx, ly } = dragRef.current; setTfm(t => ({ ...t, x: lx, y: ly })); }
    dragRef.current = null;
  }

  // ── touch drag ────────────────────────────────────────────────
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    dragRef.current = {
      sx: t.clientX, sy: t.clientY,
      tx: tfm.x, ty: tfm.y,
      scale: tfm.scale,
      factor: 1300 / svgRef.current.getBoundingClientRect().width,
      lx: tfm.x, ly: tfm.y,
    };
    movedRef.current = false;
  }
  function onTouchMove(e) {
    const d = dragRef.current; if (!d || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = (t.clientX - d.sx) * d.factor;
    const dy = (t.clientY - d.sy) * d.factor;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
    const newX = d.tx + dx, newY = d.ty + dy;
    dragRef.current.lx = newX; dragRef.current.ly = newY;
    if (gRef.current) gRef.current.setAttribute('transform', `translate(${newX},${newY}) scale(${d.scale})`);
  }
  function onTouchEnd() {
    if (dragRef.current) { const { lx, ly } = dragRef.current; setTfm(t => ({ ...t, x: lx, y: ly })); }
    dragRef.current = null;
  }

  function handleNodeClick(id) {
    if (movedRef.current) return;
    setSelected(prev => prev === id ? null : id);
  }

  function handlePass(id) {
    setProgress(p => { const n = new Set(p); n.add(id); return n; });
    setReviewData(d => ({ ...d, [id]: { strength: 1, lastReviewed: todayStr() } }));
  }

  function markReview(id, knew) {
    setReviewData(d => {
      const cur = d[id] || { strength: 1, lastReviewed: todayStr() };
      const newStrength = knew
        ? Math.min(4, cur.strength + 1)
        : Math.max(1, Math.min(2, cur.strength));
      return { ...d, [id]: { strength: newStrength, lastReviewed: todayStr() } };
    });
  }

  function resetView() { setTfm({ x: 0, y: 0, scale: 1 }); }

  const selectedNode   = selected ? TREE.find(n => n.id === selected) : null;
  const selectedStatus = selected ? nodeStatus(selected, progress) : null;
  const parentNode     = selectedNode ? TREE.find(n => n.id === selectedNode.parent) : null;
  const selRD          = selected ? reviewData[selected] : null;
  const selStrength    = selRD?.strength ?? 1;
  const selIsDue       = selected && selectedStatus === 'done' && isNodeDue(selRD);

  // ── node colours ──────────────────────────────────────────────
  function fill(id) {
    const s = nodeStatus(id, progress);
    if (id === 'wine') return '#F0CC7A';
    if (s === 'locked')    return '#1E0814';
    if (s === 'available') return '#C1003D';
    // done — use strength colour
    return STRENGTH_COLORS[reviewData[id]?.strength ?? 1] || '#2A7A3A';
  }
  function stroke(id) {
    const s = nodeStatus(id, progress);
    if (id === 'wine') return '#F0CC7A';
    if (s === 'done') {
      const str = reviewData[id]?.strength ?? 1;
      if (str >= 4) return '#F0CC7A';
      if (str >= 3) return '#D4A846';
      if (str >= 2) return 'rgba(46,158,96,0.6)';
      return 'rgba(64,128,192,0.6)';
    }
    if (s === 'available') return '#E8527A';
    return '#3A1525';
  }

  return (
    <div className="learn-fullpage">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="learn-topbar">
        <span className="learn-topbar-title">🍷 Learn</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {dueNodes.length > 0 && (
            <button
              className={`review-due-badge${reviewMode ? ' active' : ''}`}
              onClick={() => setReviewMode(r => !r)}>
              🔔 {dueNodes.length} due
            </button>
          )}
          <button className="learn-topbar-btn" onClick={resetView}>⌖ Reset</button>
          <button className="learn-topbar-btn" onClick={() => setProgress(new Set())}>Clear</button>
        </div>
      </div>

      {/* ── Graph canvas ─────────────────────────────────────────── */}
      <div className="learn-canvas"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        <svg ref={svgRef}
          viewBox="0 0 1300 1300"
          style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
          onWheel={onWheel}>
          <g ref={gRef} transform={`translate(${tfm.x},${tfm.y}) scale(${tfm.scale})`}>

            {/* Edges */}
            {TREE.filter(n => n.parent).map(n => {
              const p = LAYOUT[n.parent], c = LAYOUT[n.id];
              if (!p || !c) return null;
              const s = nodeStatus(n.id, progress);
              return (
                <line key={n.id + '-e'}
                  x1={p.x} y1={p.y} x2={c.x} y2={c.y}
                  stroke={stroke(n.id)}
                  strokeWidth={s === 'locked' ? 1 : 1.8}
                  opacity={s === 'locked' ? 0.28 : 0.55}
                />
              );
            })}

            {/* Nodes */}
            {[...TREE].reverse().map(n => {
              const pos = LAYOUT[n.id]; if (!pos) return null;
              const d = pos.depth;
              const r  = NODE_R[d]  ?? 14;
              const fs = FONT_SZ[d] ?? 7;
              const is = ICON_SZ[d] ?? 8;
              const status = nodeStatus(n.id, progress);
              const locked = status === 'locked';
              const done   = status === 'done';
              const isSel  = selected === n.id;
              const isDue  = reviewMode && done && dueNodes.includes(n.id);
              const str    = done ? (reviewData[n.id]?.strength ?? 1) : 0;

              return (
                <g key={n.id}
                  style={{ cursor: locked ? 'default' : 'pointer' }}
                  onClick={() => handleNodeClick(n.id)}>

                  {/* Mastered glow */}
                  {str >= 4 && <circle cx={pos.x} cy={pos.y} r={r + 10} fill="#F0CC7A" opacity="0.12" />}
                  {/* Done glow (not mastered) */}
                  {done && str < 4 && <circle cx={pos.x} cy={pos.y} r={r + 10} fill={STRENGTH_COLORS[str]} opacity="0.10" />}

                  {/* Due-for-review pulsing ring */}
                  {isDue && (
                    <circle cx={pos.x} cy={pos.y} r={r + 8}
                      fill="none" stroke="#D4A846" strokeWidth="2.5"
                      className="review-ring" />
                  )}

                  {/* Selected ring */}
                  {isSel && <circle cx={pos.x} cy={pos.y} r={r + 7} fill="none" stroke="#F0CC7A" strokeWidth="2" opacity="0.8" />}

                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={fill(n.id)}
                    stroke={isSel ? '#F0CC7A' : stroke(n.id)}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    opacity={locked ? 0.28 : 1}
                  />
                  <text x={pos.x} y={pos.y - 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={is} opacity={locked ? 0.2 : 1}>
                    {locked ? '🔒' : n.icon}
                  </text>
                  <text x={pos.x} y={pos.y + r + 7}
                    textAnchor="middle"
                    fontSize={fs}
                    fontFamily="Playfair Display, serif"
                    fill={locked ? '#2E0E1E' : '#E8D0B0'}
                    fontWeight="600"
                    opacity={locked ? 0.35 : 1}>
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── Legend ───────────────────────────────────────────────── */}
      <div className="learn-legend-float">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#2A7A3A' }} />New</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#C1003D' }} />Learning</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#D4A846' }} />Strong</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#F0CC7A' }} />Mastered</span>
        <span className="legend-item"><span className="legend-dot available" />Available</span>
        <span className="legend-hint">Scroll · Drag · Click</span>
      </div>

      {/* ── Info panel ───────────────────────────────────────────── */}
      {selected && selectedNode && (
        <div className="node-panel-float">
          <div className="node-panel-header">
            <div className="node-panel-title">
              <span>{selectedNode.icon}</span>
              {selectedNode.label}
              {selectedStatus === 'locked' && <span className="node-badge locked">🔒 Locked</span>}
            </div>
            <button className="node-panel-close" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div className="node-panel-info">
            {INFO[selected] || 'More information coming soon.'}
          </div>

          <div className="node-panel-footer">
            {selectedStatus === 'locked' ? (
              <div className="node-panel-locked-msg">
                Complete <strong>{parentNode?.icon} {parentNode?.label}</strong> first to unlock.
              </div>

            ) : selectedStatus === 'done' ? (
              <>
                {/* Strength row */}
                <div className="review-strength-row">
                  <div className="strength-dots">
                    {[1, 2, 3, 4].map(i => (
                      <span key={i} className="strength-dot"
                        style={{ background: i <= selStrength ? STRENGTH_COLORS[selStrength] : 'rgba(255,255,255,0.1)' }} />
                    ))}
                    <span className="strength-label"
                      style={{ color: STRENGTH_COLORS[selStrength] }}>
                      {STRENGTH_LABELS[selStrength]}
                    </span>
                  </div>
                  <div className="review-dates">
                    <span>Last: {lastReviewedText(selRD)}</span>
                    <span className={selIsDue ? 'due-now' : ''}>{nextReviewText(selRD)}</span>
                  </div>
                </div>

                {/* Review buttons */}
                <div className="review-btn-row">
                  <button className="review-btn still-learning"
                    onClick={() => markReview(selected, false)}>
                    🔁 Still learning
                  </button>
                  <button className="review-btn knew-it"
                    onClick={() => markReview(selected, true)}>
                    ✅ I knew this
                  </button>
                </div>

                {/* Retake quiz */}
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', marginTop: 6 }}
                  onClick={() => { setSelected(null); setQuiz(selected); }}>
                  Retake quiz
                </button>
              </>

            ) : (
              <button className="btn-primary"
                onClick={() => { setSelected(null); setQuiz(selected); }}>
                Take Quiz ({TOTAL_Q} questions) →
              </button>
            )}
          </div>
        </div>
      )}

      {quiz && (
        <QuizModal nodeId={quiz} onClose={() => setQuiz(null)} onPass={handlePass} />
      )}
    </div>
  );
}
