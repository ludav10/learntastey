import React, { createContext, useContext, useState } from 'react';

const WineContext = createContext();

const SAMPLE_WINES = [
  {
    id: '1', name: 'Château Margaux', vintage: 2018, region: 'Bordeaux', country: 'France',
    grape: 'Cabernet Sauvignon', color: 'Red', rating: 9,
    nose: 'Dark fruits, cedar, violets', palate: 'Full-bodied, silky tannins, blackcurrant',
    finish: 'Long, elegant', notes: 'Exceptional vintage.', tastingType: 'open', date: '2026-05-10',
  },
  {
    id: '2', name: 'Puligny-Montrachet', vintage: 2020, region: 'Burgundy', country: 'France',
    grape: 'Chardonnay', color: 'White', rating: 8,
    nose: 'Citrus, white peach, toasted oak', palate: 'Medium-bodied, crisp acidity',
    finish: 'Clean and mineral', notes: 'Classic Burgundy white.', tastingType: 'open', date: '2026-05-12',
  },
  {
    id: '3', name: 'Barolo Cannubi', vintage: 2017, region: 'Piemonte', country: 'Italy',
    grape: 'Nebbiolo', color: 'Red', rating: 8,
    nose: 'Tar, roses, dried cherries', palate: 'High tannins, bright acidity',
    finish: 'Long and austere', notes: 'Classic Barolo.', tastingType: 'blind', date: '2026-05-15',
  },
  {
    id: '4', name: 'Provence Rosé', vintage: 2024, region: 'Provence', country: 'France',
    grape: 'Grenache', color: 'Rosé', rating: 7,
    nose: 'Strawberry, peach, herbs', palate: 'Light, dry, refreshing',
    finish: 'Short and clean', notes: 'Perfect summer wine.', tastingType: 'quick', date: '2026-05-18',
  },
];

export const XP_LEVELS = [
  { min: 0,    name: 'Novice',      emoji: '🌱', color: '#4080C0' },
  { min: 100,  name: 'Beginner',    emoji: '📖', color: '#2E9E60' },
  { min: 300,  name: 'Enthusiast',  emoji: '🍷', color: '#C87820' },
  { min: 700,  name: 'Connoisseur', emoji: '🍾', color: '#C87820' },
  { min: 1200, name: 'Expert',      emoji: '🏆', color: '#F0CC7A' },
  { min: 2000, name: 'Master',      emoji: '🎓', color: '#F0CC7A' },
];

// XP_EARN — maximum XP per action (actual amount is performance-based)
export const XP_EARN = {
  learn_quiz:  50,   // 12/15 pass = 20, 13=28, 14=38, 15=50 (perfect)
  big_quiz:    70,   // 10 base + up to 10 per branch (6 branches)
  journal:     21,   // 5 base + points for each field filled + blind bonus
  party:       30,   // (winner's score / max) × 30
};

// Journal XP: based on how much detail you add
export function calcJournalXP(wine) {
  let xp = 5;  // base for logging anything
  if (wine.vintage) xp += 1;
  if (wine.grape)   xp += 2;
  if (wine.country) xp += 1;
  if (wine.region)  xp += 2;
  if (wine.nose   && wine.nose.length   > 2) xp += 3;
  if (wine.palate && wine.palate.length > 2) xp += 3;
  if (wine.notes  && wine.notes.length  > 2) xp += 1;
  if (wine.tastingType === 'blind') xp += 3;
  return xp; // max 21
}

function loadXP() {
  try {
    return {
      total:     parseInt(localStorage.getItem('lt_xp') || '0'),
      breakdown: JSON.parse(localStorage.getItem('lt_xp_bd') || '{"learn":0,"journal":0,"party":0}'),
    };
  } catch { return { total: 0, breakdown: { learn: 0, journal: 0, party: 0 } }; }
}

export function WineProvider({ children }) {
  const [wines, setWines] = useState(() => {
    try {
      const stored = localStorage.getItem('lt_wines');
      return stored ? JSON.parse(stored) : SAMPLE_WINES;
    } catch { return SAMPLE_WINES; }
  });

  const init = loadXP();
  const [xpTotal,     setXpTotal]     = useState(init.total);
  const [xpBreakdown, setXpBreakdown] = useState(init.breakdown);

  function _persistXP(total, breakdown) {
    localStorage.setItem('lt_xp',    total.toString());
    localStorage.setItem('lt_xp_bd', JSON.stringify(breakdown));
  }

  // source: 'learn' | 'journal' | 'party'
  // amount can be negative (XP loss) — total is clamped to 0
  function addXP(amount, source = 'learn') {
    setXpTotal(prev => {
      const next = Math.max(0, prev + amount);
      setXpBreakdown(bd => {
        const srcVal = Math.max(0, (bd[source] || 0) + amount);
        const nextBd = { ...bd, [source]: srcVal };
        _persistXP(next, nextBd);
        return nextBd;
      });
      return next;
    });
  }

  function getLevel() {
    let level = XP_LEVELS[0], next = XP_LEVELS[1];
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (xpTotal >= XP_LEVELS[i].min) {
        level = XP_LEVELS[i];
        next  = XP_LEVELS[i + 1] || null;
        break;
      }
    }
    const pct = next
      ? Math.min(99, Math.round(((xpTotal - level.min) / (next.min - level.min)) * 100))
      : 100;
    return { level, next, xp: xpTotal, pct, breakdown: xpBreakdown };
  }

  function addWine(wine) {
    const newWine = { ...wine, id: Date.now().toString() };
    setWines(prev => {
      const next = [newWine, ...prev];
      localStorage.setItem('lt_wines', JSON.stringify(next));
      return next;
    });
    addXP(calcJournalXP(wine), 'journal');
    return newWine;
  }

  function updateWine(id, updates) {
    setWines(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      localStorage.setItem('lt_wines', JSON.stringify(next));
      return next;
    });
  }

  function deleteWine(id) {
    setWines(prev => {
      const next = prev.filter(w => w.id !== id);
      localStorage.setItem('lt_wines', JSON.stringify(next));
      return next;
    });
  }

  const regions = [...new Set(wines.map(w => w.region))];

  return (
    <WineContext.Provider value={{ wines, addWine, updateWine, deleteWine, regions, getLevel, addXP }}>
      {children}
    </WineContext.Provider>
  );
}

export function useWine() {
  return useContext(WineContext);
}
