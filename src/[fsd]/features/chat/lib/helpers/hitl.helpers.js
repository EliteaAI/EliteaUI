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
  const runtimeResumeStrategy = nonEmpty(overlay.resume_strategy);
  const durableChildThreadId =
    runtimeResumeStrategy === 'aggregate_child' ? nonEmpty(overlay.child_thread_id) : '';
  const nestedChildThreadId = nonEmpty(raw.child_thread_id);
  const childThreadId = durableChildThreadId || nestedChildThreadId || '';
  const threadId =
    nonEmpty(raw.thread_id) ||
    (durableChildThreadId && nestedChildThreadId !== durableChildThreadId ? nestedChildThreadId : '') ||
    nonEmpty(overlay.thread_id) ||
    childThreadId ||
    '';
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
    questions: raw.questions ?? overlay.questions ?? [],
    tool_args: raw.tool_args ?? overlay.tool_args ?? null,
    policy_message: raw.policy_message || overlay.policy_message || '',
    interrupt_id: nonEmpty(raw.interrupt_id) || nonEmpty(overlay.interrupt_id) || '',
    tool_call_id: nonEmpty(raw.tool_call_id) || nonEmpty(overlay.tool_call_id) || '',
    child_thread_id: childThreadId,
    thread_id: threadId,
    resume_strategy: runtimeResumeStrategy || nonEmpty(raw.resume_strategy) || 'single',
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

export const reconcileRootHitlInterrupts = (existing = [], incoming = []) => {
  const localByIdentity = new Map(
    existing.map(interrupt => [getInterruptIdentity(interrupt), interrupt]),
  );
  return incoming.map(interrupt => {
    const local = localByIdentity.get(getInterruptIdentity(interrupt));
    if (!local || (!local.queued && !local.decided && !local.hidden)) return interrupt;
    return {
      ...interrupt,
      queued: Boolean(local.queued),
      decided: Boolean(local.decided),
      hidden: true,
    };
  });
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

const ASK_USER_TOOL_NAME = 'ask_user';
const ANSWER_LINE_PREFIX = '- ';

// Splits the ask_user tool result string ("User answered:\n- <label>: <value>")
// into its answer-line bodies (prefix stripped), tolerating a non-string input.
const extractAnswerLines = raw =>
  typeof raw === 'string'
    ? raw
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith(ANSWER_LINE_PREFIX))
        .map(line => line.slice(ANSWER_LINE_PREFIX.length))
    : [];

// Fallback { label: value } map for when the question specs are unavailable.
const parseAskUserAnswerLines = raw => {
  const map = {};
  extractAnswerLines(raw).forEach(body => {
    const sepIndex = body.indexOf(': ');
    if (sepIndex === -1) return;
    const label = body.slice(0, sepIndex).trim();
    const value = body.slice(sepIndex + 2).trim();
    if (label) map[label] = value;
  });
  return map;
};

// Reads the questions array from an ask_user tool-inputs value, tolerating a raw
// object ({ questions: [...] }), a bare array, or a JSON string of either.
const extractAskUserQuestions = toolInputs => {
  let src = toolInputs;
  if (typeof src === 'string') {
    try {
      src = JSON.parse(src);
    } catch {
      src = null;
    }
  }
  if (Array.isArray(src?.questions)) return src.questions;
  if (Array.isArray(src)) return src;
  return [];
};

// Matches a question to its answer by prefix: the SDK writes each line as
// "- <full question text>: <value>", and the question text itself may contain
// ": ", so splitting on the first separator is unreliable.
const matchAnswer = (label, answerLines) => {
  const line = answerLines.find(body => body.startsWith(label));
  return line ? line.slice(label.length).replace(/^:\s*/, '').trim() : '';
};

// Finds a completed ask_user tool action (live-answered or history-reloaded).
export const findAskUserAction = toolActions => {
  if (!Array.isArray(toolActions)) return null;
  return toolActions.find(item => item?.name === ASK_USER_TOOL_NAME && item?.status === 'complete') || null;
};

// Builds the display list [{ question, answer }] from an ask_user action's tool
// inputs (questions) and tool output (answer string). Inputs/outputs come from the
// live action or, on reload, a lazily-fetched trace-step detail. Returns null when
// there is nothing to summarize.
export const buildAskUserSummary = (toolInputs, toolOutputs) => {
  const questions = extractAskUserQuestions(toolInputs);
  const answerLines = extractAnswerLines(toolOutputs);

  if (questions.length) {
    const items = questions
      .map(spec => {
        const label = spec?.question || spec?.header || spec?.id || '';
        return { question: label, answer: label ? matchAnswer(label, answerLines) : '' };
      })
      .filter(item => item.question);
    return items.length ? items : null;
  }

  const answerMap = parseAskUserAnswerLines(toolOutputs);
  const fallbackItems = Object.entries(answerMap).map(([question, answer]) => ({ question, answer }));
  return fallbackItems.length ? fallbackItems : null;
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

export const getHitlResumeThreadId = interrupt =>
  interrupt?.resume_strategy === 'aggregate_child'
    ? nonEmpty(interrupt?.child_thread_id) || nonEmpty(interrupt?.thread_id) || ''
    : '';

export const settleHitlResumeAttempt = (interrupts, accepted) => {
  const list = Array.isArray(interrupts) ? interrupts : [];
  // StartTask acknowledges only that Core accepted the continuation request.
  // It is not an authoritative per-interrupt result: the React state carrying
  // `decided` can race the socket event, and choices queued behind the active
  // root resume have not been submitted yet. Keep the complete local array
  // until the next interrupt aggregate or terminal event reconciles it.
  if (accepted) return list;
  return list.map(interrupt =>
    interrupt?.decided || interrupt?.queued || interrupt?.hidden
      ? { ...interrupt, decided: false, queued: false, hidden: false }
      : interrupt,
  );
};

export const scheduleRootHitlDecision = (state, messageId, decision) => {
  const current =
    state?.messageId === messageId
      ? state
      : { messageId, inFlightIdentities: [], requiredTurnEndRevision: 0, decisions: [] };
  const identity = decision?.interruptId || '';
  const duplicate =
    !identity ||
    current.inFlightIdentities.includes(identity) ||
    current.decisions.some(item => item.interruptId === identity);
  if (duplicate) return { state: current, status: 'duplicate' };
  return {
    state: { ...current, decisions: [...current.decisions, decision] },
    status: current.inFlightIdentities.length ? 'queued' : 'schedule',
  };
};

export const completeRootHitlDecision = (
  state,
  pendingInterrupts,
  requiredTurnEndRevision = 1,
) => {
  const current = state || {
    messageId: null,
    inFlightIdentities: [],
    requiredTurnEndRevision: 0,
    decisions: [],
  };
  const pendingIdentities = new Set((pendingInterrupts || []).map(getInterruptIdentity));
  // Durable MCP authorization is rendered from toolActions, not from the
  // sensitive-tool hitlInterrupts collection. Once explicitly selected it is
  // still part of this root checkpoint batch even though its public interrupt
  // id is absent from pendingInterrupts.
  const nextDecisions = current.decisions.filter(
    candidate =>
      pendingIdentities.has(candidate.interruptId) || candidate.guardrailType === 'mcp_auth',
  );
  return {
    state: {
      ...current,
      inFlightIdentities: nextDecisions.map(decision => decision.interruptId),
      requiredTurnEndRevision,
      decisions: [],
    },
    nextDecisions,
  };
};

export const hasRootHitlTurnEnded = (state, turnEndRevision) =>
  Boolean(
    state?.inFlightIdentities?.length &&
      Number(turnEndRevision || 0) >= Number(state.requiredTurnEndRevision || 1),
  );
