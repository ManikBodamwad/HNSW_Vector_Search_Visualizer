export default function HeroOverlay({ onDismiss }) {
  // Always show on page load — no localStorage auto-dismiss
  const dismiss = () => {
    onDismiss?.();
  };

  return (
    <div className="intro-overlay" onClick={e => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="intro-card">
        <div className="intro-top">
          <div className="intro-eyebrow">Vector Database Internals · 3D Interactive</div>
          <h1 className="intro-title">
            Vector<em>Lens</em>
          </h1>
          <p className="intro-desc">
            Every RAG pipeline, every AI search, every semantic query runs through
            an Approximate Nearest Neighbor index. This tool visualizes the
            <strong> Hierarchical Navigable Small World (HNSW)</strong> algorithm —
            the same graph structure powering Pinecone, Qdrant, and Weaviate —
            with live cosine similarity computations at every traversal step.
            The graph rotates in 3D. Click a query chip or type your own, then hit <strong>Run HNSW</strong>.
          </p>
        </div>

        <div className="intro-stats">
          <div className="intro-stat">
            <div className="intro-stat-val">300</div>
            <div className="intro-stat-lbl">Nodes</div>
          </div>
          <div className="intro-stat">
            <div className="intro-stat-val">10</div>
            <div className="intro-stat-lbl">Clusters</div>
          </div>
          <div className="intro-stat">
            <div className="intro-stat-val">O(log N)</div>
            <div className="intro-stat-lbl">Complexity</div>
          </div>
          <div className="intro-stat">
            <div className="intro-stat-val">3D</div>
            <div className="intro-stat-lbl">Interactive</div>
          </div>
        </div>

        <div className="intro-footer">
          <div className="intro-author">
            Built by <strong>Manik Bodamwad</strong>
            {' · '}
            <a href="mailto:manikwork24@gmail.com" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
              manikwork24@gmail.com
            </a>
            {' · '}
            <a href="https://www.linkedin.com/in/manik-bodamwad-814b331a6/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
              LinkedIn
            </a>
          </div>
          <button id="intro-cta-btn" className="intro-cta" onClick={dismiss}>
            Launch Visualizer →
          </button>
        </div>
      </div>
    </div>
  );
}
