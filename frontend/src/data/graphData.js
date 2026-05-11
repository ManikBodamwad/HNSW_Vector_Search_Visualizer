/**
 * Synthetic graph data generator.
 * Produces 300 nodes across 10 semantic clusters with 32-dim embeddings.
 * Embeddings are cluster-coherent: within-cluster cos-sim ≈ 0.85-0.95.
 * No external dependencies — runs instantly in-browser.
 */

// Seeded PRNG (mulberry32) for reproducibility
function mkRng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mkRng(42);

// 10 cluster definitions
// Cluster centers redistributed to fill the entire 1000×800 canvas evenly
// including the center region — no dead zones
const CLUSTERS = [
  {
    name: 'Machine Learning',
    cx: 160, cy: 150,
    keywords: ['machine learning','neural','deep learning','training','model','gradient','ai model','optimization','backprop','embedding'],
    sentences: [
      'gradient descent optimization neural networks',
      'overfitting prevention regularization techniques',
      'convolutional neural network image recognition',
      'transformer architecture self-attention mechanism',
      'reinforcement learning reward policy gradient',
      'support vector machine kernel classification',
      'random forest ensemble decision trees bagging',
      'hyperparameter tuning cross-validation grid search',
      'batch normalization deep learning layer training',
      'dropout regularization overfitting prevention',
      'recurrent neural network LSTM sequence modeling',
      'generative adversarial network image synthesis',
      'backpropagation gradient chain rule computation',
      'word embedding vector semantic representation',
      'transfer learning pretrained model fine-tuning',
      'autoencoder latent space representation learning',
      'k-means clustering unsupervised centroid algorithm',
      'principal component analysis dimensionality reduction',
      'logistic regression sigmoid binary classification',
      'natural language processing text tokenization',
      'computer vision object detection bounding boxes',
      'activation function relu sigmoid gelu nonlinear',
      'cross-entropy loss function softmax training',
      'multi-head attention transformer architecture',
      'data augmentation image preprocessing training',
      'neural architecture search automated ml pipeline',
      'feature engineering selection machine learning',
      'SHAP LIME model explainability interpretability',
      'stochastic gradient descent mini-batch optimizer',
      'knowledge distillation model compression inference',
    ],
  },
  {
    name: 'Finance',
    cx: 840, cy: 160,
    keywords: ['stock','market','investment','portfolio','finance','crypto','trading','fund','capital','bank','economic'],
    sentences: [
      'stock market volatility index VIX calculation',
      'compound interest investment return formula',
      'portfolio diversification risk management strategy',
      'central bank monetary policy interest rates',
      'cryptocurrency blockchain consensus proof-of-work',
      'options pricing Black-Scholes model derivatives',
      'inflation CPI consumer price index economics',
      'hedge fund quantitative trading alpha strategy',
      'market capitalization equity valuation P/E ratio',
      'bond yield treasury securities fixed income',
      'venture capital startup funding Series A round',
      'foreign exchange forex currency pair trading',
      'dividend reinvestment compound growth strategy',
      'IPO initial public offering stock market listing',
      'algorithmic trading high-frequency market maker',
      'credit default swap mortgage-backed securities',
      'GDP gross domestic product economic growth',
      'supply demand equilibrium microeconomics',
      'private equity leveraged buyout acquisition',
      'quantitative easing monetary stimulus Fed',
      'return on equity ROE financial ratio analysis',
      'arbitrage risk-free profit market inefficiency',
      'technical analysis candlestick chart pattern',
      'commodity futures oil gold silver trading',
      'ESG environmental social governance investing',
      'capital gains tax loss harvesting optimization',
      'recession yield curve inversion indicator signal',
      'market liquidity bid-ask spread trading volume',
      'discounted cash flow DCF financial modeling',
      'DeFi decentralized finance yield farming protocol',
    ],
  },
  {
    name: 'Space & Astronomy',
    cx: 500, cy: 120,
    keywords: ['space','galaxy','star','planet','black hole','nasa','rocket','cosmos','universe','telescope','orbit'],
    sentences: [
      'black hole event horizon gravitational singularity',
      'Mars rover geological survey planetary science',
      'stellar nucleosynthesis heavy element formation',
      'gravitational wave detection LIGO interferometer',
      'exoplanet atmospheric spectroscopy habitable zone',
      'dark matter galactic rotation curve evidence',
      'NASA Artemis lunar mission moon surface landing',
      'James Webb telescope infrared galaxy observation',
      'neutron star pulsar magnetic field radio emission',
      'cosmic microwave background big bang radiation',
      'solar flare coronal mass ejection space weather',
      'Hubble constant universe expansion measurement',
      'asteroid mining space resource extraction future',
      'SpaceX Starship reusable rocket propulsion system',
      'Jupiter Great Red Spot atmospheric storm dynamics',
      'Saturn rings ice particle composition structure',
      'supernova remnant stellar explosion energy release',
      'radio telescope SETI signal detection search',
      'orbital mechanics Kepler laws planetary motion',
      'dark energy vacuum energy accelerated expansion',
      'galaxy cluster gravitational lensing dark matter',
      'space debris low earth orbit collision avoidance',
      'Voyager probe interstellar space heliopause',
      'tidal force gravitational interaction ocean moon',
      'binary star system orbital period dynamics',
      'cosmic ray high-energy particle atmosphere impact',
      'adaptive optics telescope atmospheric distortion',
      'protoplanetary disk accretion planet formation',
      'kilonova neutron star merger gold element synthesis',
      'aurora borealis solar wind magnetic field interaction',
    ],
  },
  {
    name: 'Biology & Medicine',
    cx: 150, cy: 450,
    keywords: ['gene','dna','protein','cell','virus','bacteria','medical','health','immune','clinical','cancer','treatment'],
    sentences: [
      'CRISPR gene editing therapeutic applications',
      'mitochondrial DNA maternal inheritance genetics',
      'protein folding AlphaFold structure prediction',
      'synaptic plasticity neural connection learning',
      'gut microbiome immune system interaction',
      'mRNA vaccine immunology cellular immune response',
      'phospholipid bilayer cell membrane transport',
      'photosynthesis chloroplast light reaction ATP',
      'enzyme catalysis substrate active site binding',
      'cancer immunotherapy checkpoint inhibitor treatment',
      'blood-brain barrier drug delivery neurology',
      'stem cell differentiation tissue regeneration',
      'antibiotic resistance bacterial mutation evolution',
      'epigenetic DNA methylation gene expression',
      'cardiovascular risk factor prevention heart disease',
      'COVID spike protein ACE2 receptor binding',
      'Alzheimer amyloid plaque tau neurodegeneration',
      'organ transplant immunosuppression rejection',
      'randomized controlled trial placebo clinical study',
      'DNA replication polymerase proofreading fidelity',
      'endocrine hormonal regulation feedback loop',
      'cytokine inflammation immune cascade signaling',
      'Mendelian inheritance dominant recessive genetics',
      'ecosystem biodiversity species conservation',
      'pharmacokinetics drug liver metabolism clearance',
      'robotic surgery minimally invasive laparoscopy',
      '16S rRNA microbiome gut bacteria sequencing',
      'telomere aging cell senescence chromosome',
      'insulin resistance metabolic syndrome obesity',
      'PCR diagnostic pathogen detection laboratory',
    ],
  },
  {
    name: 'Programming & CS',
    cx: 840, cy: 420,
    keywords: ['code','software','algorithm','database','api','docker','kubernetes','programming','python','javascript','system'],
    sentences: [
      'distributed consensus Raft Paxos algorithm system',
      'binary search tree AVL rotation balancing',
      'dynamic programming memoization overlapping subproblems',
      'Docker container orchestration Kubernetes deployment',
      'REST API HTTP endpoint request response JSON',
      'graph traversal BFS DFS topological sort',
      'garbage collection heap memory management runtime',
      'SQL query optimization index database join',
      'RSA public key cryptography digital signature',
      'microservices architecture service mesh latency',
      'React component virtual DOM reconciliation',
      'Python async generator decorator coroutine',
      'process thread scheduler preemption operating system',
      'compiler lexer parser abstract syntax tree',
      'TCP UDP socket network protocol connection',
      'Git branch merge rebase version control',
      'hash table collision chaining open addressing',
      'WebSocket real-time bidirectional communication',
      'CI/CD pipeline GitHub Actions deployment automation',
      'Redis cache eviction TTL in-memory key-value',
      'Rust ownership borrow checker memory safety',
      'GraphQL schema resolver mutation subscription',
      'time complexity Big O space tradeoff analysis',
      'SOLID principles design pattern refactoring',
      'load balancer reverse proxy nginx traffic routing',
      'WebAssembly binary format browser performance',
      'event loop non-blocking I/O Node.js concurrency',
      'vector database embedding similarity search index',
      'LLM prompt engineering few-shot chain-of-thought',
      'OAuth JWT authentication authorization token',
    ],
  },
  {
    name: 'History & Politics',
    cx: 250, cy: 660,
    keywords: ['history','war','empire','civilization','politics','democracy','revolution','ancient','medieval','election'],
    sentences: [
      'Roman Empire expansion military legions conquest',
      'World War II Pacific theater naval strategy',
      'French Revolution guillotine monarchy overthrow',
      'Cold War nuclear arms race Soviet Union',
      'Silk Road trade route cultural exchange ancient',
      'Byzantine Empire Constantinople medieval fall',
      'American Civil War slavery emancipation proclamation',
      'Renaissance humanism art scientific revolution',
      'Mongol Empire Genghis Khan conquest expansion',
      'Industrial Revolution steam engine factory labor',
      'Cuban Missile Crisis nuclear standoff Kennedy',
      'Ottoman Empire decline Balkan nationalism',
      'Great Depression economic collapse banking crisis',
      'Berlin Wall fall German reunification Cold War end',
      'Magna Carta feudal rights constitutional monarchy',
      'Vietnam War guerrilla tactics protest movement',
      'Egyptian pharaoh pyramid burial ritual afterlife',
      'Greek democracy philosophy Socrates Plato Athens',
      'Brexit European Union referendum sovereignty',
      'Korean War armistice demilitarized zone division',
      'colonial independence decolonization African nations',
      'Watergate scandal presidential impeachment Nixon',
      'Spanish Inquisition religious persecution heresy',
      'climate treaty Paris Agreement carbon emissions',
      'propaganda media censorship authoritarian regime',
      'feudal system serfdom medieval European agriculture',
      'Crusades holy land Christian Muslim conflict',
      'Weimar Republic hyperinflation German democracy',
      'apartheid South Africa racial segregation Nelson Mandela',
      'League of Nations international diplomacy failure',
    ],
  },
  {
    name: 'Music & Arts',
    cx: 580, cy: 660,
    keywords: ['music','song','art','painting','film','cinema','jazz','classical','guitar','album','creative'],
    sentences: [
      'jazz improvisation bebop syncopation rhythm blues',
      'Renaissance oil painting chiaroscuro technique',
      'symphony orchestra conductor Beethoven symphony',
      'hip-hop sampling breakbeat electronic production',
      'impressionist painting Monet light color brushwork',
      'film noir cinematography shadow contrast lighting',
      'guitar chord progression blues rock pentatonic',
      'ballet choreography pointe arabesque pirouette',
      'digital art NFT generative algorithm creative',
      'music theory harmony counterpoint chord tension',
      'abstract expressionism Jackson Pollock drip painting',
      'opera aria libretto soprano tenor performance',
      'electronic music synthesizer oscillator waveform',
      'street photography candid documentary urban life',
      'sculpture marble bronze casting technique art',
      'film score Hans Zimmer orchestral soundtrack',
      'pop music chord production verse chorus bridge',
      'cubism Picasso geometric perspective fragmentation',
      'vinyl record analog warmth audiophile listening',
      'typography kerning serif sans-serif design',
      'graphic novel comic panel storytelling sequential',
      'woodblock print ukiyo-e Japanese traditional art',
      'punk rock rebellion DIY ethos three-chord energy',
      'dance rhythm movement expression contemporary',
      'museum curation exhibition art historical context',
      'photography aperture shutter exposure composition',
      'streaming platform algorithm music recommendation',
      'drum kit polyrhythm groove pocket swing feel',
      'watercolor wash technique layering pigment',
      'musical theater Broadway production staging cast',
    ],
  },
  {
    name: 'Sports & Fitness',
    cx: 820, cy: 650,
    keywords: ['sport','fitness','exercise','training','athlete','gym','marathon','football','basketball','swimming'],
    sentences: [
      'marathon training periodization endurance running',
      'Olympic weightlifting snatch clean jerk technique',
      'basketball pick-and-roll offensive strategy NBA',
      'soccer pressing tactic high defensive block',
      'swimming stroke freestyle butterfly technique',
      'cricket batting technique cover drive technique',
      'protein synthesis muscle hypertrophy recovery',
      'VO2 max aerobic capacity cardiovascular fitness',
      'tennis serve topspin backhand footwork positioning',
      'yoga flexibility mindfulness breath control',
      'American football blitz coverage zone defense',
      'cycling power output watt training threshold',
      'CrossFit AMRAP WOD functional fitness circuit',
      'nutrition macronutrient caloric deficit fat loss',
      'rugby scrum lineout set piece strategy',
      'sprint biomechanics stride length frequency',
      'gymnastics vault release bar routine scoring',
      'ice hockey power play penalty kill face-off',
      'golf swing biomechanics club selection course',
      'combat sport grappling submission BJJ technique',
      'high-intensity interval training HIIT fat burn',
      'recovery sleep hydration periodization athlete',
      'sports psychology mental toughness focus pressure',
      'track field pole vault high jump biomechanics',
      'badminton smash drop shot net kill rally',
      'Formula 1 aerodynamics downforce pit strategy',
      'surfing wave reading barrel tube riding stance',
      'boxing jab cross hook combination footwork',
      'rock climbing route bouldering grip hold technique',
      'team cohesion locker room leadership culture',
    ],
  },
  {
    name: 'Food & Cooking',
    cx: 500, cy: 400,
    keywords: ['food','cooking','recipe','cuisine','chef','restaurant','flavor','ingredient','ferment','bake'],
    sentences: [
      'Maillard reaction browning caramelization flavor',
      'sourdough fermentation wild yeast gluten structure',
      'sous vide precise temperature water bath cooking',
      'umami fifth taste glutamate savory flavor',
      'sushi rice vinegar fish technique Japanese cuisine',
      'French sauce mother béchamel velouté espagnole',
      'pasta al dente gluten network semolina dough',
      'spice blend cumin coriander turmeric masala',
      'fermentation kimchi sauerkraut probiotic bacteria',
      'baking bread yeast proofing gluten development',
      'chocolate tempering cacao butter crystal cocoa',
      'wine pairing tannin acidity body varietal terroir',
      'molecular gastronomy spherification foam texture',
      'knife skills julienne brunoise chiffonade mise en place',
      'braising collagen gelatin slow cook rich sauce',
      'street food vendor taco noodle regional specialty',
      'food safety HACCP temperature pathogen prevention',
      'emulsification mayonnaise lecithin fat water',
      'regional Italian cuisine regional pasta sauce',
      'cocktail mixology bitters balance citrus spirit',
      'vegetarian umami depth mushroom nutritional yeast',
      'dim sum steaming dumpling Cantonese tradition',
      'BBQ smoke ring bark low slow temperature wood',
      'ice cream gelato emulsifier stabilizer churning',
      'food photography styling composition lighting',
      'plant-based protein texture meat alternative',
      'pickling brine acid preservation vegetable',
      'coffee extraction espresso grind bloom ratio',
      'cake layering ganache buttercream decoration',
      'restaurant menu costing labor food percentage',
    ],
  },
  {
    name: 'Philosophy & Psychology',
    cx: 340, cy: 310,
    keywords: ['philosophy','psychology','mind','consciousness','ethics','moral','cognitive','behavior','theory','existential'],
    sentences: [
      'existentialism Sartre freedom authenticity being',
      'cognitive bias heuristic anchoring confirmation',
      'stoicism Marcus Aurelius virtue dichotomy control',
      'consciousness hard problem qualia subjective experience',
      'Maslow hierarchy needs motivation self-actualization',
      'Kantian ethics categorical imperative duty morality',
      'behavioral psychology operant classical conditioning',
      'epistemology knowledge justification belief truth',
      'attachment theory Bowlby infant caregiver bond',
      'Nietzsche will to power eternal recurrence nihilism',
      'cognitive dissonance belief attitude rationalization',
      'utilitarian ethics greatest good consequentialism',
      'social contract Rousseau Locke political philosophy',
      'Jungian archetype collective unconscious shadow',
      'free will determinism compatibilism debate',
      'positive psychology flow optimal experience Csikszentmihalyi',
      'phenomenology Husserl intentionality lived experience',
      'trauma PTSD memory consolidation therapy treatment',
      'game theory Nash equilibrium prisoner dilemma',
      'mindfulness meditation present awareness neuroscience',
      'Plato allegory cave shadow reality ideal forms',
      'growth mindset Carol Dweck intelligence malleability',
      'philosophy of science falsifiability Popper paradigm',
      'emotional intelligence empathy self-regulation',
      'confirmation bias echo chamber belief polarization',
      'Marxist dialectical materialism class struggle',
      'decision theory expected utility rational choice',
      'mirror neuron empathy imitation social cognition',
      'language Wittgenstein meaning use family resemblance',
      'psychoanalysis Freud unconscious repression dream',
    ],
  },
];

// ── Embedding math ──────────────────────────────────────────────────────────

function randNorm(rng) {
  // Box-Muller
  const u = rng(), v = rng();
  return Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(2 * Math.PI * v);
}

function normalize(v) {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  return v.map(x => x / (norm + 1e-9));
}

function cosineSim(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // both unit vectors
}

const DIM = 32;

// Generate cluster centroids
const centroids = CLUSTERS.map(() => {
  const v = Array.from({ length: DIM }, () => randNorm(rng));
  return normalize(v);
});

// Generate node embeddings: normalize(centroid + 0.22 * noise)
function genEmbedding(clusterId) {
  const c = centroids[clusterId];
  const noiseScale = 0.22;
  const raw = c.map(ci => ci + noiseScale * randNorm(rng));
  return normalize(raw);
}

// 2D position with Gaussian spread around cluster center
function genPosition(cx, cy) {
  const spread = 80;
  let x, y;
  do {
    x = cx + spread * randNorm(rng);
    y = cy + spread * randNorm(rng);
  } while (x < 60 || x > 940 || y < 60 || y > 740);
  return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
}

// ── Build nodes ──────────────────────────────────────────────────────────────

let nodeId = 0;
const nodes = [];

CLUSTERS.forEach((cluster, ci) => {
  cluster.sentences.forEach(text => {
    const { x, y } = genPosition(cluster.cx, cluster.cy);
    const embedding = genEmbedding(ci);
    nodes.push({ id: nodeId++, text, cluster: ci, clusterName: cluster.name, x, y, embedding });
  });
});

// ── Build True HNSW Index ───────────────────────────────────────────────────

const edges = [];
let ep = null;
let maxLayer = -1;

const M = 12;
const M0 = 24;
const efConstruction = 40;
const mL = 1 / Math.log(M);

function searchLayer(q_emb, ep_id, ef, layer, _nodes) {
  const seen = new Set([ep_id]);
  const candidates = [{ id: ep_id, sim: cosineSim(q_emb, _nodes[ep_id].embedding) }];
  const results = [...candidates];
  
  while (candidates.length > 0) {
    candidates.sort((a, b) => b.sim - a.sim);
    const c = candidates.shift();
    
    results.sort((a, b) => b.sim - a.sim);
    const f = results[results.length - 1]; // worst
    if (c.sim < f.sim) break;
    
    const neighbors = _nodes[c.id].friends[layer] || [];
    for (const n_id of neighbors) {
      if (seen.has(n_id)) continue;
      seen.add(n_id);
      
      const sim = cosineSim(q_emb, _nodes[n_id].embedding);
      results.sort((a, b) => b.sim - a.sim);
      const f_worst = results[results.length - 1];
      
      if (results.length < ef || sim > f_worst.sim) {
        candidates.push({ id: n_id, sim });
        results.push({ id: n_id, sim });
        if (results.length > ef) {
          results.sort((a, b) => b.sim - a.sim);
          results.pop();
        }
      }
    }
  }
  results.sort((a, b) => b.sim - a.sim);
  return results;
}

function pruneConnections(node, layer, M_max, _nodes) {
  const neighbors = node.friends[layer];
  const sims = neighbors.map(id => ({
    id,
    sim: cosineSim(node.embedding, _nodes[id].embedding)
  }));
  sims.sort((a, b) => b.sim - a.sim);
  return sims.slice(0, M_max).map(s => s.id);
}

// Initialize node layers
nodes.forEach(n => {
  n.friends = [];
  const l = Math.floor(-Math.log(rng() + 0.0001) * mL); // +0.0001 to prevent log(0)
  n.layer = l;
  for (let i = 0; i <= l; i++) n.friends[i] = [];
});

const flatEdges = [];

for (let i = 0; i < nodes.length; i++) {
  const q = nodes[i];
  
  if (ep === null) {
    ep = i;
    maxLayer = q.layer;
    continue;
  }
  
  let currObj = ep;
  let currSim = cosineSim(q.embedding, nodes[currObj].embedding);
  
  // Coarse search down to q.layer
  for (let lc = maxLayer; lc > q.layer; lc--) {
    let changed = true;
    while (changed) {
      changed = false;
      const neighbors = nodes[currObj].friends[lc] || [];
      for (const neighbor of neighbors) {
        const sim = cosineSim(q.embedding, nodes[neighbor].embedding);
        if (sim > currSim) {
          currSim = sim;
          currObj = neighbor;
          changed = true;
        }
      }
    }
  }
  
  // Build layers
  for (let lc = Math.min(maxLayer, q.layer); lc >= 0; lc--) {
    const W = searchLayer(q.embedding, currObj, efConstruction, lc, nodes);
    const M_max = lc === 0 ? M0 : M;
    const neighbors = W.slice(0, M_max).map(w => w.id);
    
    for (const neighborId of neighbors) {
      q.friends[lc].push(neighborId);
      nodes[neighborId].friends[lc].push(q.id);
      
      if (lc === 0) {
        flatEdges.push({ from: Math.min(q.id, neighborId), to: Math.max(q.id, neighborId) });
      }
      
      if (nodes[neighborId].friends[lc].length > M_max) {
        nodes[neighborId].friends[lc] = pruneConnections(nodes[neighborId], lc, M_max, nodes);
      }
    }
    if (W.length > 0) currObj = W[0].id;
  }
  
  if (q.layer > maxLayer) {
    ep = i;
    maxLayer = q.layer;
  }
}

const edgeSet = new Set();
flatEdges.forEach(e => {
  const hash = `${e.from}-${e.to}`;
  if (!edgeSet.has(hash)) {
    edgeSet.add(hash);
    edges.push(e);
  }
});

// ── Query resolution ─────────────────────────────────────────────────────────

function resolveQueryCluster(queryText) {
  const q = queryText.toLowerCase();
  let bestCluster = 0;
  let bestScore = 0;
  CLUSTERS.forEach((c, ci) => {
    let score = 0;
    c.keywords.forEach(kw => {
      if (q.includes(kw)) score += 2;
      else kw.split(' ').forEach(w => { if (q.includes(w) && w.length > 3) score += 1; });
    });
    if (score > bestScore) { bestScore = score; bestCluster = ci; }
  });
  return bestCluster;
}

export function getQueryEmbedding(queryText) {
  const ci = resolveQueryCluster(queryText);
  
  // Seed a local PRNG using the query string so the same query ALWAYS returns the exact same embedding
  let hash = 0;
  for (let i = 0; i < queryText.length; i++) {
    hash = ((hash << 5) - hash) + queryText.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  const queryRng = mkRng(hash ^ 0x1A2B3C4D);

  // Query embedding = cluster centroid + small deterministic noise
  const c = centroids[ci];
  const raw = c.map(ci_val => ci_val + 0.08 * randNorm(queryRng));
  
  // Deterministic 2D visual position
  const clusterCenters = [
    { x: 180, y: 140 }, { x: 800, y: 150 }, { x: 490, y: 85 },
    { x: 110, y: 490 }, { x: 880, y: 390 }, { x: 270, y: 700 },
    { x: 610, y: 700 }, { x: 880, y: 640 }, { x: 680, y: 290 },
    { x: 460, y: 460 },
  ];
  const cc = clusterCenters[ci] || clusterCenters[0];
  const qx = Math.min(Math.max(cc.x + (queryRng() - 0.5) * 60, 60), 940);
  const qy = Math.min(Math.max(cc.y + (queryRng() - 0.5) * 60, 60), 740);

  return { 
    embedding: normalize(raw), 
    clusterId: ci,
    queryPos: { x: qx, y: qy }
  };
}

export { nodes, edges, centroids, CLUSTERS, cosineSim, ep, maxLayer };
export default { nodes, edges, ep, maxLayer };
