import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWine } from '../context/WineContext';
import WineColorDot from '../components/WineColorDot';
import { WINE_COUNTRIES, getRegionsForCountry } from '../data/wineRegions';
import GrapeInput from '../components/GrapeInput';

const COLORS = ['All', 'Red', 'White', 'Rosé', 'Orange', 'Sparkling'];

function EditModal({ wine, onSave, onClose }) {
  const [form, setForm] = useState({ ...wine });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-edit-header">
          <h2>Edit wine ✏️</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label>Wine name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Vintage</label>
            <input value={form.vintage} onChange={e => set('vintage', e.target.value)} type="number" />
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
            <input value={form.country || ''} onChange={e => set('country', e.target.value)} list="country-list" />
            <datalist id="country-list">{WINE_COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="form-group">
            <label>Region</label>
            <input value={form.region || ''} onChange={e => set('region', e.target.value)} list="region-list" />
            <datalist id="region-list">{getRegionsForCountry(form.country).map(r => <option key={r} value={r} />)}</datalist>
          </div>
        </div>
        <div className="form-group">
          <label>Grape(s)</label>
          <GrapeInput value={form.grape || ''} onChange={v => set('grape', v)} listId="journal-grape-list" />
        </div>
        <div className="form-group">
          <label>Rating: <strong>{form.rating}/10</strong></label>
          <input type="range" min={1} max={10} step={0.5} value={form.rating}
            onChange={e => set('rating', parseFloat(e.target.value))} className="rating-slider" />
          <div className="slider-labels"><span>1</span><span>5</span><span>10</span></div>
        </div>
        <div className="form-group">
          <label>Nose</label>
          <input value={form.nose || ''} onChange={e => set('nose', e.target.value)} placeholder="Aromas..." />
        </div>
        <div className="form-group">
          <label>Palate</label>
          <input value={form.palate || ''} onChange={e => set('palate', e.target.value)} placeholder="Flavours, texture..." />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} />
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default function Journal() {
  const { wines, deleteWine, updateWine } = useWine();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = wines.filter(w => {
    const matchColor = filter === 'All' || w.color === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || w.name.toLowerCase().includes(q) || (w.region || '').toLowerCase().includes(q) || (w.grape || '').toLowerCase().includes(q);
    return matchColor && matchSearch;
  });

  function handleDelete(id) {
    deleteWine(id);
    setSelected(null);
    setConfirming(false);
  }

  function handleSave(updated) {
    updateWine(updated.id, updated);
    setSelected(updated);
    setEditing(false);
  }

  return (
    <div className="page journal-page">
      <div className="page-header">
        <h1 className="page-title">My Journal</h1>
        <button className="btn-primary" onClick={() => navigate('/tasting/quick')}>+ Log wine</button>
      </div>

      <input
        className="search-input"
        placeholder="🔍  Search wines, regions, grapes…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="filter-row">
        {COLORS.map(c => (
          <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="wine-list">
        {filtered.map(w => (
          <div className="wine-row" key={w.id} onClick={() => { setSelected(w); setEditing(false); }}>
            <WineColorDot color={w.color} />
            <div className="wine-info">
              <div className="wine-name">{w.name} {w.vintage}</div>
              <div className="wine-sub">{w.region}{w.grape ? ` · ${w.grape}` : ''} · {w.color}</div>
              <div className="wine-date">{w.date}</div>
            </div>
            <div className="wine-meta">
              <div className="sip-rating">{w.rating}</div>
              <div className="tasting-badge">{w.tastingType}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">No wines match — try another filter.</div>
        )}
      </div>

      {/* Detail modal */}
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selected.name} {selected.vintage}</h2>
                <div className="modal-sub">
                  {[selected.region, selected.country, selected.grape, selected.color].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="sip-rating large">{selected.rating}<span className="rating-denom">/10</span></div>
            </div>
            {selected.nose && <div className="modal-section"><strong>Nose:</strong> {selected.nose}</div>}
            {selected.palate && <div className="modal-section"><strong>Palate:</strong> {selected.palate}</div>}
            {selected.finish && <div className="modal-section"><strong>Finish:</strong> {selected.finish}</div>}
            {selected.notes && <div className="modal-section"><strong>Notes:</strong> {selected.notes}</div>}
            {confirming ? (
              <div className="delete-confirm">
                <div className="delete-confirm-text">Delete <strong>{selected.name}</strong>? This can't be undone.</div>
                <div className="delete-confirm-actions">
                  <button className="btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
                  <button className="btn-danger" onClick={() => handleDelete(selected.id)}>Yes, delete</button>
                </div>
              </div>
            ) : (
              <div className="modal-footer">
                <button className="btn-danger" onClick={() => setConfirming(true)}>Delete</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
                  <button className="btn-primary" onClick={() => setEditing(true)}>Edit ✏️</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {selected && editing && (
        <EditModal
          wine={selected}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
