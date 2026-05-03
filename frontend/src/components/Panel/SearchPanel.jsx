import { useState, useRef } from 'react';
import MathPanel from './MathPanel.jsx';
import StepLog from './StepLog.jsx';
import AlgoToggle from '../UI/AlgoToggle.jsx';
import SpeedSlider from '../UI/SpeedSlider.jsx';

const CHIPS = [
  'machine learning optimization',
  'stock market portfolio',
  'space exploration Mars',
  'gene therapy treatment',
  'deep learning vision',
  'ancient Roman history',
];

export default function SearchPanel({ onSearch, algo, setAlgo, speed, setSpeed, stats, steps, status }) {
  const [query, setQuery] = useState('machine learning optimization');
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (!query.trim() || status === 'running') return;
    onSearch(query.trim(), algo);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleChip = q => {
    setQuery(q);
    if (status !== 'running') onSearch(q, algo);
  };

  return (
    <div className="left-panel">
      <div className="panel-scroll">

        {/* Search */}
        <div className="search-section">
          <div className="search-label">Query Vector</div>
          <div className="search-input-wrap">
            <input
              ref={inputRef}
              id="search-input"
              className="search-input"
              type="text"
              placeholder="Type anything… try 'machine learning'"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
            <span className="search-kbd">↵</span>
          </div>

          <div className="chip-row">
            {CHIPS.map(c => (
              <button key={c} className="chip" onClick={() => handleChip(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="panel-divider" />

        {/* Algorithm toggle */}
        <div className="algo-section">
          <div className="section-title">Algorithm</div>
          <AlgoToggle algo={algo} setAlgo={setAlgo} />
        </div>

        {/* Speed */}
        <div className="speed-section">
          <SpeedSlider speed={speed} setSpeed={setSpeed} />
        </div>

        <div className="panel-divider" />

        {/* Run button */}
        <button
          id="run-search-btn"
          className={`run-btn ${algo === 'brute' ? 'brute' : ''}`}
          onClick={handleSearch}
          disabled={status === 'running'}
        >
          {status === 'running' ? '⟳ Running…' : algo === 'hnsw' ? '▶  Run HNSW Search' : '▶  Run Brute Force'}
        </button>

        <div className="panel-divider" />

        {/* Math panel */}
        <div className="math-section">
          <div className="section-title">Live Statistics</div>
          <MathPanel stats={stats} algo={algo} />
        </div>

        <div className="panel-divider" />

        {/* Step log */}
        <div className="step-section">
          <div className="section-title">Traversal Log</div>
          <StepLog steps={steps} />
        </div>

      </div>

      {/* Status bar */}
      <div className="status-bar">
        <div className={`status-indicator ${status}`} />
        <span className="status-text">
          {status === 'running' ? 'Traversing graph…'
            : status === 'done' ? `Search complete · ${stats.nodesEvaluated}/${stats.total} evaluated`
            : 'Ready — enter a query or click a chip'}
        </span>
      </div>
    </div>
  );
}
