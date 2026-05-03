import { useRef, useState, useCallback } from 'react';
import { nodes, edges } from './data/graphData.js';
import GraphCanvas from './components/Canvas/GraphCanvas.jsx';
import ControlHUD from './components/HUD/ControlHUD.jsx';
import MathPanel from './components/Panel/MathPanel.jsx';
import LogPanel from './components/Panel/LogPanel.jsx';
import HeroOverlay from './components/Intro/HeroOverlay.jsx';
import { useSearch } from './hooks/useSearch.js';

export default function App() {
  const [algo, setAlgo] = useState('hnsw');
  const [speed, setSpeed] = useState(160);
  const [overlayDone, setOverlayDone] = useState(false);

  const searchTrigger = useRef(null);
  const canvasStateRef = useRef(null);

  const { runSearch, handleStepUpdate, handleDone, status, setStatus, stats, stepLog, mathState } =
    useSearch(searchTrigger, canvasStateRef);

  const handleSearch = useCallback((query, algoOverride) => {
    searchTrigger.current?.cancel?.();
    setStatus('running');
    setTimeout(() => { runSearch(query, algoOverride ?? algo, speed); }, 60);
  }, [runSearch, algo, speed, setStatus]);

  const handleOverlayDismiss = useCallback(() => {
    setOverlayDone(true);
    // No auto-run — user presses Run button
  }, []);

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo-mark">VL</div>
          <span className="header-title">VectorLens</span>
        </div>
        <div className="header-sep" />
        <span className="header-tagline">HNSW · Approximate Nearest Neighbor · O(log N)</span>
        <div className="header-spacer" />
        <div className="header-author">
          <span>Built by</span>
          <span className="header-author-name">Manik Bodamwad</span>
          <a href="https://www.linkedin.com/in/manik-bodamwad-814b331a6/"
            target="_blank" rel="noopener noreferrer"
            className="header-link" title="LinkedIn">in</a>
          <a href="mailto:manikwork24@gmail.com"
            className="header-link" title="manikwork24@gmail.com">@</a>
          <a href="https://github.com/ManikBodamwad/HNSW_Vector_Search_Visualizer"
            target="_blank" rel="noopener noreferrer"
            className="header-link" title="GitHub">gh</a>
        </div>
      </header>

      {/* Canvas + overlays */}
      <div className="app-body">
        <div className="canvas-area">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            searchTrigger={searchTrigger}
            onStepUpdate={handleStepUpdate}
            onDone={handleDone}
          />
        </div>

        {overlayDone && <LogPanel steps={stepLog} status={status} />}
        {overlayDone && <MathPanel stats={stats} algo={algo} mathState={mathState} />}
        {overlayDone && (
          <ControlHUD
            algo={algo} setAlgo={setAlgo}
            speed={speed} setSpeed={setSpeed}
            status={status} onSearch={handleSearch}
          />
        )}

        {overlayDone && (
          <div className="canvas-badge-left">
            <div className="badge-pip" />
            {nodes.length} nodes · {edges.length} edges · 3D
          </div>
        )}

        {overlayDone && (
          <div className="canvas-badge-right">
            <span>Built by</span>
            <a href="https://www.linkedin.com/in/manik-bodamwad-814b331a6/"
              target="_blank" rel="noopener noreferrer" className="badge-link">
              Manik Bodamwad
            </a>
            <span>·</span>
            <a href="mailto:manikwork24@gmail.com" className="badge-link">Gmail</a>
            <span>·</span>
            <a href="https://github.com/ManikBodamwad/HNSW_Vector_Search_Visualizer"
              target="_blank" rel="noopener noreferrer" className="badge-link">GitHub</a>
          </div>
        )}
      </div>

      {!overlayDone && <HeroOverlay onDismiss={handleOverlayDismiss} />}
    </div>
  );
}
