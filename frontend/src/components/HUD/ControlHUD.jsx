import { useState, useRef } from 'react';

const CHIPS = ['machine learning', 'stock market', 'space exploration', 'gene therapy', 'deep learning', 'Roman history'];

export default function ControlHUD({ algo, setAlgo, speed, setSpeed, status, onSearch }) {
  const [query, setQuery] = useState('machine learning optimization');
  const inputRef = useRef(null);
  const isRunning = status === 'running';

  const doSearch = () => {
    if (!query.trim() || isRunning) return;
    onSearch(query.trim(), algo);
  };

  return (
    <div className="hud-bar">
      {/* Chips */}
      <div className="hud-cell">
        <span className="hud-label">Examples</span>
        <div className="hud-chip-row">
          {CHIPS.map(c => (
            <button key={c} className="hud-chip"
              onClick={() => { setQuery(c); if (!isRunning) onSearch(c, algo); }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="hud-sep" />

      {/* Search input */}
      <div className="hud-cell">
        <input
          ref={inputRef}
          id="search-input"
          className="hud-search-input"
          type="text"
          placeholder="Enter query text…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
          autoComplete="off" spellCheck="false"
        />
      </div>

      <div className="hud-sep" />

      {/* Algorithm */}
      <div className="hud-cell">
        <span className="hud-label">Method</span>
        <div className="hud-seg">
          <button className={`hud-seg-btn ${algo === 'hnsw' ? 'active-hnsw' : ''}`}
            onClick={() => setAlgo('hnsw')}>HNSW</button>
          <button className={`hud-seg-btn ${algo === 'brute' ? 'active-brute' : ''}`}
            onClick={() => setAlgo('brute')}>Brute Force</button>
        </div>
      </div>

      <div className="hud-sep" />

      {/* Speed */}
      <div className="hud-cell">
        <span className="hud-label">Speed</span>
        <input type="range" className="hud-slider"
          min={40} max={400} step={20} value={speed}
          onChange={e => setSpeed(Number(e.target.value))} />
      </div>

      <div className="hud-sep" />

      {/* Run */}
      <div className="hud-cell">
        <button id="run-search-btn"
          className={`hud-run ${algo === 'brute' ? 'brute' : ''}`}
          onClick={doSearch} disabled={isRunning}>
          {isRunning
            ? <><div className="run-spinner" /> Running…</>
            : algo === 'hnsw' ? '▶ Run HNSW' : '▶ Brute Force'}
        </button>
      </div>
    </div>
  );
}
