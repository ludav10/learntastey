import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWine } from '../context/WineContext';
import WineColorDot from '../components/WineColorDot';

const DAILY_QUESTIONS = [
  {
    q: 'What gives red wine its red colour?',
    options: ['Added food colouring', 'Grape skin pigments', 'The grape juice itself', 'Oak barrel tannins'],
    answer: 1,
    explain: 'Grape skins contain anthocyanins — pigments that bleed into the juice during maceration. No skins, no colour. That\'s why white wine can be made from red grapes!',
  },
  {
    q: 'What is terroir?',
    options: ['A French grape variety', 'A winemaking technique', 'The total natural environment of a wine', 'A type of wine cellar'],
    answer: 2,
    explain: 'Terroir captures everything — soil, climate, topography, even local traditions. It\'s why the same grape tastes wildly different grown in Burgundy vs California.',
  },
  {
    q: 'Tannins are mainly responsible for…',
    options: ['Sweetness in wine', 'The drying, grippy feeling', 'Wine\'s fruity aromas', 'Fizz in sparkling wine'],
    answer: 1,
    explain: 'Tannins are polyphenols from grape skins, seeds and stems. They bind to proteins in your saliva, creating that dry, astringent sensation — and help wine age.',
  },
  {
    q: 'What makes Champagne sparkling?',
    options: ['CO₂ injected at bottling', 'Special sparkling grapes', 'A second fermentation in the bottle', 'Very cold storage'],
    answer: 2,
    explain: 'The Méthode Traditionnelle: a second fermentation happens inside the sealed bottle. Yeast eats added sugar, producing CO₂ that dissolves under pressure. Tiny bubbles!',
  },
  {
    q: 'Which grape makes Barolo?',
    options: ['Sangiovese', 'Barbera', 'Nebbiolo', 'Dolcetto'],
    answer: 2,
    explain: 'Nebbiolo is the king of Piemonte. High tannins, high acidity, notes of tar and roses — Barolo is called the "King of Italian wines" because of it.',
  },
  {
    q: 'Malolactic fermentation makes wine taste…',
    options: ['More tannic', 'Creamier and softer', 'Sweeter', 'More alcoholic'],
    answer: 1,
    explain: 'Sharp malic acid converts to softer lactic acid — like going from green apple to cream. It\'s why oaked Chardonnay tastes buttery while Chablis stays razor-sharp.',
  },
  {
    q: 'What does a "corked" wine smell like?',
    options: ['Cork and wood', 'Wet cardboard or musty basement', 'Vinegar', 'Sulphur and eggs'],
    answer: 1,
    explain: 'TCA (2,4,6-trichloroanisole) is the culprit — a compound from mould interacting with chlorine. It mutes fruit and adds a damp, musty smell. Send it back!',
  },
];

function getDailyQuestion() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_QUESTIONS[day % DAILY_QUESTIONS.length];
}

export default function Home() {
  const navigate = useNavigate();
  const { wines, getLevel } = useWine();
  const { level, next } = getLevel();
  const recent = wines.slice(0, 4);
  const regions = [...new Set(wines.map(w => w.region))];
  const dq = getDailyQuestion();
  const [answered, setAnswered] = useState(null);
  const [flipped, setFlipped] = useState(false);

  function handleAnswer(i) {
    if (answered !== null) return;
    setAnswered(i);
    setTimeout(() => setFlipped(true), 120);
  }

  const isCorrect = answered === dq.answer;

  return (
    <div className="page home-page">

      {/* 3D Flip daily question */}
      <div className={`flip-container ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-card">

          {/* FRONT */}
          <div className="flip-face flip-front">
            <div className="daily-tag">★ TODAY'S QUESTION</div>
            <div className="daily-question">{dq.q}</div>
            <div className="daily-options">
              {dq.options.map((opt, i) => (
                <button
                  key={i}
                  className={`daily-option ${answered !== null ? (i === dq.answer ? 'correct' : i === answered ? 'wrong' : 'faded') : ''}`}
                  onClick={() => handleAnswer(i)}
                >
                  <span className="daily-option-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
            <div className="daily-deco">🍷</div>
          </div>

          {/* BACK */}
          <div className={`flip-face flip-back ${isCorrect ? 'back-correct' : 'back-wrong'}`}>
            <div className="flip-back-icon">{isCorrect ? '🎉' : '🍂'}</div>
            <div className="flip-back-verdict">{isCorrect ? 'Correct!' : 'Not quite…'}</div>
            <div className="flip-back-answer">
              <span className="flip-answer-label">The answer is:</span>
              <strong>{dq.options[dq.answer]}</strong>
            </div>
            <div className="flip-back-explain">{dq.explain}</div>
            <button className="flip-reset" onClick={() => { setFlipped(false); setTimeout(() => setAnswered(null), 400); }}>
              ← Flip back
            </button>
          </div>

        </div>
      </div>

      {/* Tasting cards */}
      <div className="tasting-cards">
        <div className="tasting-card blind" onClick={() => navigate('/tasting/blind')}>
          <div className="tasting-emoji">🦉</div>
          <div className="tasting-title">Blind tasting</div>
          <div className="tasting-desc">Trust your senses. Guess the grape, region, country.</div>
          <div className="tasting-cta">Start →</div>
        </div>
        <div className="tasting-card open" onClick={() => navigate('/tasting/open')}>
          <div className="tasting-emoji">🏷️</div>
          <div className="tasting-title">Open tasting</div>
          <div className="tasting-desc">You know the wine — describe what you taste.</div>
          <div className="tasting-cta">Start →</div>
        </div>
        <div className="tasting-card quick" onClick={() => navigate('/tasting/quick')}>
          <div className="tasting-emoji">⚡</div>
          <div className="tasting-title">Quick log</div>
          <div className="tasting-desc">Rate and save. Fast and simple.</div>
          <div className="tasting-cta">Log it →</div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        <div className="last-sips-card">
          <div className="section-title">Last sips 🍇</div>
          <div className="sips-list">
            {recent.map(w => (
              <div className="sip-row" key={w.id} onClick={() => navigate('/journal')}>
                <WineColorDot color={w.color} />
                <div className="sip-info">
                  <div className="sip-name">{w.name} {w.vintage}</div>
                  <div className="sip-sub">{w.region} · {w.color}</div>
                </div>
                <div className="sip-rating">{w.rating}</div>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="empty-state">No wines yet — start a tasting!</div>
            )}
          </div>
        </div>

        <div className="stats-col">
          <div className="stat-card">
            <div className="stat-number">{wines.length}</div>
            <div className="stat-label">wines logged 🍾</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{regions.length}</div>
            <div className="stat-label">regions explored 🗺️</div>
          </div>
          <div className="level-card">
            <div className="level-tag">YOUR LEVEL</div>
            <div className="level-name">{level.name} 🍷</div>
            {next && <div className="level-next">Next up: {next.name}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
