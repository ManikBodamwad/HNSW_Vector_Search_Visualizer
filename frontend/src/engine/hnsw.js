import { cosineSim } from './similarity.js';

/**
 * Simulate HNSW traversal.
 * Returns steps array + summary stats.
 */
export function runHNSWSearch(queryEmbedding, nodes, k = 5) {
  const steps = [];
  const seen = new Set();
  const n = nodes.length;

  // ── Layer 2: coarse entry (pick random start far from query cluster) ──
  const entryId = Math.floor(Math.random() * n);
  const entrySim = parseFloat(cosineSim(queryEmbedding, nodes[entryId].embedding).toFixed(4));
  steps.push({ nodeId: entryId, sim: entrySim, type: 'entry', layer: 2, hop: 0 });
  seen.add(entryId);
  let current = { id: entryId, sim: entrySim };

  // ── Greedy traversal ──
  const layerConfig = [
    { layer: 2, hops: 2, efSearch: 6 },
    { layer: 1, hops: 2, efSearch: 10 },
    { layer: 0, hops: 3, efSearch: 16 },
  ];

  for (const { layer, hops, efSearch } of layerConfig) {
    for (let hop = 0; hop < hops; hop++) {
      // Sample candidate neighbors (simulates actual graph neighbor evaluation)
      const unseen = [];
      for (let i = 0; i < n; i++) { if (!seen.has(i)) unseen.push(i); }
      if (unseen.length === 0) break;

      // Shuffle + take efSearch candidates
      for (let i = unseen.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
      }
      const candidates = unseen.slice(0, efSearch);

      let bestSim = current.sim;
      let bestId = null;

      for (const idx of candidates) {
        const sim = parseFloat(cosineSim(queryEmbedding, nodes[idx].embedding).toFixed(4));
        seen.add(idx);
        const isHit = sim > bestSim;
        steps.push({ nodeId: idx, sim, type: 'evaluate', layer, hop, isHit });
        if (isHit) { bestSim = sim; bestId = idx; }
      }

      if (bestId !== null) {
        steps.push({ nodeId: bestId, sim: bestSim, type: 'hop', layer, hop });
        current = { id: bestId, sim: bestSim };
      } else {
        break; // local optimum
      }
    }
  }

  // ── Final: pick true top-K from all evaluated ──
  const ranked = [...seen]
    .map(id => ({ id, sim: cosineSim(queryEmbedding, nodes[id].embedding) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);

  ranked.forEach(r => {
    steps.push({ nodeId: r.id, sim: parseFloat(r.sim.toFixed(4)), type: 'result' });
  });

  return {
    steps,
    results: ranked.map(r => r.id),
    nodesEvaluated: seen.size,
    nodesSkipped: n - seen.size,
    computeSaved: parseFloat(((1 - seen.size / n) * 100).toFixed(1)),
    topSim: parseFloat(ranked[0]?.sim.toFixed(4) || '0'),
  };
}
