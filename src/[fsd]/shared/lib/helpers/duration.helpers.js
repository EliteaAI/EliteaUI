import { ToolActionStatus } from '@/common/constants';

// Compact elapsed-time label: "850ms", "2.4s", "1m 05s", "1h 02m". Missing data renders as an
// em-dash so tables keep their column alignment.
export const formatDurationMs = ms => {
  if (ms == null || Number.isNaN(ms)) return '-';
  if (Math.round(ms) < 1000) return `${Math.round(ms)}ms`;
  // Round to tenths first so 59.95s+ reads "1m 00s", not "60.0s".
  const tenths = Math.round(ms / 100);
  if (tenths < 600) return `${(tenths / 10).toFixed(1)}s`;
  const totalSeconds = Math.max(60, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
};

const toMs = value => {
  if (value == null || value === '') return NaN;
  return typeof value === 'number' ? value : new Date(value).getTime();
};

// #7264 P1: wall-clock span of one chat action, from the backend-stamped startedAt/finishedAt only
// (never the client-side created_at/ended_at fallbacks). A start that equals the finish is what the
// backend and the synthetic-action path stamp when the start event was missed, so it is unknown,
// not zero — return null and render nothing rather than a misleading "0ms".
export const getActionDurationMs = action => {
  const start = toMs(action?.startedAt);
  const finish = toMs(action?.finishedAt);
  if (Number.isNaN(start) || Number.isNaN(finish) || finish <= start) return null;
  return finish - start;
};

// #7264 P1: span of a sub-agent invocation = earliest real start → latest real finish across its
// actions (the parent's wrapper call and every folded resume round included).
export const getBlockDurationMs = actions => {
  let minStart = Infinity;
  let maxFinish = -Infinity;
  (actions || []).forEach(action => {
    if (getActionDurationMs(action) == null) return;
    minStart = Math.min(minStart, toMs(action.startedAt));
    maxFinish = Math.max(maxFinish, toMs(action.finishedAt));
  });
  return maxFinish > minStart ? maxFinish - minStart : null;
};

// #7264 P1: a HITL-paused action's wall-clock span covers the time the run sat waiting for the user.
// approvalWaited is sticky: the live deferred flag is cleared on resume, and history drops it.
export const includesApprovalWait = action =>
  action?.status === ToolActionStatus.actionRequired ||
  !!action?.approvalWaited ||
  !!action?.hitlDeferred ||
  !!action?.toolMeta?.hitl_deferred;
