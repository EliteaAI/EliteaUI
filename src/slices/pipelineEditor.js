import { createSlice } from '@reduxjs/toolkit';

const pipelineEditorSlice = createSlice({
  name: 'pipelineEditor',
  initialState: {
    nodes: [],
    edges: [],
  },
  reducers: {
    resetPipelineEditor: state => {
      state.nodes = [];
      state.edges = [];
    },
    setNodes: (state, action) => {
      state.nodes = [...(action.payload || [])];
    },
    setEdges: (state, action) => {
      state.edges = [...(action.payload || [])];
    },
  },
});

export const { name, actions } = pipelineEditorSlice;
export default pipelineEditorSlice.reducer;
