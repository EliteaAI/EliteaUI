import { RunStatusConstants } from '@/[fsd]/features/chat/lib/constants';
import { registerReducer } from '@/[fsd]/shared/config/reducerRegistry';
import { createSlice } from '@reduxjs/toolkit';

// Run state of chats for the chat list (EL-7385), keyed by project then conversation uuid.
// Fed by chat_run_status on the user's own room; a list load fills in what the socket missed.
const { RUN_STATUS, UNREAD_REASON } = RunStatusConstants;

const UNREAD_BY_STATUS = {
  [RUN_STATUS.finished]: UNREAD_REASON.newResponse,
  [RUN_STATUS.failed]: UNREAD_REASON.newResponse,
  [RUN_STATUS.waiting]: UNREAD_REASON.waiting,
};

const runStatusSlice = createSlice({
  name: 'chatRunStatus',
  initialState: {
    byProject: {},
  },
  reducers: {
    // openConversationUuid: the chat on screen; a run ending there is seen, not unread
    applyRunStatus: (state, action) => {
      const { projectId, conversationUuid, messageGroupUuid, status, openConversationUuid } = action.payload;
      if (!projectId || !conversationUuid || !status) return;
      const project = (state.byProject[projectId] ||= {});
      const previous = project[conversationUuid] || {};
      const isOpen = conversationUuid === openConversationUuid;
      project[conversationUuid] = {
        status,
        messageGroupUuid: messageGroupUuid || previous.messageGroupUuid,
        isRunning: status === RUN_STATUS.running,
        // A new run clears an old notice; an ending run on screen leaves none
        unread:
          status === RUN_STATUS.running || isOpen
            ? null
            : UNREAD_BY_STATUS[status] || previous.unread || null,
      };
    },
    // From a list load: has_running_task per row. Never clears an unread dot
    syncRunningFromList: (state, action) => {
      const { projectId, conversations } = action.payload;
      if (!projectId || !Array.isArray(conversations)) return;
      const project = (state.byProject[projectId] ||= {});
      conversations.forEach(conversation => {
        if (!conversation?.uuid || typeof conversation.has_running_task !== 'boolean') return;
        const previous = project[conversation.uuid];
        if (conversation.has_running_task) {
          project[conversation.uuid] = {
            ...previous,
            status: RUN_STATUS.running,
            isRunning: true,
            unread: null,
          };
        } else if (previous?.isRunning) {
          // Ended while the socket was away (reconnect, other device): status unknown, so no dot
          project[conversation.uuid] = { ...previous, status: undefined, isRunning: false };
        }
      });
    },
    markSeen: (state, action) => {
      const { projectId, conversationUuid } = action.payload;
      const entry = state.byProject[projectId]?.[conversationUuid];
      if (entry) entry.unread = null;
    },
  },
});

const EMPTY = {};

export const selectConversationRunStatus = (projectId, conversationUuid) => state =>
  state[runStatusSlice.name]?.byProject[projectId]?.[conversationUuid] || EMPTY;

export const { name, actions } = runStatusSlice;
registerReducer(runStatusSlice.name, runStatusSlice.reducer);

export default runStatusSlice.reducer;
