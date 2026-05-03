import { useRef, useEffect } from 'react';

const TYPE_CONFIG = {
  entry:    { cls: 'entry',  label: 'Entry' },
  hop:      { cls: 'hop',   label: 'Hop  ' },
  evaluate: { cls: 'eval',  label: 'Eval ' },
  result:   { cls: 'result',label: 'Found' },
};

export default function StepLog({ steps }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [steps]);

  if (!steps.length) {
    return (
      <div className="step-log" style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0', fontFamily: 'var(--font-mono)' }}>
        Run a search to see traversal steps…
      </div>
    );
  }

  // Show last 60 steps max for perf
  const visible = steps.slice(-60);

  return (
    <div className="step-log" ref={scrollRef}>
      {visible.map((s, i) => {
        const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.evaluate;
        return (
          <div key={i} className="step-item">
            <div className={`step-dot ${cfg.cls}`} />
            <div className="step-text">
              <span className={`step-type ${cfg.cls}`}>{cfg.label}</span>
              {' '}node {String(s.nodeId).padStart(3, ' ')}
            </div>
            <div className="step-sim">{s.sim?.toFixed(3)}</div>
          </div>
        );
      })}
    </div>
  );
}
