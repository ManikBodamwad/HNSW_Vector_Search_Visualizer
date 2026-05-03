import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const startRef = useRef(null);
  const from = useRef(0);
  useEffect(() => {
    from.current = val;
    startRef.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    const isFloat = String(target).includes('.');
    const decimals = isFloat ? (String(target).split('.')[1]?.length || 1) : 0;
    function tick(ts) {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = from.current + (target - from.current) * e;
      setVal(isFloat ? parseFloat(cur.toFixed(decimals)) : Math.round(cur));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export default function StatsHUD({ stats, algo }) {
  const computeSaved = useCountUp(stats.computeSaved ?? 0, 900);
  const evaluated    = useCountUp(stats.nodesEvaluated ?? 0, 700);
  const topSim       = useCountUp(stats.topSim ?? 0, 600);

  return (
    <div className="stats-hud">
      <div className="stat-card stat-hero">
        <div className="stat-card-val green">
          {algo === 'brute' ? '0.0' : computeSaved.toFixed(1)}%
        </div>
        <div className="stat-card-label">Compute Saved</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-val accent">{evaluated}</div>
        <div className="stat-card-label">Nodes Evaluated</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-val gold">{topSim.toFixed(4)}</div>
        <div className="stat-card-label">Top Similarity</div>
      </div>
      <div className="stat-card">
        <div className="stat-card-val" style={{ fontSize: '14px', color: algo === 'hnsw' ? '#A855F7' : '#EF4444' }}>
          {algo === 'hnsw' ? 'O(log N)' : 'O(N)'}
        </div>
        <div className="stat-card-label">Complexity</div>
      </div>
    </div>
  );
}
