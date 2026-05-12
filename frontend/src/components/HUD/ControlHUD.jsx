import { useState, useRef } from 'react';

const CHIPS = [
  { label: 'machine learning', color: '#3291FF' },
  { label: 'stock market',     color: '#10B981' },
  { label: 'space exploration',color: '#A78BFA' },
  { label: 'gene therapy',     color: '#F59E0B' },
  { label: 'deep learning',    color: '#3291FF' },
  { label: 'Roman history',    color: '#F472B6' },
];

export default function ControlHUD({ algo, setAlgo, speed, setSpeed, status, onSearch }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const isRunning = status === 'running';

  const doSearch = (q) => {
    const text = (q ?? query).trim();
    if (!text || isRunning) return;
    setQuery(text);
    onSearch(text, algo);
  };

  return (
    <div className="hud-bar">

      {/* ── Chips (prominent) ── */}
      <div className="hud-cell hud-cell-chips">
        <span className="hud-label">Try</span>
        <div className="hud-chip-row">
          {CHIPS.map(c => (
            <button key={c.label} className="hud-chip" style={{ '--chip-accent': c.color }}
              onClick={() => doSearch(c.label)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hud-sep" />

      {/* ── Search input ── */}
      <div className="hud-cell">
        <input
          ref={inputRef}
          id="search-input"
          className="hud-search-input"
          type="text"
          placeholder="Or type your own query…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
          autoComplete="off" spellCheck="false"
        />
      </div>

      <div className="hud-sep" />

      {/* ── Algorithm toggle ── */}
      <div className="hud-cell">
        <span className="hud-label hud-label-desktop">Method</span>
        <div className="hud-seg">
          <button className={`hud-seg-btn ${algo === 'hnsw' ? 'active-hnsw' : ''}`}
            onClick={() => setAlgo('hnsw')}>HNSW</button>
          <button className={`hud-seg-btn ${algo === 'brute' ? 'active-brute' : ''}`}
            onClick={() => setAlgo('brute')}>Brute Force</button>
        </div>
      </div>

      <div className="hud-sep" />

      {/* ── Speed ── */}
      <div className="hud-cell hud-cell-speed">
        <span className="hud-label">Speed</span>
        <input type="range" className="hud-slider"
          min={40} max={400} step={20} value={speed}
          onChange={e => setSpeed(Number(e.target.value))} />
      </div>

      <div className="hud-sep" />

      {/* ── Run ── */}
      <div className="hud-cell">
        <button id="run-search-btn"
          className={`hud-run ${algo === 'brute' ? 'brute' : ''}`}
          onClick={() => doSearch()} disabled={isRunning || !query.trim()}>
          {isRunning
            ? <><div className="run-spinner" /> Running…</>
            : algo === 'hnsw' ? '▶ Run HNSW' : '▶ Brute Force'}
        </button>
      </div>

    </div>
  );
}
