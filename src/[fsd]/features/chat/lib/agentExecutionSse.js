import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants.js';

export const AGENT_APPLICATION_EXECUTION_CONTRACT = 'agent.execute.application.v1';
export const AGENT_ADHOC_EXECUTION_CONTRACT = 'agent.execute.adhoc.v1';
export const AGENT_REGENERATION_EXECUTION_CONTRACT = 'agent.regenerate.v1';

const FALLBACK_STATUSES = new Set([404, 422]);
const PARTIAL_NODE_EVENT = 'partial_message';
const TERMINAL_NODE_EVENT = 'full_message';
const RUNTIME_FAILURE_EVENT = 'execution.failed';
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

const isMcpParticipant = participant => {
  if (participant?.entity_name !== 'toolkit') return false;
  const toolkitType = String(participant?.entity_settings?.toolkit_type || '').toLowerCase();
  return participant?.meta?.mcp === true || toolkitType === 'mcp' || toolkitType.endsWith('_mcp');
};

const supportsBoundedAdhocParticipant = participant => {
  if (participant?.entity_name === 'user' || participant?.entity_name === 'dummy') return true;
  return participant?.entity_name === 'toolkit' && !isMcpParticipant(participant);
};

const hasSelectedModel = eventPayload =>
  typeof eventPayload?.llm_settings?.model_name === 'string' &&
  eventPayload.llm_settings.model_name.length > 0;

const apiUrl = path => `${String(VITE_SERVER_URL || '').replace(/\/$/, '')}${path}`;

const yieldToBrowserRenderer = () =>
  new Promise(resolve => {
    if (typeof globalThis.requestAnimationFrame !== 'function') {
      resolve();
      return;
    }
    globalThis.requestAnimationFrame(() => globalThis.setTimeout(resolve, 0));
  });

const safeResponseMessage = async response => {
  try {
    const body = await response.json();
    if (typeof body?.message === 'string' && body.message) return body.message;
    if (typeof body?.error === 'string' && body.error) return body.error;
  } catch {
    // Proxy-generated and malformed bodies do not cross the safe UI boundary.
  }
  return 'Failed to start agent execution. Please try again.';
};

export class AgentExecutionStartError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AgentExecutionStartError';
  }
}

export const getAgentExecutionSseContract = ({
  isAgentsPage,
  participant,
  conversationParticipants,
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
    isAgentsPage &&
    participant?.entity_name === 'application' &&
    !hasLLMOverride &&
    isEmptyObject(eventPayload?.mcp_tokens) &&
    isEmptyArray(eventPayload?.user_ids)
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

  if (commonEligible && participant?.entity_name === 'application' && !hasLLMOverride) {
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

const startAgentExecutionRequest = async ({
  startPath,
  startBody,
  conversationUuid,
  eventPayload,
  onNodeEvent,
  onError,
  onClosed,
  fetchImpl = fetch,
  EventSourceImpl = EventSource,
  yieldToRenderer = yieldToBrowserRenderer,
}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (DEV && VITE_DEV_TOKEN) headers.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

  const response = await fetchImpl(apiUrl(startPath), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(startBody),
  });

  if (FALLBACK_STATUSES.has(response.status)) return { started: false };
  if (!response.ok) throw new AgentExecutionStartError(await safeResponseMessage(response));

  const admission = await response.json();
  if (!admission?.execution_id || !admission?.events_url) {
    throw new AgentExecutionStartError('Agent execution returned an invalid response. Please try again.');
  }

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

  const source = new EventSourceImpl(admission.events_url, { withCredentials: true });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    source.close();
    onClosed?.();
  };
  const fail = message => {
    notifyStreamFailure({ onError, questionId: eventPayload.question_id, message });
    close();
  };

  // EventSource does not await async listeners. Serialize durable replay so a
  // fast burst cannot apply tool_end before tool_start, and yield after visible
  // activity boundaries so existing Socket.IO chip rendering stays realtime.
  let nodeEventQueue = Promise.resolve();
  const enqueueNodeEvent = task => {
    nodeEventQueue = nodeEventQueue.then(task).catch(() => {
      fail('Agent execution returned an invalid event. Please refresh the conversation.');
    });
    return nodeEventQueue;
  };

  source.addEventListener('execution.node_event', event =>
    enqueueNodeEvent(async () => {
      const nodeEvent = JSON.parse(event.data);
      // partial_message and full_message are SDK persistence envelopes. The
      // existing reducer consumes their agent_* events and agent_response;
      // forwarding the envelopes creates unknown-event warnings and duplicate
      // response state. full_message remains the stream terminal authority.
      if (nodeEvent?.type === TERMINAL_NODE_EVENT) {
        close();
        return;
      }
      if (nodeEvent?.type === PARTIAL_NODE_EVENT) return;
      await onNodeEvent(nodeEvent);
      if (ACTIVITY_NODE_EVENTS.has(nodeEvent?.type)) await yieldToRenderer();
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
  source.addEventListener('execution.replay_reset', () => {
    fail('Live agent history expired. Please refresh the conversation.');
  });

  return { started: true, source, admission, conversationUuid, close };
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
    ...streamOptions,
  });
};
