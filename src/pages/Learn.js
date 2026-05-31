import { useState, useRef, useEffect, useMemo } from 'react';
import { TREE, QUIZZES, INFO } from '../data/wineTree';
import { useWine } from '../context/WineContext';

const PASS_SCORE = 12;   // 80% of 15
const TOTAL_Q    = 15;
const BIG_Q      = 7;    // questions per branch in big quiz
const BIG_INTERVAL_DAYS = 60;

const STORAGE_KEY = 'learntasty_progress';
const REVIEW_KEY  = 'learntasty_review2';  // v2 schema — avoids conflicts with old data

// ── Branch IDs (direct children of 'wine') ───────────────────────────────────
const BRANCH_IDS = TREE.filter(n => n.parent === 'wine').map(n => n.id);

// ── Strength colours ──────────────────────────────────────────────────────────
const STRENGTH_COLORS = {
  1: '#4080C0',  // New      — steel blue
  2: '#2E9E60',  // Learning — bright green
  3: '#C87820',  // Strong   — warm amber
  4: '#F0CC7A',  // Mastered — bright gold
};
const STRENGTH_LABELS = { 1: 'New', 2: 'Learning', 3: 'Strong', 4: 'Mastered' };

// ── Tree helpers ──────────────────────────────────────────────────────────────
function getDepth(id) {
  let depth = 0, cur = TREE.find(n => n.id === id);
  while (cur?.parent) { depth++; const pid = cur.parent; cur = TREE.find(n => n.id === pid); }
  return depth;
}

function getBranch(id) {
  // Returns the depth-1 ancestor (branch) of a node, or null if it IS the root
  let cur = TREE.find(n => n.id === id);
  while (cur && cur.parent && cur.parent !== 'wine') {
    const pid = cur.parent; cur = TREE.find(n => n.id === pid);
  }
  return (cur && cur.parent === 'wine') ? cur.id : null;
}

function isFullyMastered(id, progress) {
  if (id !== 'wine' && !progress.has(id)) return false;
  return TREE.filter(n => n.parent === id).every(c => isFullyMastered(c.id, progress));
}

function strengthFromDepth(id) {
  const d = getDepth(id);
  if (d <= 1) return 1;
  if (d === 2) return 2;
  return 3;
}

function getNodeStrength(id, progress, branchPenalties) {
  if (id === 'wine') return isFullyMastered('wine', progress) ? 4 : 0;
  if (!progress.has(id)) return 0;
  if (isFullyMastered(id, progress)) return 4;
  const base   = strengthFromDepth(id);
  const branch = getBranch(id);
  const penalty = branch ? (branchPenalties[branch] ?? 0) : 0;
  return Math.max(1, base - penalty);
}

function getBranchNodes(branchId) {
  const nodes = [];
  function collect(id) {
    nodes.push(id);
    TREE.filter(n => n.parent === id).forEach(c => collect(c.id));
  }
  collect(branchId);
  return nodes;
}

function getBranchQuestionPool(branchId) {
  const pool = [];
  getBranchNodes(branchId).forEach(nid => {
    (QUIZZES[nid] || []).forEach(q => pool.push({ ...q, _nid: nid }));
  });
  return pool;
}

function sampleN(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

// ── Persistence ───────────────────────────────────────────────────────────────
function loadProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); }
  catch { return new Set(); }
}
function saveProgress(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}

const EMPTY_REVIEW = { branchPenalties: {}, lastBigQuiz: null };
function loadReviewData() {
  try {
    const raw = JSON.parse(localStorage.getItem(REVIEW_KEY));
    if (!raw || !('branchPenalties' in raw)) return { ...EMPTY_REVIEW };
    return raw;
  } catch { return { ...EMPTY_REVIEW }; }
}
function saveReviewData(d) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(d));
}

function todayStr() { return new Date().toISOString().split('T')[0]; }
function todayDate() { const d = new Date(); d.setHours(0,0,0,0); return d; }

// ── Radial layout ─────────────────────────────────────────────────────────────
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

// ── Individual Quiz Modal ─────────────────────────────────────────────────────
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
    if (qi + 1 >= TOTAL_Q) setDone(true);
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
            <div className={`quiz-result-icon ${passed ? 'pass' : 'fail'}`}>{passed ? '🏆' : '📚'}</div>
            <h2 className="quiz-result-title">{passed ? 'Passed!' : 'Not quite'}</h2>
            <div className="quiz-score">{score} / {TOTAL_Q}</div>
            <div className="quiz-score-label">
              {passed ? `${node?.label} unlocked!` : `Need ${PASS_SCORE}/15 (80%) to pass.`}
            </div>
            <div className="modal-footer" style={{ marginTop: 24 }}>
              <button className="btn-ghost" onClick={onClose}>Close</button>
              {passed
                ? <button className="btn-primary" onClick={() => { onPass(nodeId, score); onClose(); }}>Continue →</button>
                : <button className="btn-primary" onClick={() => { setQi(0); setChosen(null); setScore(0); setDone(false); }}>Retry</button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Big Quiz Modal ────────────────────────────────────────────────────────────
function BigQuizModal({ onClose, onComplete }) {
  // Build quiz sections once on mount
  const [sections] = useState(() =>
    BRANCH_IDS.map(branchId => {
      const pool = getBranchQuestionPool(branchId);
      return { branchId, questions: sampleN(pool, BIG_Q) };
    })
  );

  // Flatten to one array, keep branchId per question
  const quiz = useMemo(() =>
    sections.flatMap(s => s.questions.map(q => ({ ...q, branchId: s.branchId }))),
  [sections]);

  const [qi,       setQi]     = useState(0);
  const [chosen,   setChosen] = useState(null);
  const [answers,  setAnswers] = useState([]);
  const [done,     setDone]   = useState(false);

  const total = quiz.length;
  const q     = quiz[qi];
  const branchNode = TREE.find(n => n.id === q?.branchId);

  // Section progress within current branch
  const sectionIdx   = BRANCH_IDS.indexOf(q?.branchId);
  const qInSection   = answers.filter(a => a.branchId === q?.branchId).length + 1;

  function pick(idx) { if (chosen !== null) return; setChosen(idx); }

  function next() {
    const newAnswers = [...answers, { correct: chosen === q.a, branchId: q.branchId }];
    setAnswers(newAnswers);
    if (qi + 1 >= total) setDone(true);
    else { setQi(qi + 1); setChosen(null); }
  }

  // Results per branch
  const results = useMemo(() => {
    if (!done) return [];
    return BRANCH_IDS.map(branchId => {
      const branch = TREE.find(n => n.id === branchId);
      const ba = answers.filter(a => a.branchId === branchId);
      const correct = ba.filter(a => a.correct).length;
      const penalty = correct >= 6 ? 0 : correct >= 4 ? 1 : 2;
      return { branchId, branch, correct, total: ba.length, penalty };
    });
  }, [done, answers]);

  function finish() {
    onComplete(results);
    onClose();
  }

  if (done) {
    const allPassed = results.every(r => r.penalty === 0);
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal big-quiz-result" onClick={e => e.stopPropagation()}>
          <h2 className="quiz-result-title" style={{ marginBottom: 4 }}>
            {allPassed ? '🏆 Excellent!' : '📊 Big Quiz Results'}
          </h2>
          <p style={{ color: 'var(--text-mute)', fontSize: 13, marginBottom: 18 }}>
            Results per branch — your node strength has been updated.
          </p>
          <div className="big-quiz-results-table">
            {results.map(r => (
              <div key={r.branchId} className={`big-quiz-result-row penalty-${r.penalty}`}>
                <span className="bqr-branch">{r.branch?.icon} {r.branch?.label}</span>
                <span className="bqr-score">{r.correct}/{r.total}</span>
                <span className="bqr-outcome">
                  {r.penalty === 0 ? '✅ No change'
                   : r.penalty === 1 ? '⬇ −1 level'
                   : '⬇⬇ −2 levels'}
                </span>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={finish}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal quiz-modal" onClick={e => e.stopPropagation()}>
        <div className="quiz-header">
          <div className="quiz-node-title">
            {branchNode?.icon} {branchNode?.label}
            <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-mute)', marginLeft: 8 }}>
              {qInSection}/{BIG_Q}
            </span>
          </div>
          <div className="quiz-progress">{qi + 1} / {total}</div>
        </div>
        {/* Per-branch section dots */}
        <div className="big-quiz-sections">
          {BRANCH_IDS.map((b, i) => (
            <div key={b} className={`bq-section-dot ${i < sectionIdx ? 'done' : i === sectionIdx ? 'active' : ''}`} />
          ))}
        </div>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${(qi / total) * 100}%` }} />
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
            {qi + 1 >= total ? 'See results →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}


const MILESTONES = [
  { id: 'first',    label: 'First quiz passed',      check: (p) => p.size >= 1 },
  { id: 'grapes',   label: 'Grapes branch complete',  check: (p) => getBranchNodes('grapes').every(id => p.has(id)) },
  { id: 'regions',  label: 'Regions branch complete', check: (p) => getBranchNodes('regions').every(id => p.has(id)) },
  { id: 'half',     label: '50% of nodes done',       check: (p, total) => p.size >= total * 0.5 },
  { id: 'three',    label: 'Three branches complete',  check: (p) => BRANCH_IDS.filter(b => getBranchNodes(b).every(id => p.has(id))).length >= 3 },
  { id: 'master',   label: 'Full mastery — all done', check: (p, total) => p.size >= total },
];

// ── Progress Modal ────────────────────────────────────────────────────────────
function ProgressModal({ progress, reviewData, onClose }) {
  const allNodes  = TREE.filter(n => n.id !== 'wine');
  const total     = allNodes.length;

  const branches = BRANCH_IDS.map(bid => {
    const nodes    = getBranchNodes(bid);
    const doneCount = nodes.filter(id => progress.has(id)).length;
    const branch   = TREE.find(n => n.id === bid);
    const pen      = reviewData.branchPenalties?.[bid] ?? 0;
    return { bid, branch, doneCount, total: nodes.length, pen };
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal progress-modal" onClick={e => e.stopPropagation()}>
        <div className="progress-modal-header">
          <h2 className="progress-modal-title">Your Progress</h2>
          <button className="node-panel-close" onClick={onClose}>✕</button>
        </div>

        {/* Branch breakdown */}
        <div className="progress-branches">
          {branches.map(({ bid, branch, doneCount, total: bt, pen }) => {
            const bpct = bt > 0 ? Math.round((doneCount / bt) * 100) : 0;
            return (
              <div key={bid} className="progress-branch-row">
                <span className="progress-branch-label">{branch?.icon} {branch?.label}</span>
                <div className="progress-branch-bar">
                  <div className="progress-branch-fill" style={{ width: `${bpct}%` }} />
                </div>
                <span className="progress-branch-count">{doneCount}/{bt}</span>
                {pen > 0 && <span className="progress-branch-pen">⬇{pen}</span>}
              </div>
            );
          })}
        </div>

        {/* Milestones */}
        <div className="progress-milestones">
          <div className="progress-milestones-title">Milestones</div>
          {MILESTONES.map(m => {
            const achieved = m.check(progress, total);
            return (
              <div key={m.id} className={`progress-milestone ${achieved ? 'achieved' : ''}`}>
                <span>{achieved ? '✅' : '⬜'}</span>
                <span>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Learn() {
  const { addXP } = useWine();
  const [progress,   setProgress]   = useState(loadProgress);
  const [reviewData, setReviewData] = useState(loadReviewData);
  const [selected,   setSelected]   = useState(null);
  const [quiz,       setQuiz]       = useState(null);
  const [bigQuiz,      setBigQuiz]      = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [tfm,          setTfm]          = useState({ x: 0, y: 0, scale: 1 });

  const svgRef   = useRef();
  const gRef     = useRef();
  const dragRef  = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => { saveProgress(progress);   }, [progress]);
  useEffect(() => { saveReviewData(reviewData); }, [reviewData]);

  const { branchPenalties } = reviewData;

  // Is big quiz due?
  const bigQuizDue = useMemo(() => {
    if (!reviewData.lastBigQuiz) return true;
    const days = Math.round((todayDate() - new Date(reviewData.lastBigQuiz)) / 86400000);
    return days >= BIG_INTERVAL_DAYS;
  }, [reviewData]);

  const daysUntilBigQuiz = useMemo(() => {
    if (!reviewData.lastBigQuiz) return 0;
    const days = Math.round((todayDate() - new Date(reviewData.lastBigQuiz)) / 86400000);
    return Math.max(0, BIG_INTERVAL_DAYS - days);
  }, [reviewData]);

  // ── zoom ──────────────────────────────────────────────────────
  function onWheel(e) {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const factor = 1300 / rect.width;
    const mx = (e.clientX - rect.left) * factor;
    const my = (e.clientY - rect.top) * factor;
    const delta = e.deltaY > 0 ? 0.88 : 1.14;
    setTfm(t => {
      const ns = Math.min(3.5, Math.max(0.28, t.scale * delta));
      return { x: mx - (mx - t.x) * ns / t.scale, y: my - (my - t.y) * ns / t.scale, scale: ns };
    });
  }

  // ── drag ──────────────────────────────────────────────────────
  function onMouseDown(e) {
    if (e.button !== 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    dragRef.current = { sx: e.clientX, sy: e.clientY, tx: tfm.x, ty: tfm.y,
      scale: tfm.scale, factor: 1300 / rect.width, lx: tfm.x, ly: tfm.y };
    movedRef.current = false;
  }
  function onMouseMove(e) {
    const d = dragRef.current; if (!d) return;
    const dx = (e.clientX - d.sx) * d.factor, dy = (e.clientY - d.sy) * d.factor;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    const nx = d.tx + dx, ny = d.ty + dy;
    dragRef.current.lx = nx; dragRef.current.ly = ny;
    if (gRef.current) gRef.current.setAttribute('transform', `translate(${nx},${ny}) scale(${d.scale})`);
  }
  function onMouseUp() {
    if (dragRef.current) { const { lx, ly } = dragRef.current; setTfm(t => ({ ...t, x: lx, y: ly })); }
    dragRef.current = null;
  }
  function pinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchStart(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const factor = 1300 / rect.width;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { pinch: false, sx: t.clientX, sy: t.clientY,
        tx: tfm.x, ty: tfm.y, scale: tfm.scale, factor,
        lx: tfm.x, ly: tfm.y, ls: tfm.scale };
      movedRef.current = false;
    } else if (e.touches.length === 2) {
      dragRef.current = { pinch: true, startDist: pinchDist(e.touches),
        startScale: tfm.scale, tx: tfm.x, ty: tfm.y,
        smx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        smy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        factor, lx: tfm.x, ly: tfm.y, ls: tfm.scale };
    }
  }
  function onTouchMove(e) {
    const d = dragRef.current; if (!d) return;
    e.preventDefault();
    if (d.pinch && e.touches.length === 2) {
      const ratio    = pinchDist(e.touches) / d.startDist;
      const ns       = Math.min(3.5, Math.max(0.28, d.startScale * ratio));
      const mx       = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my       = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const panX     = (mx - d.smx) * d.factor;
      const panY     = (my - d.smy) * d.factor;
      const nx       = d.tx + panX;
      const ny       = d.ty + panY;
      dragRef.current.lx = nx; dragRef.current.ly = ny; dragRef.current.ls = ns;
      if (gRef.current) gRef.current.setAttribute('transform', `translate(${nx},${ny}) scale(${ns})`);
    } else if (!d.pinch && e.touches.length === 1) {
      const t  = e.touches[0];
      const dx = (t.clientX - d.sx) * d.factor;
      const dy = (t.clientY - d.sy) * d.factor;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
      const nx = d.tx + dx, ny = d.ty + dy;
      dragRef.current.lx = nx; dragRef.current.ly = ny;
      if (gRef.current) gRef.current.setAttribute('transform', `translate(${nx},${ny}) scale(${d.scale})`);
    }
  }
  function onTouchEnd() {
    if (dragRef.current) {
      const { lx, ly, ls } = dragRef.current;
      setTfm(t => ({ x: lx, y: ly, scale: ls ?? t.scale }));
    }
    dragRef.current = null;
  }

  function handleNodeClick(id) {
    if (movedRef.current) return;
    setSelected(prev => prev === id ? null : id);
  }
  function handlePass(id, score) {
    setProgress(p => { const n = new Set(p); n.add(id); return n; });
    // Performance XP: 12→20, 13→28, 14→38, 15→50
    const xpTable = { 12: 20, 13: 28, 14: 38, 15: 50 };
    addXP(xpTable[score] ?? Math.round((score / TOTAL_Q) * 50), 'learn');
  }
  function handleBigQuizComplete(results) {
    setReviewData(d => {
      const penalties = { ...d.branchPenalties };
      results.forEach(({ branchId, penalty }) => {
        if (penalty > 0) penalties[branchId] = penalty;
        else delete penalties[branchId];
      });
      return { branchPenalties: penalties, lastBigQuiz: todayStr() };
    });
    // Performance XP: 10 base + (correct/7 * 10) per branch
    const earned = 10 + results.reduce((sum, r) => sum + Math.round((r.correct / r.total) * 10), 0);
    addXP(earned, 'learn');
    // Penalty XP loss: −8 per step-back-1 branch, −18 per step-back-2 branch
    const lost = results.reduce((sum, r) => sum + (r.penalty === 1 ? 8 : r.penalty === 2 ? 18 : 0), 0);
    if (lost > 0) addXP(-lost, 'learn');
  }

  function resetView() { setTfm({ x: 0, y: 0, scale: 1 }); }

  const selectedNode   = selected ? TREE.find(n => n.id === selected) : null;
  const selectedStatus = selected ? nodeStatus(selected, progress) : null;
  const parentNode     = selectedNode ? TREE.find(n => n.id === selectedNode.parent) : null;
  const selStrength    = selected ? getNodeStrength(selected, progress, branchPenalties) : 0;
  const selBranch      = selected ? getBranch(selected) : null;
  const selPenalty     = selBranch ? (branchPenalties[selBranch] ?? 0) : 0;

  // ── colours ───────────────────────────────────────────────────
  function fill(id) {
    const s = nodeStatus(id, progress);
    if (id === 'wine') return '#F0CC7A';
    if (s === 'locked')    return '#1E0814';
    if (s === 'available') return '#C1003D';
    const str = getNodeStrength(id, progress, branchPenalties);
    return STRENGTH_COLORS[str] || STRENGTH_COLORS[1];
  }
  function stroke(id) {
    const s = nodeStatus(id, progress);
    if (id === 'wine') return '#F0CC7A';
    if (s === 'done') {
      const str = getNodeStrength(id, progress, branchPenalties);
      if (str >= 4) return '#F0CC7A';
      if (str >= 3) return 'rgba(200,120,32,0.7)';
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
          {bigQuizDue ? (
            <button className="review-due-badge active" onClick={() => setBigQuiz(true)}>
              🎓 Big Quiz ready
            </button>
          ) : (
            <span className="review-due-badge" style={{ cursor: 'default' }}>
              🎓 Next quiz in {daysUntilBigQuiz}d
            </span>
          )}
          <button className="learn-topbar-btn" onClick={resetView}>⌖ Reset</button>
          <button className="learn-topbar-btn" onClick={() => setProgress(new Set())}>Clear</button>
        </div>
      </div>

      {/* ── Graph ────────────────────────────────────────────────── */}
      <div className="learn-canvas"
        style={{ touchAction: 'none' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        <svg ref={svgRef} viewBox="0 0 1300 1300"
          style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
          onWheel={onWheel}>
          <g ref={gRef} transform={`translate(${tfm.x},${tfm.y}) scale(${tfm.scale})`}>

            {/* Edges */}
            {TREE.filter(n => n.parent).map(n => {
              const p = LAYOUT[n.parent], c = LAYOUT[n.id];
              if (!p || !c) return null;
              const s = nodeStatus(n.id, progress);
              return (
                <line key={n.id + '-e'} x1={p.x} y1={p.y} x2={c.x} y2={c.y}
                  stroke={stroke(n.id)}
                  strokeWidth={s === 'locked' ? 1 : 1.8}
                  opacity={s === 'locked' ? 0.28 : 0.55} />
              );
            })}

            {/* Nodes */}
            {[...TREE].reverse().map(n => {
              const pos = LAYOUT[n.id]; if (!pos) return null;
              const d = pos.depth;
              const r  = NODE_R[d]  ?? 14;
              const fs = FONT_SZ[d] ?? 7;
              const is = ICON_SZ[d] ?? 8;
              const status  = nodeStatus(n.id, progress);
              const locked  = status === 'locked';
              const done    = status === 'done';
              const isSel   = selected === n.id;
              const str     = done ? getNodeStrength(n.id, progress, branchPenalties) : 0;
              const hasPen  = done && (branchPenalties[getBranch(n.id)] ?? 0) > 0;

              return (
                <g key={n.id} style={{ cursor: locked ? 'default' : 'pointer' }}
                  onClick={() => handleNodeClick(n.id)}>
                  {/* Glow */}
                  {str >= 4 && <circle cx={pos.x} cy={pos.y} r={r + 10} fill="#F0CC7A" opacity="0.12" />}
                  {done && str < 4 && <circle cx={pos.x} cy={pos.y} r={r + 10} fill={STRENGTH_COLORS[str]} opacity="0.08" />}
                  {/* Selected ring */}
                  {isSel && <circle cx={pos.x} cy={pos.y} r={r + 7} fill="none" stroke="#F0CC7A" strokeWidth="2" opacity="0.8" />}
                  {/* Penalty indicator — small dashed ring */}
                  {hasPen && !isSel && (
                    <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none"
                      stroke="rgba(193,0,61,0.5)" strokeWidth="1.2" strokeDasharray="3 3" />
                  )}
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={fill(n.id)}
                    stroke={isSel ? '#F0CC7A' : stroke(n.id)}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    opacity={locked ? 0.28 : 1} />
                  <text x={pos.x} y={pos.y - 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={is} opacity={locked ? 0.2 : 1}>
                    {locked ? '🔒' : n.icon}
                  </text>
                  <text x={pos.x} y={pos.y + r + 7}
                    textAnchor="middle" fontSize={fs}
                    fontFamily="Playfair Display, serif"
                    fill={locked ? '#2E0E1E' : '#E8D0B0'}
                    fontWeight="600" opacity={locked ? 0.35 : 1}>
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── Legend + level badge ─────────────────────────────────── */}
      <div className="learn-legend-float">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#4080C0' }} />New</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#2E9E60' }} />Learning</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#C87820' }} />Strong</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#F0CC7A' }} />Mastered</span>
        <span className="legend-item"><span className="legend-dot available" />Available</span>
        <span className="legend-hint">Scroll · Drag · Click</span>
      </div>

      {/* ── Level badge (bottom-right) ──────────────────────────── */}
      {(() => {
        const total  = TREE.filter(n => n.id !== 'wine').length;
        const pct = total > 0 ? Math.round((progress.size / total) * 100) : 0;
        return (
          <button className="level-badge" onClick={() => setShowProgress(true)}>
            <span className="level-badge-pct">{pct}%</span>
          </button>
        );
      })()}

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

          <div className="node-panel-info">{INFO[selected] || 'More information coming soon.'}</div>

          <div className="node-panel-footer">
            {selectedStatus === 'locked' ? (
              <div className="node-panel-locked-msg">
                Complete <strong>{parentNode?.icon} {parentNode?.label}</strong> first to unlock.
              </div>

            ) : selectedStatus === 'done' ? (
              <>
                {/* Strength display */}
                <div className="review-strength-row">
                  <div className="strength-dots">
                    {[1, 2, 3, 4].map(i => (
                      <span key={i} className="strength-dot"
                        style={{ background: i <= selStrength ? STRENGTH_COLORS[selStrength] : 'rgba(255,255,255,0.1)' }} />
                    ))}
                    <span className="strength-label" style={{ color: STRENGTH_COLORS[selStrength] }}>
                      {STRENGTH_LABELS[selStrength]}
                    </span>
                  </div>
                  {selPenalty > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--rose)' }}>
                      ⬇ −{selPenalty} from big quiz
                    </span>
                  )}
                </div>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={() => { setSelected(null); setQuiz(selected); }}>
                  Retake quiz
                </button>
              </>

            ) : (
              <button className="btn-primary"
                onClick={() => { setSelected(null); setQuiz(selected); }}>
                Take Quiz ({TOTAL_Q} questions, need 80%) →
              </button>
            )}
          </div>
        </div>
      )}

      {quiz && (
        <QuizModal nodeId={quiz} onClose={() => setQuiz(null)} onPass={handlePass} />
      )}
      {bigQuiz && (
        <BigQuizModal onClose={() => setBigQuiz(false)} onComplete={handleBigQuizComplete} />
      )}
      {showProgress && (
        <ProgressModal progress={progress} reviewData={reviewData} onClose={() => setShowProgress(false)} />
      )}
    </div>
  );
}
