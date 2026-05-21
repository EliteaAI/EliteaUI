import { memo, useCallback, useMemo, useReducer } from 'react';

import { AGENT_TOUR_COMPLETION, AGENT_TOUR_ID } from '@/[fsd]/features/interactive-tours/lib/agentTour';
import { CHAT_TOUR_COMPLETION, CHAT_TOUR_ID } from '@/[fsd]/features/interactive-tours/lib/chatTour';
import { SIDEBAR_TOUR_COMPLETION, SIDEBAR_TOUR_ID } from '@/[fsd]/features/interactive-tours/lib/sidebarTour';
import FirstVisitPrompt from '@/[fsd]/features/interactive-tours/ui/FirstVisitPrompt';
import InteractiveTourCard from '@/[fsd]/features/interactive-tours/ui/InteractiveTourCard';
import TourCompleteCard from '@/[fsd]/features/interactive-tours/ui/TourCompleteCard';

import { InteractiveTourContext } from './InteractiveTourContext';

// ─── Tour completion configs ───────────────────────────────────────────────────
const TOUR_COMPLETION_CONFIGS = {
  [CHAT_TOUR_ID]: CHAT_TOUR_COMPLETION,
  [AGENT_TOUR_ID]: AGENT_TOUR_COMPLETION,
  [SIDEBAR_TOUR_ID]: SIDEBAR_TOUR_COMPLETION,
};

// ─── Tour loaders (lazy) ───────────────────────────────────────────────────────
const TOUR_LOADERS = {
  [CHAT_TOUR_ID]: () => import('@/[fsd]/features/interactive-tours/lib/chatTour').then(m => m.chatTourSteps),
  [AGENT_TOUR_ID]: () =>
    import('@/[fsd]/features/interactive-tours/lib/agentTour').then(m => m.agentTourSteps),
  [SIDEBAR_TOUR_ID]: () =>
    import('@/[fsd]/features/interactive-tours/lib/sidebarTour').then(m => m.sidebarTourSteps),
};

// ─── localStorage helpers ──────────────────────────────────────────────────────
const lsPromptKey = tourId => `interactive-tour:${tourId}:prompt-seen`;
const lsCompletedKey = tourId => `interactive-tour:${tourId}:completed`;

// ─── Reducer ───────────────────────────────────────────────────────────────────
const initialState = {
  phase: 'idle', // 'idle' | 'prompt' | 'running' | 'complete'
  tourId: null,
  steps: [],
  stepIndex: 0,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'PROPOSE':
      // Only transition to 'prompt' from 'idle'; never interrupt an active tour.
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'prompt', tourId: action.tourId, steps: [] };

    case 'START':
      return {
        ...state,
        phase: 'running',
        tourId: action.tourId,
        steps: action.steps,
        stepIndex: 0,
      };

    case 'NEXT': {
      const nextIndex = state.stepIndex + 1;

      if (nextIndex >= state.steps.length) {
        return { ...state, phase: 'complete' };
      }

      return { ...state, stepIndex: nextIndex };
    }

    case 'BACK':
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };

    case 'SKIP':
    case 'DISMISS_PROMPT':
    case 'CLOSE_COMPLETE':
      return { ...initialState };

    default:
      return state;
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const InteractiveTourProvider = memo(props => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);

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

  const contextValue = useMemo(
    () => ({
      phase: state.phase,
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

  return (
    <InteractiveTourContext.Provider value={contextValue}>
      {children}
      {state.phase === 'prompt' && (
        <FirstVisitPrompt
          onSkip={dismissPrompt}
          onStart={() => startTour(state.tourId)}
        />
      )}
      {state.phase === 'running' && currentStep && <InteractiveTourCard />}
      {state.phase === 'complete' && (
        <TourCompleteCard keepExploring={TOUR_COMPLETION_CONFIGS[state.tourId]?.keepExploring ?? []} />
      )}
    </InteractiveTourContext.Provider>
  );
});

InteractiveTourProvider.displayName = 'InteractiveTourProvider';
