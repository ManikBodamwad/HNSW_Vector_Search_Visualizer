import { useCallback, useRef, useState } from 'react';
import { nodes, edges, getQueryEmbedding } from '../data/graphData.js';
import { runHNSWSearch } from '../engine/hnsw.js';
import { runBruteForce } from '../engine/bruteForce.js';

const DEFAULT_STATS = {
  nodesEvaluated: 0,
  nodesSkipped: 0,
  computeSaved: 0,
  topSim: 0,
  total: nodes.length,
};

const DEFAULT_MATH = {
  dotProduct: 0,
  normQ: 0,
  normP: 0,
  simLive: 0,
  currentLayer: 2,
};

// Compute real cosine similarity components
function computeCosineComponents(qEmb, pEmb) {
  if (!qEmb || !pEmb || qEmb.length !== pEmb.length) return null;
  let dot = 0, nq = 0, np = 0;
  for (let i = 0; i < qEmb.length; i++) {
    dot += qEmb[i] * pEmb[i];
    nq  += qEmb[i] * qEmb[i];
    np  += pEmb[i] * pEmb[i];
  }
  nq = Math.sqrt(nq);
  np = Math.sqrt(np);
  const sim = nq > 0 && np > 0 ? dot / (nq * np) : 0;
  return { dotProduct: dot, normQ: nq, normP: np, simLive: sim };
}

// Infer HNSW layer from step index (rough heuristic: L2→L1→L0 progression)
function inferLayer(stepIndex, totalSteps) {
  const pct = stepIndex / Math.max(totalSteps - 1, 1);
  if (pct < 0.15) return 2;
  if (pct < 0.40) return 1;
  return 0;
}

export function useSearch(searchTrigger, canvasStateRef) {
  const [status, setStatus]   = useState('idle');
  const [stats, setStats]     = useState(DEFAULT_STATS);
  const [stepLog, setStepLog] = useState([]);
  const [mathState, setMathState] = useState(DEFAULT_MATH);

  const stepLogRef = useRef([]);
  const queryEmbRef = useRef(null);
  const totalStepsRef = useRef(0);

  const handleStepUpdate = useCallback(({ step, nodesVisited, stepIndex, total }) => {
    // Append meaningful steps to log
    if (step.type !== 'evaluate') {
      stepLogRef.current = [...stepLogRef.current, step].slice(-80);
      setStepLog([...stepLogRef.current]);
    }

    // Update evaluated count
    setStats(prev => ({
      ...prev,
      nodesEvaluated: nodesVisited,
      nodesSkipped: Math.max(0, nodes.length - nodesVisited),
    }));

    // Compute real cosine similarity for the current node
    if (queryEmbRef.current && step.nodeId != null) {
      const pEmb = nodes[step.nodeId]?.embedding;
      if (pEmb) {
        const components = computeCosineComponents(queryEmbRef.current, pEmb);
        if (components) {
          const layer = inferLayer(stepIndex ?? 0, totalStepsRef.current);
          setMathState({ ...components, currentLayer: layer });
        }
      }
    }
  }, []);

  const handleDone = useCallback((finalStats) => {
    if (finalStats) setStats(s => ({ ...s, ...finalStats }));
    setStatus('done');
    setMathState(prev => ({ ...prev, currentLayer: 0 }));
  }, []);

  const runSearch = useCallback((query, algo, autoSpeed) => {
    if (!searchTrigger.current) return;

    // ── Reset everything ──
    stepLogRef.current = [];
    setStepLog([]);
    setStatus('running');
    setStats(DEFAULT_STATS);  // reset metrics to 0
    setMathState(DEFAULT_MATH);

    const { embedding, clusterId, queryPos } = getQueryEmbedding(query);
    queryEmbRef.current = embedding;

    if (canvasStateRef?.current) {
      canvasStateRef.current.queryEmbedding = embedding;
    }

    const isBrute = algo === 'brute';
    const result = isBrute
      ? runBruteForce(embedding, nodes)
      : runHNSWSearch(embedding, nodes, edges);

    totalStepsRef.current = result.steps.length;

    setStats({
      nodesEvaluated: 0,  // starts at 0, counts up during animation
      nodesSkipped: 0,
      computeSaved: result.computeSaved,
      topSim: result.topSim,
      total: nodes.length,
    });

    searchTrigger.current.play(result.steps, autoSpeed ?? 160, isBrute, queryPos);
  }, [searchTrigger, canvasStateRef]);

  return {
    runSearch,
    handleStepUpdate,
    handleDone,
    status,
    setStatus,
    stats,
    stepLog,
    mathState,
  };
}
