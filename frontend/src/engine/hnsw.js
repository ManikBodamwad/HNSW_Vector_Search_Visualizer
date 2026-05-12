import { cosineSim } from './similarity.js';

export class PriorityQueue {
  constructor(compare) {
    this.data = [];
    this.compare = compare;
  }
  push(val) {
    this.data.push(val);
    this.up(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const bottom = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = bottom;
      this.down(0);
    }
    return top;
  }
  peek() { return this.data.length > 0 ? this.data[0] : null; }
  get size() { return this.data.length; }
  up(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i], this.data[p]) < 0) {
        const tmp = this.data[i]; this.data[i] = this.data[p]; this.data[p] = tmp;
        i = p;
      } else break;
    }
  }
  down(i) {
    const len = this.data.length;
    while (true) {
      let left = 2 * i + 1, right = 2 * i + 2, best = i;
      if (left < len && this.compare(this.data[left], this.data[best]) < 0) best = left;
      if (right < len && this.compare(this.data[right], this.data[best]) < 0) best = right;
      if (best !== i) {
        const tmp = this.data[i]; this.data[i] = this.data[best]; this.data[best] = tmp;
        i = best;
      } else break;
    }
  }
}

/**
 * Simulate True HNSW traversal.
 * No cheats. Pure Priority-Queue based multi-layer search.
 */
export function runHNSWSearch(queryEmbedding, graphState, k = 5) {
  const steps = [];
  const seen = new Set();
  
  const { nodes, ep, maxLayer } = graphState;
  const n = nodes.length;
  if (n === 0) return { steps, results: [], nodesEvaluated: 0, nodesSkipped: 0, computeSaved: 0, topSim: 0 };
  
  let currObj = ep;
  let currSim = cosineSim(queryEmbedding, nodes[currObj].embedding);
  seen.add(currObj);
  
  // ── Coarse search down to layer 1 ──
  for (let lc = maxLayer; lc >= 1; lc--) {
    let changed = true;
    steps.push({ nodeId: currObj, sim: parseFloat(currSim.toFixed(4)), type: lc === maxLayer ? 'entry' : 'drop', layer: lc, hop: steps.length });
    while (changed) {
      changed = false;
      const neighbors = nodes[currObj].friends[lc] || [];
      for (const neighbor of neighbors) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        const sim = cosineSim(queryEmbedding, nodes[neighbor].embedding);
        const isHit = sim > currSim;
        steps.push({ nodeId: neighbor, sim: parseFloat(sim.toFixed(4)), type: 'evaluate', layer: lc, hop: steps.length, isHit });
        if (isHit) {
          currSim = sim;
          currObj = neighbor;
          changed = true;
          steps.push({ nodeId: currObj, sim: parseFloat(currSim.toFixed(4)), type: 'hop', layer: lc, hop: steps.length });
        }
      }
    }
  }

  // ── Layer 0: fine search using Priority Queue ──
  const efSearch = Math.max(k, 32); // Size of the dynamic candidate list
  
  // W: min-heap of similarity (worst of the top efSearch candidates is at the top)
  const W = new PriorityQueue((a, b) => a.sim - b.sim);
  // C: max-heap of similarity (best candidate to explore next is at the top)
  const C = new PriorityQueue((a, b) => b.sim - a.sim); 

  W.push({ id: currObj, sim: currSim });
  C.push({ id: currObj, sim: currSim });
  
  steps.push({ nodeId: currObj, sim: parseFloat(currSim.toFixed(4)), type: maxLayer === 0 ? 'entry' : 'drop', layer: 0, hop: steps.length });

  let bestSimFound = currSim;

  while (C.size > 0) {
    const c = C.pop();
    const f = W.peek();
    
    // If the best candidate is worse than the worst element in W, we can stop
    if (c.sim < f.sim) break;
    
    const neighbors = nodes[c.id].friends[0] || [];
    for (const neighbor of neighbors) {
      if (seen.has(neighbor)) continue;
      seen.add(neighbor);
      
      const sim = cosineSim(queryEmbedding, nodes[neighbor].embedding);
      const f_worst = W.peek();
      
      const isHit = W.size < efSearch || sim > f_worst.sim;
      steps.push({ nodeId: neighbor, sim: parseFloat(sim.toFixed(4)), type: 'evaluate', layer: 0, hop: steps.length, isHit });
      
      if (W.size < efSearch || sim > f_worst.sim) {
        C.push({ id: neighbor, sim });
        W.push({ id: neighbor, sim });
        
        if (W.size > efSearch) {
          W.pop(); // Remove the worst candidate
        }
        
        if (sim > bestSimFound) {
          bestSimFound = sim;
          steps.push({ nodeId: neighbor, sim: parseFloat(sim.toFixed(4)), type: 'hop', layer: 0, hop: steps.length });
        }
      }
    }
  }

  // ── Return top K ──
  const results = [];
  while(W.size > 0) results.push(W.pop());
  results.reverse(); // best to worst
  const topK = results.slice(0, k);

  topK.forEach(r => {
    steps.push({ nodeId: r.id, sim: parseFloat(r.sim.toFixed(4)), type: 'result' });
  });

  return {
    steps,
    results: topK.map(r => r.id),
    nodesEvaluated: seen.size,
    nodesSkipped: n - seen.size,
    computeSaved: parseFloat(((1 - seen.size / n) * 100).toFixed(1)),
    topSim: parseFloat(topK[0]?.sim.toFixed(4) || '0'),
  };
}
