import React, { createContext, useContext, useState, useEffect } from 'react';

const WineContext = createContext();

const SAMPLE_WINES = [
  {
    id: '1',
    name: 'Château Margaux',
    vintage: 2018,
    region: 'Bordeaux',
    country: 'France',
    grape: 'Cabernet Sauvignon',
    color: 'Red',
    rating: 9,
    nose: 'Dark fruits, cedar, violets',
    palate: 'Full-bodied, silky tannins, blackcurrant',
    finish: 'Long, elegant',
    notes: 'Exceptional vintage.',
    tastingType: 'open',
    date: '2026-05-10',
  },
  {
    id: '2',
    name: 'Puligny-Montrachet',
    vintage: 2020,
    region: 'Burgundy',
    country: 'France',
    grape: 'Chardonnay',
    color: 'White',
    rating: 8,
    nose: 'Citrus, white peach, toasted oak',
    palate: 'Medium-bodied, crisp acidity',
    finish: 'Clean and mineral',
    notes: 'Classic Burgundy white.',
    tastingType: 'open',
    date: '2026-05-12',
  },
  {
    id: '3',
    name: 'Barolo Cannubi',
    vintage: 2017,
    region: 'Piemonte',
    country: 'Italy',
    grape: 'Nebbiolo',
    color: 'Red',
    rating: 8,
    nose: 'Tar, roses, dried cherries',
    palate: 'High tannins, bright acidity',
    finish: 'Long and austere',
    notes: 'Classic Barolo.',
    tastingType: 'blind',
    date: '2026-05-15',
  },
  {
    id: '4',
    name: 'Provence Rosé',
    vintage: 2024,
    region: 'Provence',
    country: 'France',
    grape: 'Grenache',
    color: 'Rosé',
    rating: 7,
    nose: 'Strawberry, peach, herbs',
    palate: 'Light, dry, refreshing',
    finish: 'Short and clean',
    notes: 'Perfect summer wine.',
    tastingType: 'quick',
    date: '2026-05-18',
  },
];

const LEVELS = [
  { name: 'Wine Curious', min: 0 },
  { name: 'Curious Sipper', min: 3 },
  { name: 'Wine Nerd', min: 10 },
  { name: 'Grape Detective', min: 20 },
  { name: 'Sommelier in Training', min: 40 },
  { name: 'Wine Master', min: 75 },
];

export function WineProvider({ children }) {
  const [wines, setWines] = useState(() => {
    try {
      const stored = localStorage.getItem('lt_wines');
      return stored ? JSON.parse(stored) : SAMPLE_WINES;
    } catch {
      return SAMPLE_WINES;
    }
  });

  useEffect(() => {
    localStorage.setItem('lt_wines', JSON.stringify(wines));
  }, [wines]);

  function addWine(wine) {
    const newWine = { ...wine, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] };
    setWines(prev => [newWine, ...prev]);
    return newWine;
  }

  function updateWine(id, updates) {
    setWines(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }

  function deleteWine(id) {
    setWines(prev => prev.filter(w => w.id !== id));
  }

  const regions = [...new Set(wines.map(w => w.region))];

  function getLevel() {
    const count = wines.length;
    let level = LEVELS[0];
    let next = LEVELS[1];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (count >= LEVELS[i].min) {
        level = LEVELS[i];
        next = LEVELS[i + 1] || null;
        break;
      }
    }
    return { level, next };
  }

  return (
    <WineContext.Provider value={{ wines, addWine, updateWine, deleteWine, regions, getLevel }}>
      {children}
    </WineContext.Provider>
  );
}

export function useWine() {
  return useContext(WineContext);
}
