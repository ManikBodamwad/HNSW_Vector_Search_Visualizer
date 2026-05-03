import { useState, useRef } from 'react';

const CHIPS = [
  'machine learning',
  'stock market',
  'space exploration',
  'gene therapy',
  'deep learning',
  'Roman history',
];

export default function BottomHUD({ algo, setAlgo, speed, setSpeed, status, onSearch }) {
  const [query, setQuery] = useState('machine learning optimization');
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (!query.trim() || status === 'running') return;
    onSearch(query.trim(), algo);
  };

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch(); };

  const handleChip = q => {
    setQuery(q);
    if (status !== 'running') onSearch(q, algo);
  };

  const isRunning = status === 'running';

  return (
    <>
      {/* Floating chip row above HUD */}
      <div className="chip-float-row">
        {CHIPS.map(c => (
          <button key={c} className="chip" onClick={() => handleChip(c)}>{c}</button>
        ))}
      </div>

      {/* Main HUD bar */}
      <div className="hud-bar">
        {/* Search input */}
        <div className="hud-section">
          <div className="hud-search-wrap">
            <input
              ref={inputRef}
              id="search-input"
              className="hud-search-input"
              type="text"
              placeholder="Query vector…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
            <span className="hud-search-kbd">↵</span>
          </div>
        </div>

        <div className="hud-divider" />

        {/* Algorithm toggle */}
        <div className="hud-section">
          <div className="hud-algo-toggle">
            <button
              className={`hud-algo-btn ${algo === 'hnsw' ? 'active' : ''}`}
              onClick={() => setAlgo('hnsw')}
            >
              HNSW
            </button>
            <button
              className={`hud-algo-btn ${algo === 'brute' ? 'active-brute' : ''}`}
              onClick={() => setAlgo('brute')}
            >
              Brute Force
            </button>
          </div>
        </div>

        <div className="hud-divider" />

        {/* Speed */}
        <div className="hud-section">
          <div className="hud-speed-wrap">
            <span className="hud-speed-label">Speed</span>
            <input
              type="range"
              className="hud-slider"
              min={40}
              max={400}
              step={20}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="hud-divider" />

        {/* Run */}
        <button
          id="run-search-btn"
          className={`hud-run-btn ${algo === 'brute' ? 'brute' : ''}`}
          onClick={handleSearch}
          disabled={isRunning}
        >
          {isRunning
            ? <><div className="btn-spinner" /> Running…</>
            : algo === 'hnsw' ? '▶ Run HNSW' : '▶ Brute Force'}
        </button>
      </div>
    </>
  );
}
