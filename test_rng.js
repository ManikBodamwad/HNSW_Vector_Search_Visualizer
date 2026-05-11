function mkRng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getQueryEmbedding(queryText) {
  let hash = 0;
  for (let i = 0; i < queryText.length; i++) {
    hash = ((hash << 5) - hash) + queryText.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  const queryRng = mkRng(hash ^ 0x1A2B3C4D);
  return { q1: queryRng(), q2: queryRng() };
}

console.log("Run 1:", getQueryEmbedding("machine learning"));
console.log("Run 2:", getQueryEmbedding("machine learning"));
console.log("Run 3:", getQueryEmbedding("machine learning "));
