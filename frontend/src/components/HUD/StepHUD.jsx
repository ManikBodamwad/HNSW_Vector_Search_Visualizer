export default function StepHUD({ steps, status }) {
  const visible = steps.slice(-12);

  return (
    <div className="step-hud">
      <div className="step-hud-header">
        <div className={`step-hud-dot ${status}`} />
        Traversal Log
      </div>
      <div className="step-log">
        {visible.length === 0 && (
          <div style={{ padding: '8px 14px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Waiting for search…
          </div>
        )}
        {visible.map((s, i) => (
          <div key={i} className="step-item">
            <div className={`step-dot ${s.type}`} />
            <span className="step-text">
              <span className={`step-type ${s.type}`}>{s.type}</span>
              {' '}#{s.nodeId}
            </span>
            {s.similarity != null && (
              <span className="step-sim">{s.similarity.toFixed(3)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
