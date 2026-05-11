import { nodes, edges, getQueryEmbedding, CLUSTERS } from './frontend/src/data/graphData.js';
import { runBruteForce } from './frontend/src/engine/bruteForce.js';
import { runHNSWSearch } from './frontend/src/engine/hnsw.js';

let total = 0;
let match = 0;

CLUSTERS.forEach(c => {
  c.keywords.forEach(kw => {
    total++;
    const { embedding } = getQueryEmbedding(kw);
    const bf = runBruteForce(embedding, nodes, 1);
    const hnsw = runHNSWSearch(embedding, nodes, edges, 1);
    
    if (bf.results[0] === hnsw.results[0]) {
      match++;
    } else {
      console.log(`Mismatch for "${kw}": BF node ${bf.results[0]} (${bf.topSim}), HNSW node ${hnsw.results[0]} (${hnsw.topSim})`);
    }
  });
});

console.log(`Accuracy: ${match}/${total} (${(match/total*100).toFixed(1)}%)`);
