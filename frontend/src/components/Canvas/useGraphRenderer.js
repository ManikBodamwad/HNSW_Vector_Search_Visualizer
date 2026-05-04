import { useRef, useCallback } from 'react';

/* ── Projection helpers ─────────────────────────────────────────── */
// 3D → 2D perspective projection
// nodes have x ∈ [0,1000], y ∈ [0,800]; we add a z dimension from cluster depth
function project3D(x3, y3, z3, W, H, cam) {
  // Center the space and apply pan with fallback for HMR state
  const cx = x3 - 500 + (cam.panX || 0);
  const cy = y3 - 400 + (cam.panY || 0);
  const cz = z3;

  // Rotate around Y axis
  const cosY = Math.cos(cam.rotY);
  const sinY = Math.sin(cam.rotY);
  const rx = cx * cosY + cz * sinY;
  const ry = cy;
  const rz = -cx * sinY + cz * cosY;

  // Rotate around X axis (tilt)
  const cosX = Math.cos(cam.rotX);
  const sinX = Math.sin(cam.rotX);
  const rx2 = rx;
  const ry2 = ry * cosX - rz * sinX;
  const rz2 = ry * sinX + rz * cosX;

  // Perspective divide
  const fov = cam.fov;
  const dz = rz2 + cam.distance;
  if (dz <= 0) return null;
  const scale = fov / dz;

  const sx = W / 2 + rx2 * scale * (W / 900);
  const sy = H / 2 + ry2 * scale * (H / 720);

  return { sx, sy, scale, depth: rz2 };
}

/* ── Colors ─────────────────────────────────────────────────────── */
const C = {
  bg:          '#0A0E1A',
  nodDefault:  '#3A4A63',
  nodVisited:  '#2563EB',
  nodResult:   '#059669',
  nodQuery:    '#D97706',
  nodEntry:    '#60A5FA',
  edgeDefault: 'rgba(96,120,168,0.18)',
  edgeActive:  '#3B82F6',
  edgeBrute:   '#EF4444',
  gridLine:    'rgba(255,255,255,0.018)',
};

export function useGraphRenderer(canvasRef, nodes, edges) {
  const stateRef = useRef({
    nodeStates:   {},
    activePath:   [],
    queryNodePos: null,
    isBrute:      false,
    animFrame:    null,
    tick:         0,
    ripples:      [],
    prevStates:   {},
    cam: {
      rotY: 0.25,    // gentle Y rotation for 3D look
      rotX: 0.18,    // gentle downward tilt
      targetRotY: 0.25,
      targetRotX: 0.18,
      panX: 0,
      panY: 0,
      targetPanX: 0,
      targetPanY: 0,
      distance: 520,
      targetDistance: 520,
      fov:  520,
      autoRotate: true,
    },
    // Assign z depth per cluster so layers are visually separated
    nodeZ: null,
  });

  // Assign z values to nodes once (cluster-based depth)
  if (!stateRef.current.nodeZ && nodes.length > 0) {
    // cluster 0..9: spread across z = -120 to +120
    const clusterZ = [
      -100, 80, -60, 100, -80,
       60, -40, 100,  20, -20,
    ];
    stateRef.current.nodeZ = nodes.map(n => {
      const base = clusterZ[n.cluster] ?? 0;
      return base + (Math.random() - 0.5) * 40;
    });
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const dpr = window.devicePixelRatio || 1;

    // Logical (CSS) dimensions
    const W = canvas.clientWidth  || canvas.width  / dpr;
    const H = canvas.clientHeight || canvas.height / dpr;

    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    const cam = state.cam;
    state.tick++;

    // Apply smooth inertia (with fallback for HMR state preservation)
    cam.panX = cam.panX || 0;
    cam.panY = cam.panY || 0;
    cam.targetPanX = cam.targetPanX || 0;
    cam.targetPanY = cam.targetPanY || 0;

    cam.rotY += (cam.targetRotY - cam.rotY) * 0.15;
    cam.rotX += (cam.targetRotX - cam.rotX) * 0.15;
    cam.distance += (cam.targetDistance - cam.distance) * 0.15;
    cam.panX += (cam.targetPanX - cam.panX) * 0.15;
    cam.panY += (cam.targetPanY - cam.panY) * 0.15;

    // Cinematic Auto-Zoom
    if (!cam.userInteracted && !state.isBrute) {
      let focusNode = null;
      if (state.currentNode !== null) {
        focusNode = nodes[state.currentNode];
      } else if (state.queryNodePos) {
        focusNode = state.queryNodePos;
      }
      
      if (focusNode) {
        // Pan to center the node, zoom in slightly
        cam.targetPanX = 500 - focusNode.x;
        cam.targetPanY = 400 - focusNode.y;
        cam.targetDistance = 220; // zoom in
        cam.targetRotX = 0.25;    // look down slightly
      }
    }

    // Auto-rotate slowly
    if (cam.autoRotate) {
      cam.targetRotY += 0.0008;
    }

    // ── Draw at physical pixel size ──
    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle dot grid (static, doesn't rotate)
    const gridSpacing = 55;
    for (let gx = 0; gx < W; gx += gridSpacing) {
      for (let gy = 0; gy < H; gy += gridSpacing) {
        ctx.beginPath();
        ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
      }
    }

    const nodeZ = state.nodeZ || [];
    const activeColor = state.isBrute ? C.edgeBrute : C.edgeActive;

    // Project all nodes to 2D
    const projected = nodes.map((n, i) => {
      const z = nodeZ[i] ?? 0;
      return project3D(n.x, n.y, z, W, H, cam);
    });

    // ── Default edges (drawn before nodes) ──
    edges.forEach(edge => {
      const p1 = projected[edge.from];
      const p2 = projected[edge.to];
      if (!p1 || !p2) return;

      const isActive = state.activePath.some(
        p => (p.from === edge.from && p.to === edge.to) ||
             (p.from === edge.to   && p.to === edge.from)
      );
      if (isActive) return;

      const avgDepth = (p1.depth + p2.depth) / 2;
      const depthAlpha = Math.max(0.05, Math.min(1, 1 - (avgDepth + 150) / 400));

      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = `rgba(96,120,168,${0.22 * depthAlpha})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });

    // ── Active path edges with glow ──
    state.activePath.forEach(({ from, to }) => {
      const p1 = projected[from];
      const p2 = projected[to];
      if (!p1 || !p2) return;

      // Glow halo
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = state.isBrute
        ? 'rgba(239,68,68,0.12)'
        : 'rgba(59,130,246,0.14)';
      ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();

      // Core
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1.5; ctx.stroke();
    });

    // ── Ripples ──
    state.ripples = state.ripples.filter(r => r.alpha > 0.01);
    state.ripples.forEach(r => {
      r.r += (r.maxR - r.r) * 0.09;
      r.alpha *= 0.87;
      const hex = Math.round(r.alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(r.sx, r.sy, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = r.color + hex;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    if (state.rippleQueue) {
      state.rippleQueue.forEach(({ id, isHit }) => {
        const p = projected[id];
        if (p) {
          const color = isHit ? '#10B981' : '#EF4444'; // Green for hit, Red for miss
          state.ripples.push({
            sx: p.sx, sy: p.sy,
            r: 5, maxR: 35, alpha: 0.95, color
          });
        }
      });
      state.rippleQueue = [];
    }

    // Spawn ripples on state change (for entry/result)
    Object.entries(state.nodeStates).forEach(([id, ns]) => {
      if (state.prevStates[id] !== ns) {
        if (ns === 'entry' || ns === 'result') {
          const p = projected[parseInt(id)];
          if (p) {
            const color = ns === 'result' ? '#059669' : '#60A5FA';
            state.ripples.push({
              sx: p.sx, sy: p.sy,
              r: 3, maxR: 45, alpha: 0.85, color
            });
          }
        }
        state.prevStates[id] = ns;
      }
    });

    // ── Nodes — sorted back-to-front for correct z-order ──
    const sortedIdx = projected
      .map((p, i) => ({ p, i }))
      .filter(x => x.p !== null)
      .sort((a, b) => a.p.depth - b.p.depth);

    sortedIdx.forEach(({ p, i }) => {
      const ns = state.nodeStates[i] || 'default';
      const scalePerspective = Math.max(0.4, Math.min(1.6, p.scale));

      let color, baseRadius, glowStrength;
      switch (ns) {
        case 'result':
          color = C.nodResult; baseRadius = 6; glowStrength = 1; break;
        case 'entry':
          color = C.nodEntry;  baseRadius = 5; glowStrength = 0.8; break;
        case 'visited':
          color = state.isBrute ? C.edgeBrute : C.nodVisited;
          baseRadius = 4; glowStrength = 0.5; break;
        default:
          color = C.nodDefault; baseRadius = 2.5; glowStrength = 0;
      }

      const r = baseRadius * scalePerspective;

      // Glow halo for active nodes
      if (glowStrength > 0) {
        const glowR = r * 4.5;
        const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowR);
        g.addColorStop(0, color + '35');
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Specular highlight
      if (ns !== 'default') {
        ctx.beginPath();
        ctx.arc(p.sx - r * 0.3, p.sy - r * 0.3, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fill();
      }

      // Result ring pulse
      if (ns === 'result') {
        const pulse = 0.5 + 0.5 * Math.sin(state.tick * 0.07 + i * 0.5);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r + 4 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(5,150,105,${0.3 + pulse * 0.2})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Current exploring node pulse
      if (state.currentNode === i && !state.isBrute) {
        const pulse = 0.5 + 0.5 * Math.sin(state.tick * 0.15);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r + 6 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96,165,250,${0.6 - pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // ── Query node ──
    if (state.queryNodePos) {
      const { x, y, z = 0, pulse } = state.queryNodePos;
      const p = project3D(x, y, z, W, H, cam);
      if (p) {
        const sc = Math.max(0.6, Math.min(1.4, p.scale));
        const pR = (8 + Math.sin(pulse) * 2) * sc;

        // Pulsing rings
        for (let ring = 0; ring < 3; ring++) {
          const a = Math.max(0, 0.28 - ring * 0.08) * (0.6 + 0.4 * Math.sin(pulse - ring * 0.7));
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, pR + 10 + ring * 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(217,119,6,${a})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Glow
        const g = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, pR * 3.5);
        g.addColorStop(0, 'rgba(217,119,6,0.4)');
        g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(p.sx, p.sy, pR * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(p.sx, p.sy, pR, 0, Math.PI * 2);
        ctx.fillStyle = C.nodQuery; ctx.fill();

        // Highlight
        ctx.beginPath(); ctx.arc(p.sx - pR * 0.3, p.sy - pR * 0.3, pR * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();

        state.queryNodePos.pulse += 0.055;
      }
    }

    ctx.restore();
    state.animFrame = requestAnimationFrame(draw);
  }, [nodes, edges, canvasRef]);

  const startLoop = useCallback(() => {
    if (stateRef.current.animFrame) cancelAnimationFrame(stateRef.current.animFrame);
    stateRef.current.animFrame = requestAnimationFrame(draw);
  }, [draw]);

  const stopLoop = useCallback(() => {
    if (stateRef.current.animFrame) {
      cancelAnimationFrame(stateRef.current.animFrame);
      stateRef.current.animFrame = null;
    }
  }, []);

  const handleDrag = useCallback((dx, dy, isPan = false) => {
    const cam = stateRef.current.cam;
    cam.autoRotate = false;
    cam.userInteracted = true; // Stop auto-zoom if user drags
    if (isPan) {
      cam.targetPanX += dx * 1.5;
      cam.targetPanY += dy * 1.5;
    } else {
      cam.targetRotY += dx * 0.006;
      cam.targetRotX -= dy * 0.006;
      cam.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cam.targetRotX));
    }
  }, []);

  const handleZoom = useCallback((deltaY) => {
    const cam = stateRef.current.cam;
    cam.userInteracted = true; // Stop auto-zoom if user zooms
    cam.targetDistance += deltaY * 1.2;
    // Allow zooming way out, but not clipping through the camera
    cam.targetDistance = Math.max(100, Math.min(5000, cam.targetDistance));
  }, []);

  return { draw, stateRef, startLoop, stopLoop, handleDrag, handleZoom };
}
