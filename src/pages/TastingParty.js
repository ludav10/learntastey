import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWine, XP_EARN } from '../context/WineContext';
import GrapeInput from '../components/GrapeInput';
import { WINE_COUNTRIES, getRegionsForCountry } from '../data/wineRegions';

const COLORS      = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange'];
const CURRENT_YR  = new Date().getFullYear();

const OLD_WORLD = new Set([
  'France','Italy','Spain','Portugal','Germany','Austria','Greece','Hungary',
  'Croatia','Slovenia','Romania','Bulgaria','Georgia','Lebanon','Switzerland',
  'Czech Republic','Slovakia','Moldova','Serbia','Montenegro','Cyprus',
  'Luxembourg','England','Wales','Israel','Morocco','Tunisia','Algeria',
]);

function getWorld(country) {
  if (!country) return '';
  return OLD_WORLD.has(country) ? 'Old World' : 'New World';
}

const EMPTY_GUESS  = { color:'', world:'', grape:'', country:'', region:'', vintage:2015, price:25, rating:7 };
const EMPTY_ANSWER = { color:'Red', grape:'', country:'', region:'', vintage:2020, price:25 };

// ── Scoring ──────────────────────────────────────────────────────────────────
// Fixed categories scored per-player against the answer key.
// Vintage + Price are relative: closest player gets most points.

function scoreFixed(guess, answer) {
  let pts = 0;
  const breakdown = [];

  // Colour 2pts
  if (guess.color && guess.color === answer.color) {
    pts += 2; breakdown.push({ label: 'Colour', pts: 2, max: 2, hit: true });
  } else { breakdown.push({ label: 'Colour', pts: 0, max: 2, hit: false }); }

  // Old/New World 2pts
  const ansWorld = getWorld(answer.country);
  if (ansWorld && guess.world && guess.world === ansWorld) {
    pts += 2; breakdown.push({ label: 'World', pts: 2, max: 2, hit: true });
  } else { breakdown.push({ label: 'World', pts: 0, max: 2, hit: false }); }

  // Grape 4pts exact / 1pt partial
  const gg = (guess.grape  || '').toLowerCase().trim();
  const ag = (answer.grape || '').toLowerCase().trim();
  if (gg && ag) {
    if (gg === ag)                                       { pts += 4; breakdown.push({ label: 'Grape', pts: 4, max: 4, hit: true });      }
    else if (ag.includes(gg) || gg.includes(ag))         { pts += 1; breakdown.push({ label: 'Grape', pts: 1, max: 4, hit: 'close' });   }
    else                                                 {           breakdown.push({ label: 'Grape', pts: 0, max: 4, hit: false });      }
  } else                                                 {           breakdown.push({ label: 'Grape', pts: 0, max: 4, hit: false });      }

  // Country 4pts
  if (guess.country && guess.country.toLowerCase() === (answer.country || '').toLowerCase()) {
    pts += 4; breakdown.push({ label: 'Country', pts: 4, max: 4, hit: true });
  } else { breakdown.push({ label: 'Country', pts: 0, max: 4, hit: false }); }

  // Region 6pts
  if (guess.region && answer.region && guess.region.toLowerCase() === answer.region.toLowerCase()) {
    pts += 6; breakdown.push({ label: 'Region', pts: 6, max: 6, hit: true });
  } else { breakdown.push({ label: 'Region', pts: 0, max: 6, hit: false }); }

  return { pts, breakdown };
}

function addRelativeScores(players, answer) {
  // Clone so we can mutate
  const result = players.map(p => ({ ...p, breakdown: [...p.breakdown] }));

  // Vintage — 5/3/2/1 pts by rank of closeness
  const av = parseInt(answer.vintage);
  if (av) {
    const diffs  = result.map(r => { const v = parseInt(r.guess.vintage); return isNaN(v) ? Infinity : Math.abs(v - av); });
    const finite = [...new Set(diffs.filter(d => d !== Infinity))].sort((a, b) => a - b);
    const tiers  = [5, 3, 2, 1];
    diffs.forEach((diff, i) => {
      const tier = finite.indexOf(diff);
      const vpts = diff === Infinity ? 0 : (diff === 0 ? 5 : (tiers[tier] ?? 1));
      const hit  = diff === 0 ? true : diff === Infinity ? false : 'close';
      result[i].pts += vpts;
      result[i].breakdown.push({ label: 'Vintage', pts: vpts, max: 5, hit,
        extra: diff !== Infinity && diff > 0 ? `±${diff}yr` : null });
    });
  } else {
    result.forEach(r => r.breakdown.push({ label: 'Vintage', pts: 0, max: 5, hit: false }));
  }

  // Price — 3/2/1 pts by rank of closeness
  const ap = parseInt(answer.price);
  if (ap) {
    const diffs  = result.map(r => { const v = parseInt(r.guess.price); return isNaN(v) ? Infinity : Math.abs(v - ap); });
    const finite = [...new Set(diffs.filter(d => d !== Infinity))].sort((a, b) => a - b);
    const tiers  = [3, 2, 1];
    diffs.forEach((diff, i) => {
      const tier = finite.indexOf(diff);
      const ppts = diff === Infinity ? 0 : (diff === 0 ? 3 : (tiers[tier] ?? 1));
      const hit  = diff === 0 ? true : diff === Infinity ? false : 'close';
      result[i].pts += ppts;
      result[i].breakdown.push({ label: 'Price', pts: ppts, max: 3, hit,
        extra: diff !== Infinity && diff > 0 ? `±£${diff}` : null });
    });
  } else {
    result.forEach(r => r.breakdown.push({ label: 'Price', pts: 0, max: 3, hit: false }));
  }

  return result;
}

function scoreAll(rawPlayers, answer) {
  const withFixed = rawPlayers.map(p => {
    const { pts, breakdown } = scoreFixed(p.guess, answer);
    return { ...p, pts, breakdown };
  });
  return addRelativeScores(withFixed, answer);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TastingParty() {
  const { addXP } = useWine();
  const navigate = useNavigate();
  const [phase,   setPhase]   = useState('intro');
  const [answer,  setAnswer]  = useState({ ...EMPTY_ANSWER });
  const [players, setPlayers] = useState([]);        // unscored while guessing
  const [current, setCurrent] = useState({ name: '', ...EMPTY_GUESS });

  function startGuessing() { setPlayers([]); setPhase('name'); }
  function chooseMode(m)   { if (m === 'multi') { navigate('/party/multi'); return; } if (m === 'one') setPhase('setup'); }

  function nextPlayer() {
    setPlayers(p => [...p, { name: current.name, guess: { ...current } }]);
    setCurrent({ name: '', ...EMPTY_GUESS });
    setPhase('name');
  }

  function doReveal(rawList) {
    const scored = scoreAll(rawList, answer);
    setPlayers(scored);
    // XP based on winner's performance — better game = more XP
    const topScore = scored.length > 0 ? Math.max(...scored.map(p => p.pts)) : 0;
    const xpAmt = Math.max(5, Math.round((topScore / MAX_PTS) * XP_EARN.party));
    addXP(xpAmt, 'party');
    setPhase('reveal');
  }

  function revealFromName()  { doReveal(players); }
  function revealLastPlayer(){ doReveal([...players, { name: current.name, guess: { ...current } }]); }

  function restart() {
    setPlayers([]); setCurrent({ name: '', ...EMPTY_GUESS });
    setAnswer({ ...EMPTY_ANSWER }); setPhase('intro');
  }

  const MAX_PTS = 2 + 2 + 4 + 4 + 6 + 5 + 3; // = 26
  const sorted  = phase === 'reveal' ? [...players].sort((a, b) => b.pts - a.pts) : [];
  const MEDALS  = ['🥇', '🥈', '🥉'];

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="party-page">
      <div className="party-hero">
        <div className="party-hero-emoji">🍷</div>
        <h1 className="party-hero-title">Games</h1>
        <p className="party-hero-sub">Pour the wine. See who knows their stuff.</p>
      </div>

      <div className="party-mode-row">
        <button className="party-mode-card" onClick={() => chooseMode('multi')}>
          <div className="party-mode-emoji">🎉</div>
          <div className="party-mode-title">Each Phone</div>
          <div className="party-mode-sub">Everyone answers on their own device.</div>
          <div className="btn-primary" style={{marginTop:12,fontSize:13,padding:'8px 20px'}}>Play now →</div>
        </button>
        <button className="party-mode-card" onClick={() => chooseMode('one')}>
          <div className="party-mode-emoji">📱</div>
          <div className="party-mode-title">One Phone</div>
          <div className="party-mode-sub">Pass the phone around. Classic mode.</div>
          <div className="btn-primary" style={{marginTop:12,fontSize:13,padding:'8px 20px'}}>Play now →</div>
        </button>
      </div>

      <div className="party-scoring-hint">
        <strong>Scoring:</strong> Colour · World · Grape · Country · Region — exact wins.
        <br />Vintage &amp; Price — <em>closest player gets most points!</em>
      </div>
    </div>
  );

  // ── Setup (host) ───────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div className="party-page">
      <div className="party-card">
        <h2 className="party-card-title">🔒 Host only — enter the wine</h2>
        <p className="party-hint">Players won't see this. Keep the screen away from them!</p>

        <div className="form-group">
          <label>Colour</label>
          <div className="pill-row">
            {COLORS.map(c => <button key={c} className={`pill ${answer.color===c?'active':''}`}
              onClick={() => setAnswer(a => ({ ...a, color: c }))}>{c}</button>)}
          </div>
        </div>

        <div className="form-group">
          <label>Grape(s)</label>
          <GrapeInput value={answer.grape} onChange={v => setAnswer(a => ({ ...a, grape: v }))} listId="setup-grape" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Country</label>
            <input value={answer.country} onChange={e => setAnswer(a => ({ ...a, country: e.target.value, region: '' }))} list="setup-country" />
            <datalist id="setup-country">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="form-group">
            <label>Region</label>
            <input value={answer.region} onChange={e => setAnswer(a => ({ ...a, region: e.target.value }))} list="setup-region" />
            <datalist id="setup-region">{getRegionsForCountry(answer.country).map(r => <option key={r} value={r} />)}</datalist>
          </div>
        </div>

        <div className="form-group">
          <label>Vintage — <strong className="party-slider-val">{answer.vintage}</strong></label>
          <input type="range" className="party-slider" min={1960} max={CURRENT_YR}
            value={answer.vintage} onChange={e => setAnswer(a => ({ ...a, vintage: parseInt(e.target.value) }))} />
          <div className="party-slider-labels"><span>1960</span><span>{CURRENT_YR}</span></div>
        </div>

        <div className="form-group">
          <label>Price — <strong className="party-slider-val">£{answer.price}</strong></label>
          <input type="range" className="party-slider" min={5} max={200} step={5}
            value={answer.price} onChange={e => setAnswer(a => ({ ...a, price: parseInt(e.target.value) }))} />
          <div className="party-slider-labels"><span>£5</span><span>£200+</span></div>
        </div>

        <button className="btn-primary full" style={{ marginTop: 16 }} onClick={startGuessing}>
          Lock it in — start guessing →
        </button>
      </div>
    </div>
  );

  // ── Enter name ─────────────────────────────────────────────────────────────
  if (phase === 'name') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
        <h2 className="party-card-title">Who's guessing?</h2>
        {players.length > 0 &&
          <p className="party-hint">✅ {players.map(p => p.name).join(', ')} already guessed</p>}
        <input className="party-name-input" value={current.name}
          onChange={e => setCurrent(c => ({ ...c, name: e.target.value }))}
          placeholder="Your name…"
          onKeyDown={e => e.key === 'Enter' && current.name.trim() && setPhase('guess')}
          autoFocus />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {players.length > 0 &&
            <button className="btn-ghost" onClick={revealFromName}>Reveal results</button>}
          <button className="btn-primary" style={{ flex: 1 }}
            disabled={!current.name.trim()} onClick={() => setPhase('guess')}>
            Start guessing →
          </button>
        </div>
      </div>
    </div>
  );

  // ── Guess ──────────────────────────────────────────────────────────────────
  if (phase === 'guess') return (
    <div className="party-page">
      <div className="party-card">
        <h2 className="party-card-title">🍷 {current.name}'s guesses</h2>
        <p className="party-hint">What do you think is in the glass?</p>

        <div className="form-group">
          <label>Colour</label>
          <div className="pill-row">
            {COLORS.map(c => <button key={c} className={`pill ${current.color===c?'active':''}`}
              onClick={() => setCurrent(p => ({ ...p, color: c }))}>{c}</button>)}
          </div>
        </div>

        <div className="form-group">
          <label>Old World or New World?</label>
          <div className="pill-row">
            {['Old World', 'New World'].map(w => (
              <button key={w} className={`pill ${current.world===w?'active':''}`}
                onClick={() => setCurrent(p => ({ ...p, world: w }))}>{w}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Grape(s)</label>
          <GrapeInput value={current.grape} onChange={v => setCurrent(p => ({ ...p, grape: v }))} listId="guess-grape" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Country</label>
            <input value={current.country}
              onChange={e => setCurrent(p => ({ ...p, country: e.target.value, region: '' }))} list="guess-country" />
            <datalist id="guess-country">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="form-group">
            <label>Region</label>
            <input value={current.region}
              onChange={e => setCurrent(p => ({ ...p, region: e.target.value }))} list="guess-region" />
            <datalist id="guess-region">{getRegionsForCountry(current.country).map(r => <option key={r} value={r} />)}</datalist>
          </div>
        </div>

        <div className="form-group">
          <label>Vintage — <strong className="party-slider-val">{current.vintage}</strong></label>
          <input type="range" className="party-slider" min={1960} max={CURRENT_YR}
            value={current.vintage} onChange={e => setCurrent(p => ({ ...p, vintage: parseInt(e.target.value) }))} />
          <div className="party-slider-labels"><span>1960</span><span>{CURRENT_YR}</span></div>
        </div>

        <div className="form-group">
          <label>Price — <strong className="party-slider-val">£{current.price}</strong></label>
          <input type="range" className="party-slider" min={5} max={200} step={5}
            value={current.price} onChange={e => setCurrent(p => ({ ...p, price: parseInt(e.target.value) }))} />
          <div className="party-slider-labels"><span>£5</span><span>£200+</span></div>
        </div>

        <div className="form-group">
          <label>Your rating — <strong className="party-slider-val">{current.rating}/10</strong></label>
          <input type="range" className="party-slider rating-slider" min={1} max={10} step={0.5}
            value={current.rating} onChange={e => setCurrent(p => ({ ...p, rating: parseFloat(e.target.value) }))} />
          <div className="party-slider-labels"><span>😬 1</span><span>😍 10</span></div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-ghost" onClick={() => setPhase('name')}>← Back</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={nextPlayer}>Submit &amp; pass phone →</button>
        </div>
        <button className="btn-ghost full" style={{ marginTop: 8, fontSize: 12 }} onClick={revealLastPlayer}>
          This was the last player — reveal now
        </button>
      </div>
    </div>
  );

  // ── Reveal ─────────────────────────────────────────────────────────────────
  if (phase === 'reveal') return (
    <div className="party-page">
      <div className="party-reveal-header">
        <h2 className="party-hero-title">🏆 Results</h2>
        <div className="party-answer-card">
          <div className="party-answer-label">The wine was…</div>
          <div className="party-answer-name">{answer.grape || '?'}</div>
          <div className="party-answer-details">
            {[answer.color, answer.country, answer.region, answer.vintage && `${answer.vintage}`, `£${answer.price}`]
              .filter(Boolean).join(' · ')}
          </div>
          {getWorld(answer.country) && (
            <div className="party-answer-world">{getWorld(answer.country)}</div>
          )}
        </div>
      </div>

      <div className="party-leaderboard">
        {sorted.map((p, i) => (
          <div key={p.name} className={`party-player-row rank-${Math.min(i, 3)}`}>
            <span className="party-medal">{MEDALS[i] || `${i + 1}`}</span>
            <div className="party-player-main">
              <span className="party-player-name">{p.name}</span>
              <div className="party-breakdown">
                {p.breakdown.map(b => (
                  <span key={b.label} className={`party-tag ${b.hit === true ? 'hit' : b.hit ? 'close' : 'miss'}`}>
                    {b.label} {b.pts}/{b.max}{b.extra ? ` ${b.extra}` : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="party-player-right">
              <span className="party-player-pts">{p.pts}<span className="party-pts-max">/{MAX_PTS}</span></span>
              {p.guess.rating && <span className="party-player-rating">⭐ {p.guess.rating}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="party-actions">
        <button className="btn-primary full" onClick={restart}>Play again 🍷</button>
      </div>
    </div>
  );
}
