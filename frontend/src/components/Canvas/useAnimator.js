import { useRef, useCallback } from 'react';

export function useAnimator(stateRef, _draw, onStepUpdate, onDone) {
  const timerRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const play = useCallback((steps, speedMs = 160, isBrute = false) => {
    cancel();
    let prevHopNode = null;
    let visitedCount = 0;

    function playStep(index) {
      if (index >= steps.length) {
        onDone?.();
        return;
      }
      const step = steps[index];
      const state = stateRef.current;

      switch (step.type) {
        case 'entry':
          state.nodeStates[step.nodeId] = 'entry';
          prevHopNode = step.nodeId;
          visitedCount++;
          break;
        case 'hop':
          state.nodeStates[step.nodeId] = 'visited';
          if (prevHopNode !== null && prevHopNode !== step.nodeId) {
            state.activePath.push({ from: prevHopNode, to: step.nodeId });
            if (state.activePath.length > 10) state.activePath.shift();
          }
          prevHopNode = step.nodeId;
          break;
        case 'evaluate':
          if (!state.nodeStates[step.nodeId]) {
            state.nodeStates[step.nodeId] = 'visited';
            visitedCount++;
          }
          state.rippleQueue = state.rippleQueue || [];
          state.rippleQueue.push({ id: step.nodeId, isHit: step.isHit });
          break;
        case 'result':
          state.nodeStates[step.nodeId] = 'result';
          break;
      }

      onStepUpdate?.({
        stepIndex: index,
        total: steps.length,
        step,
        nodesVisited: visitedCount,
      });

      let delay;
      if (isBrute) {
        delay = step.type === 'result' ? speedMs * 2 : speedMs * 0.2;
      } else {
        switch (step.type) {
          case 'entry':  delay = speedMs * 2.5; break;
          case 'hop':    delay = speedMs * 2.0; break;
          case 'result': delay = speedMs * 3.0; break;
          default:       delay = speedMs * 0.6;
        }
      }

      timerRef.current = setTimeout(() => playStep(index + 1), delay);
    }

    playStep(0);
  }, [cancel, stateRef, onStepUpdate, onDone]);

  return { play, cancel };
}
