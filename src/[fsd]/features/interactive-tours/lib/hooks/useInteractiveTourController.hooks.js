import { useCallback, useMemo, useReducer } from 'react';

import { AGENT_TOUR_ID } from '../agentTour';
import { CHAT_TOUR_ID } from '../chatTour';
import { initialState, lsCompletedKey, lsPromptKey, tourReducer } from '../helpers';
import { SIDEBAR_TOUR_ID } from '../sidebarTour';

// ─── Tour loaders (lazy) ───────────────────────────────────────────────────────
const TOUR_LOADERS = {
  [CHAT_TOUR_ID]: () => import('../chatTour').then(m => m.chatTourSteps),
  [AGENT_TOUR_ID]: () => import('../agentTour').then(m => m.agentTourSteps),
  [SIDEBAR_TOUR_ID]: () => import('../sidebarTour').then(m => m.sidebarTourSteps),
};

/**
 * Owns the interactive-tour state machine and side effects (localStorage,
 * lazy step loading). Returns a stable, memoized value to feed into
 * `InteractiveTourProvider`.
 */
export const useInteractiveTourController = () => {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  const proposeTour = useCallback(id => {
    const seen = localStorage.getItem(lsPromptKey(id)) === 'true';
    const completed = localStorage.getItem(lsCompletedKey(id)) === 'true';

    if (!seen && !completed) {
      dispatch({ type: 'PROPOSE', tourId: id });
    }
  }, []);

  const startTour = useCallback(async id => {
    // Mark the prompt as seen immediately so that any re-run of proposeTour
    // (e.g. triggered by a context update) cannot snap the phase back to 'prompt'.
    localStorage.setItem(lsPromptKey(id), 'true');
    const steps = (await TOUR_LOADERS[id]?.()) ?? [];
    const activeSteps = steps.filter(step => !step.skip);

    if (!activeSteps.length) {
      // Unknown tour id or loader returned no steps — reset to idle rather than
      // getting stuck in 'running' with no currentStep and no UI.
      dispatch({ type: 'SKIP' });
      return;
    }

    dispatch({ type: 'START', tourId: id, steps: activeSteps });
  }, []);

  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const back = useCallback(() => dispatch({ type: 'BACK' }), []);
  const skip = useCallback(() => dispatch({ type: 'SKIP' }), []);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(lsPromptKey(state.tourId), 'true');
    dispatch({ type: 'DISMISS_PROMPT' });
  }, [state.tourId]);

  const closeComplete = useCallback(() => {
    if (state.tourId) {
      localStorage.setItem(lsCompletedKey(state.tourId), 'true');
    }

    dispatch({ type: 'CLOSE_COMPLETE' });
  }, [state.tourId]);

  const currentStep = state.steps[state.stepIndex] ?? null;

  return useMemo(
    () => ({
      phase: state.phase,
      tourId: state.tourId,
      currentStep,
      stepIndex: state.stepIndex,
      totalSteps: state.steps.length,
      proposeTour,
      startTour,
      next,
      back,
      skip,
      dismissPrompt,
      closeComplete,
    }),
    [
      state.phase,
      state.tourId,
      state.stepIndex,
      state.steps.length,
      currentStep,
      proposeTour,
      startTour,
      next,
      back,
      skip,
      dismissPrompt,
      closeComplete,
    ],
  );
};
