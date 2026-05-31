import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import GrapeInput from '../components/GrapeInput';
import { WINE_COUNTRIES, getRegionsForCountry } from '../data/wineRegions';

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS     = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange'];
const CURRENT_YR = new Date().getFullYear();
const MAX_PTS    = 2 + 2 + 4 + 4 + 6 + 5 + 3; // 26

const OLD_WORLD = new Set([
  'France','Italy','Spain','Portugal','Germany','Austria','Greece','Hungary',
  'Croatia','Slovenia','Romania','Bulgaria','Georgia','Lebanon','Switzerland',
  'Czech Republic','Slovakia','Moldova','Serbia','Montenegro','Cyprus',
  'Luxembourg','England','Wales','Israel','Morocco','Tunisia','Algeria',
]);
function getWorld(c) { return OLD_WORLD.has(c) ? 'Old World' : c ? 'New World' : ''; }

const EMPTY_ANSWER = { color: 'Red', grape: '', country: '', region: '', vintage: 2020, price: 25 };
const EMPTY_GUESS  = { color: '', world: '', grape: '', country: '', region: '', vintage: 2015, price: 25, rating: 7 };

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreAll(rawPlayers, answer) {
  const result = rawPlayers.map(p => {
    const g = p.guess || EMPTY_GUESS;
    let pts = 0;
    const breakdown = [];

    // Colour 2pts
    if (g.color && g.color === answer.color) { pts += 2; breakdown.push({ label: 'Colour', pts: 2, max: 2, hit: true }); }
    else breakdown.push({ label: 'Colour', pts: 0, max: 2, hit: false });

    // World 2pts
    const aw = getWorld(answer.country);
    if (aw && g.world === aw) { pts += 2; breakdown.push({ label: 'World', pts: 2, max: 2, hit: true }); }
    else breakdown.push({ label: 'World', pts: 0, max: 2, hit: false });

    // Grape 4/1pts
    const gg = (g.grape || '').toLowerCase().trim();
    const ag = (answer.grape || '').toLowerCase().trim();
    if (gg && ag) {
      if (gg === ag)                              { pts += 4; breakdown.push({ label: 'Grape', pts: 4, max: 4, hit: true }); }
      else if (ag.includes(gg)||gg.includes(ag))  { pts += 1; breakdown.push({ label: 'Grape', pts: 1, max: 4, hit: 'close' }); }
      else breakdown.push({ label: 'Grape', pts: 0, max: 4, hit: false });
    } else breakdown.push({ label: 'Grape', pts: 0, max: 4, hit: false });

    // Country 4pts
    if (g.country && g.country.toLowerCase() === (answer.country||'').toLowerCase()) { pts += 4; breakdown.push({ label: 'Country', pts: 4, max: 4, hit: true }); }
    else breakdown.push({ label: 'Country', pts: 0, max: 4, hit: false });

    // Region 6pts
    if (g.region && answer.region && g.region.toLowerCase() === answer.region.toLowerCase()) { pts += 6; breakdown.push({ label: 'Region', pts: 6, max: 6, hit: true }); }
    else breakdown.push({ label: 'Region', pts: 0, max: 6, hit: false });

    return { ...p, pts, breakdown };
  });

  // Vintage — relative, closest wins (5/3/2/1)
  const av = parseInt(answer.vintage);
  if (av) {
    const diffs  = result.map(r => { const v = parseInt((r.guess||{}).vintage); return isNaN(v) ? Infinity : Math.abs(v - av); });
    const finite = [...new Set(diffs.filter(d => d !== Infinity))].sort((a,b) => a-b);
    diffs.forEach((diff, i) => {
      const tier = finite.indexOf(diff);
      const vpts = diff === Infinity ? 0 : diff === 0 ? 5 : ([5,3,2,1][tier] ?? 1);
      const hit  = diff === 0 ? true : diff === Infinity ? false : 'close';
      result[i].pts += vpts;
      result[i].breakdown.push({ label: 'Vintage', pts: vpts, max: 5, hit, extra: diff > 0 && diff !== Infinity ? `±${diff}yr` : null });
    });
  } else result.forEach(r => r.breakdown.push({ label: 'Vintage', pts: 0, max: 5, hit: false }));

  // Price — relative, closest wins (3/2/1)
  const ap = parseInt(answer.price);
  if (ap) {
    const diffs  = result.map(r => { const v = parseInt((r.guess||{}).price); return isNaN(v) ? Infinity : Math.abs(v - ap); });
    const finite = [...new Set(diffs.filter(d => d !== Infinity))].sort((a,b) => a-b);
    diffs.forEach((diff, i) => {
      const tier = finite.indexOf(diff);
      const ppts = diff === Infinity ? 0 : diff === 0 ? 3 : ([3,2,1][tier] ?? 1);
      const hit  = diff === 0 ? true : diff === Infinity ? false : 'close';
      result[i].pts += ppts;
      result[i].breakdown.push({ label: 'Price', pts: ppts, max: 3, hit });
    });
  } else result.forEach(r => r.breakdown.push({ label: 'Price', pts: 0, max: 3, hit: false }));

  return result;
}

function genCode() { return Math.floor(1000 + Math.random() * 9000).toString(); }

// ── Component ─────────────────────────────────────────────────────────────────
export default function TastingPartyMulti() {
  const [view,      setView]      = useState('mode');
  const [roomId,    setRoomId]    = useState(null);
  const [roomCode,  setRoomCode]  = useState('');
  const [isHost,    setIsHost]    = useState(false);
  const [playerId,  setPlayerId]  = useState(null);
  const [players,   setPlayers]   = useState([]);
  const [answer,    setAnswer]    = useState({ ...EMPTY_ANSWER });
  const [myGuess,   setMyGuess]   = useState({ ...EMPTY_GUESS });
  const [myName,    setMyName]    = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  // ── Fetch & sync state ──────────────────────────────────────────────────────
  const fetchState = useCallback(async (currentView, currentIsHost) => {
    if (!roomId) return;
    const [{ data: room }, { data: playerList }] = await Promise.all([
      supabase.from('party_rooms').select('phase, answer').eq('id', roomId).single(),
      supabase.from('party_players').select('*').eq('room_id', roomId).order('created_at'),
    ]);
    if (playerList) setPlayers(playerList);
    if (room && !currentIsHost) {
      if (room.phase === 'guessing' && currentView === 'player-waiting')  setView('player-guessing');
      if (room.phase === 'reveal'   && currentView !== 'reveal') { setAnswer(room.answer); setView('reveal'); }
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    fetchState(view, isHost);
    const ch = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_rooms',   filter: `id=eq.${roomId}` },      () => fetchState(view, isHost))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_players', filter: `room_id=eq.${roomId}` }, () => fetchState(view, isHost))
      .subscribe();
    const poll = setInterval(() => fetchState(view, isHost), 3000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [roomId, fetchState, view, isHost]);

  // ── Host: create room ───────────────────────────────────────────────────────
  async function createRoom() {
    setLoading(true); setError('');
    const { data, error: err } = await supabase
      .from('party_rooms').insert({ code: genCode(), phase: 'waiting', answer }).select().single();
    setLoading(false);
    if (err) { setError('Could not create room — did you run the SQL setup?'); return; }
    setRoomId(data.id); setRoomCode(data.code); setIsHost(true); setView('host-waiting');
  }

  async function startGame() {
    await supabase.from('party_rooms').update({ phase: 'guessing' }).eq('id', roomId);
    setView('host-guessing');
  }

  async function doReveal() {
    setLoading(true);
    const scored = scoreAll(players.map(p => ({ name: p.name, guess: p.guess, id: p.id })), answer);
    await Promise.all(scored.map(s =>
      supabase.from('party_players').update({ pts: s.pts, breakdown: s.breakdown }).eq('id', s.id)
    ));
    await supabase.from('party_rooms').update({ phase: 'reveal' }).eq('id', roomId);
    setPlayers(scored.map((s, i) => ({ ...players[i], pts: s.pts, breakdown: s.breakdown })));
    setLoading(false); setView('reveal');
  }

  // ── Player: join by code ────────────────────────────────────────────────────
  async function joinRoom() {
    setError(''); setLoading(true);
    const { data: room } = await supabase
      .from('party_rooms').select('id, phase').eq('code', codeInput.trim()).single();
    setLoading(false);
    if (!room)                    { setError('Room not found — check the code!'); return; }
    if (room.phase !== 'waiting') { setError('This game has already started.'); return; }
    setRoomId(room.id); setIsHost(false); setView('player-name');
  }

  async function joinAsPlayer() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('party_players')
      .insert({ room_id: roomId, name: myName.trim(), guess: EMPTY_GUESS, submitted: false })
      .select().single();
    setLoading(false);
    if (err) { setError('Could not join. Try again.'); return; }
    setPlayerId(data.id); setView('player-waiting');
  }

  async function submitGuess() {
    setLoading(true);
    await supabase.from('party_players').update({ guess: myGuess, submitted: true }).eq('id', playerId);
    setLoading(false); setView('player-submitted');
  }

  const submittedCount = players.filter(p => p.submitted).length;
  const sorted = view === 'reveal' ? [...players].sort((a, b) => b.pts - a.pts) : [];
  const MEDALS = ['🥇', '🥈', '🥉'];
  const siteUrl = window.location.origin + '/party/multi';

  // ── MODE SELECT ─────────────────────────────────────────────────────────────
  if (view === 'mode') return (
    <div className="party-page">
      <div className="party-hero" style={{ paddingBottom: 24 }}>
        <div className="party-hero-emoji">🎉</div>
        <h1 className="party-hero-title">Each Phone</h1>
        <p className="party-hero-sub">Everyone guesses on their own device.</p>
      </div>
      <div className="party-mode-row">
        <button className="party-mode-card" onClick={() => setView('host-setup')}>
          <div className="party-mode-emoji">👑</div>
          <div className="party-mode-title">I'm the Host</div>
          <div className="party-mode-sub">Enter the wine &amp; share the code</div>
          <div className="btn-primary" style={{ marginTop: 12, fontSize: 13, padding: '8px 20px' }}>Create room →</div>
        </button>
        <button className="party-mode-card" onClick={() => setView('player-code')}>
          <div className="party-mode-emoji">📱</div>
          <div className="party-mode-title">I'm a Player</div>
          <div className="party-mode-sub">Enter the code from the host</div>
          <div className="btn-primary" style={{ marginTop: 12, fontSize: 13, padding: '8px 20px' }}>Join →</div>
        </button>
      </div>
    </div>
  );

  // ── HOST SETUP ──────────────────────────────────────────────────────────────
  if (view === 'host-setup') return (
    <div className="party-page">
      <div className="party-card">
        <h2 className="party-card-title">👑 Enter the wine</h2>
        <p className="party-hint">Only you see this — players guess on their own phones!</p>
        <div className="form-group">
          <label>Colour</label>
          <div className="pill-row">
            {COLORS.map(c => <button key={c} className={`pill ${answer.color===c?'active':''}`}
              onClick={() => setAnswer(a => ({ ...a, color: c }))}>{c}</button>)}
          </div>
        </div>
        <div className="form-group">
          <label>Grape(s)</label>
          <GrapeInput value={answer.grape} onChange={v => setAnswer(a => ({ ...a, grape: v }))} listId="mh-grape" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Country</label>
            <input value={answer.country} onChange={e => setAnswer(a => ({ ...a, country: e.target.value, region: '' }))} list="mh-country" />
            <datalist id="mh-country">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="form-group">
            <label>Region</label>
            <input value={answer.region} onChange={e => setAnswer(a => ({ ...a, region: e.target.value }))} list="mh-region" />
            <datalist id="mh-region">{getRegionsForCountry(answer.country).map(r => <option key={r} value={r} />)}</datalist>
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
        {error && <div className="party-error">{error}</div>}
        <button className="btn-primary full" style={{ marginTop: 16 }} onClick={createRoom} disabled={loading}>
          {loading ? 'Creating room…' : 'Create Room →'}
        </button>
        <button className="btn-ghost full" style={{ marginTop: 8 }} onClick={() => setView('mode')}>← Back</button>
      </div>
    </div>
  );

  // ── HOST WAITING ────────────────────────────────────────────────────────────
  if (view === 'host-waiting') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center' }}>
        <p className="party-hint">Tell everyone to go to:</p>
        <div className="party-url-hint">{siteUrl}</div>
        <p className="party-hint" style={{ marginTop: 8 }}>Then enter this code:</p>
        <div className="party-code-display">{roomCode}</div>
        <div className="party-joined-count">
          {players.length === 0 ? 'Waiting for players…' : `${players.length} player${players.length !== 1 ? 's' : ''} joined`}
        </div>
        {players.length > 0 && (
          <div className="party-player-chips">
            {players.map(p => <span key={p.id} className="party-player-chip">{p.name}</span>)}
          </div>
        )}
        <button className="btn-primary" style={{ marginTop: 20, width: '100%' }}
          disabled={players.length === 0} onClick={startGame}>
          Start Game →
        </button>
      </div>
    </div>
  );

  // ── HOST WATCHING ───────────────────────────────────────────────────────────
  if (view === 'host-guessing') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>⏳</div>
        <h2 className="party-card-title">Players are guessing…</h2>
        <div className="party-submitted-count">{submittedCount} / {players.length} answered</div>
        <div className="party-player-chips" style={{ marginTop: 16 }}>
          {players.map(p => (
            <span key={p.id} className={`party-player-chip ${p.submitted ? 'submitted' : ''}`}>
              {p.submitted ? '✅ ' : '⏳ '}{p.name}
            </span>
          ))}
        </div>
        <button className="btn-primary" style={{ marginTop: 24, width: '100%' }} onClick={doReveal} disabled={loading}>
          {loading ? 'Scoring…' : 'Reveal results →'}
        </button>
        {submittedCount < players.length && (
          <p className="party-hint" style={{ marginTop: 8 }}>
            {players.length - submittedCount} still guessing — you can reveal early
          </p>
        )}
      </div>
    </div>
  );

  // ── PLAYER: ENTER CODE ──────────────────────────────────────────────────────
  if (view === 'player-code') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎮</div>
        <h2 className="party-card-title">Enter game code</h2>
        <p className="party-hint">Ask the host for the 4-digit code</p>
        <input className="party-code-input" value={codeInput}
          onChange={e => { setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          placeholder="1234" maxLength={4} autoFocus inputMode="numeric" />
        {error && <div className="party-error">{error}</div>}
        <button className="btn-primary" style={{ marginTop: 16, width: '100%' }}
          disabled={codeInput.length !== 4 || loading} onClick={joinRoom}>
          {loading ? 'Finding room…' : 'Join →'}
        </button>
        <button className="btn-ghost" style={{ marginTop: 8, width: '100%' }} onClick={() => setView('mode')}>← Back</button>
      </div>
    </div>
  );

  // ── PLAYER: ENTER NAME ──────────────────────────────────────────────────────
  if (view === 'player-name') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
        <h2 className="party-card-title">What's your name?</h2>
        <input className="party-name-input" value={myName}
          onChange={e => setMyName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && myName.trim() && joinAsPlayer()}
          placeholder="Your name…" autoFocus />
        {error && <div className="party-error">{error}</div>}
        <button className="btn-primary" style={{ marginTop: 16, width: '100%' }}
          disabled={!myName.trim() || loading} onClick={joinAsPlayer}>
          {loading ? 'Joining…' : 'Join game →'}
        </button>
      </div>
    </div>
  );

  // ── PLAYER: WAITING FOR HOST ────────────────────────────────────────────────
  if (view === 'player-waiting') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
        <div className="party-waiting-pulse">🍷</div>
        <h2 className="party-card-title">You're in, {myName}!</h2>
        <p className="party-hint">Waiting for the host to start the game…</p>
        <div className="party-player-chips" style={{ marginTop: 16 }}>
          {players.map(p => <span key={p.id} className="party-player-chip">{p.name}</span>)}
        </div>
      </div>
    </div>
  );

  // ── PLAYER: GUESSING ────────────────────────────────────────────────────────
  if (view === 'player-guessing') return (
    <div className="party-page">
      <div className="party-card">
        <h2 className="party-card-title">🍷 {myName}'s guesses</h2>
        <p className="party-hint">What do you think is in the glass?</p>
        <div className="form-group">
          <label>Colour</label>
          <div className="pill-row">
            {COLORS.map(c => <button key={c} className={`pill ${myGuess.color===c?'active':''}`}
              onClick={() => setMyGuess(g => ({ ...g, color: c }))}>{c}</button>)}
          </div>
        </div>
        <div className="form-group">
          <label>Old World or New World?</label>
          <div className="pill-row">
            {['Old World', 'New World'].map(w => (
              <button key={w} className={`pill ${myGuess.world===w?'active':''}`}
                onClick={() => setMyGuess(g => ({ ...g, world: w }))}>{w}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Grape(s)</label>
          <GrapeInput value={myGuess.grape} onChange={v => setMyGuess(g => ({ ...g, grape: v }))} listId="mg-grape" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Country</label>
            <input value={myGuess.country} onChange={e => setMyGuess(g => ({ ...g, country: e.target.value, region: '' }))} list="mg-country" />
            <datalist id="mg-country">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="form-group">
            <label>Region</label>
            <input value={myGuess.region} onChange={e => setMyGuess(g => ({ ...g, region: e.target.value }))} list="mg-region" />
            <datalist id="mg-region">{getRegionsForCountry(myGuess.country).map(r => <option key={r} value={r} />)}</datalist>
          </div>
        </div>
        <div className="form-group">
          <label>Vintage — <strong className="party-slider-val">{myGuess.vintage}</strong></label>
          <input type="range" className="party-slider" min={1960} max={CURRENT_YR}
            value={myGuess.vintage} onChange={e => setMyGuess(g => ({ ...g, vintage: parseInt(e.target.value) }))} />
          <div className="party-slider-labels"><span>1960</span><span>{CURRENT_YR}</span></div>
        </div>
        <div className="form-group">
          <label>Price — <strong className="party-slider-val">£{myGuess.price}</strong></label>
          <input type="range" className="party-slider" min={5} max={200} step={5}
            value={myGuess.price} onChange={e => setMyGuess(g => ({ ...g, price: parseInt(e.target.value) }))} />
          <div className="party-slider-labels"><span>£5</span><span>£200+</span></div>
        </div>
        <div className="form-group">
          <label>Your rating — <strong className="party-slider-val">{myGuess.rating}/10</strong></label>
          <input type="range" className="party-slider rating-slider" min={1} max={10} step={0.5}
            value={myGuess.rating} onChange={e => setMyGuess(g => ({ ...g, rating: parseFloat(e.target.value) }))} />
          <div className="party-slider-labels"><span>😬 1</span><span>😍 10</span></div>
        </div>
        <button className="btn-primary full" style={{ marginTop: 16 }} onClick={submitGuess} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit answer →'}
        </button>
      </div>
    </div>
  );

  // ── PLAYER: WAITING FOR REVEAL ──────────────────────────────────────────────
  if (view === 'player-submitted') return (
    <div className="party-page">
      <div className="party-card" style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
        <div className="party-waiting-pulse">✅</div>
        <h2 className="party-card-title">Answer locked in!</h2>
        <p className="party-hint">Waiting for the host to reveal results…</p>
        <div className="party-submitted-count" style={{ marginTop: 12 }}>
          {submittedCount} / {players.length} answered
        </div>
      </div>
    </div>
  );

  // ── REVEAL ──────────────────────────────────────────────────────────────────
  if (view === 'reveal') return (
    <div className="party-page">
      <div className="party-reveal-header">
        <h2 className="party-hero-title">🏆 Results</h2>
        <div className="party-answer-card">
          <div className="party-answer-label">The wine was…</div>
          <div className="party-answer-name">{answer.grape || '?'}</div>
          <div className="party-answer-details">
            {[answer.color, answer.country, answer.region, answer.vintage && `${answer.vintage}`, `£${answer.price}`].filter(Boolean).join(' · ')}
          </div>
          {getWorld(answer.country) && <div className="party-answer-world">{getWorld(answer.country)}</div>}
        </div>
      </div>
      <div className="party-leaderboard">
        {sorted.map((p, i) => (
          <div key={p.id} className={`party-player-row rank-${Math.min(i, 3)}`}>
            <span className="party-medal">{MEDALS[i] || `${i + 1}`}</span>
            <div className="party-player-main">
              <span className="party-player-name">{p.name}</span>
              <div className="party-breakdown">
                {(p.breakdown || []).map(b => (
                  <span key={b.label} className={`party-tag ${b.hit === true ? 'hit' : b.hit ? 'close' : 'miss'}`}>
                    {b.label} {b.pts}/{b.max}{b.extra ? ` ${b.extra}` : ''}
                  </span>
                ))}
              </div>
            </div>
            <div className="party-player-right">
              <span className="party-player-pts">{p.pts ?? 0}<span className="party-pts-max">/{MAX_PTS}</span></span>
              {p.guess?.rating && <span className="party-player-rating">⭐ {p.guess.rating}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="party-actions">
        <button className="btn-primary full" onClick={() => { setView('mode'); setRoomId(null); setPlayers([]); setAnswer({ ...EMPTY_ANSWER }); }}>
          Play again 🍷
        </button>
      </div>
    </div>
  );

  return null;
}
