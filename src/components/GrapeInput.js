import { useState } from 'react';
import { WINE_GRAPES } from '../data/wineRegions';

// Grape multi-select chip input.
// value: comma-separated string e.g. "Merlot, Cabernet Sauvignon"
// onChange: called with new comma-separated string
export default function GrapeInput({ value = '', onChange, listId = 'grape-datalist', placeholder = 'Add grape…' }) {
  const [input, setInput] = useState('');

  const grapes = value
    ? value.split(',').map(g => g.trim()).filter(Boolean)
    : [];

  function addGrape(raw) {
    const g = raw.trim();
    if (!g || grapes.map(x => x.toLowerCase()).includes(g.toLowerCase())) {
      setInput('');
      return;
    }
    onChange([...grapes, g].join(', '));
    setInput('');
  }

  function removeGrape(g) {
    onChange(grapes.filter(x => x !== g).join(', '));
  }

  function handleChange(e) {
    const val = e.target.value;
    // Auto-add when user picks an exact match from the datalist
    if (WINE_GRAPES.includes(val)) {
      addGrape(val);
    } else if (val.endsWith(',')) {
      addGrape(val.slice(0, -1));
    } else {
      setInput(val);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGrape(input);
    } else if (e.key === 'Backspace' && !input && grapes.length > 0) {
      removeGrape(grapes[grapes.length - 1]);
    }
  }

  return (
    <div className="grape-input-wrap">
      {grapes.map(g => (
        <span key={g} className="grape-chip">
          {g}
          <button
            type="button"
            className="grape-chip-remove"
            onClick={() => removeGrape(g)}
            aria-label={`Remove ${g}`}>
            ×
          </button>
        </span>
      ))}
      <input
        className="grape-chip-input"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addGrape(input); }}
        list={listId}
        placeholder={grapes.length === 0 ? placeholder : 'Add another…'}
      />
      <datalist id={listId}>
        {WINE_GRAPES.filter(g => !grapes.includes(g)).map(g => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </div>
  );
}
