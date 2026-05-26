import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWine } from '../context/WineContext';
import { WINE_GRAPES, WINE_COUNTRIES, getRegionsForCountry } from '../data/wineRegions';

// ─── Nose free-pick descriptors ────────────────────────────────────────────────
const NOSE_DESCRIPTORS = [
  'Black cherry','Raspberry','Plum','Cassis','Strawberry','Citrus','Apple','Pear',
  'Peach','Apricot','Tropical','Lychee','Floral','Violet','Rose','Lavender',
  'Herbs','Pepper','Smoke','Earth','Mushroom','Cedar','Vanilla','Toast',
  'Chocolate','Coffee','Tobacco','Leather','Tar','Mineral','Petrol','Butter',
];

// ─── Palate: structured single-select groups ───────────────────────────────────
const PALATE_GROUPS = [
  { key: 'sweetness', label: 'Sweetness',  options: ['Bone dry', 'Dry', 'Off-dry', 'Medium sweet', 'Sweet'] },
  { key: 'body',      label: 'Body',       options: ['Light', 'Medium', 'Full-bodied'] },
  { key: 'tannin',    label: 'Tannin',     options: ['None', 'Soft', 'Medium', 'Firm', 'Grippy'] },
  { key: 'acidity',   label: 'Acidity',    options: ['Low', 'Medium', 'High', 'Very high'] },
  { key: 'alcohol',   label: 'Alcohol',    options: ['Low', 'Medium', 'High'] },
  { key: 'finish',    label: 'Finish',     options: ['Short', 'Medium', 'Long', 'Very long'] },
];

// ─── Palate: free-pick texture / flavour extras ───────────────────────────────
const PALATE_EXTRAS = [
  'Silky','Velvety','Creamy','Chalky','Juicy','Fresh','Warming',
  'Oak influence','Fruit-forward','Earthy','Spicy','Mineral','Complex',
];

// ─── Shared components ─────────────────────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-dot ${i === current ? 'active' : i < current ? 'done' : ''}`} />
      ))}
    </div>
  );
}

function DescriptorGrid({ selected, onToggle, items }) {
  return (
    <div className="descriptor-grid">
      {items.map(d => (
        <button key={d} className={`descriptor ${selected.includes(d) ? 'active' : ''}`} onClick={() => onToggle(d)}>{d}</button>
      ))}
    </div>
  );
}

function PillRow({ options, value, onChange }) {
  return (
    <div className="pill-row">
      {options.map(o => (
        <button key={o} className={`pill ${value === o ? 'active' : ''}`} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

function RatingSlider({ value, onChange }) {
  return (
    <>
      <div className="rating-display">{value}<span className="rating-denom">/10</span></div>
      <input type="range" min={1} max={10} step={0.5} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="rating-slider" />
      <div className="slider-labels"><span>1</span><span>5</span><span>10</span></div>
    </>
  );
}

// Structured palate step — single-select per category + free extras
function PalateStep({ palate, setPalate, extras, toggleExtra }) {
  return (
    <>
      <p className="step-intro">Take a sip. Work through each dimension one at a time.</p>
      {PALATE_GROUPS.map(g => (
        <div className="form-group palate-group" key={g.key}>
          <label>{g.label}</label>
          <PillRow
            options={g.options}
            value={palate[g.key] || ''}
            onChange={v => setPalate(p => ({ ...p, [g.key]: v }))}
          />
        </div>
      ))}
      <div className="form-group" style={{ marginTop: 8 }}>
        <label>Extra notes (multi-select)</label>
        <DescriptorGrid selected={extras} onToggle={toggleExtra} items={PALATE_EXTRAS} />
      </div>
    </>
  );
}

function palateSummary(palate, extras) {
  const parts = Object.entries(palate)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  if (extras.length) parts.push(extras.join(', '));
  return parts.join(' · ');
}

// ─── TastingShell ──────────────────────────────────────────────────────────────
function TastingShell({ title, emoji, steps, step, onBack, notice, children }) {
  return (
    <div className="page tasting-page">
      <div className="tasting-header">
        <button className="btn-ghost small" onClick={onBack}>← Back</button>
        <div className="tasting-title-row">
          <span className="tasting-header-emoji">{emoji}</span>
          <h1 className="tasting-heading">{title}</h1>
        </div>
      </div>
      {notice}
      {steps && (
        <>
          <StepDots total={steps.length} current={step} />
          <div className="step-label">{steps[step]}</div>
        </>
      )}
      <div className="form-card">{children}</div>
    </div>
  );
}

// ─── SavedScreen ───────────────────────────────────────────────────────────────
function SavedScreen({ icon, name, vintage, rating, navigate, onAnother }) {
  return (
    <div className="page tasting-page saved-screen">
      <div className="saved-blob">{icon}</div>
      <h2 className="saved-heading">Saved!</h2>
      <div className="saved-wine-name">{name} {vintage}</div>
      <div className="saved-rating">{rating}<span className="rating-denom">/10</span></div>
      <div className="saved-actions">
        <button className="btn-primary" onClick={() => navigate('/')}>Home</button>
        <button className="btn-ghost" onClick={() => navigate('/journal')}>Journal</button>
        {onAnother && <button className="btn-ghost" onClick={onAnother}>Log another</button>}
      </div>
    </div>
  );
}

// ─── Shared sub-steps ─────────────────────────────────────────────────────────
function WineInfoStep({ form, set }) {
  return (
    <>
      <div className="form-group">
        <label>Wine name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Château Margaux" autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Vintage</label>
          <input value={form.vintage} onChange={e => set('vintage', e.target.value)} placeholder="2020" type="number" />
        </div>
        <div className="form-group">
          <label>Colour</label>
          <select value={form.color} onChange={e => set('color', e.target.value)}>
            {['Red', 'White', 'Rosé', 'Orange', 'Sparkling'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Country</label>
          <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="France" list="country-list" />
          <datalist id="country-list">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="form-group">
          <label>Region</label>
          <input value={form.region} onChange={e => set('region', e.target.value)} placeholder="Bordeaux" list="region-list" />
          <datalist id="region-list">{getRegionsForCountry(form.country).map(r => <option key={r} value={r} />)}</datalist>
        </div>
      </div>
      <div className="form-group">
        <label>Grape</label>
        <input value={form.grape} onChange={e => set('grape', e.target.value)} placeholder="Cabernet Sauvignon" list="grape-list" />
        <datalist id="grape-list">{WINE_GRAPES.map(g => <option key={g} value={g} />)}</datalist>
      </div>
    </>
  );
}

function AppearanceStep({ form, set }) {
  return (
    <>
      <p className="step-intro">Hold the glass against light. What do you observe?</p>
      <div className="form-group">
        <label>Colour</label>
        <PillRow options={['Red', 'White', 'Rosé', 'Orange', 'Sparkling']} value={form.color} onChange={v => set('color', v)} />
      </div>
      <div className="form-group">
        <label>Intensity</label>
        <PillRow options={['Pale', 'Medium', 'Deep', 'Opaque']} value={form.colorIntensity} onChange={v => set('colorIntensity', v)} />
      </div>
      <div className="form-group">
        <label>Clarity</label>
        <PillRow options={['Clear', 'Hazy', 'Cloudy']} value={form.clarity} onChange={v => set('clarity', v)} />
      </div>
    </>
  );
}

// ─── OPEN TASTING ──────────────────────────────────────────────────────────────
export function OpenTasting() {
  const { addWine } = useWine();
  const navigate = useNavigate();
  const STEPS = ['Wine info', 'Appearance', 'Nose', 'Palate', 'Conclusion'];
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', vintage: '', region: '', country: '', grape: '', color: 'Red',
    colorIntensity: '', clarity: '',
    noseSelected: [], noseNotes: '',
    palate: {}, palateExtras: [],
    rating: 7, notes: '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggleNose(val) { setForm(f => ({ ...f, noseSelected: f.noseSelected.includes(val) ? f.noseSelected.filter(x => x !== val) : [...f.noseSelected, val] })); }
  function setPalate(updater) { setForm(f => ({ ...f, palate: updater(f.palate) })); }
  function toggleExtra(val) { setForm(f => ({ ...f, palateExtras: f.palateExtras.includes(val) ? f.palateExtras.filter(x => x !== val) : [...f.palateExtras, val] })); }

  function save() {
    addWine({
      ...form,
      vintage: parseInt(form.vintage) || '',
      nose: [...form.noseSelected, form.noseNotes].filter(Boolean).join(', '),
      palate: palateSummary(form.palate, form.palateExtras),
      tastingType: 'open',
    });
    setSaved(true);
  }

  if (saved) return <SavedScreen icon="🏷️" name={form.name} vintage={form.vintage} rating={form.rating} navigate={navigate} />;

  return (
    <TastingShell title="Open Tasting" emoji="🏷️" steps={STEPS} step={step} onBack={() => step > 0 ? setStep(s => s - 1) : navigate('/')}>
      {step === 0 && <WineInfoStep form={form} set={set} />}
      {step === 1 && <AppearanceStep form={form} set={set} />}
      {step === 2 && (
        <>
          <p className="step-intro">Swirl the glass. What do you smell?</p>
          <DescriptorGrid selected={form.noseSelected} onToggle={toggleNose} items={NOSE_DESCRIPTORS} />
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Other aromas</label>
            <input value={form.noseNotes} onChange={e => set('noseNotes', e.target.value)} placeholder="Anything else?" />
          </div>
        </>
      )}
      {step === 3 && <PalateStep palate={form.palate} setPalate={setPalate} extras={form.palateExtras} toggleExtra={toggleExtra} />}
      {step === 4 && (
        <>
          <div className="tasting-summary">
            <strong>{form.name || '—'}</strong>{form.vintage ? ` ${form.vintage}` : ''}
            {form.noseSelected.length > 0 && <div className="summary-line">Nose: {form.noseSelected.slice(0, 5).join(', ')}</div>}
            {Object.keys(form.palate).length > 0 && <div className="summary-line">Palate: {palateSummary(form.palate, form.palateExtras).slice(0, 80)}</div>}
          </div>
          <div className="form-group">
            <label>Overall rating</label>
            <RatingSlider value={form.rating} onChange={v => set('rating', v)} />
          </div>
          <div className="form-group">
            <label>Final notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Summary, food pairing, would you buy again?" rows={3} />
          </div>
        </>
      )}
      <div className="step-nav">
        {step < STEPS.length - 1
          ? <button className="btn-primary full" onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.name.trim()}>Next →</button>
          : <button className="btn-primary full" onClick={save}>Save tasting 🍷</button>
        }
      </div>
    </TastingShell>
  );
}

// ─── BLIND TASTING ─────────────────────────────────────────────────────────────
export function BlindTasting() {
  const { addWine } = useWine();
  const navigate = useNavigate();
  const STEPS = ['Appearance', 'Nose', 'Palate', 'Your guess', 'Reveal'];
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [form, setForm] = useState({
    color: 'Red', colorIntensity: '', clarity: '',
    noseSelected: [], noseNotes: '',
    palate: {}, palateExtras: [],
    guessGrape: '', guessCountry: '', guessRegion: '', guessVintage: '',
    name: '', vintage: '', region: '', country: '', grape: '',
    rating: 7, notes: '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggleNose(val) { setForm(f => ({ ...f, noseSelected: f.noseSelected.includes(val) ? f.noseSelected.filter(x => x !== val) : [...f.noseSelected, val] })); }
  function setPalate(updater) { setForm(f => ({ ...f, palate: updater(f.palate) })); }
  function toggleExtra(val) { setForm(f => ({ ...f, palateExtras: f.palateExtras.includes(val) ? f.palateExtras.filter(x => x !== val) : [...f.palateExtras, val] })); }

  function save() {
    addWine({
      name: form.name || form.guessGrape || 'Unknown wine',
      vintage: parseInt(form.vintage || form.guessVintage) || '',
      region: form.region || form.guessRegion,
      country: form.country, grape: form.grape || form.guessGrape,
      color: form.color, rating: form.rating,
      nose: [...form.noseSelected, form.noseNotes].filter(Boolean).join(', '),
      palate: palateSummary(form.palate, form.palateExtras),
      notes: form.notes, tastingType: 'blind',
    });
    setSaved(true);
  }

  if (saved) return <SavedScreen icon="🦉" name={form.name || 'Mystery wine'} vintage={form.vintage} rating={form.rating} navigate={navigate} />;

  return (
    <TastingShell
      title="Blind Tasting" emoji="🦉" steps={STEPS} step={step}
      onBack={() => step > 0 ? setStep(s => s - 1) : navigate('/')}
      notice={<div className="blind-notice">🙈 Wine is hidden — trust your senses</div>}
    >
      {step === 0 && <AppearanceStep form={form} set={set} />}
      {step === 1 && (
        <>
          <p className="step-intro">Swirl and smell. What do you pick up?</p>
          <DescriptorGrid selected={form.noseSelected} onToggle={toggleNose} items={NOSE_DESCRIPTORS} />
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Other aromas</label>
            <input value={form.noseNotes} onChange={e => set('noseNotes', e.target.value)} placeholder="Describe what you smell…" />
          </div>
        </>
      )}
      {step === 2 && <PalateStep palate={form.palate} setPalate={setPalate} extras={form.palateExtras} toggleExtra={toggleExtra} />}
      {step === 3 && (
        <>
          <p className="step-intro">What's your guess?</p>
          <div className="form-group">
            <label>Grape variety</label>
            <input value={form.guessGrape} onChange={e => set('guessGrape', e.target.value)} placeholder="e.g. Pinot Noir" list="guess-grape-list" />
            <datalist id="guess-grape-list">{WINE_GRAPES.map(g => <option key={g} value={g} />)}</datalist>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Country</label>
              <input value={form.guessCountry} onChange={e => set('guessCountry', e.target.value)} placeholder="e.g. France" list="guess-country-list" />
              <datalist id="guess-country-list">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Region</label>
              <input value={form.guessRegion} onChange={e => set('guessRegion', e.target.value)} placeholder="e.g. Burgundy" list="guess-region-list" />
              <datalist id="guess-region-list">{getRegionsForCountry(form.guessCountry).map(r => <option key={r} value={r} />)}</datalist>
            </div>
          </div>
          <div className="form-group">
            <label>Vintage</label>
            <input value={form.guessVintage} onChange={e => set('guessVintage', e.target.value)} placeholder="e.g. 2018" type="number" />
          </div>
          <button className="btn-reveal full" onClick={() => { setRevealed(true); setStep(4); }}>
            🔍 Reveal the wine
          </button>
        </>
      )}
      {step === 4 && revealed && (
        <>
          <p className="step-intro">Now enter what the wine actually is!</p>
          <div className="form-group">
            <label>Wine name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Gevrey-Chambertin" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Actual grape</label>
              <input value={form.grape} onChange={e => set('grape', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Actual vintage</label>
              <input value={form.vintage} onChange={e => set('vintage', e.target.value)} type="number" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Country</label>
              <input value={form.country} onChange={e => set('country', e.target.value)} list="country-list" />
              <datalist id="country-list">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Region</label>
              <input value={form.region} onChange={e => set('region', e.target.value)} list="region-list" />
              <datalist id="region-list">{getRegionsForCountry(form.country).map(r => <option key={r} value={r} />)}</datalist>
            </div>
          </div>
          <div className="guess-comparison">
            <div className="guess-row"><span className="guess-label">Your guess</span><span>{form.guessGrape || '—'} · {form.guessCountry || '—'} · {form.guessRegion || '—'} · {form.guessVintage || '—'}</span></div>
            <div className="guess-row actual"><span className="guess-label">Actual</span><span>{form.grape || '—'} · {form.country || '—'} · {form.region || '—'} · {form.vintage || '—'}</span></div>
          </div>
          <div className="form-group">
            <label>Rating</label>
            <RatingSlider value={form.rating} onChange={v => set('rating', v)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How did you do? What surprised you?" rows={3} />
          </div>
        </>
      )}
      {step < 3 && <div className="step-nav"><button className="btn-primary full" onClick={() => setStep(s => s + 1)}>Next →</button></div>}
      {step === 4 && <div className="step-nav"><button className="btn-primary full" onClick={save}>Save tasting 🍷</button></div>}
    </TastingShell>
  );
}

// ─── QUICK LOG ─────────────────────────────────────────────────────────────────
export function QuickLog() {
  const { addWine } = useWine();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', vintage: '', region: '', country: '', grape: '', color: 'Red', rating: 7, notes: '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function save() {
    if (!form.name.trim()) return;
    addWine({ ...form, vintage: parseInt(form.vintage) || '', tastingType: 'quick' });
    setSaved(true);
  }

  if (saved) return (
    <SavedScreen icon="⚡" name={form.name} vintage={form.vintage} rating={form.rating} navigate={navigate}
      onAnother={() => { setForm({ name: '', vintage: '', region: '', country: '', grape: '', color: 'Red', rating: 7, notes: '' }); setSaved(false); }} />
  );

  return (
    <TastingShell title="Quick Log" emoji="⚡" steps={null} step={0} onBack={() => navigate('/')}>
      <WineInfoStep form={form} set={set} />
      <div className="form-group">
        <label>Rating</label>
        <RatingSlider value={form.rating} onChange={v => set('rating', v)} />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Quick thoughts…" rows={3} />
      </div>
      <div className="step-nav">
        <button className="btn-primary full" onClick={save} disabled={!form.name.trim()}>Save wine 🍷</button>
      </div>
    </TastingShell>
  );
}
