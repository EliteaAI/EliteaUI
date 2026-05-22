import { useCallback, useMemo, useReducer } from 'react';

import { useDispatch } from 'react-redux';

import { actions as settingsActions } from '@/slices/settings';

import { AGENT_TOUR_ID, CHAT_TOUR_ID, FIRST_ELITEA_TOUR_ID, SIDEBAR_TOUR_ID } from '../constants';
import { initialState, lsCompletedKey, lsPromptKey, tourReducer } from '../helpers';

// ─── Tour loaders (lazy) ───────────────────────────────────────────────────────
const TOUR_LOADERS = {
  [CHAT_TOUR_ID]: () => import('../constants/chatTour.constants').then(m => m.chatTourSteps),
  [AGENT_TOUR_ID]: () => import('../constants/agentTour.constants').then(m => m.agentTourSteps),
  [FIRST_ELITEA_TOUR_ID]: () =>
    import('../constants/firstEliteaTour.constants').then(m => m.firstEliteaTourSteps),
  [SIDEBAR_TOUR_ID]: () => import('../constants/sidebarTour.constants').then(m => m.sidebarTourSteps),
};

/**
 * Owns the interactive-tour state machine and side effects (localStorage,
 * lazy step loading). Returns a stable, memoized value to feed into
 * `InteractiveTourProvider`.
 */
export const useInteractiveTourController = () => {
  const dispatchRedux = useDispatch();
  const [state, dispatch] = useReducer(tourReducer, initialState);

  const proposeTour = useCallback(id => {
    const seen = localStorage.getItem(lsPromptKey(id)) === 'true';
    const completed = localStorage.getItem(lsCompletedKey(id)) === 'true';

    if (!seen && !completed) {
      dispatch({ type: 'PROPOSE', tourId: id });
    }
  }, []);

  const startTour = useCallback(
    async id => {
      // Mark the prompt as seen immediately so that any re-run of proposeTour
      // (e.g. triggered by a context update) cannot snap the phase back to 'prompt'.
      localStorage.setItem(lsPromptKey(id), 'true');

      if (id === SIDEBAR_TOUR_ID || id === FIRST_ELITEA_TOUR_ID) {
        dispatchRedux(settingsActions.setSideBarCollapsed(false));
      }

      const steps = (await TOUR_LOADERS[id]?.()) ?? [];
      const activeSteps = steps.filter(step => !step.skip);

      if (!activeSteps.length) {
        // Unknown tour id or loader returned no steps — reset to idle rather than
        // getting stuck in 'running' with no currentStep and no UI.
        dispatch({ type: 'SKIP' });
        return;
      }

      dispatch({ type: 'START', tourId: id, steps: activeSteps });
    },
    [dispatchRedux],
  );

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
