// Run state of a chat, as chat_run_status sends it (EL-7385)
export const RUN_STATUS = {
  running: 'running',
  waiting: 'waiting',
  finished: 'finished',
  failed: 'failed',
  stopped: 'stopped',
};

// What the unread dot of a chat list row says; nothing for a run the user stopped themselves
export const UNREAD_REASON = {
  newResponse: 'new_response',
  waiting: 'waiting',
};
