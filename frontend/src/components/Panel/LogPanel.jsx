export default function LogPanel({ steps, status }) {
  const recent = steps.slice(-16);
  return (
    <div className="panel log-panel">
      <div className="panel-header">
        <div className={`panel-status-pip ${status === 'running' ? 'active' : status === 'done' ? 'complete' : ''}`} />
        <span className="panel-header-title">Traversal Log</span>
      </div>
      <div className="log-body">
        {recent.length === 0 ? (
          <div className="log-empty">Awaiting search…</div>
        ) : (
          recent.map((s, i) => (
            <div key={i} className="log-row">
              <div className={`log-pip ${s.type}`} />
              <span className={`log-type ${s.type}`}>
                {s.type === 'entry' ? 'ENTRY' :
                 s.type === 'hop'   ? 'HOP  ' :
                 s.type === 'result'? 'FOUND' : 'EVAL '}
              </span>
              <span className="log-node">#{s.nodeId}</span>
              {s.similarity != null && (
                <span className="log-sim">{s.similarity.toFixed(3)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
