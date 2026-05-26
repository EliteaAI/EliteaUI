import {
  AGENT_STUDIO_TOUR_COMPLETION,
  AGENT_STUDIO_TOUR_ID,
  AGENT_TOUR_COMPLETION,
  AGENT_TOUR_ID,
  AI_CONFIG_TOUR_COMPLETION,
  AI_CONFIG_TOUR_ID,
  ANALYTICS_TOUR_COMPLETION,
  ANALYTICS_TOUR_ID,
  CHAT_TOUR_COMPLETION,
  CHAT_TOUR_ID,
  FIRST_ELITEA_TOUR_COMPLETION,
  FIRST_ELITEA_TOUR_ID,
  MCP_TOUR_COMPLETION,
  MCP_TOUR_ID,
  NOTIFICATIONS_TOUR_COMPLETION,
  NOTIFICATIONS_TOUR_ID,
  PERSONAL_TOKENS_TOUR_COMPLETION,
  PERSONAL_TOKENS_TOUR_ID,
  PIPELINE_TOUR_COMPLETION,
  PIPELINE_TOUR_ID,
  RESOURCES_TOUR_COMPLETION,
  RESOURCES_TOUR_ID,
  SECRETS_TOUR_COMPLETION,
  SECRETS_TOUR_ID,
  SIDEBAR_TOUR_COMPLETION,
  SIDEBAR_TOUR_ID,
  TOOLKIT_TOUR_COMPLETION,
  TOOLKIT_TOUR_ID,
  USERS_TOUR_COMPLETION,
  USERS_TOUR_ID,
} from '../constants';

// ─── Tour completion configs ───────────────────────────────────────────────────
export const TOUR_COMPLETION_CONFIGS = {
  [AGENT_STUDIO_TOUR_ID]: AGENT_STUDIO_TOUR_COMPLETION,
  [AI_CONFIG_TOUR_ID]: AI_CONFIG_TOUR_COMPLETION,
  [ANALYTICS_TOUR_ID]: ANALYTICS_TOUR_COMPLETION,
  [CHAT_TOUR_ID]: CHAT_TOUR_COMPLETION,
  [AGENT_TOUR_ID]: AGENT_TOUR_COMPLETION,
  [FIRST_ELITEA_TOUR_ID]: FIRST_ELITEA_TOUR_COMPLETION,
  [MCP_TOUR_ID]: MCP_TOUR_COMPLETION,
  [NOTIFICATIONS_TOUR_ID]: NOTIFICATIONS_TOUR_COMPLETION,
  [PERSONAL_TOKENS_TOUR_ID]: PERSONAL_TOKENS_TOUR_COMPLETION,
  [PIPELINE_TOUR_ID]: PIPELINE_TOUR_COMPLETION,
  [RESOURCES_TOUR_ID]: RESOURCES_TOUR_COMPLETION,
  [SECRETS_TOUR_ID]: SECRETS_TOUR_COMPLETION,
  [SIDEBAR_TOUR_ID]: SIDEBAR_TOUR_COMPLETION,
  [TOOLKIT_TOUR_ID]: TOOLKIT_TOUR_COMPLETION,
  [USERS_TOUR_ID]: USERS_TOUR_COMPLETION,
};

// ─── localStorage helpers ──────────────────────────────────────────────────────
export const lsPromptKey = tourId => `interactive-tour:${tourId}:prompt-seen`;
export const lsCompletedKey = tourId => `interactive-tour:${tourId}:completed`;

// ─── Reducer ───────────────────────────────────────────────────────────────────
export const initialState = {
  phase: 'idle', // 'idle' | 'prompt' | 'running' | 'complete'
  tourId: null,
  steps: [],
  stepIndex: 0,
};

export const tourReducer = (state, action) => {
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
