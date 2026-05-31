import { useWine, XP_LEVELS } from '../context/WineContext';

export default function Level() {
  const { getLevel, wines } = useWine();
  const { level, next, xp, pct, breakdown } = getLevel();

  const learnNodes  = Math.floor((breakdown.learn  || 0) / 25);  // avg ~25 XP per quiz
  const partyGames  = Math.floor((breakdown.party   || 0) / 15); // avg ~15 XP per game
  const xpToNext    = next ? next.min - xp : 0;

  return (
    <div className="level-page">

      {/* ── Hero badge ── */}
      <div className="level-hero">
        <div className="level-hero-emoji">{level.emoji}</div>
        <h1 className="level-hero-name">{level.name}</h1>
        <div className="level-xp-total">{xp.toLocaleString()} XP</div>

        {/* Progress bar */}
        <div className="level-bar-wrap">
          <div className="level-bar-track">
            <div className="level-bar-fill" style={{ width: `${pct}%`, background: level.color }} />
          </div>
          <div className="level-bar-labels">
            <span>{level.name}</span>
            {next && <span>{next.name} →</span>}
          </div>
        </div>

        {next && (
          <p className="level-next-hint">{xpToNext} XP to reach <strong>{next.emoji} {next.name}</strong></p>
        )}
        {!next && (
          <p className="level-next-hint">🎉 Maximum level reached — you're a true Master!</p>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="level-stats-row">
        <div className="level-stat">
          <div className="level-stat-val">{wines.length}</div>
          <div className="level-stat-label">Wines tasted</div>
        </div>
        <div className="level-stat">
          <div className="level-stat-val">{learnNodes}</div>
          <div className="level-stat-label">Quizzes passed</div>
        </div>
        <div className="level-stat">
          <div className="level-stat-val">{partyGames}</div>
          <div className="level-stat-label">Games</div>
        </div>
      </div>

      {/* ── XP Breakdown ── */}
      <div className="level-section">
        <h2 className="level-section-title">XP Breakdown</h2>
        <div className="level-xp-bars">
          <XPBar label="🎓 Learning" value={breakdown.learn || 0} total={xp} color="#4080C0" />
          <XPBar label="📓 Journal"  value={breakdown.journal || 0} total={xp} color="#2E9E60" />
          <XPBar label="🎉 Games"    value={breakdown.party || 0}   total={xp} color="#C87820" />
        </div>
      </div>

      {/* ── How to earn ── */}
      <div className="level-section">
        <h2 className="level-section-title">How to earn XP</h2>
        <div className="level-earn-list">
          <EarnRow action="🎓 Pass a learn quiz"         range="20–50 XP" note="Perfect score = 50 XP" />
          <EarnRow action="📊 Complete the Big Quiz"     range="10–70 XP" note="Based on each branch score" />
          <EarnRow action="📓 Log a wine to your journal" range="5–21 XP" note="More detail = more XP" />
          <EarnRow action="🎉 Play a tasting party game"  range="5–30 XP" note="Winner's score drives XP" />
        </div>
      </div>

      {/* ── All levels ── */}
      <div className="level-section">
        <h2 className="level-section-title">All levels</h2>
        <div className="level-all-list">
          {XP_LEVELS.map((l, i) => {
            const reached = xp >= l.min;
            const current = l.name === level.name;
            return (
              <div key={l.name} className={`level-all-row ${reached ? 'reached' : ''} ${current ? 'current' : ''}`}>
                <span className="level-all-emoji">{l.emoji}</span>
                <span className="level-all-name">{l.name}</span>
                <span className="level-all-min">{l.min === 0 ? 'Start' : `${l.min} XP`}</span>
                {current && <span className="level-all-you">← You</span>}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function EarnRow({ action, range, note }) {
  return (
    <div className="level-earn-row">
      <div className="level-earn-action">
        {action}
        <div className="level-earn-note">{note}</div>
      </div>
      <span className="level-earn-pts">{range}</span>
    </div>
  );
}

function XPBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="xp-bar-row">
      <div className="xp-bar-label">{label}</div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="xp-bar-val">{value} XP</div>
    </div>
  );
}
