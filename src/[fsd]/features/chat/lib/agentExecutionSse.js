import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants.js';

export const AGENT_EXECUTION_CONTRACT = 'agent.execute.application.v1';

const FALLBACK_STATUSES = new Set([404, 422]);
const TERMINAL_NODE_EVENT = 'full_message';
const RUNTIME_FAILURE_EVENT = 'execution.failed';

const isEmptyObject = value =>
  value == null || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

const isEmptyArray = value => value == null || (Array.isArray(value) && value.length === 0);

const apiUrl = path => `${String(VITE_SERVER_URL || '').replace(/\/$/, '')}${path}`;

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

export const isAgentExecutionSseEligible = ({
  isAgentsPage,
  participant,
  eventPayload,
  hasAttachments,
  hasLLMOverride,
  isSendingToUser,
}) =>
  Boolean(
    isAgentsPage &&
    participant?.entity_name === 'application' &&
    !hasAttachments &&
    !hasLLMOverride &&
    !isSendingToUser &&
    isEmptyArray(eventPayload?.attachments_info) &&
    isEmptyObject(eventPayload?.mcp_tokens) &&
    isEmptyArray(eventPayload?.ignored_mcp_servers) &&
    isEmptyArray(eventPayload?.user_ids),
  );

export const buildAgentExecutionStartBody = ({ projectId, conversationUuid, eventPayload }) => ({
  payload: {
    user_input: eventPayload?.payload?.user_input ?? eventPayload?.user_input,
  },
  project_id: Number(projectId),
  participant_id: Number(eventPayload?.participant_id),
  conversation_uuid: conversationUuid,
  question_id: eventPayload?.question_id,
  interaction_uuid: eventPayload?.interaction_uuid,
  attachments_info: [],
  mcp_tokens: {},
});

const notifyStreamFailure = ({ onError, questionId, message }) => {
  onError({ type: 'error', message_id: questionId, headline: message, content: message });
};

export const startAgentExecutionSse = async ({
  projectId,
  conversationUuid,
  eventPayload,
  onNodeEvent,
  onError,
  onClosed,
  fetchImpl = fetch,
  EventSourceImpl = EventSource,
}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (DEV && VITE_DEV_TOKEN) headers.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

  const startPath = `/elitea_core/messages/prompt_lib/${encodeURIComponent(projectId)}/${encodeURIComponent(
    conversationUuid,
  )}?execution_contract=${AGENT_EXECUTION_CONTRACT}`;
  const response = await fetchImpl(apiUrl(startPath), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(buildAgentExecutionStartBody({ projectId, conversationUuid, eventPayload })),
  });

  if (FALLBACK_STATUSES.has(response.status)) return { started: false };
  if (!response.ok) throw new AgentExecutionStartError(await safeResponseMessage(response));

  const admission = await response.json();
  if (!admission?.execution_id || !admission?.events_url) {
    throw new AgentExecutionStartError('Agent execution returned an invalid response. Please try again.');
  }

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

  source.addEventListener('execution.node_event', async event => {
    try {
      const nodeEvent = JSON.parse(event.data);
      await onNodeEvent(nodeEvent);
      if (nodeEvent?.type === TERMINAL_NODE_EVENT) close();
    } catch {
      fail('Agent execution returned an invalid event. Please refresh the conversation.');
    }
  });
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
