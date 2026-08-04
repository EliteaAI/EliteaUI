import { describe, expect, it, vi } from 'vitest';

import {
  AGENT_ADHOC_EXECUTION_CONTRACT,
  AGENT_APPLICATION_EXECUTION_CONTRACT,
  AGENT_REGENERATION_EXECUTION_CONTRACT,
  buildAgentExecutionStartBody,
  getAgentExecutionSseContract,
  getAgentRegenerationSseContract,
  isAgentExecutionSseEligible,
  startAgentExecutionSse,
  startAgentRegenerationSse,
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
    expect(getAgentExecutionSseContract(base)).toBe(AGENT_APPLICATION_EXECUTION_CONTRACT);
    expect(isAgentExecutionSseEligible({ ...base, isAgentsPage: false })).toBe(false);
    expect(isAgentExecutionSseEligible({ ...base, participant: { entity_name: 'pipeline' } })).toBe(false);
    expect(isAgentExecutionSseEligible({ ...base, hasLLMOverride: true })).toBe(false);
    expect(
      isAgentExecutionSseEligible({ ...base, eventPayload: { ...payload, mcp_tokens: { server: {} } } }),
    ).toBe(false);
  });

  it('selects configured application execution in main Chat only for one bounded agent participant', () => {
    const application = {
      id: 19,
      entity_name: 'application',
      entity_settings: { agent_type: 'agent' },
    };
    const options = {
      isAgentsPage: false,
      participant: application,
      conversationParticipants: [{ entity_name: 'user' }, { entity_name: 'dummy' }, application],
      eventPayload: payload,
      hasAttachments: false,
      hasLLMOverride: false,
      isSendingToUser: false,
    };

    expect(getAgentExecutionSseContract(options)).toBe(AGENT_APPLICATION_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'toolkit', entity_settings: { toolkit_type: 'aha' } },
        ],
      }),
    ).toBeNull();
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { id: 20, entity_name: 'application', entity_settings: { agent_type: 'agent' } },
        ],
      }),
    ).toBeNull();
    expect(
      getAgentExecutionSseContract({
        ...options,
        participant: { ...application, entity_settings: { agent_type: 'pipeline' } },
      }),
    ).toBeNull();
  });

  it('selects ad-hoc execution for a current chat with only standard toolkit attachments', () => {
    const options = {
      isAgentsPage: false,
      participant: undefined,
      conversationParticipants: [
        { entity_name: 'user' },
        { entity_name: 'dummy' },
        { entity_name: 'toolkit', entity_settings: { toolkit_type: 'aha' } },
      ],
      eventPayload: {
        ...payload,
        participant_id: undefined,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      },
      hasAttachments: false,
      hasLLMOverride: true,
      isSendingToUser: false,
    };

    expect(getAgentExecutionSseContract(options)).toBe(AGENT_ADHOC_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [...options.conversationParticipants, { entity_name: 'application' }],
      }),
    ).toBeNull();
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'toolkit', meta: { mcp: true }, entity_settings: { toolkit_type: 'mcp' } },
        ],
      }),
    ).toBeNull();
  });

  it('selects regeneration only for the bounded application and ad-hoc slices', () => {
    const applicationPayload = {
      ...payload,
      payload: {
        user_input: 'hello again',
        attachments_info: [],
        mcp_tokens: {},
      },
    };
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: true,
        participant: { entity_name: 'application' },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: false,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: { id: 19, entity_name: 'application' },
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { id: 19, entity_name: 'application', entity_settings: { agent_type: 'agent' } },
        ],
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: false,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: true,
        participant: { entity_name: 'application' },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: true,
        hasLLMOverride: false,
      }),
    ).toBeNull();

    const adhocPayload = {
      ...payload,
      participant_id: undefined,
      payload: {
        user_input: 'hello again',
        attachments_info: [],
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
        mcp_tokens: {},
      },
    };
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: undefined,
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { entity_name: 'toolkit', entity_settings: { toolkit_type: 'aha' } },
        ],
        eventPayload: adhocPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: true,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
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

  it('carries only selected model settings for bounded ad-hoc execution', () => {
    expect(
      buildAgentExecutionStartBody({
        contract: AGENT_ADHOC_EXECUTION_CONTRACT,
        projectId: '7',
        conversationUuid: 'conversation-id',
        eventPayload: {
          ...payload,
          participant_id: undefined,
          llm_settings: {
            model_name: 'eu.anthropic.claude',
            model_project_id: 7,
            temperature: 0.2,
          },
        },
      }),
    ).toEqual({
      payload: { user_input: 'hello' },
      project_id: 7,
      participant_id: 0,
      conversation_uuid: 'conversation-id',
      question_id: 'question-id',
      interaction_uuid: 'interaction-id',
      attachments_info: [],
      llm_settings: {
        model_name: 'eu.anthropic.claude',
        model_project_id: 7,
        temperature: 0.2,
      },
      mcp_tokens: {},
    });
  });

  it('starts the ad-hoc contract on the same current messages route', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    await startAgentExecutionSse({
      contract: AGENT_ADHOC_EXECUTION_CONTRACT,
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: {
        ...payload,
        participant_id: undefined,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(fetchImpl.mock.calls[0][0]).toContain('execution_contract=agent.execute.adhoc.v1');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        participant_id: 0,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      }),
    );
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

  it('regenerates the existing response through the focused contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    const eventPayload = {
      ...payload,
      message_id: 'response-id',
      stream_id: 'response-id',
      payload: {
        user_input: 'hello again',
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
        attachments_info: [],
        mcp_tokens: {},
      },
    };

    const result = await startAgentRegenerationSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      responseMessageId: 'response-id',
      regenerationId: 'regeneration-id',
      eventPayload,
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(result).toEqual({ started: false });
    expect(fetchImpl.mock.calls[0][0]).toContain(
      '/elitea_core/regenerate/prompt_lib/7/response-id?execution_contract=agent.regenerate.v1',
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      ...eventPayload,
      regeneration_id: 'regeneration-id',
    });
  });

  it('reconciles the optimistic response, feeds reducer events, and closes on full_message', async () => {
    const onNodeEvent = vi.fn();
    const onClosed = vi.fn();
    const yieldToRenderer = vi.fn().mockResolvedValue();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent,
      onError: vi.fn(),
      onClosed,
      yieldToRenderer,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          task_id: 'execution-id',
          execution_id: 'execution-id',
          response_message_id: 'response-id',
          events_url: '/events',
        }),
      }),
      EventSourceImpl: FakeEventSource,
    });

    expect(onNodeEvent).toHaveBeenCalledWith({
      type: 'start_task',
      message_id: 'response-id',
      question_id: 'question-id',
      content: {
        task_id: 'execution-id',
        participant_id: 19,
        question_id: 'question-id',
      },
      sio_event: 'chat_predict',
    });
    expect(yieldToRenderer).toHaveBeenCalledOnce();

    const llmStart = {
      type: 'agent_llm_start',
      message_id: 'response-id',
      response_metadata: { tool_run_id: 'llm-1', model_name: 'model' },
    };
    await result.source.dispatch('execution.node_event', llmStart);
    expect(onNodeEvent).toHaveBeenLastCalledWith(llmStart);
    expect(yieldToRenderer).toHaveBeenCalledTimes(2);

    const agentEvent = { type: 'agent_response', message_id: 'response-id', content: 'done' };
    await result.source.dispatch('execution.node_event', agentEvent);
    await result.source.dispatch('execution.node_event', {
      type: 'partial_message',
      message_id: 'response-id',
    });
    const terminal = { type: 'full_message', message_id: 'response-id', content: 'done' };
    await result.source.dispatch('execution.node_event', terminal);

    expect(onNodeEvent).toHaveBeenCalledTimes(3);
    expect(onNodeEvent).toHaveBeenLastCalledWith(agentEvent);
    expect(result.source.close).toHaveBeenCalledOnce();
    expect(onClosed).toHaveBeenCalledOnce();
  });

  it('starts distinct editor turns on the same conversation execution stream', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-1', events_url: '/events/1' }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-2', events_url: '/events/2' }),
      });

    await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: { ...payload, question_id: 'question-1', payload: { user_input: 'first' } },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });
    await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: { ...payload, question_id: 'question-2', payload: { user_input: 'second' } },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls.map(call => JSON.parse(call[1].body))).toEqual([
      expect.objectContaining({
        conversation_uuid: 'conversation-id',
        question_id: 'question-1',
        payload: { user_input: 'first' },
      }),
      expect.objectContaining({
        conversation_uuid: 'conversation-id',
        question_id: 'question-2',
        payload: { user_input: 'second' },
      }),
    ]);
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
