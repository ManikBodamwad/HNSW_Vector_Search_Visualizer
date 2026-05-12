import { useState } from 'react';

const STEPS = [
  {
    step: '01',
    icon: '⬡',
    title: 'The Problem',
    body: 'Finding the most similar vector in a database of millions is O(N) — every item, every time. At scale this costs seconds of latency and thousands in compute.',
  },
  {
    step: '02',
    icon: '⌬',
    title: 'HNSW Index',
    body: 'Hierarchical Navigable Small World builds a layered graph during insert. Upper layers are sparse "highways" for fast coarse navigation. Layer 0 is the dense local neighborhood.',
  },
  {
    step: '03',
    icon: '◎',
    title: 'O(log N) Search',
    body: 'A greedy priority-queue traversal descends the layers. Each hop moves closer in cosine similarity space — evaluating ~5% of nodes while finding the same answer.',
  },
];

const EXAMPLE_QUERIES = [
  { label: 'machine learning', color: '#3291FF' },
  { label: 'stock market',     color: '#10B981' },
  { label: 'space exploration',color: '#A78BFA' },
  { label: 'gene therapy',     color: '#F59E0B' },
];

export default function HeroOverlay({ onDismiss }) {
  const [page, setPage] = useState(0);
  const isLast = page === STEPS.length;

  const advance = () => {
    if (isLast) { onDismiss?.(); return; }
    setPage(p => p + 1);
  };

  const skip = () => onDismiss?.();

  const s = STEPS[page];

  return (
    <div className="intro-overlay" onClick={e => { if (e.target === e.currentTarget) skip(); }}>
      <div className="intro-card v2">

        {/* ── Step indicator ── */}
        <div className="intro-step-bar">
          {STEPS.map((_, i) => (
            <button key={i} className={`intro-step-pip ${i === page ? 'active' : i < page ? 'done' : ''}`} onClick={() => setPage(i)} />
          ))}
          <button className={`intro-step-pip ${isLast ? 'active' : page === STEPS.length ? 'done' : ''}`} onClick={() => setPage(STEPS.length)} />
        </div>

        {/* ── Content ── */}
        <div className="intro-body" key={page}>
          {!isLast ? (
            <>
              <div className="intro-step-eyebrow">
                <span className="intro-step-num">STEP {s.step}</span>
                <span className="intro-step-icon">{s.icon}</span>
              </div>
              <h2 className="intro-step-title">{s.title}</h2>
              <p className="intro-step-body">{s.body}</p>
            </>
          ) : (
            <>
              <div className="intro-step-eyebrow">
                <span className="intro-step-num">READY</span>
              </div>
              <h2 className="intro-step-title">Try a query below</h2>
              <p className="intro-step-body">
                Click a chip to instantly run HNSW search. Watch the traversal log, layer descent, and cosine similarity update live in the 3D graph.
              </p>
              <div className="intro-query-chips">
                {EXAMPLE_QUERIES.map(q => (
                  <button key={q.label} className="intro-query-chip" style={{ '--chip-color': q.color }}
                    onClick={() => onDismiss?.(q.label)}>
                    {q.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="intro-footer v2">
          <div className="intro-author">
            Built by <strong>Manik Bodamwad</strong>
            {' · '}
            <a href="https://www.linkedin.com/in/manik-bodamwad-814b331a6/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
              LinkedIn
            </a>
            {' · '}
            <a href="https://github.com/ManikBodamwad/HNSW_Vector_Search_Visualizer" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
              GitHub
            </a>
          </div>
          <div className="intro-footer-actions">
            {!isLast && (
              <button className="intro-skip" onClick={skip}>Skip →</button>
            )}
            <button id="intro-cta-btn" className="intro-cta" onClick={advance}>
              {isLast ? 'Launch Visualizer →' : 'Next →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
