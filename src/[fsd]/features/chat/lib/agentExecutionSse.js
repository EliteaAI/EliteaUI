import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants.js';

export const AGENT_APPLICATION_EXECUTION_CONTRACT = 'agent.execute.application.v1';
export const AGENT_ADHOC_EXECUTION_CONTRACT = 'agent.execute.adhoc.v1';
export const AGENT_REGENERATION_EXECUTION_CONTRACT = 'agent.regenerate.v1';
export const AGENT_HITL_CONTINUATION_EXECUTION_CONTRACT = 'agent.continue.hitl.v1';
export const AGENT_AUTHORIZATION_CONTINUATION_EXECUTION_CONTRACT = 'agent.continue.authorization.v1';

const FALLBACK_STATUSES = new Set([404, 422]);
const REGENERATION_PENDING_STATUS = 409;
const REGENERATION_PENDING_CODE = 'agent_regeneration_pending';
const MAX_REGENERATION_FINALIZATION_RETRIES = 4;
const DEFAULT_REGENERATION_RETRY_DELAY_MS = 1000;
const PARTIAL_NODE_EVENT = 'partial_message';
const TERMINAL_NODE_EVENT = 'full_message';
const HITL_TERMINAL_NODE_EVENT = 'agent_hitl_interrupt';
const AUTHORIZATION_TERMINAL_NODE_EVENT = 'mcp_authorization_required';
const RUNTIME_FAILURE_EVENT = 'execution.failed';
const REPLAY_RESET_EVENT = 'execution.replay_reset';
const MAX_EXECUTION_ID_BYTES = 512;
const ACTIVITY_NODE_EVENTS = new Set([
  'agent_llm_start',
  'agent_llm_end',
  'agent_tool_start',
  'agent_tool_end',
  'agent_tool_error',
  'agent_thinking_step',
  'agent_thinking_step_update',
]);

const isEmptyObject = value =>
  value == null || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

const isEmptyArray = value => value == null || (Array.isArray(value) && value.length === 0);

// New Main Chat conversations carry internal_mcp by default. The bounded
// configured-application slice intentionally does not activate that optional
// conversation tool, but it must not force an otherwise supported selected
// agent or pipeline back onto the legacy Socket.IO path.
const supportsBoundedApplicationConversationTools = value =>
  isEmptyArray(value) || (Array.isArray(value) && value.length === 1 && value[0] === 'internal_mcp');

const isMcpParticipant = participant => {
  if (participant?.entity_name !== 'toolkit') return false;
  const toolkitType = String(participant?.entity_settings?.toolkit_type || '').toLowerCase();
  return participant?.meta?.mcp === true || toolkitType === 'mcp' || toolkitType.endsWith('_mcp');
};

const supportsBoundedAdhocParticipant = participant => {
  if (participant?.entity_name === 'user' || participant?.entity_name === 'dummy') return true;
  if (participant?.entity_name === 'application') return true;
  return participant?.entity_name === 'toolkit' && !isMcpParticipant(participant);
};

const applicationIdentity = participant =>
  String(participant?.id ?? participant?.entity_meta?.id ?? participant?.uuid ?? '');

const supportsBoundedApplicationConversation = (participants, selectedParticipant) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    return false;
  }
  if (
    !participants.every(participant => ['user', 'dummy', 'application'].includes(participant?.entity_name))
  ) {
    return false;
  }
  const applications = participants.filter(participant => participant?.entity_name === 'application');
  if (applications.length !== 1) return false;

  const selectedIdentity = applicationIdentity(selectedParticipant);
  const conversationIdentity = applicationIdentity(applications[0]);
  return !selectedIdentity || !conversationIdentity || selectedIdentity === conversationIdentity;
};

const hasSelectedModel = eventPayload =>
  typeof eventPayload?.llm_settings?.model_name === 'string' &&
  eventPayload.llm_settings.model_name.length > 0;

const conversationHasSelectedModel = participants =>
  (participants || []).some(participant => hasSelectedModel(participant?.entity_settings));

const apiUrl = path => `${String(VITE_SERVER_URL || '').replace(/\/$/, '')}${path}`;

const isBoundedExecutionIdentifier = value =>
  typeof value === 'string' &&
  value.length > 0 &&
  value === value.trim() &&
  !/[\0\r\n]/.test(value) &&
  new TextEncoder().encode(value).length <= MAX_EXECUTION_ID_BYTES;

// Durable Go execution IDs are 16 random bytes rendered as lowercase hex.
// Legacy Socket.IO task UUIDs are not valid durable replay identifiers and
// must never be attached to the authenticated Go SSE endpoint after reload.
const isDurableAgentExecutionIdentifier = value => typeof value === 'string' && /^[0-9a-f]{32}$/.test(value);

export const isAgentSequentialHITLContinuationEligible = ({ interrupt, action }) =>
  Boolean(interrupt) &&
  ['approve', 'reject', 'edit', 'block_with_comment'].includes(action) &&
  !interrupt.child_thread_id &&
  interrupt.resume_strategy !== 'aggregate_child' &&
  !interrupt.via_call_id &&
  !interrupt._via_call_id;

export const getAgentHITLChildThreadId = interrupt =>
  interrupt?.resume_strategy === 'aggregate_child'
    ? interrupt.child_thread_id || interrupt.thread_id || ''
    : interrupt?.child_thread_id || '';

export const buildAgentExecutionEventsUrl = (baseUrl, projectId, executionId) => {
  const normalizedBase = String(baseUrl || '').replace(/\/$/, '');
  return `${normalizedBase}/executions/${encodeURIComponent(projectId)}/${encodeURIComponent(
    executionId,
  )}/events`;
};

export const getAgentExecutionResumeCandidate = ({
  isAgentsPage,
  conversationParticipants,
  conversationMeta,
  chatHistory,
}) => {
  if (isAgentsPage) return null;

  const applications = (conversationParticipants || []).filter(
    participant => participant?.entity_name === 'application',
  );
  const configuredApplicationEligible =
    supportsBoundedApplicationConversationTools(conversationMeta?.internal_tools) &&
    applications.length === 1 &&
    supportsBoundedApplicationConversation(conversationParticipants, applications[0]);
  const adHocEligible =
    Array.isArray(conversationParticipants) &&
    conversationParticipants.length > 0 &&
    conversationParticipants.every(supportsBoundedAdhocParticipant) &&
    conversationHasSelectedModel(conversationParticipants);
  if (!configuredApplicationEligible && !adHocEligible) return null;

  const streamingResponses = (chatHistory || []).filter(
    message => message?.isStreaming === true && isDurableAgentExecutionIdentifier(message?.task_id),
  );
  if (streamingResponses.length !== 1) return null;

  const response = streamingResponses[0];
  const responseMessageId = String(response.id || '');
  const questionId = String(response.question_id || response.replyTo?.uuid || response.replyTo?.id || '');
  if (!isBoundedExecutionIdentifier(responseMessageId) || !isBoundedExecutionIdentifier(questionId)) {
    return null;
  }

  return {
    executionId: response.task_id,
    questionId,
    responseMessageId,
  };
};

export const resetAgentExecutionReplayProjection = (chatHistory, responseMessageId) => {
  let changed = false;
  const next = (chatHistory || []).map(message => {
    if (message?.id !== responseMessageId || !message.toolActions?.length) return message;
    changed = true;
    return { ...message, toolActions: [] };
  });
  return changed ? next : chatHistory;
};

export const settleAgentExecutionReplayProjection = (chatHistory, responseMessageId, terminalEvent) => {
  let changed = false;
  const next = (chatHistory || []).map(message => {
    if (message?.id !== responseMessageId) return message;
    const terminalContent =
      terminalEvent?.type === TERMINAL_NODE_EVENT && typeof terminalEvent?.content === 'string'
        ? terminalEvent.content
        : '';
    const shouldRestoreTerminalContent = !message.content && terminalContent;
    if (
      message.isStreaming !== true &&
      message.isLoading !== true &&
      message.isRegenerating !== true &&
      message.isSending !== true &&
      !shouldRestoreTerminalContent
    ) {
      return message;
    }
    changed = true;
    return {
      ...message,
      ...(shouldRestoreTerminalContent ? { content: terminalContent } : {}),
      isStreaming: false,
      isLoading: false,
      isRegenerating: false,
      isSending: false,
    };
  });
  return changed ? next : chatHistory;
};

const yieldToBrowserRenderer = () =>
  new Promise(resolve => {
    if (typeof globalThis.requestAnimationFrame !== 'function') {
      resolve();
      return;
    }
    globalThis.requestAnimationFrame(() => globalThis.setTimeout(resolve, 0));
  });

const safeResponseDetails = async response => {
  try {
    const body = await response.json();
    return {
      code: typeof body?.error === 'string' ? body.error : '',
      message:
        (typeof body?.message === 'string' && body.message) ||
        (typeof body?.error === 'string' && body.error) ||
        'Failed to start agent execution. Please try again.',
      retryable: body?.retryable === true,
    };
  } catch {
    // Proxy-generated and malformed bodies do not cross the safe UI boundary.
  }
  return {
    code: '',
    message: 'Failed to start agent execution. Please try again.',
    retryable: false,
  };
};

export class AgentExecutionStartError extends Error {
  constructor(message, { status = 0, code = '', retryable = false } = {}) {
    super(message);
    this.name = 'AgentExecutionStartError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

const waitForRegenerationRetry = delayMs => new Promise(resolve => globalThis.setTimeout(resolve, delayMs));

const regenerationRetryDelayMs = response => {
  const retryAfterSeconds = Number(response.headers?.get?.('Retry-After'));
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds < 0) {
    return DEFAULT_REGENERATION_RETRY_DELAY_MS;
  }
  return Math.min(1000, Math.max(50, retryAfterSeconds * 1000));
};

export const getAgentExecutionSseContract = ({
  isAgentsPage,
  participant,
  conversationParticipants,
  conversationMeta,
  eventPayload,
  hasAttachments,
  hasLLMOverride,
  isSendingToUser,
}) => {
  const commonEligible =
    !hasAttachments &&
    !isSendingToUser &&
    isEmptyArray(eventPayload?.attachments_info) &&
    isEmptyArray(eventPayload?.ignored_mcp_servers) &&
    isEmptyArray(eventPayload?.user_ids);

  if (
    commonEligible &&
    participant?.entity_name === 'application' &&
    !hasLLMOverride &&
    isEmptyObject(eventPayload?.mcp_tokens) &&
    isEmptyArray(eventPayload?.user_ids) &&
    (isAgentsPage ||
      (supportsBoundedApplicationConversationTools(conversationMeta?.internal_tools) &&
        supportsBoundedApplicationConversation(conversationParticipants, participant)))
  ) {
    return AGENT_APPLICATION_EXECUTION_CONTRACT;
  }

  if (
    commonEligible &&
    !isAgentsPage &&
    (!participant || participant.entity_name === 'dummy') &&
    hasSelectedModel(eventPayload) &&
    Array.isArray(conversationParticipants) &&
    conversationParticipants.length > 0 &&
    conversationParticipants.every(supportsBoundedAdhocParticipant)
  ) {
    return AGENT_ADHOC_EXECUTION_CONTRACT;
  }

  return null;
};

export const isAgentExecutionSseEligible = options => Boolean(getAgentExecutionSseContract(options));

export const getAgentRegenerationSseContract = ({
  isAgentsPage,
  participant,
  conversationParticipants,
  conversationMeta,
  eventPayload,
  hasAttachments,
  hasUpdatedItems,
  hasLLMOverride,
}) => {
  const payload = eventPayload?.payload;
  const commonEligible =
    !hasAttachments &&
    !hasUpdatedItems &&
    isEmptyArray(payload?.attachments_info) &&
    isEmptyObject(payload?.mcp_tokens) &&
    isEmptyArray(payload?.user_ids);

  if (
    commonEligible &&
    participant?.entity_name === 'application' &&
    !hasLLMOverride &&
    (isAgentsPage ||
      (supportsBoundedApplicationConversationTools(conversationMeta?.internal_tools) &&
        supportsBoundedApplicationConversation(conversationParticipants, participant)))
  ) {
    return AGENT_REGENERATION_EXECUTION_CONTRACT;
  }

  if (
    commonEligible &&
    !isAgentsPage &&
    (!participant || participant.entity_name === 'dummy') &&
    hasSelectedModel(payload) &&
    Array.isArray(conversationParticipants) &&
    conversationParticipants.length > 0 &&
    conversationParticipants.every(supportsBoundedAdhocParticipant)
  ) {
    return AGENT_REGENERATION_EXECUTION_CONTRACT;
  }

  return null;
};

export const buildAgentExecutionStartBody = ({ contract, projectId, conversationUuid, eventPayload }) => {
  const body = {
    payload: {
      user_input: eventPayload?.payload?.user_input ?? eventPayload?.user_input,
    },
    project_id: Number(projectId),
    participant_id:
      contract === AGENT_ADHOC_EXECUTION_CONTRACT
        ? Number(eventPayload?.participant_id || 0)
        : Number(eventPayload?.participant_id),
    conversation_uuid: conversationUuid,
    question_id: eventPayload?.question_id,
    interaction_uuid: eventPayload?.interaction_uuid,
    attachments_info: [],
    mcp_tokens: {},
  };
  if (contract === AGENT_ADHOC_EXECUTION_CONTRACT) body.llm_settings = eventPayload.llm_settings;
  return body;
};

const notifyStreamFailure = ({ onError, questionId, message }) => {
  onError({ type: 'error', message_id: questionId, headline: message, content: message });
};

const openAgentExecutionEventStream = ({
  eventsUrl,
  conversationUuid,
  questionId,
  onNodeEvent,
  onError,
  onClosed,
  onTerminal,
  onReplayReset,
  onReplayStart,
  EventSourceImpl,
  yieldToRenderer,
}) => {
  const source = new EventSourceImpl(eventsUrl, { withCredentials: true });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    source.close();
    onClosed?.();
  };
  const fail = message => {
    notifyStreamFailure({ onError, questionId, message });
    close();
  };

  // EventSource does not await async listeners. Serialize durable replay so a
  // fast burst cannot apply tool_end before tool_start, and yield after visible
  // activity boundaries so existing Socket.IO chip rendering stays realtime.
  let nodeEventQueue = Promise.resolve();
  let replayStarted = false;
  const enqueueNodeEvent = task => {
    nodeEventQueue = nodeEventQueue.then(task).catch(() => {
      fail('Agent execution returned an invalid event. Please refresh the conversation.');
    });
    return nodeEventQueue;
  };

  source.addEventListener('execution.node_event', event =>
    enqueueNodeEvent(async () => {
      const nodeEvent = JSON.parse(event.data);
      // A reload starts with trace pins already projected from PostgreSQL, while
      // the durable SSE endpoint replays the same execution from its beginning.
      // Give the owner one atomic opportunity to discard that stale projection
      // before the first replayed event is reduced. Regeneration already clears
      // its target response before opening the stream; fresh-turn resume must do
      // the equivalent once to avoid rendering persisted + replayed chips.
      if (!replayStarted) {
        replayStarted = true;
        await onReplayStart?.();
        if (onReplayStart) await yieldToRenderer();
      }
      // partial_message and full_message are SDK persistence envelopes. The
      // existing reducer consumes their agent_* events and agent_response;
      // forwarding the envelopes creates unknown-event warnings and duplicate
      // response state. full_message remains the stream terminal authority.
      if (nodeEvent?.type === TERMINAL_NODE_EVENT) {
        await onTerminal?.(nodeEvent);
        close();
        return;
      }
      if (nodeEvent?.type === PARTIAL_NODE_EVENT) return;
      await onNodeEvent(nodeEvent);
      if (ACTIVITY_NODE_EVENTS.has(nodeEvent?.type)) await yieldToRenderer();
      const isAuthorizationTerminal =
        nodeEvent?.type === AUTHORIZATION_TERMINAL_NODE_EVENT &&
        Array.isArray(nodeEvent?.response_metadata?.authorization_requests);
      if (nodeEvent?.type === HITL_TERMINAL_NODE_EVENT || isAuthorizationTerminal) {
        await onTerminal?.(nodeEvent);
        close();
      }
    }),
  );
  source.addEventListener(RUNTIME_FAILURE_EVENT, event => {
    try {
      const failure = JSON.parse(event.data);
      fail(failure?.safe_message || 'Agent execution failed. Please try again.');
    } catch {
      fail('Agent execution failed. Please try again.');
    }
  });
  source.addEventListener(REPLAY_RESET_EVENT, () => {
    if (!onReplayReset) {
      fail('Live agent history expired. Please refresh the conversation.');
      return;
    }
    enqueueNodeEvent(async () => {
      await onReplayReset();
      close();
    });
  });

  return { started: true, source, conversationUuid, close };
};

const admitAgentExecutionRequest = async ({
  startPath,
  startBody,
  fetchImpl = fetch,
  retryFinalizingRegeneration = false,
  waitForRetry = waitForRegenerationRetry,
}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (DEV && VITE_DEV_TOKEN) headers.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

  let response;
  for (let attempt = 0; ; attempt += 1) {
    response = await fetchImpl(apiUrl(startPath), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(startBody),
    });

    if (response.status !== REGENERATION_PENDING_STATUS) break;
    const details = await safeResponseDetails(response);
    const projectionPending =
      retryFinalizingRegeneration && details.code === REGENERATION_PENDING_CODE && details.retryable;
    if (!projectionPending || attempt >= MAX_REGENERATION_FINALIZATION_RETRIES) {
      throw new AgentExecutionStartError(details.message, {
        status: response.status,
        code: details.code,
        retryable: details.retryable,
      });
    }
    await waitForRetry(regenerationRetryDelayMs(response));
  }

  if (FALLBACK_STATUSES.has(response.status)) return { started: false };
  if (!response.ok) {
    const details = await safeResponseDetails(response);
    throw new AgentExecutionStartError(details.message, {
      status: response.status,
      code: details.code,
      retryable: details.retryable,
    });
  }

  const admission = await response.json();
  if (!admission?.execution_id || !admission?.events_url) {
    throw new AgentExecutionStartError('Agent execution returned an invalid response. Please try again.');
  }

  return { started: true, admission };
};

const startAgentExecutionRequest = async ({
  startPath,
  startBody,
  conversationUuid,
  eventPayload,
  onNodeEvent,
  onError,
  onClosed,
  onTerminal,
  onReplayReset,
  fetchImpl = fetch,
  EventSourceImpl = EventSource,
  yieldToRenderer = yieldToBrowserRenderer,
  retryFinalizingRegeneration = false,
  waitForRetry = waitForRegenerationRetry,
}) => {
  const admitted = await admitAgentExecutionRequest({
    startPath,
    startBody,
    fetchImpl,
    retryFinalizingRegeneration,
    waitForRetry,
  });
  if (!admitted.started) return admitted;
  const { admission } = admitted;

  // The current Socket.IO path emits start_task before the SDK NodeEvents. The
  // durable execution route already returns the identities needed to preserve
  // that UI contract, so reconcile the optimistic response before streaming.
  await onNodeEvent({
    type: 'start_task',
    message_id: admission.response_message_id,
    question_id: eventPayload.question_id,
    content: {
      task_id: admission.task_id || admission.execution_id,
      participant_id: eventPayload.participant_id || undefined,
      question_id: eventPayload.question_id,
    },
    sio_event: 'chat_predict',
  });
  // The reducer updates its message ref after React commits the optimistic
  // response. Durable replay can deliver agent_llm_start immediately, so give
  // that commit one paint before opening the stream or the first activity chip
  // is resolved against a stale message ref and discarded.
  await yieldToRenderer();

  return {
    ...openAgentExecutionEventStream({
      eventsUrl: admission.events_url,
      conversationUuid,
      questionId: eventPayload.question_id,
      onNodeEvent,
      onError,
      onClosed,
      onTerminal,
      onReplayReset,
      EventSourceImpl,
      yieldToRenderer,
    }),
    admission,
  };
};

export const admitAgentExecution = async ({
  contract = AGENT_APPLICATION_EXECUTION_CONTRACT,
  projectId,
  conversationUuid,
  eventPayload,
  fetchImpl = fetch,
}) => {
  const startPath = `/elitea_core/messages/prompt_lib/${encodeURIComponent(projectId)}/${encodeURIComponent(
    conversationUuid,
  )}?execution_contract=${encodeURIComponent(contract)}`;
  return admitAgentExecutionRequest({
    startPath,
    startBody: buildAgentExecutionStartBody({ contract, projectId, conversationUuid, eventPayload }),
    fetchImpl,
  });
};

export const resumeAgentExecutionSse = ({
  projectId,
  executionId,
  conversationUuid,
  questionId,
  onNodeEvent,
  onError,
  onClosed,
  onTerminal,
  onReplayReset,
  onReplayStart,
  EventSourceImpl = EventSource,
  yieldToRenderer = yieldToBrowserRenderer,
}) => {
  if (!isBoundedExecutionIdentifier(executionId) || !isBoundedExecutionIdentifier(questionId)) {
    return { started: false };
  }
  return openAgentExecutionEventStream({
    eventsUrl: buildAgentExecutionEventsUrl(VITE_SERVER_URL, projectId, executionId),
    conversationUuid,
    questionId,
    onNodeEvent,
    onError,
    onClosed,
    onTerminal,
    onReplayReset,
    onReplayStart,
    EventSourceImpl,
    yieldToRenderer,
  });
};

export const startAgentExecutionSse = async ({
  contract = AGENT_APPLICATION_EXECUTION_CONTRACT,
  projectId,
  conversationUuid,
  eventPayload,
  ...streamOptions
}) => {
  const startPath = `/elitea_core/messages/prompt_lib/${encodeURIComponent(projectId)}/${encodeURIComponent(
    conversationUuid,
  )}?execution_contract=${encodeURIComponent(contract)}`;
  return startAgentExecutionRequest({
    startPath,
    startBody: buildAgentExecutionStartBody({ contract, projectId, conversationUuid, eventPayload }),
    conversationUuid,
    eventPayload,
    ...streamOptions,
  });
};

export const startAgentRegenerationSse = async ({
  projectId,
  conversationUuid,
  responseMessageId,
  regenerationId,
  eventPayload,
  ...streamOptions
}) => {
  const startPath = `/elitea_core/regenerate/prompt_lib/${encodeURIComponent(projectId)}/${encodeURIComponent(
    responseMessageId,
  )}?execution_contract=${encodeURIComponent(AGENT_REGENERATION_EXECUTION_CONTRACT)}`;
  return startAgentExecutionRequest({
    startPath,
    startBody: {
      ...eventPayload,
      regeneration_id: regenerationId,
    },
    conversationUuid,
    eventPayload,
    retryFinalizingRegeneration: true,
    ...streamOptions,
  });
};

export const buildAgentHITLContinuationBody = ({
  projectId,
  conversationUuid,
  responseMessageId,
  threadId,
  action,
  value,
}) => ({
  project_id: Number(projectId),
  conversation_uuid: conversationUuid,
  message_id: responseMessageId,
  thread_id: threadId,
  hitl_resume: true,
  hitl_action: action,
  ...(action === 'edit' || action === 'block_with_comment' ? { hitl_value: value ?? '' } : {}),
  hitl_decisions: [],
  mcp_tokens: {},
  ignored_mcp_servers: [],
  user_declined_mcp_servers: [],
});

export const startAgentHITLContinuationSse = async ({
  projectId,
  conversationUuid,
  responseMessageId,
  threadId,
  action,
  value,
  eventPayload,
  ...streamOptions
}) => {
  const startPath = `/elitea_core/continue_predict/prompt_lib/${encodeURIComponent(
    projectId,
  )}/${encodeURIComponent(conversationUuid)}?execution_contract=${encodeURIComponent(
    AGENT_HITL_CONTINUATION_EXECUTION_CONTRACT,
  )}`;
  return startAgentExecutionRequest({
    startPath,
    startBody: buildAgentHITLContinuationBody({
      projectId,
      conversationUuid,
      responseMessageId,
      threadId,
      action,
      value,
    }),
    conversationUuid,
    eventPayload,
    ...streamOptions,
  });
};

export const buildAgentAuthorizationContinuationBody = ({
  projectId,
  conversationUuid,
  responseMessageId,
  threadId,
  authorizationRequestId,
  authorizationAction,
  mcpTokens = {},
  ignoredMcpServers = [],
  userDeclinedMcpServers = [],
}) => ({
  project_id: Number(projectId),
  conversation_uuid: conversationUuid,
  message_id: responseMessageId,
  thread_id: threadId,
  authorization_request_id: authorizationRequestId,
  authorization_action: authorizationAction,
  hitl_resume: false,
  hitl_decisions: [],
  mcp_tokens: mcpTokens,
  ignored_mcp_servers: ignoredMcpServers,
  user_declined_mcp_servers: userDeclinedMcpServers,
});

export const startAgentAuthorizationContinuationSse = async ({
  projectId,
  conversationUuid,
  responseMessageId,
  threadId,
  authorizationRequestId,
  authorizationAction,
  mcpTokens,
  ignoredMcpServers,
  userDeclinedMcpServers,
  eventPayload,
  ...streamOptions
}) => {
  const startPath = `/elitea_core/continue_predict/prompt_lib/${encodeURIComponent(
    projectId,
  )}/${encodeURIComponent(conversationUuid)}?execution_contract=${encodeURIComponent(
    AGENT_AUTHORIZATION_CONTINUATION_EXECUTION_CONTRACT,
  )}`;
  return startAgentExecutionRequest({
    startPath,
    startBody: buildAgentAuthorizationContinuationBody({
      projectId,
      conversationUuid,
      responseMessageId,
      threadId,
      authorizationRequestId,
      authorizationAction,
      mcpTokens,
      ignoredMcpServers,
      userDeclinedMcpServers,
    }),
    conversationUuid,
    eventPayload,
    ...streamOptions,
  });
};
