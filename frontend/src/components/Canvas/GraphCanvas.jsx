import { useRef, useEffect, useCallback, useState } from 'react';
import { useGraphRenderer } from './useGraphRenderer.js';
import { useAnimator } from './useAnimator.js';
import { dist2D } from '../../engine/similarity.js';

export default function GraphCanvas({ nodes, edges, searchTrigger, onStepUpdate, onDone }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const { stateRef, startLoop, stopLoop } = useGraphRenderer(canvasRef, nodes, edges);
  const animatorRef = useRef(null);

  const handleStepUpdate = useCallback((...args) => onStepUpdate?.(...args), [onStepUpdate]);
  const handleDone = useCallback(() => onDone?.(), [onDone]);

  useEffect(() => {
    if (searchTrigger) {
      searchTrigger.current = {
        play: (steps, speed, isBrute, queryPos) => {
          const s = stateRef.current;
          s.nodeStates   = {};
          s.prevStates   = {};
          s.activePath   = [];
          s.ripples      = [];
          s.queryNodePos = queryPos ? { ...queryPos, pulse: 0 } : null;
          s.isBrute      = isBrute;
          animatorRef.current?.play(steps, speed, isBrute);
        },
        cancel: () => animatorRef.current?.cancel(),
      };
    }
  }, [searchTrigger, stateRef]);

  // Resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width  = width + 'px';
        canvas.style.height = height + 'px';
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { startLoop(); return () => stopLoop(); }, [startLoop, stopLoop]);

  // Tooltip on hover
  const handleMouseMove = useCallback(e => {
    if (!nodes.length || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = rect.width, H = rect.height;

    let best = null, bestD = 20;
    nodes.forEach((node, i) => {
      const nx = (node.x / 1000) * W;
      const ny = (node.y / 800) * H;
      const d = dist2D(mx, my, nx, ny);
      if (d < bestD) { bestD = d; best = { node, i }; }
    });

    if (best) {
      const state = stateRef.current;
      const ns = state.nodeStates[best.i] || 'default';
      const qe = state.queryEmbedding;
      let simVal = null;
      if (qe) {
        let dot = 0, nq = 0, np = 0;
        for (let k = 0; k < qe.length; k++) {
          dot += qe[k] * best.node.embedding[k];
          nq  += qe[k] * qe[k];
          np  += best.node.embedding[k] ** 2;
        }
        simVal = (dot / (Math.sqrt(nq) * Math.sqrt(np))).toFixed(4);
      }
      setTooltip({
        x: Math.min(e.clientX - rect.left + 12, W - 210),
        y: Math.max(e.clientY - rect.top - 8, 8),
        node: best.node, id: best.i, status: ns, sim: simVal,
      });
    } else {
      setTooltip(null);
    }
  }, [nodes, stateRef]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);
  const statusLabel = { default: 'Not visited', visited: 'Visited', entry: 'Entry point', result: '✓ Result' };

  return (
    <div ref={containerRef} className="canvas-area"
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="graph-canvas" />

      {tooltip && (
        <div className="node-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tt-id">#{tooltip.id} · {tooltip.node.clusterName}</div>
          <div className="tt-text">"{tooltip.node.text}"</div>
          {tooltip.sim !== null && (
            <div className="tt-sim">cos sim = <span>{tooltip.sim}</span></div>
          )}
          <div className="tt-status">{statusLabel[tooltip.status] || 'Not visited'}</div>
        </div>
      )}

      <AnimatorBridge animatorRef={animatorRef} stateRef={stateRef}
        onStepUpdate={handleStepUpdate} onDone={handleDone} />
    </div>
  );
}

function AnimatorBridge({ animatorRef, stateRef, onStepUpdate, onDone }) {
  const { play, cancel } = useAnimator(stateRef, null, onStepUpdate, onDone);
  useEffect(() => { animatorRef.current = { play, cancel }; }, [play, cancel, animatorRef]);
  return null;
}
