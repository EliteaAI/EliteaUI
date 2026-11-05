import { registerReducer } from '@/[fsd]/shared/config/reducerRegistry';
import { createSlice } from '@reduxjs/toolkit';

// Sends tracked at once; older ones are dropped (a send is settled by its first frame within seconds)
const MAX_PENDING_SENDS = 20;

// Failures of chat sends that arrived after the user left that chat, shown there when it is opened again
const sendFailuresSlice = createSlice({
  name: 'chatSendFailures',
  initialState: {
    pendingSends: {},
    failuresByConversation: {},
    openConversationUuid: null,
  },
  reducers: {
    setOpenConversation: (state, action) => {
      state.openConversationUuid = action.payload?.conversationUuid || null;
    },
    trackSend: (state, action) => {
      const { questionId, conversationUuid, question, userMessage } = action.payload;
      if (!questionId || !conversationUuid) return;
      state.pendingSends[questionId] = { conversationUuid, question, userMessage, sentAt: Date.now() };
      const ids = Object.keys(state.pendingSends);
      if (ids.length > MAX_PENDING_SENDS) {
        ids
          .sort((a, b) => state.pendingSends[a].sentAt - state.pendingSends[b].sentAt)
          .slice(0, ids.length - MAX_PENDING_SENDS)
          .forEach(id => delete state.pendingSends[id]);
      }
    },
    settleSend: (state, action) => {
      delete state.pendingSends[action.payload.questionId];
    },
    recordFailure: (state, action) => {
      const { questionId, conversationUuid, error } = action.payload;
      const pending = state.pendingSends[questionId];
      const targetUuid = conversationUuid || pending?.conversationUuid;
      if (!questionId || !targetUuid) return;
      state.failuresByConversation[targetUuid] = {
        ...(state.failuresByConversation[targetUuid] || {}),
        [questionId]: {
          questionId,
          error,
          question: pending?.question,
          userMessage: pending?.userMessage,
          failedAt: Date.now(),
        },
      };
      delete state.pendingSends[questionId];
    },
    clearFailures: (state, action) => {
      const { conversationUuid, questionIds } = action.payload;
      const failures = state.failuresByConversation[conversationUuid];
      if (!failures) return;
      if (questionIds) questionIds.forEach(id => delete failures[id]);
      if (!questionIds || !Object.keys(failures).length)
        delete state.failuresByConversation[conversationUuid];
    },
  },
});

const EMPTY_FAILURES = {};

export const selectPendingSend = questionId => state =>
  state[sendFailuresSlice.name]?.pendingSends[questionId];

export const selectOpenConversationUuid = state => state[sendFailuresSlice.name]?.openConversationUuid;

export const selectConversationSendFailures = conversationUuid => state =>
  state[sendFailuresSlice.name]?.failuresByConversation[conversationUuid] || EMPTY_FAILURES;

export const { name, actions } = sendFailuresSlice;
registerReducer(sendFailuresSlice.name, sendFailuresSlice.reducer);

export default sendFailuresSlice.reducer;
