import { alitaApi } from '@/api/alitaApi';
import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messageIdToView: '',
    currentStreamingInfo: {},
    toolkitValidationInfo: {},
    selectedAgent: null,
    selectedAgentStarter: null,
    isCreatingNewConversation: false,
  },
  reducers: {
    setMessageIdToView: (state, action) => {
      const { messageIdToView } = action.payload;
      state.messageIdToView = messageIdToView;
    },
    setStreamingInfo: (state, action) => {
      const { projectId, conversationId, questionId } = action.payload;
      state.currentStreamingInfo = {
        ...state.currentStreamingInfo,
        [projectId]: {
          ...(state.currentStreamingInfo[projectId] || {}),
          [conversationId]: questionId,
        },
      };
    },
    clearConversationStreamingInfo: (state, action) => {
      const { projectId, conversationId } = action.payload;
      if (state.currentStreamingInfo[projectId] && state.currentStreamingInfo[projectId][conversationId]) {
        delete state.currentStreamingInfo[projectId][conversationId];
      }
    },
    resetStreamingInfo: state => {
      state.currentStreamingInfo = {};
    },
    setToolkitValidationInfo: (state, action) => {
      const { toolkitId, projectId, validationInfo } = action.payload;
      state.toolkitValidationInfo = {
        ...state.toolkitValidationInfo,
        [`${projectId}_${toolkitId}`]: validationInfo,
      };
    },
    setSelectedAgentInfo: (state, action) => {
      const { agent, starter } = action.payload;
      state.selectedAgent = agent;
      state.selectedAgentStarter = starter;
    },
    setIsCreatingNewConversation: (state, action) => {
      state.isCreatingNewConversation = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addMatcher(alitaApi.endpoints.validateToolkit.matchFulfilled, (state, { meta: { arg } }) => {
      const { toolkitId, projectId } = arg.originalArgs;
      state.toolkitValidationInfo = {
        ...state.toolkitValidationInfo,
        [`${projectId}_${toolkitId}`]: [],
      };
    });
  },
});

export const { name, actions } = chatSlice;
export default chatSlice.reducer;
