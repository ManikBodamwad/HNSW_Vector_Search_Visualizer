import React, { useEffect, useRef, useState } from 'react';

function useAnimatedVal(target, duration = 600) {
  const [val, setVal] = useState(target);
  const rafRef = useRef(null);
  const t0 = useRef(null);
  const from = useRef(target);

  useEffect(() => {
    from.current = val;
    t0.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const isFloat = !Number.isInteger(target);
    const dp = isFloat ? 4 : 0;
    function tick(ts) {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      const e = 1 - (1 - p) ** 3;
      const cur = from.current + (target - from.current) * e;
      setVal(isFloat ? parseFloat(cur.toFixed(dp)) : Math.round(cur));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export default function MathPanel({ stats, algo, mathState }) {
  const dotProd    = useAnimatedVal(mathState?.dotProduct    ?? 0);
  const normQ      = useAnimatedVal(mathState?.normQ         ?? 0);
  const normP      = useAnimatedVal(mathState?.normP         ?? 0);
  const simLive    = useAnimatedVal(mathState?.simLive       ?? 0);
  const evaluated  = useAnimatedVal(stats?.nodesEvaluated   ?? 0, 400);
  const total      = stats?.total ?? 300;
  const pct        = total > 0 ? (evaluated / total * 100) : 0;
  const saved      = algo === 'hnsw' ? Math.max(0, 100 - pct).toFixed(1) : '0.0';

  // HNSW layer: L2→L1→L0, highlight which is current
  const currentLayer = mathState?.currentLayer ?? null; // 2, 1, or 0

  return (
    <div className="panel math-panel">
      <div className="panel-header">
        <div className={`panel-status-pip ${stats?.nodesEvaluated > 0 ? 'complete' : ''}`} />
        <span className="panel-header-title">Math Inspector</span>
      </div>
      <div className="math-body">

        {/* Formula */}
        <div className="formula-block">
          <div className="formula-label">Cosine Similarity</div>
          <div className="formula-text">sim(q,p) = q·p / (‖q‖·‖p‖)</div>
        </div>

        {/* Live scalars */}
        <div className="scalar-grid">
          <div className="scalar-cell">
            <div className="scalar-key">q · p</div>
            <div className="scalar-val highlight">{dotProd.toFixed(4)}</div>
          </div>
          <div className="scalar-cell">
            <div className="scalar-key">‖q‖</div>
            <div className="scalar-val">{normQ.toFixed(4)}</div>
          </div>
          <div className="scalar-cell">
            <div className="scalar-key">‖p‖</div>
            <div className="scalar-val">{normP.toFixed(4)}</div>
          </div>
          <div className="scalar-cell">
            <div className="scalar-key">sim =</div>
            <div className="scalar-val green">{simLive.toFixed(4)}</div>
          </div>
        </div>

        {/* HNSW Layer tracker */}
        <div className="layer-block">
          <div className="layer-label">HNSW Layer</div>
          <div className="layer-track">
            {[2, 1, 0].map((l, idx) => (
              <React.Fragment key={l}>
                <div className={`layer-node ${currentLayer === l ? 'active' : currentLayer !== null && currentLayer < l ? 'done' : ''}`}>
                  L{l}
                </div>
                {idx < 2 && <div className="layer-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Efficiency */}
        <div className="eff-block">
          <div className="eff-header">
            <span className="eff-label">{algo === 'hnsw' ? 'Nodes Evaluated' : 'Brute Scan'}</span>
            <span className="eff-val">{evaluated}/{total}</span>
          </div>
          <div className="eff-bar-track">
            <div
              className={`eff-bar-fill ${algo === 'brute' ? 'brute' : ''}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {algo === 'hnsw' && (
            <div className="eff-saving">↓ {saved}% compute skipped</div>
          )}
        </div>

      </div>
    </div>
  );
}
