import { describe, expect, it, vi } from 'vitest';

import {
  buildAgentExecutionStartBody,
  isAgentExecutionSseEligible,
  startAgentExecutionSse,
} from './agentExecutionSse';

const payload = {
  payload: { user_input: 'hello' },
  project_id: 7,
  participant_id: 19,
  conversation_uuid: 'conversation-id',
  question_id: 'question-id',
  interaction_uuid: 'interaction-id',
  attachments_info: [],
  mcp_tokens: {},
};

class FakeEventSource {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.close = vi.fn();
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  async dispatch(name, data) {
    await this.listeners.get(name)?.({ data: JSON.stringify(data) });
  }
}

describe('agent execution SSE', () => {
  it('only selects the direct path for the bounded application slice', () => {
    const base = {
      isAgentsPage: true,
      participant: { entity_name: 'application' },
      eventPayload: payload,
      hasAttachments: false,
      hasLLMOverride: false,
      isSendingToUser: false,
    };

    expect(isAgentExecutionSseEligible(base)).toBe(true);
    expect(isAgentExecutionSseEligible({ ...base, participant: { entity_name: 'pipeline' } })).toBe(false);
    expect(isAgentExecutionSseEligible({ ...base, hasLLMOverride: true })).toBe(false);
    expect(
      isAgentExecutionSseEligible({ ...base, eventPayload: { ...payload, mcp_tokens: { server: {} } } }),
    ).toBe(false);
  });

  it('normalizes current payloads without forwarding model settings or credentials', () => {
    expect(
      buildAgentExecutionStartBody({
        projectId: '7',
        conversationUuid: 'conversation-id',
        eventPayload: payload,
      }),
    ).toEqual({
      payload: { user_input: 'hello' },
      project_id: 7,
      participant_id: 19,
      conversation_uuid: 'conversation-id',
      question_id: 'question-id',
      interaction_uuid: 'interaction-id',
      attachments_info: [],
      mcp_tokens: {},
    });
  });

  it('falls back before opening SSE when the direct route does not support the turn', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(result).toEqual({ started: false });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('feeds exact NodeEvents to the existing reducer and closes on full_message', async () => {
    const onNodeEvent = vi.fn();
    const onClosed = vi.fn();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent,
      onError: vi.fn(),
      onClosed,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-id', events_url: '/events' }),
      }),
      EventSourceImpl: FakeEventSource,
    });

    const terminal = { type: 'full_message', message_id: 'response-id', content: 'done' };
    await result.source.dispatch('execution.node_event', terminal);

    expect(onNodeEvent).toHaveBeenCalledWith(terminal);
    expect(result.source.close).toHaveBeenCalledOnce();
    expect(onClosed).toHaveBeenCalledOnce();
  });

  it('maps a safe runtime failure into the current socket-error contract', async () => {
    const onError = vi.fn();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent: vi.fn(),
      onError,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-id', events_url: '/events' }),
      }),
      EventSourceImpl: FakeEventSource,
    });

    await result.source.dispatch('execution.failed', { safe_message: 'Model is unavailable.' });

    expect(onError).toHaveBeenCalledWith({
      type: 'error',
      message_id: 'question-id',
      headline: 'Model is unavailable.',
      content: 'Model is unavailable.',
    });
    expect(result.source.close).toHaveBeenCalledOnce();
  });
});
