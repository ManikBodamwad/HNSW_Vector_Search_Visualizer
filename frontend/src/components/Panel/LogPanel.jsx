import { nodes } from '../../data/graphData.js';

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
                 s.type === 'drop'  ? 'L-DRP' :
                 s.type === 'hop'   ? 'HOP  ' :
                 s.type === 'result'? 'FOUND' : 
                 s.type === 'scan'  ? 'SCAN ' : 'EVAL '}
              </span>
              <span className="log-node" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                #{s.nodeId} {s.type === 'result' && nodes[s.nodeId] ? `- ${nodes[s.nodeId].clusterName}` : ''}
              </span>
              {s.sim != null && (
                <span className="log-sim">{s.sim.toFixed(3)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
