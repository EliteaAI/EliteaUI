import { ToolActionStatus } from '@/common/constants';

// Compact elapsed-time label: "850ms", "2.4s", "1m 05s", "1h 02m"; "-" when unknown.
export const formatDurationMs = ms => {
  if (ms == null || Number.isNaN(ms)) return '-';
  if (Math.round(ms) < 1000) return `${Math.round(ms)}ms`;
  // Round to tenths first so 59.95s+ reads "1m 00s", not "60.0s".
  const tenths = Math.round(ms / 100);
  if (tenths < 600) return `${(tenths / 10).toFixed(1)}s`;
  // Tenths rounded up to 60s, so clamp: 59950ms must read "1m 00s", not "0m 59s".
  const totalSeconds = Math.max(60, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
};

export const formatDurationTooltip = (ms, includesWait = false) =>
  `Took ${(ms / 1000).toFixed(3)}s${includesWait ? ' (includes time waiting for approval)' : ''}`;

const toMs = value => {
  if (value == null || value === '') return NaN;
  return typeof value === 'number' ? value : new Date(value).getTime();
};

// Backend startedAt/finishedAt only; start === finish means the start was missed, so unknown.
export const getActionDurationMs = action => {
  const start = toMs(action?.startedAt);
  const finish = toMs(action?.finishedAt);
  if (Number.isNaN(start) || Number.isNaN(finish) || finish <= start) return null;
  return finish - start;
};

// A chip's final duration: none while running, or while a deferred wrapper waits for approval
// (it ends with status complete and a finish stamp mid-pause).
export const getSettledActionDurationMs = action =>
  action?.status === ToolActionStatus.processing || action?.hitlDeferred ? null : getActionDurationMs(action);

// Earliest real start to latest real finish across the block's actions.
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

// approvalWaited is sticky: the live deferred flag is cleared on resume and history drops it.
export const includesApprovalWait = action =>
  action?.status === ToolActionStatus.actionRequired ||
  !!action?.approvalWaited ||
  !!action?.hitlDeferred ||
  !!action?.toolMeta?.hitl_deferred;
