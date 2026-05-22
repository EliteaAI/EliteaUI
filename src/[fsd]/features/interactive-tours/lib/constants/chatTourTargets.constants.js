const buildTourSelector = tourId => `[data-tour="${tourId}"]`;

export const CHAT_TOUR_TARGET_IDS = {
  workspace: 'chat-workspace',
  conversations: 'chat-conversations',
  folders: 'chat-folders',
  participants: 'chat-participants',
  messageInput: 'chat-message-input',
  internalTools: 'chat-internal-tools',
  modelSettings: 'chat-model-settings',
  contextBudget: 'chat-context-budget',
  canvasMode: 'chat-canvas-mode',
  messageFeedback: 'chat-message-feedback',
};

export const CHAT_TOUR_TARGETS = {
  workspace: buildTourSelector(CHAT_TOUR_TARGET_IDS.workspace),
  conversations: buildTourSelector(CHAT_TOUR_TARGET_IDS.conversations),
  folders: buildTourSelector(CHAT_TOUR_TARGET_IDS.folders),
  participants: buildTourSelector(CHAT_TOUR_TARGET_IDS.participants),
  messageInput: buildTourSelector(CHAT_TOUR_TARGET_IDS.messageInput),
  internalTools: buildTourSelector(CHAT_TOUR_TARGET_IDS.internalTools),
  modelSettings: buildTourSelector(CHAT_TOUR_TARGET_IDS.modelSettings),
  contextBudget: buildTourSelector(CHAT_TOUR_TARGET_IDS.contextBudget),
  canvasMode: buildTourSelector(CHAT_TOUR_TARGET_IDS.canvasMode),
  messageFeedback: buildTourSelector(CHAT_TOUR_TARGET_IDS.messageFeedback),
};
