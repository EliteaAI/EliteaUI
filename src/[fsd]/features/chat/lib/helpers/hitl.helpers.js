import { normalizeExecutionHierarchy } from './executionHierarchy.helpers';

const nonEmpty = value => (typeof value === 'string' && value.trim() ? value : '');

export const getInterruptIdentity = interrupt => {
  const interruptId = nonEmpty(interrupt?.interrupt_id);
  if (interruptId) return interruptId;
  const threadId = nonEmpty(interrupt?.child_thread_id) || nonEmpty(interrupt?.thread_id);
  const toolCallId = nonEmpty(interrupt?.tool_call_id);
  if (!threadId && !toolCallId) return '';
  return JSON.stringify([threadId, toolCallId]);
};

export const normalizeHitlInterrupt = (raw = {}, overlay = {}) => {
  const hierarchy = normalizeExecutionHierarchy(raw, overlay);
  const childThreadId = nonEmpty(raw.child_thread_id) || nonEmpty(overlay.child_thread_id) || '';
  const threadId = nonEmpty(raw.thread_id) || nonEmpty(overlay.thread_id) || childThreadId || '';
  const interrupt = {
    message: raw.message || overlay.message || 'Please review and take action.',
    node_name: raw.node_name || overlay.node_name || '',
    available_actions: raw.available_actions || overlay.available_actions || ['approve', 'reject'],
    routes: raw.routes || overlay.routes || {},
    edit_state_key: raw.edit_state_key || overlay.edit_state_key || '',
    guardrail_type: raw.guardrail_type || overlay.guardrail_type || '',
    tool_name: raw.tool_name || overlay.tool_name || '',
    toolkit_name: raw.toolkit_name || overlay.toolkit_name || '',
    toolkit_type: raw.toolkit_type || overlay.toolkit_type || '',
    action_label: raw.action_label || overlay.action_label || '',
    tool_args: raw.tool_args ?? overlay.tool_args ?? null,
    policy_message: raw.policy_message || overlay.policy_message || '',
    interrupt_id: nonEmpty(raw.interrupt_id) || nonEmpty(overlay.interrupt_id) || '',
    tool_call_id: nonEmpty(raw.tool_call_id) || nonEmpty(overlay.tool_call_id) || '',
    child_thread_id: childThreadId,
    thread_id: threadId,
    resume_strategy:
      nonEmpty(raw.resume_strategy) ||
      nonEmpty(overlay.resume_strategy) ||
      (childThreadId ? 'aggregate_child' : 'single'),
    ...hierarchy,
  };
  return interrupt;
};

export const mergeHitlInterrupts = (existing = [], incoming = []) => {
  const result = [...existing];
  incoming.forEach(interrupt => {
    const identity = getInterruptIdentity(interrupt);
    const index = identity ? result.findIndex(item => getInterruptIdentity(item) === identity) : -1;
    if (index >= 0) result[index] = interrupt;
    else result.push(interrupt);
  });
  return result;
};

export const getPendingHitlMessage = history => {
  const messages = Array.isArray(history) ? history : [];
  const lastAssistant = messages[messages.length - 1];
  // Historical pauses are display-only. Only the current tail assistant turn
  // may own actionable controls or disable the composer.
  if (lastAssistant?.role !== 'assistant') return undefined;
  if (!lastAssistant) return undefined;
  const interrupts = Array.isArray(lastAssistant.hitlInterrupts)
    ? lastAssistant.hitlInterrupts
    : lastAssistant.hitlInterrupt
      ? [lastAssistant.hitlInterrupt]
      : [];
  return interrupts.some(interrupt => !interrupt?.decided) ? lastAssistant : undefined;
};

export const getHitlResumeGroup = (interrupts, selected) => {
  const list = Array.isArray(interrupts) ? interrupts : [];
  if (!selected) return [];
  if (selected.resume_strategy !== 'aggregate_child') return [selected];
  const threadId = selected.child_thread_id || selected.thread_id;
  return list.filter(
    interrupt =>
      interrupt.resume_strategy === 'aggregate_child' &&
      (interrupt.child_thread_id || interrupt.thread_id) === threadId,
  );
};
