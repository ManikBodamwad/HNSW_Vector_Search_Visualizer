import { useRef, useEffect, useCallback, useState } from 'react';
import { useGraphRenderer } from './useGraphRenderer.js';
import { useAnimator } from './useAnimator.js';
import { dist2D } from '../../engine/similarity.js';

export default function GraphCanvas({ nodes, edges, searchTrigger, onStepUpdate, onDone }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef   = useRef(null);

  const { stateRef, startLoop, stopLoop, handleDrag, handleZoom } = useGraphRenderer(canvasRef, nodes, edges);
  const animatorRef = useRef(null);

  const isDragging = useRef(false);
  const dragType = useRef('pan');
  const lastPos = useRef({ x: 0, y: 0 });

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
          s.currentLayer = null; // Reset layer
          s.currentNode  = null; // Reset current node
          s.isComplete   = false; // Reset completion flag
          
          // Reset camera auto-zoom state
          s.cam.userInteracted = false;
          s.cam.targetDistance = 520;
          s.cam.targetPanX = 0;
          s.cam.targetPanY = 0;

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

  // Pointer events for Tooltip and Dragging
  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    containerRef.current?.setPointerCapture(e.pointerId);
    containerRef.current?.classList.add('is-dragging');
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';

    if (!canvasRef.current || !stateRef.current.sortedIdx) {
      dragType.current = 'pan';
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    let hitNode = false;
    for (const item of stateRef.current.sortedIdx) {
      if (item.p && dist2D(mx, my, item.p.sx, item.p.sy) < 25) {
        hitNode = true;
        break;
      }
    }
    dragType.current = hitNode ? 'rotate' : 'pan';
  }, [stateRef]);

  const handlePointerMove = useCallback((e) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      
      let isPan = dragType.current === 'pan';
      if (e.buttons === 2 || e.shiftKey) isPan = !isPan; // toggle behavior with right-click or shift

      handleDrag(dx, dy, isPan);
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

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
      const statusLabel = { default: 'Not visited', visited: 'Visited', entry: 'Entry point', result: '✓ Result' };
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = `${Math.min(e.clientX - rect.left + 12, W - 210)}px`;
        tooltipRef.current.style.top = `${Math.max(e.clientY - rect.top - 8, 8)}px`;
        tooltipRef.current.innerHTML = `
          <div class="tt-id">#${best.i} · ${best.node.clusterName}</div>
          <div class="tt-text">"${best.node.text}"</div>
          ${simVal !== null ? `<div class="tt-sim">cos sim = <span>${simVal}</span></div>` : ''}
          <div class="tt-status">${statusLabel[ns] || 'Not visited'}</div>
        `;
      }
    } else {
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    }
  }, [nodes, stateRef, handleDrag]);

  const handlePointerUp = useCallback((e) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
    containerRef.current?.classList.remove('is-dragging');
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';
  }, []);
  
  // Native wheel event to prevent browser zooming (passive: false is required)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      handleZoom(e.deltaY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [handleZoom]);

  const statusLabel = { default: 'Not visited', visited: 'Visited', entry: 'Entry point', result: '✓ Result' };

  return (
    <div ref={containerRef} className="canvas-area"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }} // prevent scrolling while dragging
    >
      <canvas ref={canvasRef} className="graph-canvas" />

      <div ref={tooltipRef} className="node-tooltip" style={{ display: 'none' }}></div>

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
