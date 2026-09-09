import {
  ORIENTATION,
  OrientationKey,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { DEFAULT_PIPELINE_KEY } from '@/[fsd]/features/pipelines/lib/constants';
import { DumpYamlHelpers } from '@/[fsd]/shared/lib/helpers';
import { createSlice, current } from '@reduxjs/toolkit';

export { DEFAULT_PIPELINE_KEY };

export const initialPipelineState = {
  initState: {
    nodes: [],
    edges: [],
    yamlJsonObject: {},
    yamlCode: '',
    layout_version: '',
  },
  nodes: [],
  edges: [],
  yamlJsonObject: {},
  yamlCode: '',
  resetFlag: false,
  layout_version: '',
  stateValidationErrors: {},
};

const resolveKey = state => state.activePipelineKey ?? DEFAULT_PIPELINE_KEY;

const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState: {
    // Per-pipeline isolated state, keyed by "${projectId}_${pipelineId}" or DEFAULT_PIPELINE_KEY
    byKey: {},
    // Which key is currently active (Canvas sets this per-tab; non-Canvas pages use DEFAULT_PIPELINE_KEY)
    activePipelineKey: null,
    // Shared orientation setting (not per-pipeline)
    orientation: localStorage.getItem(OrientationKey) || ORIENTATION.vertical,
  },
  reducers: {
    setActivePipelineKey: (state, action) => {
      state.activePipelineKey = action.payload;
    },

    clearPipelineKey: (state, action) => {
      delete state.byKey[action.payload];
      if (state.activePipelineKey === action.payload) {
        state.activePipelineKey = null;
      }
    },

    initThePipeline: (state, action) => {
      const { nodes, edges, yamlJsonObject, yamlCode, layout_version } = action.payload;
      const key = resolveKey(state);
      state.byKey[key] = {
        ...(state.byKey[key] || initialPipelineState),
        nodes: [...nodes],
        edges: [...edges],
        yamlJsonObject: structuredClone(yamlJsonObject || {}),
        yamlCode,
        resetFlag: true,
        layout_version,
        stateValidationErrors: {},
        initState: {
          nodes: [...nodes],
          edges: [...edges],
          yamlJsonObject: structuredClone(yamlJsonObject || {}),
          yamlCode,
          layout_version,
        },
      };
    },

    resetPipeline: state => {
      const key = resolveKey(state);
      if (!state.byKey[key]) return;
      const { nodes, edges, yamlJsonObject, yamlCode, layout_version } = state.byKey[key].initState;
      state.byKey[key] = {
        ...state.byKey[key],
        nodes: [...nodes],
        edges: [...edges],
        yamlJsonObject: structuredClone(yamlJsonObject ? current(yamlJsonObject) : {}),
        yamlCode,
        resetFlag: true,
        layout_version,
        stateValidationErrors: {},
      };
    },

    clearResetFlag: state => {
      const key = resolveKey(state);
      if (state.byKey[key]) {
        state.byKey[key].resetFlag = false;
      }
    },

    setYamlCode: (state, action) => {
      const key = resolveKey(state);
      if (state.byKey[key]) {
        state.byKey[key].yamlCode = action.payload;
      }
    },

    setYamlJsonObject: (state, action) => {
      const key = resolveKey(state);
      if (state.byKey[key]) {
        state.byKey[key].yamlJsonObject = { ...(action.payload?.yamlJsonObject || {}) };
      }
    },

    setOrientation: (state, action) => {
      state.orientation = action.payload;
      localStorage.setItem(OrientationKey, action.payload);
    },

    updateInitState: (state, action) => {
      const key = resolveKey(state);
      if (!state.byKey[key]) return;
      const { yamlCode } = action.payload;
      state.byKey[key].yamlCode = yamlCode;
      state.byKey[key].initState = {
        ...state.byKey[key].initState,
        yamlCode,
      };
    },

    setLayoutVersion: (state, action) => {
      const key = resolveKey(state);
      if (state.byKey[key]) {
        state.byKey[key].layout_version = action.payload;
      }
    },

    syncInitYamlJsonObject: (state, action) => {
      const key = resolveKey(state);
      if (!state.byKey[key]) return;
      const newYamlJsonObject = structuredClone(action.payload?.yamlJsonObject || {});
      let newYamlCode = '';
      try {
        newYamlCode = DumpYamlHelpers.dumpYaml(newYamlJsonObject);
      } catch {
        newYamlCode = state.byKey[key].yamlCode;
      }
      state.byKey[key].initState.yamlJsonObject = newYamlJsonObject;
      state.byKey[key].initState.yamlCode = newYamlCode;
    },

    setStateValidationError: (state, action) => {
      const key = resolveKey(state);
      if (!state.byKey[key]) return;
      const { variableName, error } = action.payload;
      if (error) {
        state.byKey[key].stateValidationErrors[variableName] = error;
      } else {
        delete state.byKey[key].stateValidationErrors[variableName];
      }
    },

    clearStateValidationErrors: state => {
      const key = resolveKey(state);
      if (state.byKey[key]) {
        state.byKey[key].stateValidationErrors = {};
      }
    },

    restorePipelineSnapshot: (state, action) => {
      const key = resolveKey(state);
      const { nodes, edges, yamlJsonObject, yamlCode, layout_version, initState } = action.payload;
      // Fall back to the existing initState when the snapshot's initState is null
      // (tab was hidden before versionDetails loaded and ownInitStateRef was never set).
      const resolvedInitState = initState ?? state.byKey[key]?.initState ?? initialPipelineState.initState;
      state.byKey[key] = {
        nodes: [...nodes],
        edges: [...edges],
        yamlJsonObject: structuredClone(yamlJsonObject || {}),
        yamlCode,
        layout_version,
        // resetFlag=true causes only this tab's FlowEditor to re-sync because
        // each tab reads its own key via selectActivePipeline.
        resetFlag: true,
        stateValidationErrors: {},
        initState: structuredClone(resolvedInitState),
      };
    },
  },
});

// Selector: returns the active pipeline's state (or initialPipelineState if none active).
// Canvas pages set activePipelineKey per-tab; non-Canvas pages fall back to DEFAULT_PIPELINE_KEY.
export const selectActivePipeline = state => {
  const { byKey, activePipelineKey } = state.pipeline;
  const key = activePipelineKey ?? DEFAULT_PIPELINE_KEY;
  return byKey[key] || initialPipelineState;
};

export const { name, actions } = pipelineSlice;
export default pipelineSlice.reducer;
