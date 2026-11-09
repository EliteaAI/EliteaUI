import { TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

import { normalizeExecutionHierarchy } from './executionHierarchy.helpers.js';

// Live text of a run, streamed while the user was away, sent once by chat_enter_room (EL-7385).
// frame.response_metadata.tool_runs = { [tool_run_id]: { content, thinking, seq, truncated, metadata } }
// metadata is the first live chunk's response_metadata.metadata, so a seeded step sits where live ones do.
// Every live agent_llm_chunk carries response_metadata.snapshot_seq; one not above the action's
// snapshotSeq is already in the snapshot and is skipped.

// A snapshot that arrived before the history it belongs to was loaded, by response message id
const MAX_PENDING_SNAPSHOTS = 20;
const pendingSnapshots = new Map();

export const rememberPendingSnapshot = (messageId, toolRuns) => {
  if (!messageId || !toolRuns) return;
  pendingSnapshots.delete(messageId);
  pendingSnapshots.set(messageId, toolRuns);
  while (pendingSnapshots.size > MAX_PENDING_SNAPSHOTS) {
    pendingSnapshots.delete(pendingSnapshots.keys().next().value);
  }
};

export const takePendingSnapshot = messageId => {
  const toolRuns = pendingSnapshots.get(messageId);
  pendingSnapshots.delete(messageId);
  return toolRuns;
};

export const clearPendingSnapshots = () => pendingSnapshots.clear();

// Same shape as the step the first live agent_llm_chunk creates (components/Chat/hooks.js)
const snapshotAction = (toolRunId, run, createdAt) => {
  const metadata = run.metadata || {};
  const hierarchy = normalizeExecutionHierarchy(metadata);
  return {
    name: metadata.langgraph_node?.trim() || TOOL_ACTION_NAMES.Llm,
    ...hierarchy,
    id: toolRunId,
    status: ToolActionStatus.processing,
    toolMeta: { ...metadata, ...hierarchy },
    created_at: createdAt,
    type: TOOL_ACTION_TYPES.Llm,
    content: run.content || '',
    thinking: run.thinking || '',
    snapshotSeq: run.seq || 0,
  };
};

/**
 * Tool actions with the snapshot applied. A step the client already has is overwritten only when the
 * snapshot is ahead of it; a finished step (status not processing) is never touched, its persisted
 * text is the truth. Returns the same array when nothing changed.
 */
export const applyRunSnapshot = (toolActions = [], toolRuns = {}, createdAt = new Date().getTime()) => {
  let changed = false;
  const known = new Set();
  const next = toolActions.map(action => {
    const run = toolRuns[action.id];
    if (!run) return action;
    known.add(action.id);
    if (action.status !== ToolActionStatus.processing) return action;
    if ((run.seq || 0) <= (action.snapshotSeq || 0)) return action;
    changed = true;
    return {
      ...action,
      content: run.content || '',
      thinking: run.thinking || '',
      snapshotSeq: run.seq || 0,
    };
  });
  Object.entries(toolRuns).forEach(([toolRunId, run]) => {
    if (known.has(toolRunId) || !run) return;
    changed = true;
    next.push(snapshotAction(toolRunId, run, createdAt));
  });
  return changed ? next : toolActions;
};

/** True when a live chunk is already part of the snapshot this action was seeded from. */
export const isChunkInSnapshot = (action, snapshotSeq) =>
  !!action && typeof snapshotSeq === 'number' && snapshotSeq <= (action.snapshotSeq || 0);
