import {
  ORIENTATION,
  OrientationKey,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { createSlice } from '@reduxjs/toolkit';

const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState: {
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
    orientation: localStorage.getItem(OrientationKey) || ORIENTATION.vertical,
    layout_version: '',
    stateValidationErrors: {}, // Store validation errors by variable name
  },
  reducers: {
    initThePipeline: (state, action) => {
      const { nodes, edges, yamlJsonObject, yamlCode, layout_version } = action.payload;
      state.nodes = [...nodes];
      state.edges = [...edges];
      state.yamlJsonObject = { ...yamlJsonObject };
      state.yamlCode = yamlCode;
      state.resetFlag = true;
      state.layout_version = layout_version;
      state.stateValidationErrors = {}; // Clear validation errors on init
      state.initState = {
        nodes: [...nodes],
        edges: [...edges],
        yamlJsonObject: { ...yamlJsonObject },
        yamlCode,
        layout_version,
      };
    },
    resetPipeline: state => {
      const { nodes, edges, yamlJsonObject, yamlCode, layout_version } = state.initState;
      state.nodes = [...nodes];
      state.edges = [...edges];
      state.yamlJsonObject = { ...yamlJsonObject };
      state.yamlCode = yamlCode;
      state.resetFlag = true;
      state.layout_version = layout_version;
      state.stateValidationErrors = {}; // Clear validation errors on reset
    },
    clearResetFlag: state => {
      state.resetFlag = false;
    },
    setYamlCode: (state, action) => {
      state.yamlCode = action.payload;
    },
    setYamlJsonObject: (state, action) => {
      state.yamlJsonObject = { ...(action.payload?.yamlJsonObject || {}) };
    },
    setOrientation: (state, action) => {
      state.orientation = action.payload;
      localStorage.setItem(OrientationKey, action.payload);
    },
    // Update only the initState to mark content as saved without triggering reset
    updateInitState: (state, action) => {
      const { yamlCode } = action.payload;
      // Update both current yamlCode and initState to match saved version
      state.yamlCode = yamlCode;
      state.initState = {
        ...state.initState,
        yamlCode,
      };
    },
    setLayoutVersion: (state, action) => {
      state.layout_version = action.payload;
    },
    setStateValidationError: (state, action) => {
      const { variableName, error } = action.payload;
      if (error) {
        state.stateValidationErrors[variableName] = error;
      } else {
        delete state.stateValidationErrors[variableName];
      }
    },
    clearStateValidationErrors: state => {
      state.stateValidationErrors = {};
    },
  },
});

export const { name, actions } = pipelineSlice;
export default pipelineSlice.reducer;
