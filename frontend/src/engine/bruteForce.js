import { cosineSim } from './similarity.js';

/**
 * Brute-force: evaluate every node sequentially.
 * Same return shape as runHNSWSearch for unified animation pipeline.
 */
export function runBruteForce(queryEmbedding, nodes, k = 5) {
  const steps = [];

  const allSims = nodes.map((node, i) => {
    const sim = parseFloat(cosineSim(queryEmbedding, node.embedding).toFixed(4));
    steps.push({ nodeId: i, sim, type: 'evaluate', layer: 0, hop: 0 });
    if (i % 15 === 0) {
      steps.push({ nodeId: i, sim, type: 'scan', layer: 0, hop: 0 });
    }
    return { id: i, sim };
  });

  const results = allSims.sort((a, b) => b.sim - a.sim).slice(0, k);
  results.forEach(r => steps.push({ nodeId: r.id, sim: r.sim, type: 'result' }));

  return {
    steps,
    results: results.map(r => r.id),
    nodesEvaluated: nodes.length,
    nodesSkipped: 0,
    computeSaved: 0,
    topSim: parseFloat(results[0]?.sim.toFixed(4) || '0'),
  };
}
